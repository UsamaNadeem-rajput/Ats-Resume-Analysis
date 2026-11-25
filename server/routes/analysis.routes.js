
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { analysisRules, checkValidation } = require('../middleware/validate');
const {
  createAnalysis, requestSuggestions, historylist, singleDocdetail, deletehistory,
  createCoverLetter, updateCoverLetter, getCoverLetter, downloadCoverLetterPdf,
} = require('../controllers/analysis.controller');

const { deleteResume } = require('../controllers/resume.controller');

router.get('/analyses/list', protect, historylist);
router.get('/analysis/single/doc/:id', protect, singleDocdetail);
router.delete('/analysis/doc/remove/:id', protect, deletehistory);

router.post('/analysis', protect, upload.single('resume'), analysisRules(), checkValidation, createAnalysis);
router.post('/analysis/:id/suggestions', protect, requestSuggestions);

router.post('/analysis/:id/cover-letter', protect, createCoverLetter);
router.put('/analysis/:id/cover-letter', protect, updateCoverLetter);
router.get('/analysis/:id/cover-letter', protect, getCoverLetter);
router.get('/analysis/:id/cover-letter/pdf', protect, downloadCoverLetterPdf);

router.delete('/resume/doc/remove/:id', protect, deleteResume);

module.exports = router;