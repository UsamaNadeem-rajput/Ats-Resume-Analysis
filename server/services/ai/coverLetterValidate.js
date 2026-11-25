
const { AiCallError } = require('./providers');
const { findSkills } = require('../../utils/skillMatcher');
const { cleanText } = require('./validate');

const TONES = ['professional', 'friendly', 'confident'];
const normalizeTone = (tone) => (TONES.includes(tone) ? tone : 'professional');

const cleanLabel = (value, max = 80) =>
  typeof value === 'string' ? cleanText(value).replace(/[^\p{L}\p{N} .'&,-]/gu, '').trim().slice(0, max) : '';

const LIMITS = { minWords: 120, maxWords: 380, minParagraphs: 2 };

const formatPersonName = (value) => {
  const name = cleanLabel(value, 60);
  if (!name) return '';
  if (name !== name.toLowerCase() && name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
};

const LEARNING_INTENT = /\b(?:learn|learning|eager to|keen to|willing to|ready to|excited to|look(?:ing)? forward to|grow(?:ing)? (?:my|in))\b/i;

const GREETING_OR_SIGNOFF = /^(?:dear|to whom|hello|hi|sincerely|regards|best regards|kind regards|yours|respectfully|thank you,?\s*$)/i;

const splitSentences = (paragraph) => paragraph.split(/(?<=[.!?])\s+(?=[A-Z"'(])/).map((s) => s.trim()).filter(Boolean);

const numbersIn = (text) => text.match(/\d+(?:[.,]\d+)?/g) || [];

const buildContext = ({ resumeText, extraAllowedText = '' }) => ({
  resumeLower: resumeText.toLowerCase(),
  resumeNumbers: new Set([...numbersIn(resumeText), ...numbersIn(extraAllowedText)]),
  resumeSkills: new Set(findSkills(resumeText).map((skill) => skill.name)),
});

const sentenceProblem = (sentence, ctx) => {
  if (/[[\]{}<>]/.test(sentence)) return 'placeholder';
  if (CURRENT_ACTIVITY.test(sentence)) return 'unverified_current_activity';
  const claimTerms = (sentence.match(CLAIM_TERMS) || []).map((t) => t.toLowerCase());
  if (claimTerms.some((t) => !ctx.resumeLower.includes(t))) return 'unsupported_claim';
  if (LEADERSHIP.test(sentence) && !LEADERSHIP.test(ctx.resumeLower)) return 'leadership_claim';
  if (numbersIn(sentence).some((n) => !ctx.resumeNumbers.has(n))) return 'new_number';
  const isLearning = LEARNING_INTENT.test(sentence);
  if (!isLearning && findSkills(sentence).some((s) => !ctx.resumeSkills.has(s.name))) return 'new_skill';
  return null;
};

const THIRD_PERSON_HINT = 'The letter must be written by the applicant in the FIRST PERSON ("I", "my"). Never write "the candidate", "they" or "their" about the applicant.';
const OVERCLAIM_HINT = 'Do not overclaim: remove words like proven, expert, expertise, extensive, seasoned, mastery. Use modest, specific wording.';

const isThirdPerson = (text) => {
  if (/\b(?:the|this) (?:candidate|applicant)\b/i.test(text)) return true;
  const first = (text.match(/\b(?:I|[Mm]y|[Mm]e|[Mm]yself)\b/g) || []).length;
  const third = (text.match(/\b(?:they|their|them|he|she|his|her)\b/gi) || []).length;
  return first < 3 || third > first;
};

const OVERCLAIM_WORDS = /\b(proven|expert|expertise|extensive|seasoned|mastery|guru|ninja|world-class)\b/gi;
const overclaims = (text, resumeLower) =>
  [...new Set((text.match(OVERCLAIM_WORDS) || []).map((w) => w.toLowerCase()))].filter((w) => !resumeLower.includes(w));

const CURRENT_ACTIVITY = /\b(?:currently|actively|presently|continu(?:e|es|ing|ously)|constantly)\s+(?:to\s+)?(?:learning|learn|studying|study|expanding|expand|upskilling|growing|grow|mastering|pursuing)\b/i;

const CLAIM_TERMS = /\b(?:milestones?|deadlines?|timely|on[- ]time|ahead of schedule|code quality|best practices|mentored|spearheaded|award(?:s|-winning)?|recognized|promoted|top performer|client satisfaction|stakeholders?)\b/gi;
const LEADERSHIP = /\b(?:led|managed|headed|directed|supervised)\s+(?:a|an|the|my|our)?\s*(?:\w+\s+)?(?:team|group|engineers|developers|interns|students|people|department)\b/i;

const FILLER_ADJECTIVES = ['robust', 'seamless', 'cutting-edge', 'state-of-the-art', 'world-class'];

const validateLetter = (parsed, ctx) => {
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.paragraphs)) {
    throw new AiCallError('no paragraphs in JSON', 'invalid_output');
  }
  const context = buildContext(ctx);
  const resumeLower = ctx.resumeText.toLowerCase();

  const rawText = parsed.paragraphs.filter((p) => typeof p === 'string').join(' ');
  if (isThirdPerson(rawText)) {
    throw new AiCallError('letter written in third person', 'invalid_output', null, THIRD_PERSON_HINT);
  }
  const bad = overclaims(rawText, resumeLower);
  if (bad.length) {
    throw new AiCallError(`overclaiming words: ${bad.join(', ')}`, 'invalid_output', null, `${OVERCLAIM_HINT} (found: ${bad.join(', ')})`);
  }

  const paragraphs = parsed.paragraphs
    .map((p) => (typeof p === 'string' ? cleanText(p) : ''))
    .filter((p) => p && !GREETING_OR_SIGNOFF.test(p))
    .slice(0, 5)
    .map((p) => splitSentences(p).filter((s) => sentenceProblem(s, context) === null).join(' '))
    .filter(Boolean);

  const fillerToStrip = FILLER_ADJECTIVES.filter((w) => !context.resumeLower.includes(w));
  const cleaned = fillerToStrip.length
    ? paragraphs.map((p) =>
        p.replace(new RegExp(`\\b(?:${fillerToStrip.join('|')})\\s+`, 'gi'), '')
         .replace(/(^|[.!?]\s+)([a-z])/g, (m, lead, ch) => lead + ch.toUpperCase()))
    : paragraphs;
  paragraphs.splice(0, paragraphs.length, ...cleaned);

  const words = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
  if (paragraphs.length < LIMITS.minParagraphs || words < LIMITS.minWords || words > LIMITS.maxWords) {
    throw new AiCallError(`letter length out of range (${paragraphs.length} paragraphs, ${words} words)`, 'invalid_output');
  }
  return { paragraphs };
};

const composeLetter = ({ paragraphs, manager, name }) => {
  const greeting = manager ? `Dear ${manager},` : 'Dear Hiring Manager,';
  const signature = name ? `Sincerely,\n${name}` : 'Sincerely,';
  return `${greeting}\n\n${paragraphs.join('\n\n')}\n\n${signature}`;
};

module.exports = { validateLetter, composeLetter, normalizeTone, cleanLabel, formatPersonName, isThirdPerson, sentenceProblem, buildContext, TONES };