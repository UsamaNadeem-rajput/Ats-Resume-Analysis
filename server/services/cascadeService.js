// src/services/cascadeService.js
// "Delete" ka matlab sirf ek document nahi: us se jure doosre documents bhi jane chahiye, warna
// yateem (orphan) records bachte hain (jaise resume nahi aur uske analyses maujood).
//
// Rishta (parent → bachay):
//   User ─┬─ Resume ── Analysis ── Coverletters
//         └──────────── (user ke har document par `user` field bhi hota hai)
//
// Usool: pehle BACHAY hatao, phir PARENT. Beech mein kuch fail ho jaye to parent maujood rehta hai
// aur user dobara delete kar sakta hai (warna bachay yateem reh jate aur dikhte bhi nahi).
// MongoDB transaction yahan nahi: wo replica set maangti hai, aur ek dafa dobara chalane se kaam ho jata hai.

const Resume = require('../models/resumes');
const Analysis = require('../models/analysis');
const Coverletters = require('../models/coverletters');

// Ek resume aur uske saare analyses/cover letters. userId se ownership bhi check hoti hai.
// null wapas = "yeh resume is user ka nahi (ya hai hi nahi)"
const deleteResumeCascade = async (userId, resumeId) => {
  const resume = await Resume.findOne({ _id: resumeId, user: userId });
  if (!resume) return null;

  const analyses = await Analysis.find({ resume: resumeId, user: userId }).select('_id').lean();
  const analysisIds = analyses.map((a) => a._id);

  const letters = analysisIds.length
    ? await Coverletters.deleteMany({ analysis: { $in: analysisIds }, user: userId })
    : { deletedCount: 0 };
  const removedAnalyses = await Analysis.deleteMany({ resume: resumeId, user: userId });
  await Resume.deleteOne({ _id: resumeId, user: userId });

  return {
    resume: 1,
    analyses: removedAnalyses.deletedCount || 0,
    coverLetters: letters.deletedCount || 0,
  };
};

// User ka SAARA data (account delete se pehle). User document khud yahan nahi hatta:
// woh auth wale hisse ka kaam hai (cookie saaf karna waghera)
const deleteAllUserData = async (userId) => {
  const letters = await Coverletters.deleteMany({ user: userId });
  const analyses = await Analysis.deleteMany({ user: userId });
  const resumes = await Resume.deleteMany({ user: userId });
  return {
    coverLetters: letters.deletedCount || 0,
    analyses: analyses.deletedCount || 0,
    resumes: resumes.deletedCount || 0,
  };
};

module.exports = { deleteResumeCascade, deleteAllUserData };