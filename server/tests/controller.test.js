
const mongoose = require('mongoose');
const { load, resolve } = require('./paths');
const { resumes, jds } = require('./fixtures');

const pdfCalls = [];
const FAKE_FILES = { web: resumes.web, senior: resumes.senior, ml: resumes.ml };
const linesOf = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const AppError = load('utils/AppError');

const fakePdfService = {
  extractText: async (buffer) => {
    const key = buffer.toString();
    pdfCalls.push(key);
    if (!FAKE_FILES[key]) throw new AppError('PDF read nahi ho saki, file theek nahi lag rahi', 400, 'VALIDATION_ERROR');
    const lines = linesOf(FAKE_FILES[key].text);
    return { text: lines.join(' '), lines, pageCount: FAKE_FILES[key].pageCount };
  },
};
const pdfPath = resolve('services/pdfService');
try { require(pdfPath); } catch {  }
require.cache[pdfPath] = { id: pdfPath, filename: pdfPath, loaded: true, exports: fakePdfService };

const { createAnalysis, requestSuggestions } = load(process.env.CONTROLLER_FILE || 'controllers/analysis.controller');
const Resume = load('models/resumes');
const Analysis = load('models/analysis');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? '  →  ' + detail : ''}`);
};

const db = { resumes: [], analyses: [], deletedResumeIds: [] };
const sameId = (a, b) => String(a) === String(b);

Resume.findOne = async (q) => db.resumes.find((r) => sameId(r.user, q.user) && r.fileHash === q.fileHash) || null;
Resume.create = async (data) => {
  const doc = new Resume(data);
  await doc.validate();
  if (db.resumes.some((r) => sameId(r.user, doc.user) && r.fileHash === doc.fileHash)) {
    throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
  }
  db.resumes.push(doc);
  return doc;
};
Resume.deleteOne = async (q) => {
  db.deletedResumeIds.push(String(q._id));
  db.resumes = db.resumes.filter((r) => !sameId(r._id, q._id));
};
Analysis.create = async (data) => {
  const doc = new Analysis(data);
  await doc.validate();
  db.analyses.push(doc);
  return doc;
};
Analysis.findOne = (q) => ({
  populate: async () => {
    const stored = db.analyses.find((a) => sameId(a._id, q._id) && sameId(a.user, q.user));
    if (!stored) return null;
    const resumeDoc = db.resumes.find((r) => sameId(r._id, stored.resume)) || null;
    return new Proxy(stored, {
      get: (target, prop) => {
        if (prop === 'resume') return resumeDoc;
        const value = Reflect.get(target, prop, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set: (target, prop, value) => { target[prop] = value; return true; },
    });
  },
});
Analysis.prototype.save = async function save() { await this.validate(); return this; };
const reset = () => { db.resumes = []; db.analyses = []; db.deletedResumeIds = []; pdfCalls.length = 0; };

const aiCalls = [];
const goodAi = {
  summary: 'Good fit for a junior web role. Add Docker if you have used it.',
  sectionSuggestions: [{ section: 'Skills', issue: 'Docker missing', fix: 'If you have used Docker, add it.' }],
  rewrittenBullets: [],
};
const setAi = (mode) => {
  ['GEMINI_API_KEY', 'GROQ_API_KEY', 'AI_PROVIDER'].forEach((k) => delete process.env[k]);
  process.env.AI_WAIT_SCALE = '0';
  aiCalls.length = 0;
  if (mode === 'none') return;
  process.env.GROQ_API_KEY = 'test-key';
  console.warn = () => {};
  global.fetch = async (url, options) => {
    aiCalls.push(JSON.parse(options.body));
    if (mode === 'ok') return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(goodAi) } }] }) };
    return { ok: false, status: 401, headers: { get: () => null }, json: async () => ({}) };
  };
};

const call = async (handler, req) => {
  const out = { status: null, body: null, error: null };
  const res = { status(c) { out.status = c; return this; }, json(p) { out.body = p; return this; } };
  await handler(req, res, (err) => { out.error = err; });
  return out;
};
const upload = (key, user, body = { jobDescription: jds.web }, name = key + '.pdf') =>
  call(createAnalysis, { file: { buffer: Buffer.from(key), originalname: name, size: key.length }, body, user });

const main = async () => {
  const userA = { _id: new mongoose.Types.ObjectId() };
  const userB = { _id: new mongoose.Types.ObjectId() };

  console.log('\n=== A. Pehli upload: score foran, AI ke bagair ===');
  reset(); setAi('ok');
  let r = await upload('senior', userA, { jobDescription: jds.senior, jobTitle: ' Senior Backend ' });
  const first = r.body?.analysis;
  check('201 aur success', r.status === 201 && r.body?.success === true, r.error?.message);
  check('AI ko ZERO tokens: fetch kabhi nahi chali', aiCalls.length === 0);
  check('aiStatus not_requested, suggestions null', first?.aiStatus === 'not_requested' && first.suggestions === null);
  check('Resume save: hash, pageCount (2), lines newline se jori', db.resumes.length === 1 && db.resumes[0].fileHash.length === 64 && db.resumes[0].pageCount === 2 && db.resumes[0].extractedText.includes('\n'));
  check('Analysis save, jobTitle trim', db.analyses.length === 1 && db.analyses[0].jobTitle === 'Senior Backend');
  check('score naye weights mein (skills <= 40)', first.breakdown.skillsMatch <= 40 && first.score >= 0 && first.score <= 100);

  console.log('\n=== B. Wahi file dobara: Resume duplicate nahi, score wahi ===');
  const firstScore = first.score;
  const firstBreakdown = JSON.stringify(first.breakdown);
  const firstSections = JSON.stringify(first.detectedSections);
  r = await upload('senior', userA, { jobDescription: jds.senior });
  const second = r.body?.analysis;
  check('201', r.status === 201, r.error?.message);
  check('Resume sirf 1 (dobara nahi bana)', db.resumes.length === 1);
  check('PDF parsing sirf ek baar hui (doosri baar skip)', pdfCalls.length === 1);
  check('Analysis 2 bane (har koshish ki apni history)', db.analyses.length === 2);
  check('DONO baar SCORE BILKUL WAHI (2 page resume bhi)', second.score === firstScore && JSON.stringify(second.breakdown) === firstBreakdown, `first ${firstScore} vs second ${second?.score}`);
  check('sections dono baar wahi (lines wapas milti hain)', JSON.stringify(second.detectedSections) === firstSections);
  check('pageCount wahi 2', second.resume.pageCount === 2);

  console.log('\n=== C. Alag user / alag file ===');
  r = await upload('senior', userB, { jobDescription: jds.senior });
  check('doosre user ke liye alag Resume (privacy)', db.resumes.length === 2);
  r = await upload('web', userA, { jobDescription: jds.web });
  check('alag file → naya Resume', db.resumes.length === 3);

  console.log('\n=== D. Teen requests ek saath (race condition) ===');
  reset();
  const results = await Promise.all([upload('web', userA), upload('web', userA), upload('web', userA)]);
  check('teeno 201 (koi E11000 error user tak nahi pahunchi)', results.every((x) => x.status === 201 && !x.error), results.map((x) => x.status + ':' + (x.error?.message || '')).join(' '));
  check('phir bhi Resume sirf 1', db.resumes.length === 1, 'resumes: ' + db.resumes.length);
  check('Analysis 3 (har request ki apni)', db.analyses.length === 3);
  check('koi Resume hataya nahi gaya', db.deletedResumeIds.length === 0);

  console.log('\n=== E. Galat input aur database ki galti ===');
  reset();
  r = await call(createAnalysis, { file: undefined, body: { jobDescription: jds.web }, user: userA });
  check('file nahi → 400', r.status === 400 && r.body.code === 'VALIDATION_ERROR');
  r = await upload('not-a-pdf', userA);
  check('kharab PDF → AppError 400, kuch save nahi', r.error?.statusCode === 400 && db.resumes.length === 0);
  r = await upload('web', undefined);
  check('login nahi → 401', r.error?.statusCode === 401);

  const realAnalysisCreate = Analysis.create;
  Analysis.create = async () => { throw new Error('db down'); };
  r = await upload('web', userA);
  check('Analysis fail + NAYA Resume → Resume wapas hata diya', r.error?.message === 'db down' && db.resumes.length === 0 && db.deletedResumeIds.length === 1);
  Analysis.create = realAnalysisCreate;

  await upload('web', userA);
  const before = db.resumes.length;
  Analysis.create = async () => { throw new Error('db down'); };
  r = await upload('web', userA);
  check('Analysis fail + PURANA Resume → hataya NAHI', r.error && db.resumes.length === before);
  Analysis.create = realAnalysisCreate;

  console.log('\n=== F. AI route: button dabane par ===');
  reset(); setAi('ok');
  r = await upload('senior', userA, { jobDescription: jds.senior });
  const id = r.body.analysis.id;
  r = await call(requestSuggestions, { params: { id: String(id) }, user: userA });
  check('200, cached false, aiStatus ok', r.status === 200 && r.body.cached === false && r.body.aiStatus === 'ok', r.error?.message);
  check('suggestions save hui (DB mein)', db.analyses[0].aiStatus === 'ok' && db.analyses[0].suggestions.summary.startsWith('Good fit'));
  check('AI ko ek hi call gayi', aiCalls.length === 1);
  const sent = JSON.stringify(aiCalls[0]);
  check('PRIVACY: naam AI ko nahi gaya (lines wapas milne ki wajah se)', !sent.includes('Daniel Weber'));
  check('PRIVACY: email/phone/links nahi gaye', !sent.includes('daniel.weber@mail.com') && !sent.includes('23456789') && !sent.includes('github.com/dweber'));
  check('kaam ka content gaya (Kafka, Spring Boot)', sent.includes('Kafka') && sent.includes('Spring Boot'));
  check('resume newline ke saath gaya (dhancha saaf)', aiCalls[0].messages[1].content.includes('\nEDUCATION\n'));

  r = await call(requestSuggestions, { params: { id: String(id) }, user: userA });
  check('dobara dabane par CACHE: cached true', r.body.cached === true && r.body.aiStatus === 'ok');
  check('cache par AI ko dobara call nahi gayi (token bachay)', aiCalls.length === 1);

  console.log('\n=== G. AI fail ho to? ===');
  reset(); setAi('401');
  r = await upload('web', userA);
  const id2 = String(r.body.analysis.id);
  r = await call(requestSuggestions, { params: { id: id2 }, user: userA });
  check('AI fail → 200, aiStatus failed, message', r.status === 200 && r.body.aiStatus === 'failed' && !!r.body.message);
  check('score wala analysis salamat, status failed save', db.analyses[0].aiStatus === 'failed' && db.analyses[0].score > 0);
  setAi('ok');
  r = await call(requestSuggestions, { params: { id: id2 }, user: userA });
  check('dobara dabane par (failed tha) AI phir chalti hai → ok', r.body.aiStatus === 'ok' && r.body.cached === false && aiCalls.length === 1);

  console.log('\n=== H. AI route ki galat soorten ===');
  r = await call(requestSuggestions, { params: { id: 'abc' }, user: userA });
  check('galat id "abc" → 400 (500 nahi)', r.error?.statusCode === 400);
  r = await call(requestSuggestions, { params: { id: String(new mongoose.Types.ObjectId()) }, user: userA });
  check('maujood nahi → 404', r.error?.statusCode === 404);
  r = await call(requestSuggestions, { params: { id: id2 }, user: userB });
  check('kisi aur user ka analysis → 404 (dikhta hi nahi)', r.error?.statusCode === 404);
  r = await call(requestSuggestions, { params: { id: id2 }, user: undefined });
  check('login nahi → 401', r.error?.statusCode === 401);
  db.resumes = [];
  r = await call(requestSuggestions, { params: { id: id2 }, user: userA });
  check('Resume hat chuka ho → 404 (crash nahi)', r.error?.statusCode === 404);

  console.log('\n=== I. Purane (flat text, pageCount nahi) documents ===');
  reset(); setAi('ok');
  await Resume.create({
    user: userA._id, orignalName: 'old.pdf',
    fileHash: require('crypto').createHash('sha256').update(Buffer.from('web')).digest('hex'),
    extractedText: linesOf(resumes.web.text).join(' '), detectedSections: [],
  });
  r = await upload('web', userA);
  check('purana flat-text resume bhi crash nahi karta', r.status === 201 && pdfCalls.length === 0 && r.body.analysis.resume.pageCount === 1, r.error?.message);

  console.log(`\n${failures === 0 ? 'SAB PASS ✅' : failures + ' FAILURE(S) ❌'}`);
  process.exit(failures === 0 ? 0 : 1);
};

main().catch((err) => { console.error('Test crash:', err); process.exit(1); });