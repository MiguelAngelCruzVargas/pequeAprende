import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { PROVIDERS } from './registry.js';

// ─── Provider Singletons (lazy, created once) ─────────────────────────────────
let groqClient = null;
let openaiClient = null;
let deepseekClient = null;

function getGroq() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

function getOpenAI() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function getDeepSeek() {
  if (!deepseekClient && process.env.DEEPSEEK_API_KEY) {
    deepseekClient = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: PROVIDERS.deepseek.baseURL,
    });
  }
  return deepseekClient;
}

// ─── Call Groq (Llama 3.3 70B) ───────────────────────────────────────────────
export async function callGroq(messages, systemPrompt) {
  const client = getGroq();
  if (!client) throw new Error('GROQ_NOT_CONFIGURED');

  const cfg = PROVIDERS.groq;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeout);

  try {
    const response = await client.chat.completions.create({
      model: cfg.model,
      max_tokens: cfg.maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }, { signal: controller.signal });

    return response.choices[0]?.message?.content?.trim() || '';
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Call Gemini ─────────────────────────────────────────────────────────────
export async function callGemini(messages, systemPrompt, imageBase64 = null) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_NOT_CONFIGURED');
  const cfg = PROVIDERS.gemini;

  // Build the prompt text
  const userText = messages[messages.length - 1]?.content || '';
  const fullText = `${systemPrompt}\n\n${userText}`;

  // Build parts (text + optional image)
  const parts = [{ text: fullText }];
  if (imageBase64) {
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeout);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`GEMINI_API_ERROR: ${err?.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Call OpenAI (GPT-4o-mini) ───────────────────────────────────────────────
export async function callOpenAI(messages, systemPrompt, imageBase64 = null) {
  const client = getOpenAI();
  if (!client) throw new Error('OPENAI_NOT_CONFIGURED');
  const cfg = PROVIDERS.openai;

  const userContent = imageBase64
    ? [ 
        { type: 'text', text: messages[messages.length - 1]?.content || '' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'low' } },
      ]
    : messages[messages.length - 1]?.content || '';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeout);

  try {
    const response = await client.chat.completions.create(
      {
        model: cfg.model,
        max_tokens: cfg.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(0, -1),
          { role: 'user', content: userContent },
        ],
      },
      { signal: controller.signal }
    );

    return response.choices[0]?.message?.content?.trim() || '';
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Call DeepSeek ───────────────────────────────────────────────────────────
export async function callDeepSeek(messages, systemPrompt) {
  const client = getDeepSeek();
  if (!client) throw new Error('DEEPSEEK_NOT_CONFIGURED');
  const cfg = PROVIDERS.deepseek;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeout);

  try {
    const response = await client.chat.completions.create(
      {
        model: cfg.model,
        max_tokens: cfg.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      },
      { signal: controller.signal }
    );

    return response.choices[0]?.message?.content?.trim() || '';
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Unified Caller with Automatic Fallback ───────────────────────────────────
/**
 * Calls providers in priority order, falling back if one fails.
 * @param {string} providerId  - preferred provider, or 'auto'
 * @param {Array}  messages    - conversation messages
 * @param {string} systemPrompt
 * @param {boolean} requiresImages
 * @param {string|null} imageBase64
 */
export async function callProvider(providerId, messages, systemPrompt, requiresImages = false, imageBase64 = null) {
  const callers = {
    groq:      () => callGroq(messages, systemPrompt),
    gemini:    () => callGemini(messages, systemPrompt, imageBase64),
    openai:    () => callOpenAI(messages, systemPrompt, imageBase64),
    deepseek:  () => callDeepSeek(messages, systemPrompt),
  };

  const { selectProvider, getAvailableProviders } = await import('./registry.js');

  // Build fallback chain
  let chain = [];
  if (providerId && providerId !== 'auto' && callers[providerId]) {
    // Preferred provider first, then rest as fallback
    chain = [providerId, ...getAvailableProviders()
      .map(p => p.id)
      .filter(id => id !== providerId)
    ];
  } else {
    // Auto-select by priority
    const best = selectProvider(requiresImages);
    if (!best) throw new Error('NO_PROVIDER_AVAILABLE');
    chain = getAvailableProviders().map(p => p.id);
  }

  // Filter out providers that can't handle images when needed
  if (requiresImages) {
    chain = chain.filter(id => PROVIDERS[id]?.supportsImages);
  }

  // Remove unconfigured providers
  chain = chain.filter(id => process.env[PROVIDERS[id]?.envKey]);

  if (chain.length === 0) throw new Error('NO_VALID_PROVIDER');

  let lastError = null;
  for (const id of chain) {
    try {
      console.log(`[AI] Trying provider: ${id}`);
      const result = await callers[id]();
      console.log(`[AI] ✅ Success with: ${id} (${result.length} chars)`);
      return { text: result, provider: id };
    } catch (err) {
      console.warn(`[AI] ⚠️ Provider ${id} failed: ${err.message}`);
      lastError = err;
      // Don't fallback on abort (timeout was intentional from our side)
      if (err.name === 'AbortError') {
        console.warn(`[AI] Timeout — not falling back further.`);
        break;
      }
      // Continue to next provider
    }
  }

  throw lastError || new Error('ALL_PROVIDERS_FAILED');
}
