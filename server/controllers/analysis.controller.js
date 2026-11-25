
const crypto = require('crypto');
const mongoose = require('mongoose');
const { extractText } = require('../services/pdfService');
const { analyzeKeywords } = require('../services/keywordService');
const { calculateScore } = require('../services/scoringService');
const { generateSuggestions } = require('../services/aiService');
const { generateCoverLetter } = require('../services/coverLetterService');
const { buildCoverLetterPdf, coverLetterFilename } = require('../services/coverLetterPdf');
const { cleanLabel, normalizeTone, formatPersonName } = require('../services/ai/coverLetterValidate');
const { extractContact } = require('../utils/contact');
const Resume = require('../models/resumes');
const Analysis = require('../models/analysis');
const Coverletters = require('../models/coverletters');
const AppError = require('../utils/AppError');

const getUserId = (req) => req.user?._id || req.user?.id;

const partsFromSaved = (extractedText = '') => {
  const lines = extractedText.split('\n').map((line) => line.trim()).filter(Boolean);
  return { lines, text: lines.join(' ') };
};

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

    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    resumeDoc = await Resume.findOne({ user: userId, fileHash });

    let text, lines, pageCount, keywordData;

    if (resumeDoc) {
      ({ lines, text } = partsFromSaved(resumeDoc.extractedText));
      pageCount = resumeDoc.pageCount || 1;
      keywordData = analyzeKeywords(text, jobDescription, lines);
    } else {
      const extracted = await extractText(req.file.buffer);
      text = extracted.text;
      lines = extracted.lines;
      pageCount = extracted.pageCount;
      keywordData = analyzeKeywords(text, jobDescription, lines);

      try {
        resumeDoc = await Resume.create({
          user: userId,
          orignalName: req.file.originalname,
          fileHash,
          sizeBytes: req.file.size,
          pageCount,
          extractedText: lines.join('\n'),
          detectedSections: keywordData.detectedSections,
        });
        isNewResumeCreated = true;
      } catch (createErr) {
        if (createErr.code !== 11000) throw createErr;
        resumeDoc = await Resume.findOne({ user: userId, fileHash });
        if (!resumeDoc) throw createErr;
      }
    }

    const { score, breakdown, notApplicable } = calculateScore(keywordData, text, { pageCount });

    const analysis = await Analysis.create({
      user: userId,
      resume: resumeDoc._id,
      jobTitle,
      jobDescription,
      score,
      breakdown,
      notApplicable,
      matchedkeywords: keywordData.matchedKeywords,
      missingkeywords: keywordData.missingKeywords,
      matchedSkills: keywordData.matchedSkills,
      missingSkills: keywordData.missingSkills,
      aiStatus: 'not_requested',
    });

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
    if (isNewResumeCreated && resumeDoc) {
      await Resume.deleteOne({ _id: resumeDoc._id }).catch(() => { });
    }
    return next(err);
  }
};

const requestSuggestions = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) throw new AppError('Pehle login karein', 401, 'UNAUTHORIZED');

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Analysis id galat hai', 400, 'VALIDATION_ERROR');
    }

    const analysis = await Analysis.findOne({ _id: id, user: userId }).populate('resume');
    if (!analysis || !analysis.resume) {
      throw new AppError('Analysis record nahi mila', 404, 'NOT_FOUND');
    }

    if (analysis.aiStatus === 'ok' && analysis.suggestions?.summary) {
      return res.status(200).json({
        success: true,
        cached: true,
        suggestions: analysis.suggestions,
        aiStatus: analysis.aiStatus,
      });
    }

    const { lines } = partsFromSaved(analysis.resume.extractedText);

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
    analysis.aiStatus = ai.aiStatus;
    await analysis.save();

    return res.status(200).json({
      success: true,
      cached: false,
      suggestions: analysis.suggestions,
      aiStatus: analysis.aiStatus,
      ...(analysis.aiStatus === 'failed' && { message: 'AI abhi jawab nahi de saka, thori der baad dobara try karein' }),
    });
  } catch (err) {
    return next(err);
  }
};

const assertValidId = (id, label = 'Analysis') => {
  if (!mongoose.isValidObjectId(id)) throw new AppError(`${label} id galat hai`, 400, 'VALIDATION_ERROR');
};

const historylist = async (req, res) => {
  const userId = getUserId(req);

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
  assertValidId(id);

  const result = await Analysis.findOne({ _id: id, user: userId })
    .populate('resume', 'orignalName sizeBytes pageCount detectedSections createdAt')
    .lean();

  if (!result) {
    throw new AppError('Analysis record nahi mila', 404, 'NOT_FOUND');
  }

  const hasCoverLetter = !!(await Coverletters.exists({ analysis: id, user: userId }));

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

  await Coverletters.deleteOne({ analysis: analysisId, user: userId });

  res.status(200).json({ success: true, message: 'Deleted', data: { id: analysisId } });
};

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
      candidateName: req.user?.name,
      tone,
      keywordData: { matchedSkills: analysis.matchedSkills, missingSkills: analysis.missingSkills },
    });

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

const MIN_LETTER_CHARS = 50;
const MAX_LETTER_CHARS = 6000;

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
      else unset[field] = 1;
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

const getCoverLetter = async (req, res) => {
  const userId = getUserId(req);
  assertValidId(req.params.id);

  const letter = await Coverletters.findOne({ analysis: req.params.id, user: userId });
  if (!letter) throw new AppError('Is analysis ka cover letter abhi nahi bana', 404, 'COVER_LETTER_NOT_FOUND');

  res.status(200).json({ success: true, coverLetter: coverLetterJson(letter) });
};

const downloadCoverLetterPdf = async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  assertValidId(id);

  const letter = await Coverletters.findOne({ analysis: id, user: userId });
  if (!letter) throw new AppError('Is analysis ka cover letter abhi nahi bana', 404, 'COVER_LETTER_NOT_FOUND');

  const analysis = await Analysis.findOne({ _id: id, user: userId }).populate('resume', 'extractedText');
  const contact = extractContact(analysis?.resume?.extractedText || '');

  const name = formatPersonName(req.user?.name);
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
    'Cache-Control': 'private, no-store',
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