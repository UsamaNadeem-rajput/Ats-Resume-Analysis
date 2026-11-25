
const stopWords = require('../utils/stopWords');
const jobFiller = require('../utils/jobFiller');
const { findSkills } = require('../utils/skillMatcher');
const { termRegex, tokenizeWords, normalizeWord } = require('../utils/textUtils');

const fillerStems = new Set([...jobFiller].map(normalizeWord));

const isNoise = (word) =>
  word.length < 2 ||
  /^\d+$/.test(word) ||
  stopWords.has(word) ||
  fillerStems.has(normalizeWord(word));

const buildJdKeywords = (jdText, excludedStems, topN = 20) => {
  const counts = new Map();

  tokenizeWords(jdText).forEach((word) => {
    if (isNoise(word)) return;
    const stem = normalizeWord(word);
    if (excludedStems.has(stem)) return;

    const entry = counts.get(stem);
    if (entry) entry.count += 1;
    else counts.set(stem, { word, count: 1 });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, topN)
    .map(([stem, { word }]) => ({ stem, word }));
};

const SECTION_ALIASES = {
  education:  ['education', 'academic background', 'academics', 'academic qualifications', 'qualifications'],
  experience: [
    'experience', 'work experience', 'professional experience', 'work history', 'employment',
    'employment history', 'professional background', 'internship', 'internships',
    'research', 'freelance', 'volunteer', 'volunteering',
  ],
  skills:     ['skills', 'technical skills', 'core competencies', 'competencies', 'technologies', 'tech stack', 'tools', 'expertise'],
  projects:   ['projects', 'project', 'personal projects', 'academic projects', 'portfolio', 'open source'],
  summary:    ['summary', 'professional summary', 'objective', 'career objective', 'profile', 'about me', 'about', 'overview'],
};

const WEAK_ALIASES = new Set([
  'qualifications', 'research', 'freelance', 'volunteer', 'volunteering', 'technologies',
  'tech stack', 'tools', 'expertise', 'project', 'portfolio', 'open source', 'objective',
  'profile', 'about me', 'about', 'overview',
]);

const aliasRegex = {};
Object.entries(SECTION_ALIASES).forEach(([section, aliases]) => {
  aliasRegex[section] = aliases.map((alias) => ({ alias, regex: termRegex(alias, 'i') }));
});

const normalizeHeading = (line) =>
  line.toLowerCase().replace(/[^a-z& ]+/g, ' ').replace(/\s+/g, ' ').trim();

const isHeadingCase = (line) =>
  line
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w))
    .every((w) => /^[^a-z]*[A-Z]/.test(w) || ['and', 'of', 'the', '&'].includes(w.toLowerCase()));

const allAliases = new Set(Object.values(SECTION_ALIASES).flat());

const detectSections = (lines, fullText) => {
  const detected = new Set();

  const headingLines = lines
    .map((raw) => ({ raw, norm: normalizeHeading(raw) }))
    .filter(({ norm }) => {
      const wordCount = norm.split(' ').filter(Boolean).length;
      return wordCount >= 1 && wordCount <= 4;
    })
    .filter(({ raw, norm }) => allAliases.has(norm) || isHeadingCase(raw))
    .map(({ norm }) => norm);

  Object.entries(aliasRegex).forEach(([section, entries]) => {
    if (headingLines.some((h) => entries.some((e) => e.regex.test(h)))) detected.add(section);
  });

  if (lines.length < 6) {
    Object.entries(aliasRegex).forEach(([section, entries]) => {
      const strong = entries.filter((e) => !WEAK_ALIASES.has(e.alias));
      if (strong.some((e) => e.regex.test(fullText))) detected.add(section);
    });
  }

  return Object.keys(SECTION_ALIASES).filter((s) => detected.has(s));
};

const analyzeKeywords = (resumeText, jdText, resumeLines = []) => {
  const jdSkillHits     = findSkills(jdText);
  const resumeSkillHits = findSkills(resumeText);

  const jdSkills     = jdSkillHits.map((s) => s.name);
  const resumeSkills = resumeSkillHits.map((s) => s.name);

  const resumeSkillSet = new Set(resumeSkills);
  const jdSkillSet     = new Set(jdSkills);
  const matchedSkills  = jdSkills.filter((s) => resumeSkillSet.has(s));
  const missingSkills  = jdSkills.filter((s) => !resumeSkillSet.has(s));

  const excludedStems = new Set();
  jdSkillHits.forEach(({ terms }) =>
    terms.forEach((term) => tokenizeWords(term).forEach((w) => excludedStems.add(normalizeWord(w))))
  );

  const jdKeywordObjs = buildJdKeywords(jdText, excludedStems, 20);

  const resumeStemSet = new Set(tokenizeWords(resumeText).map(normalizeWord));

  const jdKeywords      = jdKeywordObjs.map((k) => k.word);
  const matchedKeywords = jdKeywordObjs.filter((k) => resumeStemSet.has(k.stem)).map((k) => k.word);
  const missingKeywords = jdKeywordObjs.filter((k) => !resumeStemSet.has(k.stem)).map((k) => k.word);

  const detectedSections = detectSections(resumeLines, resumeText);

  return {
    jdKeywords,
    matchedKeywords,
    missingKeywords,

    jdSkills,
    resumeSkills,
    matchedSkills,
    missingSkills,

    detectedSections,
  };
};

module.exports = { analyzeKeywords };