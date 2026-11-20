// src/services/ai/providers.js
//
// Har AI company ka API alag shakl ka hota hai. Yahan har ek ke liye ek chhota "adapter" hai
// jo ek hi kaam karta hai: (system, user) lo → AI ka text jawab wapas do.
// Baaki poora project sirf callProvider() jaanta hai, provider ke andar ki tafseel nahi.
//
// Koi SDK install nahi kiya: Node ka apna fetch kaafi hai (kam packages = kam masle).

// Hamari apni error: kind se pata chalta hai aage kya karna hai
//   'transient'      → server/network ka waqti masla (5xx, timeout): ek baar dobara koshish
//   'rate_limit'     → 429, limit khatam: dobara koshish bekaar, agle provider par jao
//   'config'         → 400/401/403/404: galat key ya model ka naam, agle provider par jao
//   'invalid_output' → AI ne jawab diya lekin kaam ka nahi: ek baar dobara poocho
class AiCallError extends Error {
  constructor(message, kind, retryAfterMs = null, hint = null) {
    super(message);
    this.name = 'AiCallError';
    this.kind = kind;
    this.retryAfterMs = retryAfterMs; // server ne kitni der baad dobara aane ko kaha (agar kaha)
    this.hint = hint;                 // validator ki taraf se AI ke liye "kya theek karo" (dobara poochte waqt joda jata hai)
  }
}

const statusToKind = (status) => {
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'transient';
  return 'config';
};

// Dono providers ka common hissa: POST bhejo, timeout lagao, errors ko AiCallError banao.
// DHYAN: error message mein sirf status code jata hai, kabhi response body ya request body nahi
// (request mein resume hai, aur key bhi header mein hai, in dono ko log mein nahi aana chahiye)
const postJson = async (url, headers, body, timeoutMs) => {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs), // itni der mein jawab na aaye to cancel
    });
  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    throw new AiCallError(isTimeout ? 'timeout' : 'network error', 'transient');
  }

  if (!response.ok) {
    // "Retry-After" header: server batata hai kitne second baad dobara koshish karo (429/503 par aksar)
    const seconds = Number(response.headers?.get?.('retry-after'));
    const retryAfterMs = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
    const hint = retryAfterMs !== null ? ` (retry-after ${seconds}s)` : '';
    throw new AiCallError(`HTTP ${response.status}${hint}`, statusToKind(response.status), retryAfterMs);
  }

  try {
    return await response.json();
  } catch {
    throw new AiCallError('response was not JSON', 'transient');
  }
};

// ── Google Gemini ────────────────────────────────────────────────────────────
const callGemini = async ({ apiKey, model, system, user, timeoutMs }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const data = await postJson(
    url,
    { 'x-goog-api-key': apiKey },   // key header mein (URL mein nahi, warna logs mein dikh sakti hai)
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: 'application/json', // Gemini ko seedha JSON dene par majboor karta hai
        temperature: 0.3,                     // kam = zyada stable jawab
        // Naye Gemini models jawab se pehle "sochte" hain, aur yeh soch bhi isi hadd mein ginti hai.
        // Hadd chhoti ho to jawab beech mein kat jata hai (adhoora JSON). Isliye barri hadd
        maxOutputTokens: 8192,
      },
    },
    timeoutMs
  );

  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const text = (candidate?.content?.parts || []).map((part) => part.text || '').join('');

  // Jawab hadd par kat gaya: adhoora JSON hai, parse karna bekaar. Wajah saaf log mein aaye
  if (finishReason === 'MAX_TOKENS') throw new AiCallError('truncated (output token limit)', 'invalid_output');
  if (!text.trim()) {
    throw new AiCallError(`empty response${finishReason ? ` (${finishReason})` : ''}`, 'invalid_output');
  }
  return text;
};

// ── Groq (OpenAI jaisa format) ───────────────────────────────────────────────
// response_format jaan boojh kar nahi bheja: har Groq model JSON mode support nahi karta.
// Hum prompt mein JSON maangte hain aur validate.js ka parser fences/faltu text sambhal leta hai
const callGroq = async ({ apiKey, model, system, user, timeoutMs }) => {
  const data = await postJson(
    'https://api.groq.com/openai/v1/chat/completions',
    { Authorization: `Bearer ${apiKey}` },
    {
      model,
      temperature: 0.3,
      max_completion_tokens: 4096,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    },
    timeoutMs
  );

  const choice = data?.choices?.[0];
  const text = choice?.message?.content;
  if (choice?.finish_reason === 'length') throw new AiCallError('truncated (output token limit)', 'invalid_output');
  if (typeof text !== 'string' || !text.trim()) throw new AiCallError('empty response', 'invalid_output');
  return text;
};

const adapters = { gemini: callGemini, groq: callGroq };

// provider = { name, apiKey, model } (config/ai.js se)
const callProvider = (provider, { system, user, timeoutMs }) =>
  adapters[provider.name]({ apiKey: provider.apiKey, model: provider.model, system, user, timeoutMs });

module.exports = { callProvider, AiCallError };