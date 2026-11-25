
require('dotenv').config();

const { generateSuggestions } = require('../services/aiService');
const { analyzeKeywords } = require('../services/keywordService');
const { calculateScore } = require('../services/scoringService');
const { getAiConfig } = require('../config/ai');
const { resumes, jds } = require('./fixtures');

(async () => {
  const { providers } = getAiConfig();
  console.log('Available providers:', providers.length ? providers.map((p) => `${p.name} (${p.model})`).join(' → ') : 'KOI NAHI (.env mein key daalo)');

  const lines = resumes.web.text.split('\n').map((l) => l.trim()).filter(Boolean);
  const resumeText = lines.join(' ');
  const keywordData = analyzeKeywords(resumeText, jds.web, lines);
  const { score, breakdown } = calculateScore(keywordData, resumeText, { pageCount: 1 });

  const started = Date.now();
  const result = await generateSuggestions({ resumeText, lines, jdText: jds.web, keywordData, score, breakdown });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`\naiStatus: ${result.aiStatus}  (${seconds}s)`);
  if (result.aiStatus === 'failed') {
    console.log('error:', result.error, '\n(Upar [ai] warn lines dekho: status code ya kind bataegi kya hua)');
    process.exit(1);
  }
  console.log('provider:', result.provider, '| model:', result.model);
  console.log('summary:', result.suggestions.summary);
  console.log('sectionSuggestions:', result.suggestions.sectionSuggestions.length, '| rewrittenBullets:', result.suggestions.rewrittenBullets.length);
})();