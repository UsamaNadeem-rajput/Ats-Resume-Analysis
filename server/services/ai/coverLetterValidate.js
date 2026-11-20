// src/services/ai/coverLetterValidate.js
// AI ka cover letter jawab check karta hai, jhoot wale jumle nikalta hai, aur final letter jodta hai.
//
// Suggestions ke guards (validate.js) "bullet" par chalte thay. Letter mein bullet nahi, jumle hote hain,
// isliye yahan guards JUMLE ki satah par hain: ek jhoota jumla hata do, baqi letter bacha rahe.

const { AiCallError } = require('./providers');
const { findSkills } = require('../../utils/skillMatcher');
const { cleanText } = require('./validate');

const TONES = ['professional', 'friendly', 'confident'];
const normalizeTone = (tone) => (TONES.includes(tone) ? tone : 'professional');

// User ka likha hua chhota label (company, hiring manager, naam, job title) ko saaf karo.
// Yeh letter ke text mein jata hai, isliye sirf harf, number, space aur . ' - & rakhte hain
// (koi bracket, newline ya "</resume>" jaisi cheez andar nahi ja sakti)
const cleanLabel = (value, max = 80) =>
  typeof value === 'string' ? cleanText(value).replace(/[^\p{L}\p{N} .'&,-]/gu, '').trim().slice(0, max) : '';

const LIMITS = { minWords: 120, maxWords: 380, minParagraphs: 2 };

// ── Naam ko saaf shakl dena ──────────────────────────────────────────────────────────
// Account mein naam aksar "usama nadeem" (sab chhota) ya "USAMA NADEEM" (sab bara) save hota hai.
// Letter aur PDF mein "Usama Nadeem" chahiye. Jo naam pehle se mixed-case hai ("McDonald") usay nahi chhedte
const formatPersonName = (value) => {
  const name = cleanLabel(value, 60);
  if (!name) return '';
  if (name !== name.toLowerCase() && name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
};

// Seekhne ki neeyat wale jumle jhoot nahi hote ("I am eager to learn Docker"), isliye missing skill
// ka zikr inmein allowed hai
const LEARNING_INTENT = /\b(?:learn|learning|eager to|keen to|willing to|ready to|excited to|look(?:ing)? forward to|grow(?:ing)? (?:my|in))\b/i;

// AI ne greeting/sign-off likh di to woh paragraph hata do: yeh kaam server ka hai
const GREETING_OR_SIGNOFF = /^(?:dear|to whom|hello|hi|sincerely|regards|best regards|kind regards|yours|respectfully|thank you,?\s*$)/i;

// "Node.js and React." ko galat na toore: sirf tab todo jab full-stop ke baad space ho aur agla lafz bara harf
const splitSentences = (paragraph) => paragraph.split(/(?<=[.!?])\s+(?=[A-Z"'(])/).map((s) => s.trim()).filter(Boolean);

const numbersIn = (text) => text.match(/\d+(?:[.,]\d+)?/g) || [];

// ctx = { resumeText, extraAllowedText }  (extraAllowedText: company/job title, unmein number ho sakta hai: "7-Eleven")
const buildContext = ({ resumeText, extraAllowedText = '' }) => ({
  resumeLower: resumeText.toLowerCase(),
  resumeNumbers: new Set([...numbersIn(resumeText), ...numbersIn(extraAllowedText)]),
  resumeSkills: new Set(findSkills(resumeText).map((skill) => skill.name)),
});

// Ek jumle ko kyun nikala jaye: kya wajah (log aur tests ke liye). null = jumla theek hai
const sentenceProblem = (sentence, ctx) => {
  if (/[[\]{}<>]/.test(sentence)) return 'placeholder';                                          // [Company] jaisa
  if (CURRENT_ACTIVITY.test(sentence)) return 'unverified_current_activity';
  const claimTerms = (sentence.match(CLAIM_TERMS) || []).map((t) => t.toLowerCase());
  if (claimTerms.some((t) => !ctx.resumeLower.includes(t))) return 'unsupported_claim';              // "timely delivery of milestones"
  if (LEADERSHIP.test(sentence) && !LEADERSHIP.test(ctx.resumeLower)) return 'leadership_claim';     // "I led a team"
                       // "actively learning..."
  if (numbersIn(sentence).some((n) => !ctx.resumeNumbers.has(n))) return 'new_number';            // "5 years", "40%"
  const isLearning = LEARNING_INTENT.test(sentence);
  if (!isLearning && findSkills(sentence).some((s) => !ctx.resumeSkills.has(s.name))) return 'new_skill'; // resume mein nahi skill ka daava
  return null;
};

// ── Sakht jaanch (poore letter par): ghalat ho to AI se dobara likhwate hain, hint ke saath ──
const THIRD_PERSON_HINT = 'The letter must be written by the applicant in the FIRST PERSON ("I", "my"). Never write "the candidate", "they" or "their" about the applicant.';
const OVERCLAIM_HINT = 'Do not overclaim: remove words like proven, expert, expertise, extensive, seasoned, mastery. Use modest, specific wording.';

// Cover letter applicant khud likhta hai: "I built...". "The candidate is eager..." kisi aur ki likhi hui tareef lagti hai
const isThirdPerson = (text) => {
  if (/\b(?:the|this) (?:candidate|applicant)\b/i.test(text)) return true;
  const first = (text.match(/\b(?:I|[Mm]y|[Mm]e|[Mm]yself)\b/g) || []).length;
  const third = (text.match(/\b(?:they|their|them|he|she|his|her)\b/gi) || []).length;
  return first < 3 || third > first;
};

// Badha-chadha daava: sirf tab theek jab resume mein khud yeh lafz ho (maslan senior ka "extensive experience")
const OVERCLAIM_WORDS = /\b(proven|expert|expertise|extensive|seasoned|mastery|guru|ninja|world-class)\b/gi;
const overclaims = (text, resumeLower) =>
  [...new Set((text.match(OVERCLAIM_WORDS) || []).map((w) => w.toLowerCase()))].filter((w) => !resumeLower.includes(w));

// "actively expanding/learning..." jaise "abhi sikh raha hoon" ke daave, jo resume mein likhe hi nahi
const CURRENT_ACTIVITY = /\b(?:currently|actively|presently|continu(?:e|es|ing|ously)|constantly)\s+(?:to\s+)?(?:learning|learn|studying|study|expanding|expand|upskilling|growing|grow|mastering|pursuing)\b/i;

// Natije/zimmedari ke daave jo AI aksar khud bana deta hai ("timely delivery of milestones", "ensuring code quality").
// Resume mein yeh lafz khud na hon to jumla hata dete hain
const CLAIM_TERMS = /\b(?:milestones?|deadlines?|timely|on[- ]time|ahead of schedule|code quality|best practices|mentored|spearheaded|award(?:s|-winning)?|recognized|promoted|top performer|client satisfaction|stakeholders?)\b/gi;
// "led a team", "managed the engineers": qiyadat ka daava (sirf "managed the database" jaisa nahi)
const LEADERSHIP = /\b(?:led|managed|headed|directed|supervised)\s+(?:a|an|the|my|our)?\s*(?:\w+\s+)?(?:team|group|engineers|developers|interns|students|people|department)\b/i;

// Aise taareefi sifat jo cliche hain: resume mein khud na hon to sirf lafz hata dete hain ("robust backend" → "backend")
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

  // Cliche sifat hatao (resume mein na hon to), aur jumle ka pehla harf phir se bara karo
  const fillerToStrip = FILLER_ADJECTIVES.filter((w) => !context.resumeLower.includes(w));
  const cleaned = fillerToStrip.length
    ? paragraphs.map((p) =>
        p.replace(new RegExp(`\\b(?:${fillerToStrip.join('|')})\\s+`, 'gi'), '')
         .replace(/(^|[.!?]\s+)([a-z])/g, (m, lead, ch) => lead + ch.toUpperCase()))
    : paragraphs;
  paragraphs.splice(0, paragraphs.length, ...cleaned);

  const words = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
  if (paragraphs.length < LIMITS.minParagraphs || words < LIMITS.minWords || words > LIMITS.maxWords) {
    // Ya AI ka jawab hi chhota/lamba tha, ya safai ke baad bohot kam bacha: dobara poochte hain
    throw new AiCallError(`letter length out of range (${paragraphs.length} paragraphs, ${words} words)`, 'invalid_output');
  }
  return { paragraphs };
};

// Final letter: greeting aur sign-off SERVER lagata hai, AI nahi
const composeLetter = ({ paragraphs, manager, name }) => {
  const greeting = manager ? `Dear ${manager},` : 'Dear Hiring Manager,';
  const signature = name ? `Sincerely,\n${name}` : 'Sincerely,';
  return `${greeting}\n\n${paragraphs.join('\n\n')}\n\n${signature}`;
};

module.exports = { validateLetter, composeLetter, normalizeTone, cleanLabel, formatPersonName, isThirdPerson, sentenceProblem, buildContext, TONES };