
const { redactLinks } = require('./links');
const { findPhoneSpans } = require('./contact');

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

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

  result = result.replace(EMAIL, '[EMAIL]');
  result = redactLinks(result);
  result = redactPhones(result);
  return result;
};

module.exports = { redactContactInfo };