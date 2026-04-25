// ─────────────────────────────────────────────────────────────────────────────
// PequeAprendo — Motor de Reconocimiento de Voz
// ─────────────────────────────────────────────────────────────────────────────
// Escucha lo que dice el niño y lo compara con la palabra objetivo.
// Usa comparación "fuzzy" (tolerante) porque un niño de 2-3 años
// NO va a pronunciar perfectamente las palabras.
// ─────────────────────────────────────────────────────────────────────────────

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
};

// ─── Verificar si el navegador soporta reconocimiento de voz ────────────────
export const isRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
};

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

// ─── ESCUCHAR al niño ───────────────────────────────────────────────────────
// Abre el micrófono, escucha por unos segundos, y devuelve lo que entendió.
export function listenToChild(targetWord: string, timeoutMs = 5000): Promise<ListenResult> {
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
      finish({ heard: '', match: 'miss', confidence: 0 });
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
