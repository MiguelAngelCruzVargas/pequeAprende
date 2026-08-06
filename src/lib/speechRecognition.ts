// ─────────────────────────────────────────────────────────────────────────────
// PequeAprendo — Motor de Reconocimiento de Voz
// ─────────────────────────────────────────────────────────────────────────────
// Escucha lo que dice el niño y lo compara con la palabra objetivo.
// Usa comparación "fuzzy" (tolerante) porque un niño de 2-3 años
// NO va a pronunciar perfectamente las palabras.
//
// Dos caminos según el navegador:
// 1) SpeechRecognition nativo (Chrome/Edge/Android) — instantáneo, sin red.
// 2) Grabar con MediaRecorder + transcribir en el servidor con Whisper (Groq)
//    — necesario porque Safari/iPad (el dispositivo objetivo de esta app)
//    NUNCA ha implementado SpeechRecognition, solo MediaRecorder.
// ─────────────────────────────────────────────────────────────────────────────

import { AI_BASE } from './ai';

// Tipos para TypeScript
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

type ListenResult = {
  heard: string;
  match: 'perfect' | 'close' | 'miss';
  confidence: number;
  // true solo cuando el usuario negó el permiso de micrófono explícitamente
  // (distinto de "no se entendió nada"), para poder mostrar un mensaje útil.
  permissionDenied?: boolean;
  // true solo cuando el backend de IA falló (no cuando simplemente no
  // entendió al niño) — para que el juego deje de ofrecer el micrófono en
  // vez de reintentar contra un servicio roto.
  serviceUnavailable?: boolean;
};

// ─── Verificar si el navegador soporta reconocimiento de voz NATIVO ─────────
// Solo Chrome/Edge/Android lo tienen de verdad. Safari (iPad/iPhone/Mac)
// nunca lo implementó, aunque a veces expone el objeto webkitSpeechRecognition
// que falla al usarse — por eso además comprobamos MediaRecorder como respaldo
// real en isMicInputAvailable().
export const isRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
};

// ─── ¿El dispositivo TIENE hardware/API para grabar? (sin mirar el servidor) ─
// Necesario pero no suficiente para el camino de respaldo: además hace falta
// que el backend de IA esté arriba y configurado (ver canUseVoicePractice).
const hasRecorderCapability = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return !!(navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined');
};

// ─── Verificar si HAY alguna forma de escuchar al niño, YA MISMO y sin red ──
// Uso: chequeo instantáneo para decisiones síncronas. En Chrome/Android es la
// respuesta final. En Safari/iPad, aunque haya hardware de grabación, la
// respuesta real depende del servidor — usar canUseVoicePractice() para eso.
export const isMicInputAvailable = (): boolean => {
  return isRecognitionSupported() || hasRecorderCapability();
};

// ─── ¿El backend de IA está arriba y tiene al menos un proveedor configurado? ─
// La IA es un EXTRA opcional, nunca un requisito: si el servidor no responde
// (apagado, sin API keys, modelo bloqueado en la cuenta, etc.) esto debe
// resolver a false rápido y en silencio, para que el juego jamás dependa de
// que un servicio externo esté disponible. Se cachea por sesión de página.
let cachedServerAvailable: boolean | null = null;
let serverCheckPromise: Promise<boolean> | null = null;

async function checkServerTranscriptionAvailable(): Promise<boolean> {
  if (cachedServerAvailable !== null) return cachedServerAvailable;
  if (!serverCheckPromise) {
    serverCheckPromise = (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`${AI_BASE}/providers`, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) return false;
        const data = await res.json();
        return Array.isArray(data.available) && data.available.length > 0;
      } catch {
        return false;
      }
    })();
  }
  cachedServerAvailable = await serverCheckPromise;
  return cachedServerAvailable;
}

// ─── Marcar el servidor como caído/roto en caliente ──────────────────────────
// Se llama cuando una transcripción real falla por un problema de servidor
// (no por permiso ni por "no se entendió"), para dejar de ofrecer el
// micrófono el resto de la sesión en vez de reintentar contra algo roto.
function markServerUnavailable(): void {
  cachedServerAvailable = false;
}

// ─── ¿Se puede usar la práctica de voz AHORA MISMO? (incluye red si aplica) ──
// Esto es lo que deben usar los juegos antes de mostrar el botón del
// micrófono: en Chrome/Android resuelve al instante (nativo, sin red). En
// Safari/iPad solo dice que sí si además confirmó que el servidor responde.
export async function canUseVoicePractice(): Promise<boolean> {
  if (isRecognitionSupported()) return true;
  if (!hasRecorderCapability()) return false;
  return checkServerTranscriptionAvailable();
}

// ─── Normalizar texto para comparación ──────────────────────────────────────
// Quita acentos, convierte a minúsculas, elimina espacios extra
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s]/g, '')     // Quitar caracteres especiales
    .trim();
}

// ─── Distancia de Levenshtein (similaridad entre strings) ───────────────────
// Devuelve un número de 0 a 1 donde 1 = idéntico
function similarity(s1: string, s2: string): number {
  const a = normalize(s1);
  const b = normalize(s2);

  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[a.length][b.length];
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance / maxLen;
}

// ─── También checar si la palabra objetivo aparece DENTRO de lo que dijo ────
// Porque el reconocimiento puede agregar artículos: "la mamá", "un perro"
function containsTarget(heard: string, target: string): boolean {
  return normalize(heard).includes(normalize(target));
}

// ─── Clasificar el resultado ────────────────────────────────────────────────
function classifyMatch(heard: string, target: string): 'perfect' | 'close' | 'miss' {
  const sim = similarity(heard, target);
  
  // Si la palabra está contenida en lo que dijo, es perfecto
  if (containsTarget(heard, target)) return 'perfect';
  
  // Similaridad alta = perfecto (tolerancia para errores menores)
  if (sim >= 0.7) return 'perfect';
  
  // Similaridad media = casi, buen intento
  if (sim >= 0.4) return 'close';
  
  // Muy diferente
  return 'miss';
}

// ─── ESCUCHAR al niño (camino nativo) ────────────────────────────────────────
// Abre el micrófono, escucha por unos segundos, y devuelve lo que entendió.
// Solo funciona donde isRecognitionSupported() es true (Chrome/Edge/Android).
function listenToChildNative(targetWord: string, timeoutMs = 5000): Promise<ListenResult> {
  return new Promise((resolve) => {
    if (!isRecognitionSupported()) {
      resolve({ heard: '', match: 'miss', confidence: 0 });
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-MX';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    let resolved = false;
    const finish = (result: ListenResult) => {
      if (resolved) return;
      resolved = true;
      try { recognition.stop(); } catch (_) {}
      resolve(result);
    };

    // Timeout de seguridad
    const timer = setTimeout(() => {
      finish({ heard: '', match: 'miss', confidence: 0 });
    }, timeoutMs);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      clearTimeout(timer);

      // Revisar todas las alternativas
      let bestMatch: ListenResult = { heard: '', match: 'miss', confidence: 0 };

      for (let i = 0; i < event.results[0].length; i++) {
        const transcript = event.results[0][i].transcript;
        const conf = event.results[0][i].confidence;
        const match = classifyMatch(transcript, targetWord);

        // Preferir la alternativa que mejor matchea
        const matchPriority = { perfect: 3, close: 2, miss: 1 };
        if (matchPriority[match] > matchPriority[bestMatch.match]) {
          bestMatch = { heard: transcript, match, confidence: conf };
        }
      }

      // Si no hubo mejor match, usar la primera alternativa
      if (!bestMatch.heard && event.results[0].length > 0) {
        const first = event.results[0][0];
        bestMatch = {
          heard: first.transcript,
          match: classifyMatch(first.transcript, targetWord),
          confidence: first.confidence,
        };
      }

      finish(bestMatch);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearTimeout(timer);
      console.warn('🎤 Error de reconocimiento:', event.error);
      const permissionDenied = event.error === 'not-allowed' || event.error === 'permission-denied' || event.error === 'service-not-allowed';
      finish({ heard: '', match: 'miss', confidence: 0, permissionDenied });
    };

    recognition.onend = () => {
      clearTimeout(timer);
      // Si terminó sin resultados
      finish({ heard: '', match: 'miss', confidence: 0 });
    };

    try {
      recognition.start();
    } catch (err) {
      clearTimeout(timer);
      finish({ heard: '', match: 'miss', confidence: 0 });
    }
  });
}

// ─── ESCUCHAR al niño (camino de respaldo: grabar + transcribir en servidor) ─
// Para Safari/iPad, donde no existe SpeechRecognition nativo pero sí
// MediaRecorder. Graba unos segundos, manda el audio al backend (Whisper vía
// Groq) y clasifica el texto recibido con la misma lógica "fuzzy" de arriba.
const RECORDER_MIME_CANDIDATES = [
  'audio/mp4',
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
];

function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  return RECORDER_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // result viene como "data:<mime>;base64,AAAA..." — nos quedamos solo con la parte base64.
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function recordAudio(maxMs: number): Promise<{ blob: Blob; mimeType: string } | { permissionDenied: true }> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err: any) {
    if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || err?.name === 'SecurityError') {
      return { permissionDenied: true };
    }
    throw err;
  }

  const mimeType = pickRecorderMimeType();

  return new Promise((resolve, reject) => {
    try {
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const finalType = recorder.mimeType || mimeType || 'audio/webm';
        resolve({ blob: new Blob(chunks, { type: finalType }), mimeType: finalType });
      };

      recorder.onerror = (e) => {
        stream.getTracks().forEach((t) => t.stop());
        reject(e);
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, maxMs);
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop());
      reject(err);
    }
  });
}

// unavailable=true significa "el servidor/la IA falló" (red, 5xx, timeout,
// modelo bloqueado, etc.) — distinto de "respondió pero no entendió nada",
// que es un resultado normal del juego y no debe apagar el micrófono.
async function transcribeViaServer(audioBase64: string, mimeType: string): Promise<{ text: string; unavailable: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${AI_BASE}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType }),
      signal: controller.signal,
    });
    if (!res.ok) return { text: '', unavailable: true };
    const data = await res.json();
    return { text: typeof data.text === 'string' ? data.text : '', unavailable: false };
  } catch {
    return { text: '', unavailable: true };
  } finally {
    clearTimeout(timer);
  }
}

async function listenToChildViaRecording(targetWord: string, maxMs: number): Promise<ListenResult> {
  try {
    const recorded = await recordAudio(Math.min(maxMs, 6000));
    if ('permissionDenied' in recorded) {
      return { heard: '', match: 'miss', confidence: 0, permissionDenied: true };
    }

    const base64 = await blobToBase64(recorded.blob);
    const { text: heard, unavailable } = await transcribeViaServer(base64, recorded.mimeType);

    if (unavailable) {
      markServerUnavailable();
      return { heard: '', match: 'miss', confidence: 0, serviceUnavailable: true };
    }
    if (!heard) return { heard: '', match: 'miss', confidence: 0 };
    return { heard, match: classifyMatch(heard, targetWord), confidence: 0.9 };
  } catch (err) {
    console.warn('🎤 Error grabando/transcribiendo:', err);
    return { heard: '', match: 'miss', confidence: 0 };
  }
}

// ─── API pública: elige el mejor camino disponible ───────────────────────────
export function listenToChild(targetWord: string, timeoutMs = 5000): Promise<ListenResult> {
  if (isRecognitionSupported()) {
    return listenToChildNative(targetWord, timeoutMs);
  }
  return listenToChildViaRecording(targetWord, timeoutMs);
}
