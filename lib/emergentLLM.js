import OpenAI from 'openai';

const PROXY_URL = 'https://integrations.emergentagent.com/llm';

/**
 * Build an OpenAI-compatible client that talks to the Emergent LLM proxy.
 * Reads EMERGENT_LLM_KEY at CALL time (not import time) so Next.js build
 * on Vercel doesn't crash when the env var is missing during page-data collection.
 */
function resolveKey(userKey) {
  const k = (userKey || '').trim();
  if (k) return { key: k, byok: !k.startsWith('sk-emergent-') };
  const envKey = process.env.EMERGENT_LLM_KEY;
  if (!envKey) throw new Error('EMERGENT_LLM_KEY is not set');
  return { key: envKey, byok: false };
}

export function llmClient(apiKey) {
  return new OpenAI({
    apiKey,
    baseURL: PROXY_URL,
    dangerouslyAllowBrowser: false,
  });
}

function modelForProxy(provider, model) {
  return provider === 'gemini' ? `gemini/${model}` : model;
}

export async function llmChat({ provider, model, systemMessage, messages, apiKey }) {
  const { key } = resolveKey(apiKey);
  const client = llmClient(key);
  const finalMessages = [
    { role: 'system', content: systemMessage },
    ...messages,
  ];
  const res = await client.chat.completions.create({
    model: modelForProxy(provider, model),
    messages: finalMessages,
    temperature: 0.4,
  });
  return res.choices?.[0]?.message?.content || '';
}

export { resolveKey };
