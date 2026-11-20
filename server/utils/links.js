// src/utils/links.js
// "Link kya hai?" ka ek hi jawab, jo scoringService (formatting marks) aur redact.js (privacy) dono use karte hain.
// Pehle dono jagah apni apni regex thi aur dono ek hi galti karti thin.

// http(s):// ya www.; aam professional sites; aur kisi bhi naam ka .dev/.io/.me/.tech/.app (portfolio site)
const LINK_SOURCE =
  '(?:https?:\\/\\/|www\\.)\\S+|' +
  '\\b(?:github|gitlab|linkedin|bitbucket|kaggle|huggingface|leetcode|stackoverflow|medium|' +
  'behance|dribbble|codepen|hackerrank|codeforces)\\.(?:com|io|dev|org)\\S*|' +
  '\\b[a-z0-9-]+\\.(?:dev|io|me|tech|app)\\b\\S*';

// Technology ke naam jo link jaise dikhte hain lekin link nahi: "Socket.io" ek library hai.
// Yeh list chhoti rakhi hai, sirf jo resumes mein skill ke taur par aate hain
const TECH_NAMES = new Set(['socket.io']);

// Lafz ke aakhri comma/full-stop hata kar allowlist se milao ("Socket.io," bhi tech name hai)
const isTechName = (match) => TECH_NAMES.has(match.replace(/[),.;:]+$/, '').toLowerCase());

const newRegex = () => new RegExp(LINK_SOURCE, 'gi');

const containsLink = (text) => (text.match(newRegex()) || []).some((m) => !isTechName(m));

const redactLinks = (text, placeholder = '[LINK]') =>
  text.replace(newRegex(), (m) => (isTechName(m) ? m : placeholder));

// Saare asli links (tech naam nahi), jis shakl mein likhe hain. Aakhri comma/full-stop hata dete hain
const findLinks = (text) =>
  (text.match(newRegex()) || [])
    .filter((m) => !isTechName(m))
    .map((m) => m.replace(/[),.;:]+$/, ''));

module.exports = { containsLink, redactLinks, findLinks };