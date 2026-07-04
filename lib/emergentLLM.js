import OpenAI from 'openai';

const EMERGENT_LLM_KEY = process.env.EMERGENT_LLM_KEY;
const PROXY_URL = 'https://integrations.emergentagent.com/llm';

/**
 * Build an OpenAI-compatible client that talks to the Emergent LLM proxy.
 * Works for Anthropic, OpenAI, and Gemini models through a single key.
 * Model name conventions inside the proxy:
 *   - anthropic:  'claude-sonnet-4-5' (no prefix)
 *   - openai:     'gpt-4o' (no prefix)
 *   - gemini:     'gemini/gemini-2.0-flash-exp' (prefixed)
 */
function resolveKey(userKey) {
  const k = (userKey || '').trim();
  if (k) return { key: k, byok: !k.startsWith('sk-emergent-') };
  return { key: EMERGENT_LLM_KEY, byok: false };
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
