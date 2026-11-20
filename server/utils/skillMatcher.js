// src/utils/skillMatcher.js
// skillsDictionary (data) ko regexes mein compile karta hai aur text mein skills dhoondta hai.
// Dictionary sirf data hai, matching ka logic yahan hai, taake dono alag alag badal sakein.

const skillsDictionary = require('./skillsDictionary');
const { termRegex } = require('./textUtils');

// PDF kabhi kabhi lafz ke beech space daal deta hai ("Nod e.js").
// Aise cases ke liye lambe/dot wale variants ko "spaces hata kar" bhi dhoondte hain.
// Chhote variants par yeh fallback NAHI lagta, warna "forest fully" mein "restful" mil jata
const canUseSpacingFallback = (stripped) =>
  stripped.length >= 6 && (stripped.includes('.') || stripped.length >= 9);

// Server start par ek hi baar compile hota hai (har request par dobara nahi)
const compiled = skillsDictionary.map((skill) => ({
  name: skill.name,
  requires: skill.requires,
  implies: skill.implies,
  virtual: skill.virtual,
  strong: skill.variants.map((term) => {
    const stripped = term.replace(/\s+/g, '');
    return {
      term,
      regex: termRegex(term, 'i'),            // case-insensitive
      stripped,
      fallback: canUseSpacingFallback(stripped),
    };
  }),
  weak: skill.weak.map((term) => ({
    term,
    regex: termRegex(term, ''),               // case-SENSITIVE: "Express" mile, "express" nahi
  })),
}));

// text mein jitni skills milen, [{ name, terms: [jo variants match hue] }] wapas deta hai
const findSkills = (text) => {
  const strippedLower = text.toLowerCase().replace(/\s+/g, '');
  const found = new Map(); // name → matched terms

  // Pass 1: strong variants (koi shart nahi)
  const virtualHits = [];                       // virtual skills (MERN...) ke hits, baad mein implies ke liye
  compiled.forEach((skill) => {
    const hits = skill.strong
      .filter((v) => v.regex.test(text) || (v.fallback && strippedLower.includes(v.stripped)))
      .map((v) => v.term);
    if (hits.length === 0) return;
    if (skill.virtual) virtualHits.push({ skill, hits });   // khud skill nahi, sirf implies ke liye
    else found.set(skill.name, hits);
  });

  // Pass 1b: virtual skills ki implied skills ("MERN stack" → MongoDB, Express, React, Node.js)
  const addImplied = (skill, hits) =>
    skill.implies.forEach((name) => {
      const existing = found.get(name) || [];
      found.set(name, [...new Set([...existing, ...hits])]); // hits isliye: keywords se "mern" lafz bhi nikal jaye
    });
  virtualHits.forEach(({ skill, hits }) => addImplied(skill, hits));

  // Pass 2: weak variants (sirf tab jab `requires` mein se koi skill pehle se mili ho)
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