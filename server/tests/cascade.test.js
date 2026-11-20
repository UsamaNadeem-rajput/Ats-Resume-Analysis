// tests/cascade.test.js: `node tests/cascade.test.js`
//
// Delete ke cascade: ek resume hatao to uske analyses aur cover letters bhi jayen (yateem na bachen),
// aur kisi aur ka ya apne doosre resume ka data na chhuye.
// Models ASLI hain; database in-memory nakli (MongoDB ki zaroorat nahi).

const mongoose = require('mongoose');
const { load } = require('./paths');

const Resume = load('models/resumes');
const Analysis = load('models/analysis');
const Coverletters = load('models/coverletters');
const { deleteResumeCascade, deleteAllUserData } = load('services/cascadeService');
const { deleteResume } = load('controllers/resume.controller');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? '  →  ' + detail : ''}`);
};

const same = (a, b) => String(a) === String(b);
const oid = () => new mongoose.Types.ObjectId();
let db;
const order = []; // kis tarteeb se delete hua
let failAnalysisDelete = false;

// ── In-memory stubs ─────────────────────────────────────────────────────────
const matches = (doc, q) => Object.entries(q).every(([k, v]) => {
  if (v && typeof v === 'object' && '$in' in v) return v.$in.some((x) => same(doc[k], x));
  return same(doc[k], v);
});
Resume.findOne = async (q) => db.resumes.find((d) => matches(d, q)) || null;
Resume.deleteOne = async (q) => { order.push('resume'); db.resumes = db.resumes.filter((d) => !matches(d, q)); };
Resume.deleteMany = async (q) => { order.push('resumes*'); const n = db.resumes.filter((d) => matches(d, q)).length; db.resumes = db.resumes.filter((d) => !matches(d, q)); return { deletedCount: n }; };
Analysis.find = (q) => ({ select: () => ({ lean: async () => db.analyses.filter((d) => matches(d, q)).map((d) => ({ _id: d._id })) }) });
Analysis.deleteMany = async (q) => {
  if (failAnalysisDelete) throw new Error('db error mid-way');
  order.push('analyses'); const n = db.analyses.filter((d) => matches(d, q)).length; db.analyses = db.analyses.filter((d) => !matches(d, q)); return { deletedCount: n };
};
Coverletters.deleteMany = async (q) => { order.push('letters'); const n = db.letters.filter((d) => matches(d, q)).length; db.letters = db.letters.filter((d) => !matches(d, q)); return { deletedCount: n }; };

const userA = oid();
const userB = oid();

const seed = () => {
  const r1 = oid(); const r2 = oid(); const rB = oid();
  const a1 = oid(); const a2 = oid(); const a3 = oid(); const aB = oid();
  db = {
    resumes: [{ _id: r1, user: userA }, { _id: r2, user: userA }, { _id: rB, user: userB }],
    analyses: [
      { _id: a1, user: userA, resume: r1 }, { _id: a2, user: userA, resume: r1 }, // r1 ke 2 analyses
      { _id: a3, user: userA, resume: r2 },                                       // r2 ka 1
      { _id: aB, user: userB, resume: rB },
    ],
    letters: [
      { _id: oid(), user: userA, analysis: a1 }, { _id: oid(), user: userA, analysis: a3 },
      { _id: oid(), user: userB, analysis: aB },
    ],
  };
  order.length = 0;
  return { r1, r2, rB, a1, a2, a3, aB };
};

const call = async (handler, req) => {
  const out = { status: null, body: null, error: null };
  const res = { status(c) { out.status = c; return this; }, json(p) { out.body = p; return this; } };
  // Express 5 ki nakal: promise reject ho to error `out.error` mein (framework next(err) bulata hai)
  await new Promise((done) => {
    Promise.resolve()
      .then(() => handler({ params: {}, ...req }, res, (err) => { out.error = err; done(); }))
      .then(() => done(), (err) => { out.error = err; done(); });
  });
  return out;
};

const main = async () => {
  console.log('\n=== A. deleteResumeCascade (service) ===');
  let ids = seed();
  let removed = await deleteResumeCascade(userA, ids.r1);
  check('resume + uske 2 analyses + 1 letter ginti sahi', removed.resume === 1 && removed.analyses === 2 && removed.coverLetters === 1, JSON.stringify(removed));
  check('r1 aur uske analyses hat gaye', !db.resumes.some((d) => same(d._id, ids.r1)) && !db.analyses.some((d) => same(d.resume, ids.r1)));
  check('r1 ke analysis ka letter hat gaya', !db.letters.some((d) => same(d.analysis, ids.a1)));
  check('apne doosre resume (r2) ka data salamat', db.resumes.some((d) => same(d._id, ids.r2)) && db.analyses.some((d) => same(d._id, ids.a3)) && db.letters.some((d) => same(d.analysis, ids.a3)));
  check('doosre user ka sab salamat', db.resumes.some((d) => same(d._id, ids.rB)) && db.analyses.some((d) => same(d._id, ids.aB)) && db.letters.some((d) => same(d.analysis, ids.aB)));
  check('tarteeb: pehle bachay (letters, analyses), phir parent (resume)', order.join(',') === 'letters,analyses,resume', order.join(','));

  ids = seed();
  removed = await deleteResumeCascade(userB, ids.r1);
  check('kisi aur ka resume → null, kuch nahi hata', removed === null && db.resumes.length === 3 && db.analyses.length === 4 && db.letters.length === 3);
  removed = await deleteResumeCascade(userA, oid());
  check('maujood nahi → null', removed === null);

  ids = seed();
  db.analyses = db.analyses.filter((d) => !same(d.resume, ids.r2)); // r2 ke koi analysis nahi
  removed = await deleteResumeCascade(userA, ids.r2);
  check('resume jiska koi analysis nahi: sirf resume hata, letters ki query nahi chali', removed.resume === 1 && removed.analyses === 0 && removed.coverLetters === 0 && !order.includes('letters'), order.join(','));

  ids = seed();
  failAnalysisDelete = true;
  let threw = false;
  try { await deleteResumeCascade(userA, ids.r1); } catch { threw = true; }
  failAnalysisDelete = false;
  check('beech mein error → throw, aur PARENT RESUME abhi maujood (dobara delete ho sakta hai)', threw && db.resumes.some((d) => same(d._id, ids.r1)));
  removed = await deleteResumeCascade(userA, ids.r1);
  check('dobara koshish → poora cascade ho gaya', removed && !db.resumes.some((d) => same(d._id, ids.r1)) && !db.analyses.some((d) => same(d.resume, ids.r1)));

  console.log('\n=== B. deleteAllUserData (service) ===');
  ids = seed();
  const all = await deleteAllUserData(userA);
  check('user A ka sab: 2 resumes, 3 analyses, 2 letters', all.resumes === 2 && all.analyses === 3 && all.coverLetters === 2, JSON.stringify(all));
  check('user A ke pass kuch nahi bacha', !db.resumes.some((d) => same(d.user, userA)) && !db.analyses.some((d) => same(d.user, userA)) && !db.letters.some((d) => same(d.user, userA)));
  check('user B ka sab salamat', db.resumes.length === 1 && db.analyses.length === 1 && db.letters.length === 1);
  check('tarteeb: letters, analyses, resumes', order.join(',') === 'letters,analyses,resumes*', order.join(','));
  const none = await deleteAllUserData(oid());
  check('jis user ka data hi nahi: sab 0, crash nahi', none.resumes === 0 && none.analyses === 0 && none.coverLetters === 0);

  console.log('\n=== C. deleteResume (endpoint) ===');
  ids = seed();
  let r = await call(deleteResume, { params: { id: String(ids.r1) }, user: { _id: userA } });
  check('200, success, ginti ke saath', r.status === 200 && r.body.success === true && r.body.removed.analyses === 2 && r.body.removed.coverLetters === 1, r.error?.message);
  r = await call(deleteResume, { params: { id: String(ids.r1) }, user: { _id: userA } });
  check('dobara → 404', r.error?.statusCode === 404);
  r = await call(deleteResume, { params: { id: String(ids.rB) }, user: { _id: userA } });
  check('kisi aur ka resume → 404 (aur woh salamat)', r.error?.statusCode === 404 && db.resumes.some((d) => same(d._id, ids.rB)));
  r = await call(deleteResume, { params: { id: 'abc' }, user: { _id: userA } });
  check('galat id → 400 (500 nahi)', r.error?.statusCode === 400);
  r = await call(deleteResume, { params: { id: String(ids.r2) }, user: undefined });
  check('login nahi → 401', r.error?.statusCode === 401);

  console.log(`\n${failures === 0 ? 'SAB PASS ✅' : failures + ' FAILURE(S) ❌'}`);
  process.exit(failures === 0 ? 0 : 1);
};

main().catch((err) => { console.error('Test crash:', err); process.exit(1); });