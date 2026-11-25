
const KEY_ENV   = { gemini: 'GEMINI_API_KEY', groq: 'GROQ_API_KEY' };
const MODEL_ENV = { gemini: 'GEMINI_MODEL',   groq: 'GROQ_MODEL' };

const DEFAULT_MODELS = {
  gemini: 'gemini-3.8-flash',
  groq: 'openai/gpt-oss-120b',
};

const DEFAULT_ORDER = ['gemini', 'groq'];

const getAiConfig = () => {
  const preferred = (process.env.AI_PROVIDER || '').trim().toLowerCase();

  const order = DEFAULT_ORDER.includes(preferred)
    ? [preferred, ...DEFAULT_ORDER.filter((name) => name !== preferred)]
    : DEFAULT_ORDER;

  const providers = order
    .map((name) => ({
      name,
      apiKey: (process.env[KEY_ENV[name]] || '').trim(),
      model: (process.env[MODEL_ENV[name]] || '').trim().replace(/^models\//, '') || DEFAULT_MODELS[name],
    }))
    .filter((provider) => provider.apiKey.length > 0);

  return {
    providers,
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
    totalBudgetMs: Number(process.env.AI_TOTAL_BUDGET_MS) || 45000,
    maxRateLimitWaitMs: Number(process.env.AI_MAX_RATE_LIMIT_WAIT_MS) || 15000,
    waitScale: process.env.AI_WAIT_SCALE === undefined || process.env.AI_WAIT_SCALE === '' ? 1 : Number(process.env.AI_WAIT_SCALE),
  };
};

module.exports = { getAiConfig, DEFAULT_MODELS };