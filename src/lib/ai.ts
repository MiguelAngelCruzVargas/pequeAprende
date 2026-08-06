/**
 * PequeAprendo – Frontend AI Client
 * Connects to the local AI backend proxy. Never exposes API keys to the browser.
 */

// El backend de IA (server/index.js) puede vivir en distintos sitios según
// cómo se despliegue la app, así que resolvemos la URL en este orden:
//
// 1. VITE_AI_BASE_URL — variable de entorno fijada en el build, solo hace
//    falta si frontend y backend viven en dominios DISTINTOS (deploy
//    separado en dos servicios). Vite la inyecta en build time por el
//    prefijo VITE_, no hace falta tocar vite.config.ts.
// 2. En desarrollo local (npm run dev) asumimos que el backend está en el
//    mismo host pero en el puerto 3001 (setup local: npm run dev + npm run
//    server por separado, incluido abrir la app desde un iPad por LAN).
// 3. En producción sin esa variable, asumimos deploy combinado: el mismo
//    server/index.js sirve la app Y la API (ver server/index.js), así que
//    una ruta relativa basta — mismo origen, sin CORS que configurar.
const AI_PORT = 3001;
const envAiBase = (import.meta as any).env?.VITE_AI_BASE_URL as string | undefined;
const isDev = !!(import.meta as any).env?.DEV;

export const AI_BASE = envAiBase
  ? envAiBase.replace(/\/$/, '')
  : isDev && typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:${AI_PORT}/api/ai`
    : '/api/ai';

export type AIProvider = 'groq' | 'gemini' | 'openai' | 'deepseek' | 'auto';

export interface AIResponse {
  text: string;
  provider: string;
  providerName?: string;
}

export interface ProviderInfo {
  id: AIProvider;
  name: string;
  supportsImages: boolean;
  supportsStreaming: boolean;
  model: string;
  priority: number;
}

// ─── Simple in-memory rate guard (client-side, secondary protection) ──────────
const requestLog: number[] = [];
const CLIENT_MAX_RPM = 40; // stay well below server limits

function clientRateGuard(): boolean {
  const now = Date.now();
  // Remove entries older than 1 min
  while (requestLog.length && requestLog[0] < now - 60000) requestLog.shift();
  if (requestLog.length >= CLIENT_MAX_RPM) return false;
  requestLog.push(now);
  return true;
}

// ─── Fetch with timeout helper ────────────────────────────────────────────────
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── askAI: Send a chat message to the tutor ─────────────────────────────────
export async function askAI(
  message: string,
  options: {
    provider?: AIProvider;
    context?: { game?: string; item?: string; correct?: boolean };
    imageBase64?: string;
  } = {}
): Promise<AIResponse> {
  if (!clientRateGuard()) {
    throw new Error('CLIENT_RATE_LIMIT');
  }

  const res = await fetchWithTimeout(
    `${AI_BASE}/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        provider: options.provider || 'auto',
        context: options.context || {},
        imageBase64: options.imageBase64 || null,
      }),
    },
    15000
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw Object.assign(new Error(errData.error || 'AI_REQUEST_FAILED'), {
      status: res.status,
      userMessage: errData.message || 'El tutor no puede responder ahora.',
      retryAfterMs: errData.retryAfterMs,
    });
  }

  return res.json();
}

// ─── getHint: Get a game-specific hint ───────────────────────────────────────
export async function getHint(
  game: string,
  item: string,
  options: { childAnswer?: string; provider?: AIProvider } = {}
): Promise<string> {
  if (!clientRateGuard()) throw new Error('CLIENT_RATE_LIMIT');

  const res = await fetchWithTimeout(
    `${AI_BASE}/hint`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game,
        item,
        childAnswer: options.childAnswer,
        provider: options.provider || 'auto',
      }),
    },
    12000
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'No se pudo obtener la pista.');
  }

  const data = await res.json();
  return data.hint;
}

// ─── getCelebration: Get a celebration message ────────────────────────────────
export async function getCelebration(
  game: string,
  streak = 1,
  childName = ''
): Promise<string> {
  if (!clientRateGuard()) {
    // Fallback to static message on rate limit
    return '¡Excelente! ¡Lo hiciste increíble! 🌟';
  }

  try {
    const res = await fetchWithTimeout(
      `${AI_BASE}/celebrate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, streak, childName, provider: 'auto' }),
      },
      8000
    );
    if (!res.ok) return '¡Muy bien! ¡Sigue así! 🎉';
    const data = await res.json();
    return data.celebration;
  } catch {
    return '¡Fantástico! ¡Eres increíble! ⭐';
  }
}

// ─── getProviders: List available providers ───────────────────────────────────
export async function getProviders(): Promise<{
  available: ProviderInfo[];
  hasImageCapability: boolean;
}> {
  try {
    const res = await fetchWithTimeout(`${AI_BASE}/providers`, { method: 'GET' }, 5000);
    if (!res.ok) return { available: [], hasImageCapability: false };
    return res.json();
  } catch {
    return { available: [], hasImageCapability: false };
  }
}

// ─── Error classifier (use this in React components) ─────────────────────────
export function classifyAIError(err: unknown): {
  userMessage: string;
  canRetry: boolean;
  retryAfterMs?: number;
} {
  if (err instanceof Error) {
    const e = err as Error & { status?: number; userMessage?: string; retryAfterMs?: number };
    
    if (e.message === 'CLIENT_RATE_LIMIT') {
      return { userMessage: '⏳ Espera un momento antes de preguntar de nuevo.', canRetry: true, retryAfterMs: 5000 };
    }
    if (e.name === 'AbortError') {
      return { userMessage: '⏱️ El tutor tardó mucho. ¡Lo intentamos de nuevo!', canRetry: true };
    }
    if (e.status === 429) {
      return { userMessage: '⏳ El tutor está ocupado. Espera un poco.', canRetry: true, retryAfterMs: e.retryAfterMs || 10000 };
    }
    if (e.status === 503 || e.status === 502) {
      return { userMessage: '⚠️ El tutor no está disponible ahora.', canRetry: false };
    }
    if (e.userMessage) {
      return { userMessage: e.userMessage, canRetry: true };
    }
  }
  return { userMessage: '🤔 El tutor no pudo responder. ¡Inténtalo de nuevo!', canRetry: true };
}
