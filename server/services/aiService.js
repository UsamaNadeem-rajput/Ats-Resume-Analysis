// src/services/aiService.js
//
// AI ka darwaza. Controller sirf generateSuggestions() bulata hai, baaki sab yahan chhupa hai.
// AI hamesha "optional" hai: fail ho jaye to bhi score save hota hai (aiStatus: 'failed').
//
// Do hisse:
//  1. generateJson()        : GENERIC engine. Provider chuno → poocho → JSON nikalo → check karo → retry/fallback.
//                              Phase 10 ka cover letter bhi isi ko dobara istemal karega.
//  2. generateSuggestions() : is project ka khaas kaam: resume saaf karo → prompt banao → generateJson.

const { getAiConfig } = require('../config/ai');
const { callProvider } = require('./ai/providers');
const { buildSuggestionPrompt, RETRY_NOTE } = require('./ai/prompt');
const { extractJson, validateSuggestions } = require('./ai/validate');
const { redactContactInfo } = require('../utils/redact');

// AI ko bhejne ki hadd: free tiers par tokens ki per-minute limit chhoti hoti hai.
// (~4 characters = 1 token, to resume ~1,250 aur JD ~600 tokens)
const MAX_RESUME_CHARS = 5000;
const MAX_JD_CHARS = 2500;

// Ek provider par kitni koshish, kis qism ke masle par
const MAX_INVALID_OUTPUT_ATTEMPTS = 2; // kharab/adhoora jawab: ek baar aur poochho
const MAX_TRANSIENT_ATTEMPTS = 3;      // 503/timeout/network: teen koshish, beech mein ruk kar
const BASE_BACKOFF_MS = 1000;          // pehli ruk 1s, phir 2s (har baar double), thori random ghat-barh ke saath

// scale = 0 ho to bina ruke (tests tez chalein). Normal chalne par scale = 1
const wait = (ms, scale) => new Promise((resolve) => setTimeout(resolve, ms * scale));
const backoffMs = (transientCount) => BASE_BACKOFF_MS * 2 ** (transientCount - 1) + Math.random() * 300;

// ── 1. Generic engine ────────────────────────────────────────────────────────
// validate(parsedJson) → saaf data wapas de, ya AiCallError('...', 'invalid_output') phenk de
const generateJson = async ({ system, user, validate }) => {
  const { providers, timeoutMs, totalBudgetMs, maxRateLimitWaitMs, waitScale } = getAiConfig();
  const startedAt = Date.now();
  const elapsed = () => Date.now() - startedAt;
  const budgetLeft = () => totalBudgetMs - elapsed();

  if (providers.length === 0) {
    return { ok: false, error: 'no_api_key' };
  }

  let lastError = 'unknown';
  const rateLimited = []; // jin providers ne "limit khatam" kaha: baad mein ek aur mauqa

  // Ek provider par poori koshish (retry sameet). { ok:true,... } ya { ok:false, kind, retryAfterMs }
  const runProvider = async (provider, { single = false } = {}) => {
    let invalidCount = 0;
    let transientCount = 0;
    let first = true;
    let lastHint = null; // validator ne AI ko kya theek karne ko kaha (agar kaha)

    for (;;) {
      // Kul waqt ki hadd: user ko minuton intezar nahi karwana. Hadd guzar gayi to nayi koshish nahi
      // (sirf sab se pehli call hamesha hoti hai)
      if (!first && budgetLeft() <= 0) return { ok: false, kind: 'budget_exceeded' };
      first = false;

      try {
        const raw = await callProvider(provider, {
          system,
          // Kharab jawab ke baad dobara poochte waqt saaf yaad dilao
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

        // Log mein sirf provider, kind aur chhota message. Na resume, na key, na AI ka jawab
        console.warn(`[ai] ${provider.name} failed (${kind}): ${err.kind ? err.message : err.name}`);

        if (single) return { ok: false, kind, retryAfterMs: err.retryAfterMs ?? null };

        if (kind === 'invalid_output') {
          lastHint = err.hint || null;
          invalidCount += 1;
          if (invalidCount < MAX_INVALID_OUTPUT_ATTEMPTS) continue;
        } else if (kind === 'transient') {
          transientCount += 1;
          if (transientCount < MAX_TRANSIENT_ATTEMPTS) {
            // Server abhi masroof hai: foran dobara maarne se bekaar, thori der ruk kar
            await wait(Math.min(backoffMs(transientCount), Math.max(budgetLeft(), 0)), waitScale);
            continue;
          }
        }
        // rate_limit (429), config (galat key/model) ya koshishein khatam
        return { ok: false, kind, retryAfterMs: err.retryAfterMs ?? null };
      }
    }
  };

  // Har available provider ko baari baari: pehla fail ho to doosra
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

  // Doosra mauqa: koi provider "limit khatam" bola tha aur server ne chhoti ruk batayi (ya nahi batayi),
  // to ek baar ruk kar poochte hain. Lambi ruk (jaise 60s) ke liye user ko nahi rokte
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

// ── 2. Suggestions ───────────────────────────────────────────────────────────
// Input: controller ke paas jo kuch hai. Output hamesha ek hi shakl ka (kabhi throw nahi karta)
//   { aiStatus: 'ok',      suggestions: {...}, provider, model }   ('ok'/'failed': Analysis model ke enum ke mutabiq)
//   { aiStatus: 'failed',  suggestions: null,  error }
const generateSuggestions = async ({ resumeText, lines = [], jdText, keywordData, score, breakdown }) => {
  // Zaati maloomat hatao, phir lambai ki hadd lagao
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
    // "before" bullets ko safeResume se check karte hain (wahi text jo AI ne dekha)
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