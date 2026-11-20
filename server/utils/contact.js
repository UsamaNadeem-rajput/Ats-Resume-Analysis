// src/utils/contact.js
// "Phone / email / link kahan hai?" ka EK hi jawab. Teen jagah isay istemal karti hain:
//   scoringService  → formatting marks (kya resume mein phone hai?)
//   redact.js       → AI ko bhejne se pehle hatana
//   coverLetterPdf  → PDF ke header mein sender ki maloomat likhna
// Pehle phone ka logic do jagah alag alag tha (aur ek jagah kamzor): isi se redaction mein
// "phone ke baad saal" likha hota to phone ka number AI tak chala jata. Ab ek hi code.

const { findLinks } = require('./links');

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const isYear = (digits) => /^(19|20)\d{2}$/.test(digits);

// Phone jaisa lagne wala tukra dhoondta hai: digits, spaces, ( ) . - aur shuru mein + ya (
const CANDIDATE = /[+(]?\d[\d\s().-]{6,}/g;

// Ek candidate ke andar se asli phone ka hissa nikalta hai (digits ki ginti 10 se 13).
// Misaal: "+92 303 2180360 2022- 2026" → "+92 303 2180360"  (saal chhor diye)
//         "(555) 123-4567"            → poora
//         "2019 2020 2021 2022"       → null (sab saal hain, phone nahi)
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

// Poore text mein saare phone numbers ki jagah: [{ start, end, text }]
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

// Resume se sender ki maloomat nikaalo (cover letter PDF ke header ke liye)
// Links mein LinkedIn pehle, phir GitHub, phir baaqi (maximum 2)
const extractContact = (text) => {
  const email = findEmails(text)[0];
  const phone = findPhoneSpans(text)[0]?.text;

  const rank = (link) => (/linkedin/i.test(link) ? 0 : /github/i.test(link) ? 1 : 2);
  const links = findLinks(text.replace(EMAIL, ' ')).sort((a, b) => rank(a) - rank(b)).slice(0, 2);

  return { email, phone, links };
};

module.exports = { findPhoneSpans, findEmails, extractContact, EMAIL };