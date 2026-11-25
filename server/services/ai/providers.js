
class AiCallError extends Error {
  constructor(message, kind, retryAfterMs = null, hint = null) {
    super(message);
    this.name = 'AiCallError';
    this.kind = kind;
    this.retryAfterMs = retryAfterMs;
    this.hint = hint;
  }
}

const statusToKind = (status) => {
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'transient';
  return 'config';
};

const postJson = async (url, headers, body, timeoutMs) => {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    throw new AiCallError(isTimeout ? 'timeout' : 'network error', 'transient');
  }

  if (!response.ok) {
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

const callGemini = async ({ apiKey, model, system, user, timeoutMs }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const data = await postJson(
    url,
    { 'x-goog-api-key': apiKey },
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    },
    timeoutMs
  );

  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const text = (candidate?.content?.parts || []).map((part) => part.text || '').join('');

  if (finishReason === 'MAX_TOKENS') throw new AiCallError('truncated (output token limit)', 'invalid_output');
  if (!text.trim()) {
    throw new AiCallError(`empty response${finishReason ? ` (${finishReason})` : ''}`, 'invalid_output');
  }
  return text;
};

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

const callProvider = (provider, { system, user, timeoutMs }) =>
  adapters[provider.name]({ apiKey: provider.apiKey, model: provider.model, system, user, timeoutMs });

module.exports = { callProvider, AiCallError };