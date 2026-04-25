/**
 * AI Provider Registry
 * Defines capabilities, rate limits, and configuration for each provider.
 * ⚠️ Not all providers support images or complex multimodal tasks.
 */

export const PROVIDERS = {
  // ── Groq (Llama 3.3 70B) ─────────────────────────────────────────────────
  groq: {
    name: 'Groq – Llama 3.3 70B',
    model: 'llama-3.3-70b-versatile',
    supportsImages: false,       // ⛔ Text-only
    supportsStreaming: true,
    maxTokens: 1024,
    rateLimit: {
      windowMs: 60 * 1000,      // 1 min
      max: 30,                   // Groq free: ~30 req/min
    },
    envKey: 'GROQ_API_KEY',
    baseURL: 'https://api.groq.com/openai/v1',
    priority: 1,                  // First choice (fastest)
    timeout: 8000,
  },

  // ── Google Gemini ─────────────────────────────────────────────────────────
  gemini: {
    name: 'Google Gemini',
    model: 'gemini-2.0-flash',
    supportsImages: true,         // ✅ Multimodal
    supportsStreaming: true,
    maxTokens: 1024,
    rateLimit: {
      windowMs: 60 * 1000,
      max: 15,                    // Gemini free: 15 req/min
    },
    envKey: 'GEMINI_API_KEY',
    priority: 2,
    timeout: 12000,
  },

  // ── OpenAI (GPT-4o-mini) ─────────────────────────────────────────────────
  openai: {
    name: 'OpenAI GPT-4o-mini',
    model: 'gpt-4o-mini',
    supportsImages: true,         // ✅ Multimodal
    supportsStreaming: true,
    maxTokens: 1024,
    rateLimit: {
      windowMs: 60 * 1000,
      max: 20,                    // Adaptive based on tier
    },
    envKey: 'OPENAI_API_KEY',
    priority: 3,
    timeout: 15000,
  },

  // ── DeepSeek ─────────────────────────────────────────────────────────────
  deepseek: {
    name: 'DeepSeek Chat',
    model: 'deepseek-chat',
    supportsImages: false,        // ⛔ Text-only
    supportsStreaming: true,
    maxTokens: 1024,
    rateLimit: {
      windowMs: 60 * 1000,
      max: 10,                    // DeepSeek free tier
    },
    envKey: 'DEEPSEEK_API_KEY',
    baseURL: 'https://api.deepseek.com/v1',
    priority: 4,
    timeout: 20000,
  },
};

/**
 * Get a list of available providers (ones that have an API key configured)
 */
export function getAvailableProviders() {
  return Object.entries(PROVIDERS)
    .filter(([, cfg]) => !!process.env[cfg.envKey])
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([id, cfg]) => ({ id, ...cfg }));
}

/**
 * Select best provider for a given task:
 * - If task requires images → skip text-only providers
 * - Falls back through priority order
 */
export function selectProvider(requiresImages = false) {
  const available = getAvailableProviders();
  if (requiresImages) {
    return available.find(p => p.supportsImages) || null;
  }
  return available[0] || null; // Highest priority available
}
