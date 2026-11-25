
const LINK_SOURCE =
  '(?:https?:\\/\\/|www\\.)\\S+|' +
  '\\b(?:github|gitlab|linkedin|bitbucket|kaggle|huggingface|leetcode|stackoverflow|medium|' +
  'behance|dribbble|codepen|hackerrank|codeforces)\\.(?:com|io|dev|org)\\S*|' +
  '\\b[a-z0-9-]+\\.(?:dev|io|me|tech|app)\\b\\S*';

const TECH_NAMES = new Set(['socket.io']);

const isTechName = (match) => TECH_NAMES.has(match.replace(/[),.;:]+$/, '').toLowerCase());

const newRegex = () => new RegExp(LINK_SOURCE, 'gi');

const containsLink = (text) => (text.match(newRegex()) || []).some((m) => !isTechName(m));

const redactLinks = (text, placeholder = '[LINK]') =>
  text.replace(newRegex(), (m) => (isTechName(m) ? m : placeholder));

const findLinks = (text) =>
  (text.match(newRegex()) || [])
    .filter((m) => !isTechName(m))
    .map((m) => m.replace(/[),.;:]+$/, ''));

module.exports = { containsLink, redactLinks, findLinks };