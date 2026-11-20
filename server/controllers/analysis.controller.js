//controllers/analysis.controller.js
//
// Tumhara design (do route): 1) upload → score foran, AI ke bagair. 2) button dabane par AI suggestions.
// Isay maine bilkul waise hi rakha hai. Sirf woh jagahein badli hain jahan bug tha: har badlao par
// "BADLAO n" likha hai taake tum dhoondh sako.

const crypto = require('crypto');
const mongoose = require('mongoose');
const { extractText }         = require('../services/pdfService');
const { analyzeKeywords }     = require('../services/keywordService');
const { calculateScore }      = require('../services/scoringService');
const { generateSuggestions } = require('../services/aiService');
const { generateCoverLetter } = require('../services/coverLetterService');
const { buildCoverLetterPdf, coverLetterFilename } = require('../services/coverLetterPdf');
const { cleanLabel, normalizeTone, formatPersonName } = require('../services/ai/coverLetterValidate');
const { extractContact } = require('../utils/contact');
const Resume   = require('../models/resumes');
const Analysis = require('../models/analysis');
const Coverletters = require('../models/coverletters');
const AppError = require('../utils/AppError');

const getUserId = (req) => req.user?._id || req.user?.id;

// BADLAO 1: Resume mein text newline (\n) se jora hua save hota hai (har line alag).
// Wapas padhte waqt yeh dono shaklen banti hain:
//   lines = alag alag lines (headings aur naam pehchanne ke liye)
//   text  = sab ek line mein (keywords/skills/score ke liye)
// Pehle yahan text.split('\n') tha, lekin saved text mein newline thi hi nahi, to poora resume
// "ek line" ban jata: sections kharab pakde jate aur AI ko bhejte waqt NAAM redact NAHI hota tha.
const partsFromSaved = (extractedText = '') => {
  const lines = extractedText.split('\n').map((line) => line.trim()).filter(Boolean);
  return { lines, text: lines.join(' ') };
};

// ── 1. Create Analysis (Deterministic Score Only — Zero AI Tokens) ───────────
const createAnalysis = async (req, res, next) => {
  let isNewResumeCreated = false;
  let resumeDoc = null;

  try {
    const userId = getUserId(req);
    if (!userId) throw new AppError('Pehle login karein', 401, 'UNAUTHORIZED');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'PDF file zaroori hai',
      });
    }

    const { jobDescription } = req.body;
    const jobTitle = typeof req.body.jobTitle === 'string' ? req.body.jobTitle.trim() || undefined : undefined;

    // ── File Buffer ka SHA-256 Hash nikalein ──────────────────────────────────
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // ── Check karein: Kya yeh resume pehle se database mein hai? ──────────────
    resumeDoc = await Resume.findOne({ user: userId, fileHash });

    let text, lines, pageCount, keywordData;

    if (resumeDoc) {
      // Resume pehle se maujood hai — PDF parsing skip, saved text reuse karein
      ({ lines, text } = partsFromSaved(resumeDoc.extractedText));
      pageCount = resumeDoc.pageCount || 1; // BADLAO 2: pehle yahan hamesha 1 tha (2 page resume ka score badal jata)
      keywordData = analyzeKeywords(text, jobDescription, lines);
    } else {
      // Naya resume hai — PDF parse karein
      const extracted = await extractText(req.file.buffer);
      text = extracted.text;
      lines = extracted.lines;
      pageCount = extracted.pageCount;
      keywordData = analyzeKeywords(text, jobDescription, lines);

      // Naya resume create karein
      try {
        resumeDoc = await Resume.create({
          user: userId,
          orignalName: req.file.originalname,
          fileHash,
          sizeBytes: req.file.size,
          pageCount,                         // BADLAO 2: page count save
          extractedText: lines.join('\n'),   // BADLAO 1: newline ke saath save
          detectedSections: keywordData.detectedSections,
        });
        isNewResumeCreated = true;
      } catch (createErr) {
        // BADLAO 3: do requests ek saath aayen to dono ko "resume nahi hai" dikhta hai aur dono bana-
        // ne chalte hain. Database ka unique index doosri ko E11000 error deta hai. Us surat mein
        // jo resume pehli request ne abhi banaya, wahi use karo (error mat do)
        if (createErr.code !== 11000) throw createErr;
        resumeDoc = await Resume.findOne({ user: userId, fileHash });
        if (!resumeDoc) throw createErr;
      }
    }

    // ── Mathematical Deterministic Score (Rules based, no AI) ─────────────────
    const { score, breakdown, notApplicable } = calculateScore(keywordData, text, { pageCount });

    // ── Analysis Save (aiStatus: 'not_requested') ──────────────────────────────
    const analysis = await Analysis.create({
      user: userId,
      resume: resumeDoc._id,
      jobTitle,
      jobDescription,
      score,
      breakdown,
      matchedkeywords: keywordData.matchedKeywords,
      missingkeywords: keywordData.missingKeywords,
      matchedSkills: keywordData.matchedSkills,
      missingSkills: keywordData.missingSkills,
      aiStatus: 'not_requested',
    });

    // ── Fast Response (Instant result) ────────────────────────────────────────
    return res.status(201).json({
      success: true,
      analysis: {
        id: analysis._id,
        resume: {
          id: resumeDoc._id,
          fileName: resumeDoc.orignalName,
          pageCount,
          sizeBytes: resumeDoc.sizeBytes,
        },
        jobTitle: analysis.jobTitle,
        score,
        breakdown,
        notApplicable,
        keywords: {
          matched: keywordData.matchedKeywords,
          missing: keywordData.missingKeywords,
        },
        skills: {
          inJd: keywordData.jdSkills,
          inResume: keywordData.resumeSkills,
          matched: keywordData.matchedSkills,
          missing: keywordData.missingSkills,
        },
        detectedSections: keywordData.detectedSections,
        suggestions: null,
        aiStatus: analysis.aiStatus,
        createdAt: analysis.createdAt,
      },
    });
  } catch (err) {
    // Sirf tab delete karein agar ISI request mein naya resume bana tha
    if (isNewResumeCreated && resumeDoc) {
      await Resume.deleteOne({ _id: resumeDoc._id }).catch(() => {});
    }
    return next(err);
  }
};

// ── 2. Request AI Suggestions (On-Demand / Button Click) ───────────────────────
const requestSuggestions = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) throw new AppError('Pehle login karein', 401, 'UNAUTHORIZED');

    const { id } = req.params;

    // BADLAO 4: id galat shakl ki ho ("abc") to Mongoose CastError deta tha (500 error).
    // Ab saaf 400
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Analysis id galat hai', 400, 'VALIDATION_ERROR');
    }

    const analysis = await Analysis.findOne({ _id: id, user: userId }).populate('resume');
    // BADLAO 5: resume hat chuka ho to analysis.resume null hota hai aur neeche .extractedText par crash
    if (!analysis || !analysis.resume) {
      throw new AppError('Analysis record nahi mila', 404, 'NOT_FOUND');
    }

    // Cache Check: Agar suggestions pehle hi calculate ho chuke hain
    if (analysis.aiStatus === 'ok' && analysis.suggestions?.summary) {
      return res.status(200).json({
        success: true,
        cached: true,
        suggestions: analysis.suggestions,
        aiStatus: analysis.aiStatus,
      });
    }

    // BADLAO 1: lines wapas banao (naam redaction aur AI ko saaf dhancha dene ke liye)
    const { lines } = partsFromSaved(analysis.resume.extractedText);

    // AI Service call
    const ai = await generateSuggestions({
      resumeText: lines.join('\n'),
      lines,
      jdText: analysis.jobDescription,
      keywordData: {
        matchedKeywords: analysis.matchedkeywords,
        missingKeywords: analysis.missingkeywords,
        matchedSkills: analysis.matchedSkills,
        missingSkills: analysis.missingSkills,
        detectedSections: analysis.resume.detectedSections,
      },
      score: analysis.score,
      breakdown: analysis.breakdown,
    });

    analysis.suggestions = ai.suggestions || undefined;
    analysis.aiStatus = ai.aiStatus; // 'ok' ya 'failed'
    await analysis.save();

    return res.status(200).json({
      success: true,
      cached: false,
      suggestions: analysis.suggestions,
      aiStatus: analysis.aiStatus,
      // Frontend ke liye: AI na chale to user ko kya dikhana hai
      ...(analysis.aiStatus === 'failed' && { message: 'AI abhi jawab nahi de saka, thori der baad dobara try karein' }),
    });
  } catch (err) {
    return next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// History: list, detail, delete  (tumhare functions, bugs theek kiye)
// ═══════════════════════════════════════════════════════════════════════════════

// Express 5: async handler mein throw/reject hone wale errors khud next(err) tak pahunchte hain,
// isliye yahan koi catchAsync wrapper nahi chahiye (Express 4 mein chahiye hota tha).

// Id ObjectId jaisi shakl ki na ho to Mongoose CastError (500) deta hai. Yeh Express ka nahi, Mongoose ka masla hai,
// isliye Express 5 mein bhi zaroori hai: saaf 400
const assertValidId = (id, label = 'Analysis') => {
  if (!mongoose.isValidObjectId(id)) throw new AppError(`${label} id galat hai`, 400, 'VALIDATION_ERROR');
};

const historylist = async (req, res) => {
  const userId = getUserId(req);

  // BADLAO 7: page/limit query se "text" aate hain ("5"), aur limit ki koi hadd nahi thi:
  // ?limit=100000 se poori collection ek saath load ho jati. Ab number banate hain aur limit 1 se 50
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limitofpage = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const paginationoptions = {
    page,
    limit: limitofpage,
    select: { jobTitle: 1, score: 1, aiStatus: 1, createdAt: 1, _id: 1 },
    sort: { createdAt: -1 },
    lean: true,
  };
  const analysislist = await Analysis.paginate({ user: userId }, paginationoptions);

  res.status(200).json({
    success: true,
    data: analysislist.docs,
    totaldocs: analysislist.totalDocs,
    totalpages: analysislist.totalPages,
    currentpage: analysislist.page,
    pagingcounter: analysislist.pagingCounter,
    previouspage: analysislist.hasPrevPage,
    nextpage: analysislist.hasNextPage,
  });
};

const singleDocdetail = async (req, res) => {
  const userId = getUserId(req);
  const id = req.params.id;
  assertValidId(id); // BADLAO 8: galat id par pehle 500 (CastError) aata tha

  // BADLAO 9: resume ki details (file ka naam, size, pages, sections) populate hoti hain, lekin
  // extractedText nahi (woh bhari hai aur yahan zaroori nahi)
  const result = await Analysis.findOne({ _id: id, user: userId })
    .populate('resume', 'orignalName sizeBytes pageCount detectedSections createdAt')
    .lean();

  if (!result) {
    throw new AppError('Analysis record nahi mila', 404, 'NOT_FOUND');
  }

  // Frontend ko batane ke liye: is analysis ka cover letter ban chuka hai ya nahi (button dikhana hai ya "view")
  const hasCoverLetter = !!(await Coverletters.exists({ analysis: id, user: userId }));

  // BADLAO 10: pehle { success: result } tha, yani "success" mein poora document. Ab success: true
  res.status(200).json({ success: true, analysis: result, hasCoverLetter });
};

const deletehistory = async (req, res) => {
  const analysisId = req.params.id;
  const userId = getUserId(req);
  assertValidId(analysisId);

  const result = await Analysis.findOneAndDelete({ _id: analysisId, user: userId });
  if (!result) {
    throw new AppError('Analysis record nahi mila', 404, 'NOT_FOUND');
  }

  // BADLAO 11: is analysis ka cover letter bhi hata do, warna yateem (orphan) letter database mein reh jata
  await Coverletters.deleteOne({ analysis: analysisId, user: userId });

  res.status(200).json({ success: true, message: 'Deleted', data: { id: analysisId } });
};

// ═══════════════════════════════════════════════════════════════════════════════
// Cover Letter: banao, dekho, PDF
// ═══════════════════════════════════════════════════════════════════════════════

const coverLetterJson = (doc) => ({
  id: doc._id,
  analysis: doc.analysis,
  content: doc.content,
  tone: doc.tone,
  companyName: doc.companyName,
  hiringManager: doc.hiringManager,
  location: doc.location,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// Ek analysis ka ek hi letter (analysis par unique index). Pehle se ho to badal do, na ho to bana do.
// Do requests ek saath aayen to doosri E11000 deti hai: us surat mein update karke wahi letter wapas
const saveCoverLetter = async (userId, analysisId, set, unset = {}) => {
  const filter = { analysis: analysisId, user: userId };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true };
  const update = { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) };
  try {
    return await Coverletters.findOneAndUpdate(filter, update, options);
  } catch (err) {
    if (err.code !== 11000) throw err;
    return Coverletters.findOneAndUpdate(filter, update, { new: true, runValidators: true });
  }
};

// ── POST /analysis/:id/cover-letter ─────────────────────────────────────────
// Body (sab optional): companyName, hiringManager, tone, location, regenerate
const createCoverLetter = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) throw new AppError('Pehle login karein', 401, 'UNAUTHORIZED');

    const { id } = req.params;
    assertValidId(id);

    const analysis = await Analysis.findOne({ _id: id, user: userId }).populate('resume');
    if (!analysis || !analysis.resume) {
      throw new AppError('Analysis record nahi mila', 404, 'NOT_FOUND');
    }

    const body = req.body || {};
    const regenerate = body.regenerate === true || body.regenerate === 'true';

    // Letter pehle se bana hua hai? To wohi dikha do (AI ke tokens nahi lagte), jab tak user regenerate na maange
    const existing = await Coverletters.findOne({ analysis: analysis._id, user: userId });
    if (existing && !regenerate) {
      return res.status(200).json({ success: true, cached: true, coverLetter: coverLetterJson(existing) });
    }

    const { lines } = partsFromSaved(analysis.resume.extractedText);
    const tone = normalizeTone(body.tone);
    const companyName = cleanLabel(body.companyName);
    const hiringManager = cleanLabel(body.hiringManager, 60);
    const location = cleanLabel(body.location);

    const ai = await generateCoverLetter({
      resumeText: lines.join('\n'),
      lines,
      jdText: analysis.jobDescription,
      jobTitle: analysis.jobTitle,
      companyName,
      hiringManager,
      candidateName: req.user?.name, // sign-off ke liye; AI ko nahi bheja jata
      tone,
      keywordData: { matchedSkills: analysis.matchedSkills, missingSkills: analysis.missingSkills },
    });

    // Suggestions ki tarah "failed" status save karne ki jagah nahi: letter ke bina saving ka matlab nahi.
    // 503 deta hain taake frontend "dobara try karein" button dikha sake
    if (ai.aiStatus !== 'ok') {
      throw new AppError('AI abhi cover letter nahi bana saka, thori der baad dobara try karein', 503, 'AI_UNAVAILABLE');
    }

    const saved = await saveCoverLetter(userId, analysis._id, {
      content: ai.coverLetter.text,
      tone,
      companyName: companyName || undefined,
      hiringManager: hiringManager || undefined,
      location: location || undefined,
    });

    return res.status(existing ? 200 : 201).json({ success: true, cached: false, coverLetter: coverLetterJson(saved) });
  } catch (err) {
    return next(err);
  }
};

// ── PUT /analysis/:id/cover-letter ──────────────────────────────────────────
// User ka khud ka edit kiya hua letter save karta hai (AI ke bagair). Body (sab optional, lekin kuch to ho):
//   content, companyName, hiringManager, location, tone
// "" bhejne par company/manager/location hat jata hai. Letter pehle se na ho to content dena zaroori hai (user khud likh sakta hai)
const MIN_LETTER_CHARS = 50;
const MAX_LETTER_CHARS = 6000;

// User ka apna text hai, isliye AI wale guards nahi: sirf line endings aur kharab (control/zero-width) characters saaf
const cleanUserLetter = (value) =>
  String(value)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u200B-\u200D\uFEFF]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const updateCoverLetter = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) throw new AppError('Pehle login karein', 401, 'UNAUTHORIZED');

    const { id } = req.params;
    assertValidId(id);

    // Analysis is user ka hona chahiye (warna kisi aur ke analysis par letter ban jata)
    const analysis = await Analysis.findOne({ _id: id, user: userId });
    if (!analysis) throw new AppError('Analysis record nahi mila', 404, 'NOT_FOUND');

    const body = req.body || {};
    const set = {};
    const unset = {};

    if (body.content !== undefined) {
      if (typeof body.content !== 'string') throw new AppError('content text hona chahiye', 400, 'VALIDATION_ERROR');
      const content = cleanUserLetter(body.content);
      if (content.length < MIN_LETTER_CHARS || content.length > MAX_LETTER_CHARS) {
        throw new AppError(`Letter ${MIN_LETTER_CHARS} se ${MAX_LETTER_CHARS} characters ke beech hona chahiye`, 400, 'VALIDATION_ERROR');
      }
      set.content = content;
    }

    [['companyName', 80], ['hiringManager', 60], ['location', 80]].forEach(([field, max]) => {
      if (body[field] === undefined) return;
      const value = cleanLabel(body[field], max);
      if (value) set[field] = value;
      else unset[field] = 1; // khali bheja to hata do
    });

    if (body.tone !== undefined) set.tone = normalizeTone(body.tone);

    const existing = await Coverletters.findOne({ analysis: analysis._id, user: userId });
    if (!existing && !set.content) {
      throw new AppError('Naya letter banane ke liye content zaroori hai', 400, 'VALIDATION_ERROR');
    }
    if (Object.keys(set).length === 0 && Object.keys(unset).length === 0) {
      throw new AppError('Badalne ke liye kuch nahi bheja', 400, 'VALIDATION_ERROR');
    }

    const saved = await saveCoverLetter(userId, analysis._id, set, unset);
    return res.status(existing ? 200 : 201).json({ success: true, coverLetter: coverLetterJson(saved) });
  } catch (err) {
    return next(err);
  }
};

// ── GET /analysis/:id/cover-letter ──────────────────────────────────────────
const getCoverLetter = async (req, res) => {
  const userId = getUserId(req);
  assertValidId(req.params.id);

  const letter = await Coverletters.findOne({ analysis: req.params.id, user: userId });
  if (!letter) throw new AppError('Is analysis ka cover letter abhi nahi bana', 404, 'COVER_LETTER_NOT_FOUND');

  res.status(200).json({ success: true, coverLetter: coverLetterJson(letter) });
};

// ── GET /analysis/:id/cover-letter/pdf   (?inline=1 → browser mein dikhao/print karo) ─────────
const downloadCoverLetterPdf = async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  assertValidId(id);

  const letter = await Coverletters.findOne({ analysis: id, user: userId });
  if (!letter) throw new AppError('Is analysis ka cover letter abhi nahi bana', 404, 'COVER_LETTER_NOT_FOUND');

  // Sender ki maloomat: naam user ke account se, email/phone/links resume se (AI ko nahi gaye, sirf PDF mein jayenge)
  const analysis = await Analysis.findOne({ _id: id, user: userId }).populate('resume', 'extractedText');
  const contact = extractContact(analysis?.resume?.extractedText || '');

  const name = formatPersonName(req.user?.name); // header mein bhi "Usama Nadeem"
  const pdf = await buildCoverLetterPdf({
    name,
    contact: { ...contact, email: contact.email || req.user?.email },
    location: letter.location,
    date: new Date(),
    manager: letter.hiringManager,
    company: letter.companyName,
    jobTitle: analysis?.jobTitle,
    content: letter.content,
  });

  const disposition = req.query.inline === '1' ? 'inline' : 'attachment';
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${disposition}; filename="${coverLetterFilename({ name, jobTitle: analysis?.jobTitle })}"`,
    'Content-Length': pdf.length,
    'Cache-Control': 'private, no-store', // letter zaati hai: kisi shared cache mein na rahe
  });
  res.status(200).send(pdf);
};

module.exports = {
  createAnalysis,
  requestSuggestions,
  historylist,
  singleDocdetail,
  deletehistory,
  createCoverLetter,
  updateCoverLetter,
  getCoverLetter,
  downloadCoverLetterPdf,
};