
const { findLinks } = require('./links');

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const isYear = (digits) => /^(19|20)\d{2}$/.test(digits);

const CANDIDATE = /[+(]?\d[\d\s().-]{6,}/g;

const phoneInCandidate = (candidate) => {
  let digits = 0;
  const groups = [];

  for (const m of candidate.matchAll(/\d+/g)) {
    groups.push(m[0]);
    digits += m[0].length;
    if (digits >= 10 && digits <= 13 && !groups.every(isYear)) {
      return { start: 0, end: m.index + m[0].length };
    }
    if (digits > 13) return null;
  }
  return null;
};

const findPhoneSpans = (text) => {
  const spans = [];
  for (const candidate of text.matchAll(CANDIDATE)) {
    const hit = phoneInCandidate(candidate[0]);
    if (hit) {
      spans.push({ start: candidate.index, end: candidate.index + hit.end, text: candidate[0].slice(0, hit.end).trim() });
    }
  }
  return spans;
};

const findEmails = (text) => text.match(EMAIL) || [];

const extractContact = (text) => {
  const email = findEmails(text)[0];
  const phone = findPhoneSpans(text)[0]?.text;

  const rank = (link) => (/linkedin/i.test(link) ? 0 : /github/i.test(link) ? 1 : 2);
  const links = findLinks(text.replace(EMAIL, ' ')).sort((a, b) => rank(a) - rank(b)).slice(0, 2);

  return { email, phone, links };
};

module.exports = { findPhoneSpans, findEmails, extractContact, EMAIL };