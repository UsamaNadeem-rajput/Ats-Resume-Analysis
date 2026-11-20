// src/utils/textUtils.js
// Chhote shared helpers: har service inhein use karti hai, isliye ek jagah rakhe hain

// Regex ke special characters (. + * ? ( ) waghera) ko escape karta hai
// "c++" → "c\+\+", warna regex "c++" ko galat samajh kar crash ya galat match karta
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Aisi regex banata hai jo term ko POORE lafz ki tarah dhoondti hai
//  (^|[^A-Za-z0-9])  → term se pehle shuru-e-text ya koi non-letter/digit
//  (?:e?s)?          → akhir mein optional "s"/"es" (api → apis, container → containers)
//  (?![A-Za-z0-9])   → term ke baad letter/digit nahi aana chahiye
// Is se "scala" ≠ "scalable", "unity" ≠ "community", "rust" ≠ "trust"
const termRegex = (term, flags = 'i') =>
  new RegExp(`(^|[^A-Za-z0-9])${escapeRegex(term)}(?:e?s)?(?![A-Za-z0-9])`, flags);

// Text ko words mein todta hai (sirf a-z aur 0-9, baaki sab separator)
const tokenizeWords = (text) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

// Halka sa stemmer: "apis"→"api", "testing/tested/tests"→"test", "built" wahi rehta hai
// Yeh perfect NAHI hai (asli stemmer jaise Porter bhi nahi), bas itna kaafi hai ke
// same lafz ki alag shaklen ek dusre se match ho jayein.
// Dono taraf (JD aur resume) yehi function chalta hai, isliye consistent rehta hai
const normalizeWord = (word) => {
  let w = word.toLowerCase();
  if (w.length <= 3) return w;

  if (w.endsWith('ies') && w.length > 4) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('es') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) w = w.slice(0, -1);

  // Aakhri "e" hata do taake create/created/creating teeno "creat" ban jayein
  if (w.endsWith('e') && w.length > 3) w = w.slice(0, -1);
  return w;
};

module.exports = { escapeRegex, termRegex, tokenizeWords, normalizeWord };