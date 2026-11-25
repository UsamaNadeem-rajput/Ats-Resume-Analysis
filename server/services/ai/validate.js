
const { AiCallError } = require('./providers');
const { findSkills } = require('../../utils/skillMatcher');

const extractJson = (raw) => {
  const cleaned = raw.replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new AiCallError('no JSON object found', 'invalid_output');

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new AiCallError('invalid JSON', 'invalid_output');
  }
};

const cleanText = (value) =>
  String(value)
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201F]/g, '"')
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const asText = (value, max) => (typeof value === 'string' ? cleanText(value).slice(0, max) : '');
const asArray = (value) => (Array.isArray(value) ? value : []);
const squash = (text) => cleanText(text).toLowerCase();

const numbersOutsidePlaceholders = (text) =>
  (text.replace(/\[[^\]]*\]/g, ' ').match(/\d+(?:[.,]\d+)?/g) || []);

const skillNames = (text) => new Set(findSkills(text).map((skill) => skill.name));

const RISKY_ADVICE = [
  /\botherwise\b.{0,80}\badd\b/i,
  /\beven if (?:you )?(?:have not|haven't|don't|do not|never)\b/i,
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
    .filter((item) => item.section && item.issue && item.fix)
    .filter((item) => !isRiskyAdvice(item.fix))
    .slice(0, 8);

  const rewrittenBullets = asArray(parsed.rewrittenBullets)
    .map((item) => ({ before: asText(item?.before, 400), after: asText(item?.after, 500) }))
    .filter((item) => item.before && item.after && resumeSquashed.includes(squash(item.before)))
    .filter((item) => numbersOutsidePlaceholders(item.after).every((n) => resumeNumbers.has(n)))
    .filter((item) => [...skillNames(item.after)].every((name) => resumeSkillSet.has(name)))
    .slice(0, 5);

  if (!summary && sectionSuggestions.length === 0) {
    throw new AiCallError('no usable content', 'invalid_output');
  }

  return { summary, sectionSuggestions, rewrittenBullets };
};

module.exports = { extractJson, validateSuggestions, cleanText };