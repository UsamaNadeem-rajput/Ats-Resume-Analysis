
const { generateJson, MAX_RESUME_CHARS, MAX_JD_CHARS } = require('./aiService');
const { redactContactInfo } = require('../utils/redact');
const { buildCoverLetterPrompt } = require('./ai/coverLetterPrompt');
const { validateLetter, composeLetter, normalizeTone, cleanLabel, formatPersonName } = require('./ai/coverLetterValidate');

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
  const name = formatPersonName(candidateName);
  const toneKey = normalizeTone(tone);

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