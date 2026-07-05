/**
 * Google Gemini client — direct REST call, no SDK dep.
 * Works with both classic AI Studio keys (AIza…) and newer keys (AQ.…).
 */
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function getApiKey() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error('GEMINI_API_KEY is not set');
  return k;
}

function getModel() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
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

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!text) throw new Error('Gemini returned an empty response');
  return text;
}
