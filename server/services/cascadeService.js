
const Resume = require('../models/resumes');
const Analysis = require('../models/analysis');
const Coverletters = require('../models/coverletters');

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