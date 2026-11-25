
const actionVerbs = require('../utils/actionVerbs');
const { tokenizeWords, normalizeWord } = require('../utils/textUtils');
const { containsLink } = require('../utils/links');
const { findPhoneSpans } = require('../utils/contact');

const WEIGHTS = {
  keywordMatch: 20,
  skillsMatch: 40,
  sectionCompleteness: 15,
  formatting: 10,
  achievements: 10,
  readability: 5,
};

const ratio = (part, whole) => (whole === 0 ? 0 : part / whole);

const scoreKeywords = ({ jdKeywords, matchedKeywords }) => {
  if (jdKeywords.length === 0) return null;
  return Math.round(ratio(matchedKeywords.length, jdKeywords.length) * WEIGHTS.keywordMatch);
};

const scoreSkills = ({ jdSkills, matchedSkills }) => {
  if (jdSkills.length === 0) return null;
  return Math.round(ratio(matchedSkills.length, jdSkills.length) * WEIGHTS.skillsMatch);
};

const scoreSections = ({ detectedSections }) => {
  const has = (name) => detectedSections.includes(name);
  let points = 0;
  if (has('education')) points += 5;
  if (has('skills')) points += 5;
  if (has('experience') || has('projects')) points += 5;
  return points;
};

const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

const hasEmail = (text) => EMAIL_REGEX.test(text);

const hasPhone = (text) => findPhoneSpans(text).length > 0;

const hasProfessionalLink = (text) => containsLink(text.replace(new RegExp(EMAIL_REGEX, 'gi'), ' '));

const isTextClean = (text) => {
  if (text.length === 0) return false;
  const garbage = (text.match(/[\uE000-\uF8FF\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length;
  return ratio(garbage, text.length) < 0.005;
};

const scoreFormatting = (text) => {
  let points = 0;
  if (hasEmail(text)) points += 3;
  if (hasPhone(text)) points += 3;
  if (hasProfessionalLink(text)) points += 2;
  if (isTextClean(text)) points += 2;
  return points;
};

const METRIC_REGEX = new RegExp(
  [
    '\\d+(?:\\.\\d+)?\\s?%',
    '\\d+(?:\\.\\d+)?\\s?x\\b',
    '[$€£]\\s?\\d[\\d,.]*\\s?(?:k|m|b|million|billion)?',
    '\\d[\\d,.]*\\s?(?:k|m|b)\\b',
    '\\d[\\d,]*\\+',
    '\\d[\\d,.]*\\s?(?:ms|seconds|minutes|hours|days|users|customers|clients|requests|records|' +
      'transactions|downloads|students|employees|members|engineers|developers|servers|sites|' +
      'endpoints|services|models|tests|reports|alerts|vulnerabilities|incidents|devices|nodes|' +
      'rows|queries|apis|features|pages|projects)\\b',
  ].join('|'),
  'gi'
);

const scoreAchievements = (text) => {
  const metrics = new Set((text.match(METRIC_REGEX) || []).map((m) => m.toLowerCase().trim()));
  const metricPoints = Math.min(metrics.size, 5);

  const usedVerbs = new Set(
    tokenizeWords(text).map(normalizeWord).filter((w) => actionVerbs.has(w))
  );
  const verbPoints = Math.min(usedVerbs.size, 5);

  return metricPoints + verbPoints;
};

const scoreReadability = (text, pageCount) => {
  const words = tokenizeWords(text);
  if (words.length === 0) return 0;

  const pages = Math.max(pageCount || 1, 1);
  const wordsPerPage = words.length / pages;

  let lengthPoints = 0;
  if (pages <= 2) {
    if (wordsPerPage >= 200 && wordsPerPage <= 750) lengthPoints = 3;
    else if (wordsPerPage >= 100 && wordsPerPage <= 950) lengthPoints = 1;
  }

  const varietyPoints = new Set(words).size / words.length > 0.35 ? 2 : 0;

  return lengthPoints + varietyPoints;
};

const FIT_PARTS = ['keywordMatch', 'skillsMatch'];
const GATE_FLOOR = 0.4;

const calculateScore = (keywordData, resumeText, meta = {}) => {
  const parts = {
    keywordMatch: scoreKeywords(keywordData),
    skillsMatch: scoreSkills(keywordData),
    sectionCompleteness: scoreSections(keywordData),
    formatting: scoreFormatting(resumeText),
    achievements: scoreAchievements(resumeText),
    readability: scoreReadability(resumeText, meta.pageCount),
  };

  let fitEarned = 0;
  let fitPossible = 0;
  FIT_PARTS.forEach((name) => {
    if (parts[name] === null) return;
    fitEarned += parts[name];
    fitPossible += WEIGHTS[name];
  });
  const matchFactor = fitPossible === 0 ? 1 : GATE_FLOOR + (1 - GATE_FLOOR) * ratio(fitEarned, fitPossible);

  const breakdown = {};
  const notApplicable = [];
  let earned = 0;
  let possible = 0;

  Object.entries(parts).forEach(([name, value]) => {
    if (value === null) {
      breakdown[name] = 0;
      notApplicable.push(name);
      return;
    }
    const marks = FIT_PARTS.includes(name) ? value : Math.round(value * matchFactor);
    breakdown[name] = marks;
    earned += marks;
    possible += WEIGHTS[name];
  });

  const score = Math.round(ratio(earned, possible) * 100);

  return { score, breakdown, notApplicable, matchFactor: Math.round(matchFactor * 100) / 100 };
};

module.exports = {
  calculateScore,
  WEIGHTS,
  _internals: { hasPhone, hasEmail, hasProfessionalLink, isTextClean, scoreAchievements, scoreReadability },
};