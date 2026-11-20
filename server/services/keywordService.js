// src/services/keywordService.js

const stopWords = require('../utils/stopWords');
const jobFiller = require('../utils/jobFiller');
const { findSkills } = require('../utils/skillMatcher');
const { termRegex, tokenizeWords, normalizeWord } = require('../utils/textUtils');

// jobFiller ke lafz bhi normalize karke rakho, taake "building" aur "build" dono pakde jayein
const fillerStems = new Set([...jobFiller].map(normalizeWord));

// ── Helper: ek lafz "noise" hai ya nahi ──────────────────────────────────────
const isNoise = (word) =>
  word.length < 2 ||
  /^\d+$/.test(word) ||                       // sirf numbers (2024, 5) keyword nahi
  stopWords.has(word) ||
  fillerStems.has(normalizeWord(word));

// ── Helper: JD ke top keywords (skills ke ALAWA) ─────────────────────────────
// Skills dictionary se alag ginti hain, isliye jo lafz kisi JD-skill ka hissa hain
// (react, node, js, docker...) yahan se nikal dete hain: warna ek hi cheez do baar score hoti
const buildJdKeywords = (jdText, excludedStems, topN = 20) => {
  const counts = new Map(); // stem → { word (dikhane wala), count }

  tokenizeWords(jdText).forEach((word) => {
    if (isNoise(word)) return;
    const stem = normalizeWord(word);
    if (excludedStems.has(stem)) return;

    const entry = counts.get(stem);
    if (entry) entry.count += 1;
    else counts.set(stem, { word, count: 1 });
  });

  // Zyada baar aane wale pehle. Barabar hon to jo JD mein pehle aaya woh pehle (sort stable hai)
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, topN)
    .map(([stem, { word }]) => ({ stem, word }));
};

// ── Sections: HEADINGS dhoondo, sirf lafz ki maujoodgi nahi ──────────────────
// Pehle "built" likha hone se projects aur "about 40%" se summary mil jati thi.
// Ab sirf chhoti lines (heading jaisi) dekhte hain.
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

// Yeh aam lafz hain, sirf heading ki shakl mein bharosa karte hain.
// Agar PDF se line structure hi na mile (fallback) to inhein ignore karte hain
const WEAK_ALIASES = new Set([
  'qualifications', 'research', 'freelance', 'volunteer', 'volunteering', 'technologies',
  'tech stack', 'tools', 'expertise', 'project', 'portfolio', 'open source', 'objective',
  'profile', 'about me', 'about', 'overview',
]);

const aliasRegex = {};
Object.entries(SECTION_ALIASES).forEach(([section, aliases]) => {
  aliasRegex[section] = aliases.map((alias) => ({ alias, regex: termRegex(alias, 'i') }));
});

// "WORK EXPERIENCE:" → "work experience"  (sirf letters aur spaces)
const normalizeHeading = (line) =>
  line.toLowerCase().replace(/[^a-z& ]+/g, ' ').replace(/\s+/g, ' ').trim();

// Heading ki shakl: sab CAPITAL ("EDUCATION") ya Title Case ("Technical Skills").
// "Worked on projects" jaisi sentence ki tarah lines (chhote lafz lowercase) heading nahi
const isHeadingCase = (line) =>
  line
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w))
    .every((w) => /^[^a-z]*[A-Z]/.test(w) || ['and', 'of', 'the', '&'].includes(w.toLowerCase()));

const allAliases = new Set(Object.values(SECTION_ALIASES).flat());

const detectSections = (lines, fullText) => {
  const detected = new Set();

  // Heading 1 se 4 lafz ki chhoti line hoti hai ("Technical Skills", "Work Experience")
  const headingLines = lines
    .map((raw) => ({ raw, norm: normalizeHeading(raw) }))
    .filter(({ norm }) => {
      const wordCount = norm.split(' ').filter(Boolean).length;
      return wordCount >= 1 && wordCount <= 4;
    })
    // Ya line bilkul ek alias ho ("skills"), ya heading ki shakl (CAPITAL / Title Case) mein ho
    .filter(({ raw, norm }) => allAliases.has(norm) || isHeadingCase(raw))
    .map(({ norm }) => norm);

  Object.entries(aliasRegex).forEach(([section, entries]) => {
    if (headingLines.some((h) => entries.some((e) => e.regex.test(h)))) detected.add(section);
  });

  // Fallback: agar PDF se lines hi nahi mili (sab ek line mein), to poore text mein
  // sirf STRONG aliases dhoondo (weak wale nahi, warna wohi purana "about"/"tools" masla)
  if (lines.length < 6) {
    Object.entries(aliasRegex).forEach(([section, entries]) => {
      const strong = entries.filter((e) => !WEAK_ALIASES.has(e.alias));
      if (strong.some((e) => e.regex.test(fullText))) detected.add(section);
    });
  }

// Dictionary ke order mein wapas (education, experience, skills, projects, summary)
  return Object.keys(SECTION_ALIASES).filter((s) => detected.has(s));
};

// ── Main function ────────────────────────────────────────────────────────────
// resumeLines: pdfService se aati hai (line-preserved text). Optional, default khali array
const analyzeKeywords = (resumeText, jdText, resumeLines = []) => {
  // 1. Skills (dictionary se). Har skill ke saath woh variants bhi milte hain jo match hue
  const jdSkillHits     = findSkills(jdText);
  const resumeSkillHits = findSkills(resumeText);

  const jdSkills     = jdSkillHits.map((s) => s.name);
  const resumeSkills = resumeSkillHits.map((s) => s.name);

  const resumeSkillSet = new Set(resumeSkills);
  const jdSkillSet     = new Set(jdSkills);
  const matchedSkills  = jdSkills.filter((s) => resumeSkillSet.has(s));
  const missingSkills  = jdSkills.filter((s) => !resumeSkillSet.has(s));

  // 2. Keywords: JD ki skills ke lafz nikal kar baaqi top lafz
  const excludedStems = new Set();
  jdSkillHits.forEach(({ terms }) =>
    terms.forEach((term) => tokenizeWords(term).forEach((w) => excludedStems.add(normalizeWord(w))))
  );

  const jdKeywordObjs = buildJdKeywords(jdText, excludedStems, 20);

  // Resume ke lafz bhi normalize karke Set mein (lookup O(1))
  const resumeStemSet = new Set(tokenizeWords(resumeText).map(normalizeWord));

  const jdKeywords      = jdKeywordObjs.map((k) => k.word);
  const matchedKeywords = jdKeywordObjs.filter((k) => resumeStemSet.has(k.stem)).map((k) => k.word);
  const missingKeywords = jdKeywordObjs.filter((k) => !resumeStemSet.has(k.stem)).map((k) => k.word);

  // 3. Sections
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