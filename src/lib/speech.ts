// ─────────────────────────────────────────────────────────────────────────────
// PequeAprendo — Motor de Voz Infantil Profesional
// ─────────────────────────────────────────────────────────────────────────────
// En iOS/Safari las voces se cargan de forma asíncrona. Si llamamos getVoices()
// antes de que estén listas, devuelve [] y se usa la voz por defecto (robótica).
// Este módulo espera a que las voces carguen, cachea la mejor voz encontrada,
// y configura parámetros suaves para que los niños entiendan cada palabra.
// ─────────────────────────────────────────────────────────────────────────────

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesReady = false;
let pendingQueue: string[] = [];
let currentUtterance: SpeechSynthesisUtterance | null = null;
let speakTimeout: NodeJS.Timeout | null = null;
let lastSpokenText = '';
let lastSpokenTime = 0;

// ─── Prioridad de selección de voz ────────────────────────────────────────────
// Buscamos la voz más natural disponible. En iOS las mejores son las
// "Premium" o "Enhanced" de Paulina (México) o Mónica (España).
// En Android/Chrome las "Google español" son muy buenas.
// Nunca queremos voces masculinas (Diego/Jorge) porque suenan más robóticas
// y no generan la misma confianza en niños pequeños.
function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const es = voices.filter(v => v.lang.startsWith('es'));
  if (es.length === 0) return null;

  // Nombres de voces femeninas de alta calidad en orden de preferencia
  const femaleNames = ['Paulina', 'Monica', 'Mónica', 'Angelica', 'Angélica', 'Jimena'];
  const qualityTags = ['Premium', 'Enhanced', 'Natural', 'Neural'];
  const maleNames = ['Diego', 'Jorge', 'Carlos', 'Juan'];

  // 1) Voz femenina Premium/Enhanced (la mejor posible)
  for (const name of femaleNames) {
    for (const tag of qualityTags) {
      const v = es.find(voice => voice.name.includes(name) && voice.name.includes(tag));
      if (v) return v;
    }
  }

  // 2) Cualquier voz Premium/Enhanced en español
  for (const tag of qualityTags) {
    const v = es.find(voice => voice.name.includes(tag) && !maleNames.some(m => voice.name.includes(m)));
    if (v) return v;
  }

  // 3) Voz femenina estándar (Paulina, Monica, etc.)
  for (const name of femaleNames) {
    const v = es.find(voice => voice.name.includes(name));
    if (v) return v;
  }

  // 4) Google español (Chrome/Android) – excluyendo masculinas
  const google = es.find(v => v.name.includes('Google') && !maleNames.some(m => v.name.includes(m)));
  if (google) return google;

  // 5) Cualquier voz en español que NO sea masculina
  const nonMale = es.find(v => !maleNames.some(m => v.name.includes(m)));
  if (nonMale) return nonMale;

  // 6) Lo que sea (último recurso)
  return es[0];
}

// ─── Inicialización: esperar a que las voces se carguen ──────────────────────
function initVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;

  const tryLoad = () => {
    const voices = synth.getVoices();
    if (voices.length > 0) {
      cachedVoice = pickBestVoice(voices);
      voicesReady = true;

      // Log para debug (solo en dev)
      if ((import.meta as any).env?.DEV && cachedVoice) {
        console.log(`🔊 PequeAprendo voz seleccionada: "${cachedVoice.name}" (${cachedVoice.lang})`);
      }

      // Procesar cola de mensajes que llegaron antes de que las voces cargaran
      if (pendingQueue.length > 0) {
        const first = pendingQueue.shift()!;
        doSpeak(first);
        pendingQueue = []; // descartar el resto para no saturar
      }
    }
  };

  // Intentar de inmediato (funciona en Chrome)
  tryLoad();

  // En iOS/Safari las voces se cargan de forma asíncrona
  if (!voicesReady) {
    synth.addEventListener('voiceschanged', tryLoad);
    // Fallback extra para Safari que a veces no dispara el evento
    setTimeout(tryLoad, 200);
    setTimeout(tryLoad, 500);
    setTimeout(tryLoad, 1000);
  }
}

// Arrancar al cargar el módulo
initVoices();

// ─── Función interna de habla ────────────────────────────────────────────────
// ─── Función interna de habla ────────────────────────────────────────────────
function doSpeak(text: string, cancel = true): Promise<void> {
  const synth = window.speechSynthesis;
  
  if (cancel) {
    synth.cancel();
    if (speakTimeout) clearTimeout(speakTimeout);
  }

  const utt = new SpeechSynthesisUtterance(text);

  // Configuración optimizada para claridad infantil
  utt.lang = 'es-MX'; 

  // ─── Parámetros clave ─────────────
  utt.rate = 0.85;
  utt.pitch = 1.15;
  utt.volume = 1.0;

  // Usar la voz cacheada de alta calidad
  if (cachedVoice) {
    utt.voice = cachedVoice;
  }

  return new Promise((resolve) => {
    utt.onend = () => {
      if (currentUtterance === utt) {
        currentUtterance = null;
      }
      resolve();
    };

    utt.onerror = () => {
      if (currentUtterance === utt) {
        currentUtterance = null;
      }
      resolve();
    };

    currentUtterance = utt;

    if (cancel) {
      speakTimeout = setTimeout(() => {
        if (currentUtterance === utt) {
          synth.speak(utt);
        } else {
          resolve();
        }
      }, 60);
    } else {
      synth.speak(utt);
    }
  });
}

// ─── API Pública ─────────────────────────────────────────────────────────────
export const speak = (text: string, cancelPrevious = true): Promise<void> => {
  if (globalMuted) return Promise.resolve();
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve();

  const synth = window.speechSynthesis;
  const now = Date.now();

  // Prevención de repetición accidental (debounce de 500ms para el mismo texto)
  if (text === lastSpokenText && (now - lastSpokenTime) < 500) {
    return Promise.resolve();
  }

  lastSpokenText = text;
  lastSpokenTime = now;

  const cleanText = text.trim();
  if (!cleanText) return Promise.resolve();

  // Si las voces aún no han cargado (iOS primera carga), encolar
  if (!voicesReady) {
    pendingQueue.push(cleanText);
    // Forzar un intento adicional de carga
    const voices = synth.getVoices();
    if (voices.length > 0) {
      cachedVoice = pickBestVoice(voices);
      voicesReady = true;
      const p = doSpeak(cleanText, cancelPrevious);
      pendingQueue = [];
      return p;
    }
    return Promise.resolve();
  }

  return doSpeak(cleanText, cancelPrevious);
};

// ─── Flag global de silencio ─────────────────────────────────────────────────
// Cuando se llama stopSpeaking(), se activa este flag para que cualquier
// flujo async/await que siga corriendo en segundo plano NO pueda hablar más.
let globalMuted = false;

// ─── Utilidad: detener la voz Y silenciar flujos pendientes ─────────────────
export const stopSpeaking = (): void => {
  globalMuted = true;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
    if (speakTimeout) clearTimeout(speakTimeout);
  }
};

// ─── Reactivar la voz (se llama al entrar a un juego nuevo) ─────────────────
export const resumeSpeaking = (): void => {
  globalMuted = false;
};

// ─── Hablar y ESPERAR a que termine ─────────────────────────────────────────
// Resuelve la promesa SOLO cuando la voz termina de hablar.
// Si globalMuted está activo, no habla y lanza un error silencioso que
// permite a los flujos async detectar que deben detenerse.
export const speakAndWait = async (text: string): Promise<void> => {
  if (globalMuted) throw new Error('__MUTED__');
  await speak(text, true);
  if (globalMuted) throw new Error('__MUTED__');
  await new Promise(r => setTimeout(r, 300));
};

// ─── Hablar SIN cancelar lo anterior ────────────────────────────────────────
export const speakNoCancel = (text: string): Promise<void> => {
  if (globalMuted) return Promise.resolve();
  return speak(text, false);
};