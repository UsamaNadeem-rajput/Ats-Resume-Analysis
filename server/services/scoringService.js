// src/services/scoringService.js
// Score 6 hisson ka hai (KSSFAR). Har hissa deterministic rule hai, AI nahi.
// Yeh ATS ka ASLI score nahi, ek ESTIMATE hai: asli ATS (Workday, Greenhouse, Lever...) har company
// ka apna aur private hota hai. Hum "parse ho sakta hai?", "JD se kitna milta hai?",
// "structure theek hai?" naap kar ek andaza dete hain.

const actionVerbs = require('../utils/actionVerbs');
const { tokenizeWords, normalizeWord } = require('../utils/textUtils');
const { containsLink } = require('../utils/links');
const { findPhoneSpans } = require('../utils/contact');

// Skills asli signal hain (dictionary se pakki cheezein), keywords sirf JD ke aam lafz hain
// (skills ke bina), jo thode noisy hote hain. Isliye skills ka wazan zyada hai
const WEIGHTS = {
  keywordMatch: 20,
  skillsMatch: 40,
  sectionCompleteness: 15,
  formatting: 10,
  achievements: 10,
  readability: 5,
};

const ratio = (part, whole) => (whole === 0 ? 0 : part / whole);

// ── 1. Keywords (20) ─────────────────────────────────────────────────────────
// null = "yeh component lagu hi nahi" (JD se koi keyword nikla hi nahi)
const scoreKeywords = ({ jdKeywords, matchedKeywords }) => {
  if (jdKeywords.length === 0) return null;
  return Math.round(ratio(matchedKeywords.length, jdKeywords.length) * WEIGHTS.keywordMatch);
};

// ── 2. Skills (40) ───────────────────────────────────────────────────────────
// Pehle JD mein skill na ho to free 20 milte thay. Ab "lagu nahi" (null), aur score scale hota hai
const scoreSkills = ({ jdSkills, matchedSkills }) => {
  if (jdSkills.length === 0) return null;
  return Math.round(ratio(matchedSkills.length, jdSkills.length) * WEIGHTS.skillsMatch);
};

// ── 3. Sections (15) ─────────────────────────────────────────────────────────
// Fresher fair: experience YA projects (research, internship bhi detectSections mein experience hain)
const scoreSections = ({ detectedSections }) => {
  const has = (name) => detectedSections.includes(name);
  let points = 0;
  if (has('education')) points += 5;
  if (has('skills')) points += 5;
  if (has('experience') || has('projects')) points += 5;
  return points;
};

// ── 4. Formatting (10) ───────────────────────────────────────────────────────
const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

const hasEmail = (text) => EMAIL_REGEX.test(text);

// Phone: kisi bhi mulk ka format. Faisla digits ki ginti (10 se 13) se hota hai, format se nahi.
// Logic utils/contact.js mein hai (redaction aur PDF header bhi wahi istemal karte hain)
const hasPhone = (text) => findPhoneSpans(text).length > 0;

// Koi bhi professional link (GitHub, Kaggle, portfolio site, http(s)://, www.).
// "Link kya hai" ka faisla utils/links.js karta hai: "Socket.io" jaise tech naam link nahi gine jate.
// Pehle email hata dete hain, warna "name@company.io" bhi link ban jata
const hasProfessionalLink = (text) => containsLink(text.replace(new RegExp(EMAIL_REGEX, 'gi'), ' '));

// "Garbage" = asli kharabi: private-use icon-font characters, replacement char (�), control chars.
// Bullets (•), dashes, accents (é), Urdu/Arabic naam garbage NAHI hain
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

// ── 5. Achievements (10) ─────────────────────────────────────────────────────
// Metrics: percent, multiplier (3x), currency, bade numbers (10k, 2M), unit ke saath numbers
// (200 ms, 10,000 users, 40 endpoints) aur "1000+". Saal (2023) ya GPA metric nahi hote
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

  // Set: "built" 5 baar likhne se 5 point nahi, alag alag verbs ginte hain
  const usedVerbs = new Set(
    tokenizeWords(text).map(normalizeWord).filter((w) => actionVerbs.has(w))
  );
  const verbPoints = Math.min(usedVerbs.size, 5);

  return metricPoints + verbPoints;
};

// ── 6. Readability (5) ───────────────────────────────────────────────────────
// Fresher 1 page, senior 2 page tak theek. Words per page dekhte hain, total words nahi
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

  // Unique words ÷ total words: bohot kam ho to keyword stuffing ka shak
  const varietyPoints = new Set(words).size / words.length > 0.35 ? 2 : 0;

  return lengthPoints + varietyPoints;
};

// ── Main ─────────────────────────────────────────────────────────────────────
// Do guruh: FIT (keywords + skills: JD se kitna milta hai) aur STRUCTURE (sections, formatting,
// achievements, readability: resume ki apni quality).
// Pehle structure ke 40 marks JD se azaad thay, to galat field ke resume ko bhi ~40 mil jate thay.
// Ab structure ke marks "match factor" se scale hote hain: bilkul na milta ho to 40% marks
// (acha resume phir bhi poora zero nahi), poora milta ho to 100%
const FIT_PARTS = ['keywordMatch', 'skillsMatch'];
const GATE_FLOOR = 0.4;

// meta = { pageCount }
const calculateScore = (keywordData, resumeText, meta = {}) => {
  const parts = {
    keywordMatch: scoreKeywords(keywordData),
    skillsMatch: scoreSkills(keywordData),
    sectionCompleteness: scoreSections(keywordData),
    formatting: scoreFormatting(resumeText),
    achievements: scoreAchievements(resumeText),
    readability: scoreReadability(resumeText, meta.pageCount),
  };

  // 1. Fit kitna hai? (sirf jo components lagu hain)
  let fitEarned = 0;
  let fitPossible = 0;
  FIT_PARTS.forEach((name) => {
    if (parts[name] === null) return;
    fitEarned += parts[name];
    fitPossible += WEIGHTS[name];
  });
  // Agar JD se na keyword nikla na skill, to gate nahi lagta (factor 1)
  const matchFactor = fitPossible === 0 ? 1 : GATE_FLOOR + (1 - GATE_FLOOR) * ratio(fitEarned, fitPossible);

  // 2. Breakdown banao: structure ke marks match factor se scale
  const breakdown = {};
  const notApplicable = [];
  let earned = 0;
  let possible = 0;

  Object.entries(parts).forEach(([name, value]) => {
    if (value === null) {
      breakdown[name] = 0;
      notApplicable.push(name);          // is component ke marks denominator se bhi nikal diye
      return;
    }
    const marks = FIT_PARTS.includes(name) ? value : Math.round(value * matchFactor);
    breakdown[name] = marks;
    earned += marks;
    possible += WEIGHTS[name];
  });

  // Total hamesha breakdown ka sum hai (sab lagu hon to possible = 100).
  // Koi component lagu na ho to baaki ko 100 par scale karte hain
  const score = Math.round(ratio(earned, possible) * 100);

  return { score, breakdown, notApplicable, matchFactor: Math.round(matchFactor * 100) / 100 };
};

module.exports = {
  calculateScore,
  WEIGHTS,
  _internals: { hasPhone, hasEmail, hasProfessionalLink, isTextClean, scoreAchievements, scoreReadability },
};