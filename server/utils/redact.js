// src/utils/redact.js
// AI ko resume bhejne se pehle zaati maloomat hata deta hai.
// AI ko suggestions ke liye naam/email/phone ki zaroorat nahi, aur free tier par provider
// text apne models ke liye istemal kar sakta hai. "Jo zaroori nahi, bhejo hi mat."

const { redactLinks } = require('./links');
const { findPhoneSpans } = require('./contact');

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

// Phone: utils/contact.js ki jagahon (spans) par replace. Pehle yahan apni alag regex thi aur
// "+92 303 2180360 2022- 2026" jaisi line mein phone nahi hatata tha (saal jur kar 13 digits se zyada ho jate)
const redactPhones = (text) => {
  const spans = findPhoneSpans(text);
  let result = '';
  let last = 0;
  spans.forEach(({ start, end }) => {
    result += text.slice(last, start) + '[PHONE]';
    last = end;
  });
  return result + text.slice(last);
};

// Naam: resume ki pehli line aksar naam hoti hai. Sirf tab hatate hain jab line chhoti ho
// (5 lafz tak), usmein digit ya @ na ho. Yeh andaza hai, pakka nahi (best effort)
const looksLikeName = (line) =>
  typeof line === 'string' &&
  line.trim().length > 0 &&
  line.trim().split(/\s+/).length <= 5 &&
  !/[\d@]/.test(line);

const redactContactInfo = (text, { lines = [] } = {}) => {
  let result = text;

  if (looksLikeName(lines[0])) {
    result = result.replace(lines[0].trim(), '[NAME]');
  }

  // Pehle email (link se pehle, warna "name@site.io" aadha link ban jata)
  result = result.replace(EMAIL, '[EMAIL]');
  result = redactLinks(result);
  result = redactPhones(result);
  return result;
};

module.exports = { redactContactInfo };