// src/services/coverLetterService.js
// Cover letter ka darwaza (aiService.generateSuggestions ka jora).
// Kabhi throw nahi karta: { aiStatus: 'ok', coverLetter } ya { aiStatus: 'failed', coverLetter: null }.
//
// Is mein naya kuch nahi, sab purane tukde jorte hain:
//   redact.js            → naam/email/phone/links hata do
//   coverLetterPrompt.js → AI ko hidayat
//   generateJson()       → provider chuno, retry, backoff, fallback (wahi engine jo suggestions ka hai)
//   coverLetterValidate  → jhoote jumle nikalo, greeting/sign-off server lagaye

const { generateJson, MAX_RESUME_CHARS, MAX_JD_CHARS } = require('./aiService');
const { redactContactInfo } = require('../utils/redact');
const { buildCoverLetterPrompt } = require('./ai/coverLetterPrompt');
const { validateLetter, composeLetter, normalizeTone, cleanLabel, formatPersonName } = require('./ai/coverLetterValidate');

// Input:
//   resumeText, lines   : Resume model ka saved text aur uski lines
//   jdText, jobTitle    : Analysis se
//   keywordData         : { matchedSkills, missingSkills } Analysis se
//   candidateName       : req.user.name (sign-off ke liye; AI ko kabhi nahi bheja jata)
//   companyName, hiringManager, tone : user ki marzi (sab optional)
const generateCoverLetter = async ({
  resumeText,
  lines = [],
  jdText,
  jobTitle,
  companyName,
  hiringManager,
  candidateName,
  tone,
  keywordData = {},
}) => {
  const company = cleanLabel(companyName);
  const manager = cleanLabel(hiringManager, 60);
  const title = cleanLabel(jobTitle);
  const name = formatPersonName(candidateName); // "usama nadeem" → "Usama Nadeem"
  const toneKey = normalizeTone(tone);

  // Zaati maloomat hatao (naam bhi), phir lambai ki hadd
  const safeResume = redactContactInfo(resumeText, { lines }).slice(0, MAX_RESUME_CHARS);
  const safeJd = jdText.slice(0, MAX_JD_CHARS);

  const { system, user } = buildCoverLetterPrompt({
    resumeText: safeResume,
    jdText: safeJd,
    jobTitle: title,
    companyName: company,
    tone: toneKey,
    keywordData,
  });

  const result = await generateJson({
    system,
    user,
    // Jumla-satah ke guards: resume mein jo numbers/skills nahi, unka daava karne wale jumle hata do
    validate: (parsed) => validateLetter(parsed, { resumeText: safeResume, extraAllowedText: `${company} ${title}` }),
  });

  if (!result.ok) {
    return { aiStatus: 'failed', coverLetter: null, error: result.error };
  }

  return {
    aiStatus: 'ok',
    coverLetter: {
      text: composeLetter({ paragraphs: result.data.paragraphs, manager, name }),
      tone: toneKey,
      companyName: company || undefined,
      hiringManager: manager || undefined,
    },
    provider: result.provider,
    model: result.model,
  };
};

module.exports = { generateCoverLetter };