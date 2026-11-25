
const skillsDictionary = require('./skillsDictionary');
const { termRegex } = require('./textUtils');

const canUseSpacingFallback = (stripped) =>
  stripped.length >= 6 && (stripped.includes('.') || stripped.length >= 9);

const compiled = skillsDictionary.map((skill) => ({
  name: skill.name,
  requires: skill.requires,
  implies: skill.implies,
  virtual: skill.virtual,
  strong: skill.variants.map((term) => {
    const stripped = term.replace(/\s+/g, '');
    return {
      term,
      regex: termRegex(term, 'i'),
      stripped,
      fallback: canUseSpacingFallback(stripped),
    };
  }),
  weak: skill.weak.map((term) => ({
    term,
    regex: termRegex(term, ''),
  })),
}));

const findSkills = (text) => {
  const strippedLower = text.toLowerCase().replace(/\s+/g, '');
  const found = new Map();

  const virtualHits = [];
  compiled.forEach((skill) => {
    const hits = skill.strong
      .filter((v) => v.regex.test(text) || (v.fallback && strippedLower.includes(v.stripped)))
      .map((v) => v.term);
    if (hits.length === 0) return;
    if (skill.virtual) virtualHits.push({ skill, hits });
    else found.set(skill.name, hits);
  });

  const addImplied = (skill, hits) =>
    skill.implies.forEach((name) => {
      const existing = found.get(name) || [];
      found.set(name, [...new Set([...existing, ...hits])]);
    });
  virtualHits.forEach(({ skill, hits }) => addImplied(skill, hits));

  compiled.forEach((skill) => {
    if (skill.weak.length === 0 || (!skill.virtual && found.has(skill.name))) return;
    const contextOk = skill.requires.length === 0 || skill.requires.some((r) => found.has(r));
    if (!contextOk) return;
    const hits = skill.weak.filter((v) => v.regex.test(text)).map((v) => v.term);
    if (hits.length === 0) return;
    if (skill.virtual) addImplied(skill, hits);
    else found.set(skill.name, hits);
  });

  return [...found.entries()].map(([name, terms]) => ({ name, terms }));
};

module.exports = { findSkills };