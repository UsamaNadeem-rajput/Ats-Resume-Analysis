// tests/coverLetterController.test.js: `node tests/coverLetterController.test.js`
//
// Cover letter ke teeno endpoints (banao, dekho, PDF) + tumhare theek kiye hue history functions
// (list, detail, delete) + contact/redaction ki safai.
//
// ASLI: controller, services, aur tumhare Mongoose models (schema ki shartein bhi chalti hain).
// NAKLI: database (in-memory), pdfService, AI ka network (fetch).
// PDF ka asli banna alag section mein test hota hai (agar `pdftotext` maujood ho).

const mongoose = require('mongoose');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { load, resolve } = require('./paths');
const { resumes, jds } = require('./fixtures');

const AppError = load('utils/AppError');
const linesOf = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);

// ── Asli PDF builder pehle pakad lo, phir controller ke liye nakli (spy) rakh do ──
const realPdf = load('services/coverLetterPdf');
const pdfSpy = { calls: [] };
const pdfServicePath = resolve('services/pdfService');
const pdfBuilderPath = resolve('services/coverLetterPdf');
try { require(pdfServicePath); } catch { /* pdf-parse na ho to bhi theek */ }
require.cache[pdfServicePath] = { id: pdfServicePath, filename: pdfServicePath, loaded: true, exports: {
  extractText: async (buffer) => {
    const key = buffer.toString();
    if (!resumes[key]) throw new AppError('PDF read nahi ho saki', 400, 'VALIDATION_ERROR');
    const lines = linesOf(resumes[key].text);
    return { text: lines.join(' '), lines, pageCount: resumes[key].pageCount };
  },
} };
require.cache[pdfBuilderPath] = { id: pdfBuilderPath, filename: pdfBuilderPath, loaded: true, exports: {
  ...realPdf,
  buildCoverLetterPdf: async (data) => { pdfSpy.calls.push(data); return Buffer.from('%PDF-1.4 fake pdf bytes for test'); },
} };

const controller = load('controllers/analysis.controller');
const Resume = load('models/resumes');
const Analysis = load('models/analysis');
const Coverletters = load('models/coverletters');
const { extractContact } = load('utils/contact');
const { redactContactInfo } = load('utils/redact');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? '  →  ' + detail : ''}`);
};

// ── In-memory database ───────────────────────────────────────────────────────
const db = { resumes: [], analyses: [], letters: [] };
const same = (a, b) => String(a) === String(b);
let failNextUpsertWith11000 = false;

Resume.findOne = async (q) => db.resumes.find((r) => same(r.user, q.user) && r.fileHash === q.fileHash) || null;
Resume.create = async (d) => { const doc = new Resume(d); await doc.validate(); db.resumes.push(doc); return doc; };
Resume.deleteOne = async () => {};
Analysis.create = async (d) => { const doc = new Analysis(d); await doc.validate(); db.analyses.push(doc); return doc; };
Analysis.findOne = (q) => {
  let lean = false;
  const resolveDoc = () => {
    const stored = db.analyses.find((a) => same(a._id, q._id) && same(a.user, q.user));
    if (!stored) return null;
    const resumeDoc = db.resumes.find((r) => same(r._id, stored.resume)) || null;
    if (lean) return { ...stored.toObject(), resume: resumeDoc ? resumeDoc.toObject() : null };
    return new Proxy(stored, {
      get: (t, p) => (p === 'resume' ? resumeDoc : (typeof t[p] === 'function' ? t[p].bind(t) : Reflect.get(t, p, t))),
    });
  };
  const chain = { populate: () => chain, lean: () => { lean = true; return chain; }, then: (ok, bad) => Promise.resolve().then(resolveDoc).then(ok, bad) };
  return chain;
};
Analysis.findOneAndDelete = async (q) => {
  const i = db.analyses.findIndex((a) => same(a._id, q._id) && same(a.user, q.user));
  return i >= 0 ? db.analyses.splice(i, 1)[0] : null;
};
const paginateCalls = [];
Analysis.paginate = async (filter, opts) => {
  paginateCalls.push({ filter, opts });
  const docs = db.analyses.filter((a) => same(a.user, filter.user)).map((a) => ({ _id: a._id, jobTitle: a.jobTitle, score: a.score, aiStatus: a.aiStatus, createdAt: a.createdAt }));
  return { docs, totalDocs: docs.length, totalPages: 1, page: opts.page, pagingCounter: 1, hasPrevPage: false, hasNextPage: false };
};

Coverletters.findOne = async (q) => db.letters.find((l) => same(l.analysis, q.analysis) && same(l.user, q.user)) || null;
Coverletters.exists = async (q) => (db.letters.find((l) => same(l.analysis, q.analysis) && same(l.user, q.user)) ? { _id: 1 } : null);
Coverletters.deleteOne = async (q) => { db.letters = db.letters.filter((l) => !(same(l.analysis, q.analysis) && same(l.user, q.user))); };
Coverletters.findOneAndUpdate = async (filter, update) => {
  if (failNextUpsertWith11000) { failNextUpsertWith11000 = false; throw Object.assign(new Error('E11000'), { code: 11000 }); }
  let doc = db.letters.find((l) => same(l.analysis, filter.analysis) && same(l.user, filter.user));
  if (doc) { doc.set(update.$set || {}); Object.keys(update.$unset || {}).forEach((k) => doc.set(k, undefined)); }
  else { doc = new Coverletters({ ...filter, ...update.$set }); db.letters.push(doc); }
  await doc.validate();
  return doc;
};

// ── AI nakli ─────────────────────────────────────────────────────────────────
const P1 = 'I am drawn to the Full Stack Developer role because it combines the React and Node.js work I enjoy most. My degree in Computer Science and my internship gave me a solid base, and I want to apply it to real products used by real people.';
const P2 = 'At Techify I implemented 12 REST endpoints and wrote unit tests with Jest, which taught me to keep APIs clean and testable. In my Expense Tracker project I built a MERN app used by 300+ users and reduced manual data entry by 40% with receipt parsing. My Chat App project used Socket.io and JWT authentication, deployed on AWS EC2.';
const P3 = 'I am still growing in Docker and TypeScript, and I am eager to learn them quickly on the job. I would welcome the chance to talk about how my projects could help your team. Thank you for your time and consideration.';
const aiCalls = [];
const setAi = (mode) => {
  ['GEMINI_API_KEY', 'GROQ_API_KEY', 'AI_PROVIDER'].forEach((k) => delete process.env[k]);
  process.env.AI_WAIT_SCALE = '0';
  aiCalls.length = 0;
  console.warn = () => {};
  if (mode === 'none') return;
  process.env.GROQ_API_KEY = 'test-key';
  global.fetch = async (url, options) => {
    aiCalls.push(JSON.parse(options.body));
    if (mode === 'ok') return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify({ paragraphs: [P1, P2, P3] }) } }] }) };
    return { ok: false, status: 401, headers: { get: () => null }, json: async () => ({}) };
  };
};

// ── req/res/next nakli ───────────────────────────────────────────────────────
const call = async (handler, req) => {
  const out = { status: null, body: null, error: null, headers: {}, sent: null };
  const res = {
    status(c) { out.status = c; return this; },
    json(p) { out.body = p; return this; },
    set(h) { Object.assign(out.headers, h); return this; },
    send(b) { out.sent = b; return this; },
  };
  // Express 5 ki nakal: handler next(err) bulaye YA promise reject ho (throw), dono surat mein error `out.error` mein
  await new Promise((resolveDone) => {
    const next = (err) => { out.error = err; resolveDone(); };
    Promise.resolve()
      .then(() => handler({ body: {}, query: {}, params: {}, ...req }, res, next))
      .then(() => resolveDone(), (err) => { out.error = err; resolveDone(); });
  });
  return out;
};

const reset = () => { db.resumes = []; db.analyses = []; db.letters = []; paginateCalls.length = 0; pdfSpy.calls.length = 0; };
const makeAnalysis = async (user, key = 'web', jd = jds.web, jobTitle = 'Full Stack Developer') => {
  const r = await call(controller.createAnalysis, { file: { buffer: Buffer.from(key), originalname: key + '.pdf', size: 10 }, body: { jobDescription: jd, jobTitle }, user });
  return String(r.body.analysis.id);
};

const main = async () => {
  const userA = { _id: new mongoose.Types.ObjectId(), name: 'Usama Nadeem', email: 'usama@account.test' };
  const userB = { _id: new mongoose.Types.ObjectId(), name: 'Other Person' };

  console.log('\n=== A. Cover letter banana ===');
  reset(); setAi('ok');
  const id = await makeAnalysis(userA);
  let r = await call(controller.createCoverLetter, { params: { id }, user: userA, body: { companyName: 'Acme Labs', hiringManager: 'Ms. Khan', tone: 'friendly', location: 'Karachi, Pakistan' } });
  const letter = r.body?.coverLetter;
  check('201, cached false', r.status === 201 && r.body?.cached === false, r.error?.message);
  check('greeting server ne lagayi (Dear Ms. Khan,)', letter?.content.startsWith('Dear Ms. Khan,'));
  check('sign-off mein naam req.user.name se', letter?.content.endsWith('Sincerely,\nUsama Nadeem'));
  check('letter ka text DB mein save (content)', db.letters.length === 1 && db.letters[0].content === letter.content);
  check('tone/company/manager/location save', db.letters[0].tone === 'friendly' && db.letters[0].companyName === 'Acme Labs' && db.letters[0].hiringManager === 'Ms. Khan' && db.letters[0].location === 'Karachi, Pakistan');
  const sent = JSON.stringify(aiCalls[0]);
  check('PRIVACY: resume ka naam/email/phone AI ko nahi gaya', !sent.includes('Ali Khan') && !sent.includes('ali.khan@email.com') && !sent.includes('123-4567'));
  check('PRIVACY: user ka account naam AI ko nahi gaya', !sent.includes('Usama Nadeem'));
  check('AI ko company aur role bataye gaye', sent.includes('Acme Labs') && sent.includes('Full Stack Developer'));

  console.log('\n=== B. Dobara: cache, aur regenerate ===');
  r = await call(controller.createCoverLetter, { params: { id }, user: userA });
  check('dobara POST → 200 cached true', r.status === 200 && r.body.cached === true);
  check('cache par AI ko call nahi (token bachay)', aiCalls.length === 1);
  r = await call(controller.createCoverLetter, { params: { id }, user: userA, body: { regenerate: true, tone: 'confident', companyName: 'Beta Corp' } });
  check('regenerate:true → AI dobara chali, 200', r.status === 200 && r.body.cached === false && aiCalls.length === 2);
  check('wahi ek letter badla (naya document nahi)', db.letters.length === 1 && db.letters[0].tone === 'confident' && db.letters[0].companyName === 'Beta Corp');

  failNextUpsertWith11000 = true;
  r = await call(controller.createCoverLetter, { params: { id }, user: userA, body: { regenerate: true } });
  check('E11000 (race) par bhi 200, error nahi, letter ek hi', r.status === 200 && !r.error && db.letters.length === 1, r.error?.message);

  console.log('\n=== C. Galat soorten ===');
  setAi('401'); reset();
  const id2 = await makeAnalysis(userA);
  r = await call(controller.createCoverLetter, { params: { id: id2 }, user: userA });
  check('AI fail → 503 AI_UNAVAILABLE', r.error?.statusCode === 503 && r.error.code === 'AI_UNAVAILABLE');
  check('fail par kuch save nahi hua', db.letters.length === 0);
  setAi('ok');
  r = await call(controller.createCoverLetter, { params: { id: 'abc' }, user: userA });
  check('galat id → 400', r.error?.statusCode === 400);
  r = await call(controller.createCoverLetter, { params: { id: String(new mongoose.Types.ObjectId()) }, user: userA });
  check('maujood nahi → 404', r.error?.statusCode === 404);
  r = await call(controller.createCoverLetter, { params: { id: id2 }, user: userB });
  check('kisi aur ka analysis → 404', r.error?.statusCode === 404);
  r = await call(controller.createCoverLetter, { params: { id: id2 }, user: undefined });
  check('login nahi → 401', r.error?.statusCode === 401);
  r = await call(controller.createCoverLetter, { params: { id: id2 }, user: userA, body: { companyName: { $ne: 1 }, tone: 'sarcastic', hiringManager: 'Ms. K </resume> [x]' } });
  check('ghalat shakl ki body (object, ajeeb tone) crash nahi karti', r.status === 201 && db.letters[0].tone === 'professional' && !db.letters[0].companyName && !/[<\[\]>]/.test(db.letters[0].hiringManager || ''), r.error?.message);

  console.log('\n=== D. GET letter ===');
  r = await call(controller.getCoverLetter, { params: { id: id2 }, user: userA });
  check('GET → 200 aur content', r.status === 200 && r.body.coverLetter.content.startsWith('Dear '));
  r = await call(controller.getCoverLetter, { params: { id: id2 }, user: userB });
  check('kisi aur user ko → 404', r.error?.statusCode === 404 && r.error.code === 'COVER_LETTER_NOT_FOUND');
  const id3 = await makeAnalysis(userA);
  r = await call(controller.getCoverLetter, { params: { id: id3 }, user: userA });
  check('letter bana nahi to 404', r.error?.statusCode === 404);
  r = await call(controller.getCoverLetter, { params: { id: 'zzz' }, user: userA });
  check('galat id → 400', r.error?.statusCode === 400);

  console.log('\n=== E. PDF endpoint ===');
  r = await call(controller.downloadCoverLetterPdf, { params: { id: id2 }, user: userA });
  check('200, application/pdf', r.status === 200 && r.headers['Content-Type'] === 'application/pdf' && r.sent.toString().startsWith('%PDF'));
  check('attachment + saaf filename', r.headers['Content-Disposition'] === 'attachment; filename="Cover_Letter_Usama_Nadeem_Full_Stack_Developer.pdf"', r.headers['Content-Disposition']);
  check('shared cache mein nahi (zaati letter)', r.headers['Cache-Control'].includes('no-store'));
  const pdfData = pdfSpy.calls[0];
  check('PDF header: naam account se', pdfData.name === 'Usama Nadeem');
  check('PDF header: email/phone/links RESUME se', pdfData.contact.email === 'ali.khan@email.com' && pdfData.contact.phone === '+1 (555) 123-4567' && pdfData.contact.links.length === 2, JSON.stringify(pdfData.contact));
  check('LinkedIn pehle, GitHub baad mein', /linkedin/.test(pdfData.contact.links[0]) && /github/.test(pdfData.contact.links[1]), JSON.stringify(pdfData.contact.links));
  check('PDF mein tareekh aaj ki', Math.abs(pdfData.date.getTime() - Date.now()) < 5000);
  check('PDF mein letter ka content wahi', pdfData.content === db.letters[0].content);
  r = await call(controller.downloadCoverLetterPdf, { params: { id: id2 }, user: userA, query: { inline: '1' } });
  check('?inline=1 → inline (browser mein dekho/print)', r.headers['Content-Disposition'].startsWith('inline;'));
  r = await call(controller.downloadCoverLetterPdf, { params: { id: id2 }, user: userB });
  check('kisi aur ka PDF → 404', r.error?.statusCode === 404);
  r = await call(controller.downloadCoverLetterPdf, { params: { id: id3 }, user: userA });
  check('letter nahi bana to PDF → 404', r.error?.statusCode === 404);

  console.log('\n=== F. History functions (tumhare, theek kiye) ===');
  r = await call(controller.historylist, { user: userA, query: { page: '2', limit: '100000' } });
  check('limit 100000 → 50 par rok di', paginateCalls.at(-1).opts.limit === 50);
  check('page "2" (text) → number 2', paginateCalls.at(-1).opts.page === 2);
  r = await call(controller.historylist, { user: userA, query: { page: 'abc', limit: '-5' } });
  check('page/limit kharab → page 1, limit 1', paginateCalls.at(-1).opts.page === 1 && paginateCalls.at(-1).opts.limit === 1);
  r = await call(controller.historylist, { user: userA });
  check('list: bhaari fields nahi, success true', paginateCalls.at(-1).opts.select.extractedText === undefined && r.body.success === true && r.body.data.every((d) => d.jobDescription === undefined));
  check('list ki keys wahi (data, totaldocs, currentpage, nextpage...)', ['data', 'totaldocs', 'currentpage', 'pagingcounter', 'previouspage', 'nextpage'].every((k) => k in r.body));

  r = await call(controller.singleDocdetail, { params: { id: id2 }, user: userA });
  check('detail: success true + analysis (pehle success mein poora doc tha)', r.body.success === true && !!r.body.analysis.score);
  check('detail: resume ki file details populate', r.body.analysis.resume.orignalName === 'web.pdf' && r.body.analysis.resume.detectedSections.length > 0);
  check('detail: hasCoverLetter true', r.body.hasCoverLetter === true);
  r = await call(controller.singleDocdetail, { params: { id: id3 }, user: userA });
  check('detail: letter nahi to hasCoverLetter false', r.body.hasCoverLetter === false);
  r = await call(controller.singleDocdetail, { params: { id: 'abc' }, user: userA });
  check('detail: galat id → 400 (pehle 500)', r.error?.statusCode === 400);
  r = await call(controller.singleDocdetail, { params: { id: id2 }, user: userB });
  check('detail: kisi aur ka → 404', r.error?.statusCode === 404);

  r = await call(controller.deletehistory, { params: { id: id2 }, user: userB });
  check('delete: kisi aur ka analysis nahi hata sakta → 404', r.error?.statusCode === 404 && db.analyses.some((a) => same(a._id, id2)));
  r = await call(controller.deletehistory, { params: { id: id2 }, user: userA });
  check('delete: apna analysis hata, success true', r.status === 200 && r.body.success === true && !db.analyses.some((a) => same(a._id, id2)));
  check('delete: uska cover letter bhi hata (cascade)', !db.letters.some((l) => same(l.analysis, id2)));
  r = await call(controller.deletehistory, { params: { id: 'abc' }, user: userA });
  check('delete: galat id → 400', r.error?.statusCode === 400);
  r = await call(controller.deletehistory, { params: { id: id2 }, user: userA });
  check('delete: dobara → 404', r.error?.statusCode === 404);

  console.log('\n=== A2. Account mein naam chhote harf mein ===');
  const userLower = { _id: new mongoose.Types.ObjectId(), name: 'usama nadeem' };
  const idLower = await makeAnalysis(userLower);
  r = await call(controller.createCoverLetter, { params: { id: idLower }, user: userLower });
  check('sign-off "Usama Nadeem" (pehle "usama nadeem" likha aata tha)', r.body?.coverLetter.content.endsWith('Sincerely,\nUsama Nadeem'), r.body?.coverLetter.content.slice(-30));
  await call(controller.downloadCoverLetterPdf, { params: { id: idLower }, user: userLower });
  check('PDF header mein bhi "Usama Nadeem"', pdfSpy.calls.at(-1).name === 'Usama Nadeem');

  console.log('\n=== A3. User ka apna edit (PUT) ===');
  setAi('ok'); reset();
  const idE = await makeAnalysis(userA);
  const aiBefore = aiCalls.length;
  const myLetter = 'Dear Ms. Khan,\r\n\r\n\r\n\r\nI built a MERN app\u200B and I would love to join your team.  \r\nThank you for reading this letter, it means a lot to me.\n\nSincerely,\nUsama Nadeem';
  r = await call(controller.updateCoverLetter, { params: { id: idE }, user: userA, body: { content: myLetter, companyName: 'Acme', tone: 'sarcastic' } });
  check('letter pehle na ho, content do → 201 (khud likha letter)', r.status === 201 && db.letters.length === 1, r.error?.message);
  check('content saaf: \\r\\n → \\n, 3+ khali lines → 1, zero-width hata', db.letters[0].content === 'Dear Ms. Khan,\n\nI built a MERN app and I would love to join your team.\nThank you for reading this letter, it means a lot to me.\n\nSincerely,\nUsama Nadeem', JSON.stringify(db.letters[0].content));
  check('ghalat tone → professional', db.letters[0].tone === 'professional' && db.letters[0].companyName === 'Acme');
  check('edit par AI ko call nahi gayi', aiCalls.length === aiBefore);

  r = await call(controller.updateCoverLetter, { params: { id: idE }, user: userA, body: { content: myLetter.replace('MERN', 'MEAN'), companyName: '', hiringManager: 'Ms. Khan' } });
  check('maujooda letter badla → 200, ek hi document', r.status === 200 && db.letters.length === 1 && db.letters[0].content.includes('MEAN'));
  check('companyName "" bheja → hat gaya, hiringManager set', db.letters[0].companyName === undefined && db.letters[0].hiringManager === 'Ms. Khan');
  r = await call(controller.updateCoverLetter, { params: { id: idE }, user: userA, body: { location: 'Lahore' } });
  check('sirf location badli, content waisa hi', r.status === 200 && db.letters[0].location === 'Lahore' && db.letters[0].content.includes('MEAN'));

  r = await call(controller.updateCoverLetter, { params: { id: idE }, user: userA, body: {} });
  check('kuch nahi bheja → 400', r.error?.statusCode === 400);
  r = await call(controller.updateCoverLetter, { params: { id: idE }, user: userA, body: { content: 'too short' } });
  check('content 50 characters se chhota → 400', r.error?.statusCode === 400);
  r = await call(controller.updateCoverLetter, { params: { id: idE }, user: userA, body: { content: 'x'.repeat(6001) } });
  check('content 6000 se bara → 400', r.error?.statusCode === 400);
  r = await call(controller.updateCoverLetter, { params: { id: idE }, user: userA, body: { content: { $gt: '' } } });
  check('content text nahi (object) → 400', r.error?.statusCode === 400);
  const idNo = await makeAnalysis(userA);
  r = await call(controller.updateCoverLetter, { params: { id: idNo }, user: userA, body: { companyName: 'Acme' } });
  check('letter na ho aur content na do → 400', r.error?.statusCode === 400);
  r = await call(controller.updateCoverLetter, { params: { id: idE }, user: userB, body: { content: myLetter } });
  check('kisi aur ke analysis par → 404', r.error?.statusCode === 404);
  r = await call(controller.updateCoverLetter, { params: { id: 'abc' }, user: userA, body: { content: myLetter } });
  check('galat id → 400', r.error?.statusCode === 400);
  r = await call(controller.updateCoverLetter, { params: { id: idE }, user: undefined, body: { content: myLetter } });
  check('login nahi → 401', r.error?.statusCode === 401);
  await call(controller.downloadCoverLetterPdf, { params: { id: idE }, user: userA });
  check('PDF mein user ka EDIT kiya hua letter jata hai', pdfSpy.calls.at(-1).content.includes('MEAN') && pdfSpy.calls.at(-1).manager === 'Ms. Khan');

  console.log('\n=== G. Contact nikalna aur redaction ki safai ===');
  const c = extractContact('Usama usamanadeem.prg@gmail.com +92 303 2180360 2022- 2026 linkedin.com/in/usama github.com/usama Socket.io');
  check('email', c.email === 'usamanadeem.prg@gmail.com');
  check('phone saal ke bina: "+92 303 2180360"', c.phone === '+92 303 2180360', c.phone);
  check('links, Socket.io link nahi', c.links.length === 2 && !c.links.some((l) => /socket/i.test(l)), JSON.stringify(c.links));
  const red = redactContactInfo('Ali Khan\nPhone +92 303 2180360 2022- 2026 Karachi', { lines: ['Ali Khan'] });
  check('REDACTION: phone ke baad saal likhe hon tab bhi phone hata (pehle leak hota tha)', !red.includes('2180360') && red.includes('2022- 2026'), red);
  check('phone na ho to undefined', extractContact('BS CS 2019 2020 2021 2022').phone === undefined);

  console.log('\n=== H. Asli PDF ka banna (pdftotext se parh kar) ===');
  let hasPdftotext = true;
  try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); } catch (e) { hasPdftotext = e.code !== 'ENOENT'; }
  if (!hasPdftotext) {
    console.log('SKIP  pdftotext tumhare system par nahi (poppler). Koi masla nahi: PDF Postman/browser mein khol kar dekho');
  } else {
    const buf = await realPdf.buildCoverLetterPdf({
      name: 'Usama Nadeem', contact: { email: 'u@x.com', phone: '+92 303 2180360', links: ['linkedin.com/in/usama', 'github.com/usama'] },
      location: 'Karachi', date: new Date('2026-11-05T12:00:00Z'), manager: 'Ms. Khan', company: 'Acme Labs', jobTitle: 'Full Stack Developer',
      content: `Dear Ms. Khan,\n\n${P1}\n\n${P2}\n\n${P3}\n\nSincerely,\nUsama Nadeem`,
    });
    const file = path.join(os.tmpdir(), 'cl_test.pdf');
    fs.writeFileSync(file, buf);
    const text = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
    const pages = (text.match(/\f/g) || []).length;
    check('PDF ek page', pages === 1, 'pages ' + pages);
    check('header: naam, email, phone, links', ['Usama Nadeem', 'u@x.com', '+92 303 2180360', 'linkedin.com/in/usama', 'github.com/usama'].every((t) => text.includes(t)));
    check('tareekh "November 5, 2026"', text.includes('November 5, 2026'));
    check('receiver block + Re: line', text.includes('Ms. Khan') && text.includes('Acme Labs') && text.includes('Re: Application for Full Stack Developer'));
    check('greeting, paragraphs, sign-off', text.includes('Dear Ms. Khan,') && text.includes('12 REST endpoints') && text.includes('Sincerely,'));
    const long = await realPdf.buildCoverLetterPdf({ name: 'A B', contact: {}, date: new Date(), content: `Dear Hiring Manager,\n\n${[P2, P2, P2, P2, P2, P2].join('\n\n')}\n\nSincerely,\nA B` });
    fs.writeFileSync(file, long);
    const longText = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
    check('lamba letter bhi (font chhota ho kar) ek page mein', (longText.match(/\f/g) || []).length === 1);
    const nonLatin = await realPdf.buildCoverLetterPdf({ name: 'José علی', contact: {}, date: new Date(), content: 'Dear Hiring Manager,\n\nHello.\n\nSincerely,\nJosé علی' });
    fs.writeFileSync(file, nonLatin);
    check('Latin naam (José) theek, Urdu harf hata diye (kharab nishan nahi)', execFileSync('pdftotext', [file, '-'], { encoding: 'utf8' }).includes('José'));
  }
  check('filename saaf: ajeeb characters hat jate hain', realPdf.coverLetterFilename({ name: 'Usama Nadeem', jobTitle: 'Full Stack Developer (MERN)/React"\n' }) === 'Cover_Letter_Usama_Nadeem_Full_Stack_Developer_MERN_React.pdf');
  check('naam/title na ho to "Cover_Letter.pdf"', realPdf.coverLetterFilename({}) === 'Cover_Letter.pdf');

  console.log(`\n${failures === 0 ? 'SAB PASS ✅' : failures + ' FAILURE(S) ❌'}`);
  process.exit(failures === 0 ? 0 : 1);
};

main().catch((err) => { console.error('Test crash:', err); process.exit(1); });