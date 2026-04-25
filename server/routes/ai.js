import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { PROVIDERS, getAvailableProviders } from '../providers/registry.js';
import { callProvider } from '../providers/callers.js';

const router = Router();

// ─── Per-Provider Rate Limiters ───────────────────────────────────────────────
// Each provider has its own window to respect their free-tier limits
const providerLimiters = {};
Object.entries(PROVIDERS).forEach(([id, cfg]) => {
  providerLimiters[id] = rateLimit({
    windowMs: cfg.rateLimit.windowMs,
    max: cfg.rateLimit.max,
    keyGenerator: (req) => `${id}-${req.ip}`,
    message: {
      error: 'PROVIDER_RATE_LIMIT',
      provider: id,
      message: `⏳ Límite de ${cfg.name} alcanzado. Espera un momento.`,
      retryAfterMs: cfg.rateLimit.windowMs,
    },
    skip: (req) => req.body?.provider !== id && req.body?.provider !== 'auto',
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
});

// ─── Educational System Prompt ────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres Lechuza, el tutor virtual de PequeAprendo, una app educativa para niños de 2 a 4 años.

REGLAS ESTRICTAS:
1. Responde SIEMPRE en español
2. Usa lenguaje muy simple, cálido, alentador y corto (máximo 2 oraciones)
3. No uses palabras difíciles; piensa como si hablaras con un bebé
4. Siempre sé positivo y celebra el esfuerzo
5. Nunca generes contenido inapropiado
6. Si te preguntan algo que no es educativo para niños, redirige amablemente
7. Respuestas máximo 80 palabras

Ejemplos de tono:
- "¡Muy bien! Esa es la letra A, como Avión. ¡Tú puedes!"
- "¡Ups! Ese es el gato. El perro dice ¡Guau! ¿Lo intentamos otra vez?"
- "Eso se llama MANZANA. ¡Qué inteligente eres!"`;

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
// General-purpose educational AI chat
router.post('/chat', async (req, res) => {
  try {
    const {
      message,
      provider = 'auto',      // 'groq' | 'gemini' | 'openai' | 'deepseek' | 'auto'
      context = {},            // game context { game, item, correct, wrong }
      imageBase64 = null,      // optional base64 image (only multimodal providers)
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Se requiere un mensaje.' });
    }

    // If an image is sent but provider doesn't support it, warn and strip
    let effectiveImage = imageBase64;
    if (imageBase64 && provider !== 'auto') {
      const providerCfg = PROVIDERS[provider];
      if (providerCfg && !providerCfg.supportsImages) {
        console.warn(`[AI] Provider ${provider} does not support images. Stripping image.`);
        effectiveImage = null;
      }
    }

    // Build context-enriched message
    const contextNote = context.game
      ? `[Contexto del juego: ${context.game}${context.item ? `, elemento: ${context.item}` : ''}${context.correct !== undefined ? `, respuesta correcta: ${context.correct}` : ''}]`
      : '';

    const messages = [
      { role: 'user', content: `${contextNote}\n${message}`.trim() },
    ];

    // Apply per-provider rate limit middleware manually  
    const limiterId = provider === 'auto' ? null : providerLimiters[provider];
    if (limiterId) {
      // Inline rate limit check
      await new Promise((resolve, reject) => {
        limiterId(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      }).catch(() => {}); // Response already sent by rateLimit middleware
      
      if (res.headersSent) return;
    }

    const requiresImages = !!effectiveImage;
    const result = await callProvider(provider, messages, SYSTEM_PROMPT, requiresImages, effectiveImage);

    res.json({
      text: result.text,
      provider: result.provider,
      providerName: PROVIDERS[result.provider]?.name,
    });

  } catch (err) {
    handleAIError(err, res);
  }
});

// ─── POST /api/ai/hint ────────────────────────────────────────────────────────
// Request a hint for a specific game item
router.post('/hint', async (req, res) => {
  try {
    const { game, item, childAnswer, provider = 'auto' } = req.body;
    if (!game || !item) {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Se requiere juego y elemento.' });
    }

    const hintPrompts = {
      vowels:     `El niño debe aprender la vocal "${item}". Da una pista divertida de 1 oración.`,
      animals:    `El niño toca el animal "${item}". Di el nombre y un dato divertido. 1 oración.`,
      colors:     `El niño ve el color "${item}". Da una descripción simple con un ejemplo. 1 oración.`,
      numbers:    `El niño aprendiendo el número ${item}. Da una pista con objetos cotidianos. 1 oración.`,
      shapes:     `La figura geométrica es "${item}". Descríbela de forma simple para un bebé. 1 oración.`,
      nameit:     `El niño ${childAnswer ? `dijo "${childAnswer}" pero la respuesta era` : 'debe adivinar'} "${item}". ${childAnswer ? 'Corrígelo gentilmente.' : 'Da una pista.'}`,
      repeat:     `El niño practica decir la palabra "${item}". Anímalo a repetirla sílaba por sílaba.`,
      soundguess: `El niño escucha el sonido de un "${item}". Da una pista de cómo suena. 1 oración.`,
      matching:   `El niño busca la pareja de "${item}". Da una pista descriptiva. 1 oración.`,
      reasoning:  `El niño busca el color "${item}". Ayúdalo a encontrarlo de forma divertida. 1 oración.`,
    };

    const prompt = hintPrompts[game] || `Ayuda al niño con "${item}" en el juego "${game}". 1 oración.`;
    const messages = [{ role: 'user', content: prompt }];

    const result = await callProvider(provider, messages, SYSTEM_PROMPT, false, null);

    res.json({
      hint: result.text,
      provider: result.provider,
    });

  } catch (err) {
    handleAIError(err, res);
  }
});

// ─── POST /api/ai/celebrate ──────────────────────────────────────────────────
// Get a dynamic celebration message
router.post('/celebrate', async (req, res) => {
  try {
    const { childName = '', game = '', streak = 1, provider = 'auto' } = req.body;

    const msg = `Genera un mensaje de celebración corto y creativo para ${childName || 'un niño'} que acaba de acertar ${streak} respuestras seguidas en el juego de ${game}. Máximo 15 palabras, muy alegre y motivador.`;
    const messages = [{ role: 'user', content: msg }];
    const result = await callProvider(provider, messages, SYSTEM_PROMPT, false, null);

    res.json({ celebration: result.text, provider: result.provider });
  } catch (err) {
    handleAIError(err, res);
  }
});

// ─── GET /api/ai/providers ───────────────────────────────────────────────────
// Returns available providers and their capabilities (no keys exposed)
router.get('/providers', (_req, res) => {
  const available = getAvailableProviders().map(({ id, name, supportsImages, supportsStreaming, model, priority }) => ({
    id, name, supportsImages, supportsStreaming, model, priority,
  }));

  res.json({
    available,
    total: available.length,
    hasImageCapability: available.some(p => p.supportsImages),
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
function handleAIError(err, res) {
  console.error('[AI Route Error]', err.message);

  const knownErrors = {
    NO_PROVIDER_AVAILABLE:  { status: 503, message: '⚠️ No hay proveedores de IA configurados.' },
    NO_VALID_PROVIDER:      { status: 503, message: '⚠️ Ningún proveedor disponible admite esta petición.' },
    ALL_PROVIDERS_FAILED:   { status: 502, message: '⚠️ Todos los servicios de IA fallaron. Intenta más tarde.' },
    GROQ_NOT_CONFIGURED:    { status: 503, message: '⚠️ Groq no está configurado.' },
    GEMINI_NOT_CONFIGURED:  { status: 503, message: '⚠️ Gemini no está configurado.' },
    OPENAI_NOT_CONFIGURED:  { status: 503, message: '⚠️ OpenAI no está configurado.' },
    DEEPSEEK_NOT_CONFIGURED:{ status: 503, message: '⚠️ DeepSeek no está configurado.' },
  };

  const known = knownErrors[err.message];
  if (known) {
    return res.status(known.status).json({ error: err.message, message: known.message });
  }

  // Rate limit from underlying API
  if (err.status === 429) {
    return res.status(429).json({
      error: 'PROVIDER_QUOTA_EXCEEDED',
      message: '⏳ El servicio de IA está ocupado. Espera unos segundos.',
      retryAfterMs: 10000,
    });
  }

  // Timeout
  if (err.name === 'AbortError') {
    return res.status(504).json({
      error: 'AI_TIMEOUT',
      message: '⏱️ La IA tardó demasiado. Intenta de nuevo.',
    });
  }

  res.status(500).json({
    error: 'AI_ERROR',
    message: 'El tutor no puede responder ahora. ¡Lo intentamos luego!',
  });
}

export default router;
