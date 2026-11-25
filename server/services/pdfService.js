const pdfParse = require('pdf-parse');
const AppError = require('../utils/AppError');

const toLines = (rawText) =>
  rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

const extractText = async (buffer) => {
  let result;
  try {
    result = await pdfParse(buffer);
  } catch (err) {
    console.log('pdf-parse error:', err.message);
    throw new AppError(
      'PDF read nahi ho saki, file theek nahi lag rahi',
      400,
      'VALIDATION_ERROR'
    );
  }

  const lines = toLines(result.text || '');
  const text = lines.join(' ');

  if (text.length < 50) {
    throw new AppError(
      'PDF mein readable text nahi mila. Scanned PDF kaam nahi karti, text-based PDF use karein',
      422,
      'NO_TEXT_IN_PDF'
    );
  }

  return {
    text,
    lines,
    pageCount: result.numpages,
  };
};

module.exports = { extractText, _toLines: toLines };