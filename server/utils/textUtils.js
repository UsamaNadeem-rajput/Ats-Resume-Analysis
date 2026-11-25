
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const termRegex = (term, flags = 'i') =>
  new RegExp(`(^|[^A-Za-z0-9])${escapeRegex(term)}(?:e?s)?(?![A-Za-z0-9])`, flags);

const tokenizeWords = (text) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

const normalizeWord = (word) => {
  let w = word.toLowerCase();
  if (w.length <= 3) return w;

  if (w.endsWith('ies') && w.length > 4) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('es') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) w = w.slice(0, -1);

  if (w.endsWith('e') && w.length > 3) w = w.slice(0, -1);
  return w;
};

module.exports = { escapeRegex, termRegex, tokenizeWords, normalizeWord };