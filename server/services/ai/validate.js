// src/services/ai/validate.js
// AI ka jawab ek text hota hai. Isay (1) JSON mein badlo, (2) check karo ke shakl sahi hai.
// AI par bharosa nahi karte: jo item kharab ho woh nikal dete hain, poora jawab tab hi reject
// jab kaam ki koi cheez bachi hi nahi.

const { AiCallError } = require('./providers');
const { findSkills } = require('../../utils/skillMatcher');

// AI aksar ```json ... ``` ya "Here is the JSON:" jaisa faltu text laga deta hai.
// Pehli '{' se aakhri '}' tak ka hissa nikal kar parse karte hain
const extractJson = (raw) => {
  const cleaned = raw.replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new AiCallError('no JSON object found', 'invalid_output');

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    // JSON.parse ka apna message nahi lagate: usmein AI ke jawab ka tukra hota hai
    throw new AiCallError('invalid JSON', 'invalid_output');
  }
};

// ── Safai: AI ke text mein aksar ajeeb characters aur line breaks hote hain ───────────────
// 1. "full‑stack" mein AI kabhi NON-BREAKING hyphen (U+2011) likhta hai, kabhi en/em dash, smart quotes.
//    User yeh text apne resume mein copy karega, aur ATS in ajeeb characters ko galat parh sakta hai.
//    Isliye sab ko aam keyboard wale characters mein badal dete hain
// 2. PDF mein bullet kai lines mein toota hota hai, AI "\n" ke saath copy kar deta hai: ek line banao
const cleanText = (value) =>
  String(value)
    .replace(/[\u2010-\u2015\u2212]/g, '-')          // sab qism ke hyphen/dash → "-"
    .replace(/[\u2018\u2019\u201B]/g, "'")            // smart single quotes
    .replace(/[\u201C\u201D\u201F]/g, '"')            // smart double quotes
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F]/g, ' ') // non-breaking / ajeeb spaces
    .replace(/[\u200B-\u200D\uFEFF]/g, '')            // zero-width characters
    .replace(/\s+/g, ' ')                               // newline/tabs/dohre spaces → ek space
    .trim();

const asText = (value, max) => (typeof value === 'string' ? cleanText(value).slice(0, max) : '');
const asArray = (value) => (Array.isArray(value) ? value : []);
const squash = (text) => cleanText(text).toLowerCase();

// ── Jhoot ke guards (AI prompt ki hidayat aksar maan leta hai, lekin kabhi kabhi nahi) ───────
// Guard 1: "after" mein koi NAYA number nahi hona chahiye ("4-person team", "reduced by 30%").
//          Sirf woh numbers jo resume mein pehle se hain, ya [X%] jaisa placeholder (square brackets mein)
const numbersOutsidePlaceholders = (text) =>
  (text.replace(/\[[^\]]*\]/g, ' ').match(/\d+(?:[.,]\d+)?/g) || []);

// Guard 2: "after" mein koi NAYI skill nahi hona chahiye jo poore resume mein hai hi nahi
// (jaise resume mein encryption/Docker kahin nahi, lekin AI ne bullet mein daal diya).
// Skills pakadne ke liye wahi dictionary jo score mein chalti hai
const skillNames = (text) => new Set(findSkills(text).map((skill) => skill.name));

// Guard 3: "jo skill nahi aati, woh bhi likh do" jaisi salah. Yeh jhoot likhwana hai
const RISKY_ADVICE = [
  /\botherwise\b.{0,80}\badd\b/i,                                // "...if you have used them; otherwise add a line like..."
  /\beven if (?:you )?(?:have not|haven't|don't|do not|never)\b/i,  // "even if you haven't used it"
  /\b(?:pretend|claim) (?:to )?(?:know|have)\b/i,
];
const isRiskyAdvice = (text) => RISKY_ADVICE.some((pattern) => pattern.test(text));

const validateSuggestions = (parsed, resumeText) => {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new AiCallError('JSON was not an object', 'invalid_output');
  }

  const resumeSquashed = squash(resumeText);
  const resumeNumbers = new Set(resumeText.match(/\d+(?:[.,]\d+)?/g) || []);
  const resumeSkillSet = skillNames(resumeText);

  const summary = asText(parsed.summary, 700);

  const sectionSuggestions = asArray(parsed.sectionSuggestions)
    .map((item) => ({
      section: asText(item?.section, 60),
      issue: asText(item?.issue, 300),
      fix: asText(item?.fix, 500),
    }))
    .filter((item) => item.section && item.issue && item.fix) // adhoora item nikal do
    .filter((item) => !isRiskyAdvice(item.fix))                // Guard 3
    .slice(0, 8);

  // "before" bullet resume mein sach mein hona chahiye (AI ne khud nahi banaya),
  // aur "after" mein koi naya number ya naya skill nahi
  const rewrittenBullets = asArray(parsed.rewrittenBullets)
    .map((item) => ({ before: asText(item?.before, 400), after: asText(item?.after, 500) }))
    .filter((item) => item.before && item.after && resumeSquashed.includes(squash(item.before)))
    .filter((item) => numbersOutsidePlaceholders(item.after).every((n) => resumeNumbers.has(n)))   // Guard 1
    .filter((item) => [...skillNames(item.after)].every((name) => resumeSkillSet.has(name)))       // Guard 2
    .slice(0, 5);

  // Kuch bhi kaam ka nahi bacha to yeh "kharab jawab" hai, retry hoga
  if (!summary && sectionSuggestions.length === 0) {
    throw new AiCallError('no usable content', 'invalid_output');
  }

  return { summary, sectionSuggestions, rewrittenBullets };
};

module.exports = { extractJson, validateSuggestions, cleanText };