// src/config/ai.js
//
// Yeh file .env se dekhti hai ke kaun sa AI provider istemal ho sakta hai.
// Rule: jis provider ki API key .env mein hai, wahi "available" hai.
//   sirf GROQ_API_KEY   → Groq chalega
//   sirf GEMINI_API_KEY → Gemini chalega
//   dono keys           → pehle Gemini, woh fail ho to Groq (ya AI_PROVIDER=groq likh kar order badlo)
//   koi key nahi        → AI band, lekin score phir bhi chalta hai (aiService yeh handle karta hai)
//
// Code mein kahin provider ka naam hard-code nahi: naya provider = yahan ek line + providers.js mein ek function.

const KEY_ENV   = { gemini: 'GEMINI_API_KEY', groq: 'GROQ_API_KEY' };
const MODEL_ENV = { gemini: 'GEMINI_MODEL',   groq: 'GROQ_MODEL' };

// Default models. Yeh naam jaldi purane ho jate hain (Gemini 2.5 band ho chuka),
// isliye .env mein GEMINI_MODEL / GROQ_MODEL likh kar badal sakte ho, code nahi chhedna padta
const DEFAULT_MODELS = {
  gemini: 'gemini-3.8-flash',
  groq: 'openai/gpt-oss-120b',
};

const DEFAULT_ORDER = ['gemini', 'groq'];

// Har request par dobara padhte hain (server start par ek baar nahi), taake tests mein env badal sako
const getAiConfig = () => {
  const preferred = (process.env.AI_PROVIDER || '').trim().toLowerCase();

  // Pasandida provider sab se pehle, baaki uske baad
  const order = DEFAULT_ORDER.includes(preferred)
    ? [preferred, ...DEFAULT_ORDER.filter((name) => name !== preferred)]
    : DEFAULT_ORDER;

  const providers = order
    .map((name) => ({
      name,
      apiKey: (process.env[KEY_ENV[name]] || '').trim(),
      // AI Studio/API "models/gemini-xyz" likhta hai, hamein sirf "gemini-xyz" chahiye: aage ka "models/" hata do
      model: (process.env[MODEL_ENV[name]] || '').trim().replace(/^models\//, '') || DEFAULT_MODELS[name],
    }))
    .filter((provider) => provider.apiKey.length > 0); // key nahi to provider nahi

  return {
    providers,
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000, // ek call ke liye 30 second se zyada intezar nahi
    // Poori AI process (retry aur fallback sab milakar) ki hadd: iske baad nayi koshish nahi hoti
    totalBudgetMs: Number(process.env.AI_TOTAL_BUDGET_MS) || 45000,
    // Ek hi provider ho aur woh "limit khatam" (429) kahe to kitni der tak intezar kar ke ek baar aur poocha jaye
    maxRateLimitWaitMs: Number(process.env.AI_MAX_RATE_LIMIT_WAIT_MS) || 15000,
    // Waqti masle (503/timeout) ke baad dobara koshish se pehle ruknay ka paimana. 0 = bina ruke (tests ke liye)
    waitScale: process.env.AI_WAIT_SCALE === undefined || process.env.AI_WAIT_SCALE === '' ? 1 : Number(process.env.AI_WAIT_SCALE),
  };
};

module.exports = { getAiConfig, DEFAULT_MODELS };