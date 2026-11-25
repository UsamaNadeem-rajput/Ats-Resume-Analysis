
const { getAiConfig } = require('../config/ai');
const { callProvider } = require('./ai/providers');
const { buildSuggestionPrompt, RETRY_NOTE } = require('./ai/prompt');
const { extractJson, validateSuggestions } = require('./ai/validate');
const { redactContactInfo } = require('../utils/redact');

const MAX_RESUME_CHARS = 5000;
const MAX_JD_CHARS = 2500;

const MAX_INVALID_OUTPUT_ATTEMPTS = 2;
const MAX_TRANSIENT_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000;

const wait = (ms, scale) => new Promise((resolve) => setTimeout(resolve, ms * scale));
const backoffMs = (transientCount) => BASE_BACKOFF_MS * 2 ** (transientCount - 1) + Math.random() * 300;

const generateJson = async ({ system, user, validate }) => {
  const { providers, timeoutMs, totalBudgetMs, maxRateLimitWaitMs, waitScale } = getAiConfig();
  const startedAt = Date.now();
  const elapsed = () => Date.now() - startedAt;
  const budgetLeft = () => totalBudgetMs - elapsed();

  if (providers.length === 0) {
    return { ok: false, error: 'no_api_key' };
  }

  let lastError = 'unknown';
  const rateLimited = [];

  const runProvider = async (provider, { single = false } = {}) => {
    let invalidCount = 0;
    let transientCount = 0;
    let first = true;
    let lastHint = null;

    for (;;) {
      if (!first && budgetLeft() <= 0) return { ok: false, kind: 'budget_exceeded' };
      first = false;

      try {
        const raw = await callProvider(provider, {
          system,
          user: invalidCount > 0
            ? user + (lastHint
                ? `\n\nYour previous reply was rejected. ${lastHint} Reply again with ONLY the JSON object.`
                : RETRY_NOTE)
            : user,
          timeoutMs,
        });
        const data = validate(extractJson(raw));
        return { ok: true, data, provider: provider.name, model: provider.model };
      } catch (err) {
        const kind = err.kind || 'unexpected';

        console.warn(`[ai] ${provider.name} failed (${kind}): ${err.kind ? err.message : err.name}`);

        if (single) return { ok: false, kind, retryAfterMs: err.retryAfterMs ?? null };

        if (kind === 'invalid_output') {
          lastHint = err.hint || null;
          invalidCount += 1;
          if (invalidCount < MAX_INVALID_OUTPUT_ATTEMPTS) continue;
        } else if (kind === 'transient') {
          transientCount += 1;
          if (transientCount < MAX_TRANSIENT_ATTEMPTS) {
            await wait(Math.min(backoffMs(transientCount), Math.max(budgetLeft(), 0)), waitScale);
            continue;
          }
        }
        return { ok: false, kind, retryAfterMs: err.retryAfterMs ?? null };
      }
    }
  };

  for (const provider of providers) {
    if (provider !== providers[0] && budgetLeft() <= 0) {
      return { ok: false, error: `${lastError}:budget_exceeded` };
    }
    const result = await runProvider(provider);
    if (result.ok) return result;

    lastError = `${provider.name}:${result.kind}`;
    if (result.kind === 'budget_exceeded') return { ok: false, error: lastError };
    if (result.kind === 'rate_limit') rateLimited.push({ provider, retryAfterMs: result.retryAfterMs });
  }

  for (const { provider, retryAfterMs } of rateLimited) {
    const pause = retryAfterMs ?? 5000;
    if (pause > maxRateLimitWaitMs || pause >= budgetLeft()) continue;
    await wait(pause, waitScale);
    const result = await runProvider(provider, { single: true });
    if (result.ok) return result;
    lastError = `${provider.name}:${result.kind}`;
  }

  return { ok: false, error: lastError };
};

const generateSuggestions = async ({ resumeText, lines = [], jdText, keywordData, score, breakdown }) => {
  const safeResume = redactContactInfo(resumeText, { lines }).slice(0, MAX_RESUME_CHARS);
  const safeJd = jdText.slice(0, MAX_JD_CHARS);

  const { system, user } = buildSuggestionPrompt({
    resumeText: safeResume,
    jdText: safeJd,
    keywordData,
    score,
    breakdown,
  });

  const result = await generateJson({
    system,
    user,
    validate: (parsed) => validateSuggestions(parsed, safeResume),
  });

  if (!result.ok) {
    return { aiStatus: 'failed', suggestions: null, error: result.error };
  }
  return {
    aiStatus: 'ok',
    suggestions: result.data,
    provider: result.provider,
    model: result.model,
  };
};

module.exports = { generateSuggestions, generateJson, MAX_RESUME_CHARS, MAX_JD_CHARS };