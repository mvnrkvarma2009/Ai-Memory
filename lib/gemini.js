/**
 * Google Gemini client — direct REST call, no SDK dep.
 * Works with both classic AI Studio keys (AIza…) and newer keys (AQ.…).
 *
 * We disable "thinking" (chain-of-thought) because on long transcripts the
 * model would otherwise burn its whole maxOutputTokens budget on thoughts
 * and truncate the actual JSON payload.
 */
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function getApiKey() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error('GEMINI_API_KEY is not set');
  return k;
}

function getModel() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
}

export async function geminiGenerate({ systemPrompt, userPrompt, temperature = 0.4, maxTokens = 8192 }) {
  const key = getApiKey();
  const model = getModel();
  const url = `${BASE}/${model}:generateContent`;

  const body = {
    systemInstruction: systemPrompt ? { role: 'system', parts: [{ text: systemPrompt }] } : undefined,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
      // Disable chain-of-thought so the token budget goes to the JSON, not to thinking.
      // Supported by 2.5-series models; ignored by others.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const detail = data?.error?.message || JSON.stringify(data).slice(0, 300);
    const err = new Error(`Gemini request failed: ${detail}`);
    err.status = res.status;
    throw err;
  }

  const cand = data.candidates?.[0];
  if (!cand) throw new Error('Gemini returned no candidates');

  // Filter out any "thought" parts (safety net) and concatenate visible text parts.
  const parts = cand.content?.parts || [];
  const text = parts
    .filter((p) => !p.thought)
    .map((p) => p.text || '')
    .join('')
    .trim();

  if (!text) {
    const reason = cand.finishReason || 'unknown';
    const usage = data.usageMetadata || {};
    throw new Error(
      `Gemini returned an empty response (finishReason=${reason}, ` +
      `thoughtsTokens=${usage.thoughtsTokenCount ?? 0}, ` +
      `outputTokens=${usage.candidatesTokenCount ?? 0}). ` +
      `Try a shorter transcript or a different GEMINI_MODEL.`
    );
  }
  return text;
}
