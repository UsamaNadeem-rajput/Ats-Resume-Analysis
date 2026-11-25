
require('dotenv').config();

(async () => {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) {
    console.log('.env mein GEMINI_API_KEY nahi mili');
    process.exit(1);
  }

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
    headers: { 'x-goog-api-key': key },
  });
  if (!response.ok) {
    console.log('Masla: HTTP', response.status, '(key galat ya band ho sakti hai)');
    process.exit(1);
  }

  const data = await response.json();
  const names = (data.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((name) => name.startsWith('gemini'))
    .sort();

  console.log('Text generate karne wale Gemini models (GEMINI_MODEL mein inmein se likho):\n');
  names.forEach((name) => console.log(' ', name));
})();