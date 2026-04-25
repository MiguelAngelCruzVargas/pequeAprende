import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak, speakAndWait } from '../lib/speech';
import { listenToChild, isRecognitionSupported } from '../lib/speechRecognition';
import { useAI } from '../lib/aiContext';
import { ArrowLeft, Sparkles, Brain, Volume2, Hand, RotateCcw, ChevronRight, Home, Mic } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// BANCO DE PALABRAS ORGANIZADO POR DIFICULTAD (Método Científico)
// ─────────────────────────────────────────────────────────────────────────────
interface Word {
  word: string;
  syllables: string[];
  icon: string;
  bg: string;
  hint: string;
  mouthGuide: string;
  bodyAction: string;
  category: 'familia' | 'comida' | 'animales' | 'cuerpo' | 'cosas' | 'acciones' | 'naturaleza';
  level: 1 | 2 | 3;
}

const allWords: Word[] = [
  // NIVEL 1
  { word: 'Mamá', syllables: ['Ma', 'má'], icon: '👩', bg: 'from-pink-400 to-rose-500', hint: 'Te quiere mucho', mouthGuide: 'Junta los labios y ábrelos: MA', bodyAction: '👏 Palmea 2 veces', category: 'familia', level: 1 },
  { word: 'Papá', syllables: ['Pa', 'pá'], icon: '👨', bg: 'from-blue-400 to-indigo-500', hint: 'Te lleva a jugar', mouthGuide: 'Sopla aire con los labios: PA', bodyAction: '👏 Palmea 2 veces', category: 'familia', level: 1 },
  { word: 'Bebé', syllables: ['Be', 'bé'], icon: '👶', bg: 'from-yellow-300 to-amber-400', hint: 'Un niño chiquito', mouthGuide: 'Labios juntos suavecito: BE', bodyAction: '👏 Palmea 2 veces', category: 'familia', level: 1 },
  { word: 'Nene', syllables: ['Ne', 'ne'], icon: '🧒', bg: 'from-emerald-400 to-green-500', hint: 'Un niño como tú', mouthGuide: 'Toca el cielo de la boca con la lengua: NE', bodyAction: '👏 Palmea 2 veces', category: 'familia', level: 1 },
  { word: 'Tete', syllables: ['Te', 'te'], icon: '🍼', bg: 'from-sky-300 to-blue-400', hint: 'Tu biberón', mouthGuide: 'Toca los dientes de arriba con la lengua: TE', bodyAction: '👏 Palmea 2 veces', category: 'comida', level: 1 },
  { word: 'Pipi', syllables: ['Pi', 'pi'], icon: '🚽', bg: 'from-violet-300 to-purple-400', hint: 'Cuando vas al baño', mouthGuide: 'Sopla los labios suave: PI', bodyAction: '👏 Palmea 2 veces', category: 'cuerpo', level: 1 },
  { word: 'Mano', syllables: ['Ma', 'no'], icon: '✋', bg: 'from-orange-300 to-amber-400', hint: 'Para agarrar cosas', mouthGuide: 'Labios juntos MA, lengua arriba NO', bodyAction: '✋ Levanta las manos', category: 'cuerpo', level: 1 },
  { word: 'Dedo', syllables: ['De', 'do'], icon: '👆', bg: 'from-teal-400 to-cyan-500', hint: 'Para señalar', mouthGuide: 'Lengua toca dientes: DE-DO', bodyAction: '👆 Señala con el dedo', category: 'cuerpo', level: 1 },
  { word: 'Ojo', syllables: ['O', 'jo'], icon: '👁️', bg: 'from-amber-400 to-yellow-500', hint: 'Para ver todo', mouthGuide: 'Boca redonda: O, aire rasposo: JO', bodyAction: '👁️ Señala tus ojos', category: 'cuerpo', level: 1 },
  { word: 'Pie', syllables: ['Pi', 'e'], icon: '🦶', bg: 'from-rose-300 to-pink-400', hint: 'Para caminar', mouthGuide: 'Labios juntos: PI, boca abierta: E', bodyAction: '🦶 Toca tu pie', category: 'cuerpo', level: 1 },
  // NIVEL 2
  { word: 'Casa', syllables: ['Ca', 'sa'], icon: '🏠', bg: 'from-orange-400 to-amber-500', hint: 'Donde vives', mouthGuide: 'Garganta rasposa: CA, sonrisa: SA', bodyAction: '🏠 Haz un techo con las manos', category: 'cosas', level: 2 },
  { word: 'Agua', syllables: ['A', 'gua'], icon: '💧', bg: 'from-cyan-400 to-sky-500', hint: 'Para tomar', mouthGuide: 'Abre grande: A, garganta suave: GUA', bodyAction: '💧 Haz como si tomaras', category: 'comida', level: 2 },
  { word: 'Luna', syllables: ['Lu', 'na'], icon: '🌙', bg: 'from-indigo-400 to-violet-500', hint: 'Sale de noche', mouthGuide: 'Lengua arriba: LU, nariz: NA', bodyAction: '🌙 Señala al cielo', category: 'naturaleza', level: 2 },
  { word: 'Gato', syllables: ['Ga', 'to'], icon: '🐱', bg: 'from-purple-400 to-fuchsia-500', hint: 'Dice miau', mouthGuide: 'Garganta: GA, lengua arriba: TO', bodyAction: '🐱 Haz garras con las manos', category: 'animales', level: 2 },
  { word: 'Perro', syllables: ['Pe', 'rro'], icon: '🐶', bg: 'from-amber-400 to-orange-500', hint: 'Dice guau', mouthGuide: 'Labios soplan: PE, lengua vibra: RRO', bodyAction: '🐶 Mueve la colita', category: 'animales', level: 2 },
  { word: 'Leche', syllables: ['Le', 'che'], icon: '🥛', bg: 'from-slate-200 to-gray-300', hint: 'Blanca y rica', mouthGuide: 'Lengua arriba: LE, como callar: CHE', bodyAction: '🥛 Haz como si tomaras', category: 'comida', level: 2 },
  { word: 'Pan', syllables: ['Pan'], icon: '🍞', bg: 'from-yellow-400 to-amber-500', hint: 'Para comer', mouthGuide: 'Labios soplan y abren: PAN', bodyAction: '🍞 Haz como si comieras', category: 'comida', level: 2 },
  { word: 'Sol', syllables: ['Sol'], icon: '☀️', bg: 'from-yellow-300 to-orange-400', hint: 'Da calorcito', mouthGuide: 'Sonrisa: S, boca redonda: OL', bodyAction: '☀️ Abre los brazos grande', category: 'naturaleza', level: 2 },
  { word: 'Pato', syllables: ['Pa', 'to'], icon: '🦆', bg: 'from-yellow-400 to-lime-500', hint: 'Dice cuac', mouthGuide: 'Labios soplan: PA, lengua arriba: TO', bodyAction: '🦆 Haz alas con los brazos', category: 'animales', level: 2 },
  { word: 'Vaca', syllables: ['Va', 'ca'], icon: '🐄', bg: 'from-green-400 to-emerald-500', hint: 'Dice muuu', mouthGuide: 'Labio de abajo toca los dientes: VA, garganta: CA', bodyAction: '🐄 Di muuuu', category: 'animales', level: 2 },
  { word: 'Cama', syllables: ['Ca', 'ma'], icon: '🛏️', bg: 'from-indigo-300 to-blue-400', hint: 'Para dormir', mouthGuide: 'Garganta: CA, labios juntos: MA', bodyAction: '🛏️ Pon la cabeza en las manos', category: 'cosas', level: 2 },
  { word: 'Mesa', syllables: ['Me', 'sa'], icon: '🪑', bg: 'from-amber-500 to-orange-600', hint: 'Para comer', mouthGuide: 'Labios juntos: ME, sonrisa: SA', bodyAction: '🪑 Golpea suavecito la mesa', category: 'cosas', level: 2 },
  { word: 'Nube', syllables: ['Nu', 'be'], icon: '☁️', bg: 'from-sky-300 to-blue-400', hint: 'Flota en el cielo', mouthGuide: 'Nariz: NU, labios suaves: BE', bodyAction: '☁️ Sopla como el viento', category: 'naturaleza', level: 2 },
  { word: 'Boca', syllables: ['Bo', 'ca'], icon: '👄', bg: 'from-red-400 to-rose-500', hint: 'Para hablar y comer', mouthGuide: 'Labios juntos: BO, garganta: CA', bodyAction: '👄 Señala tu boca', category: 'cuerpo', level: 2 },
  { word: 'Nariz', syllables: ['Na', 'riz'], icon: '👃', bg: 'from-pink-300 to-rose-400', hint: 'Para oler', mouthGuide: 'Por la nariz: NA, sonrisa: RIZ', bodyAction: '👃 Toca tu nariz', category: 'cuerpo', level: 2 },
  { word: 'Pelo', syllables: ['Pe', 'lo'], icon: '💇', bg: 'from-amber-300 to-yellow-400', hint: 'En tu cabeza', mouthGuide: 'Labios soplan: PE, lengua arriba: LO', bodyAction: '💇 Toca tu pelo', category: 'cuerpo', level: 2 },
  // NIVEL 3
  { word: 'Pelota', syllables: ['Pe', 'lo', 'ta'], icon: '⚽', bg: 'from-green-400 to-emerald-500', hint: 'Para jugar', mouthGuide: 'PE-LO-TA: labios, lengua arriba, lengua arriba', bodyAction: '⚽ Palmea 3 veces', category: 'cosas', level: 3 },
  { word: 'Zapato', syllables: ['Za', 'pa', 'to'], icon: '👟', bg: 'from-blue-500 to-indigo-600', hint: 'En tus pies', mouthGuide: 'Sonrisa con aire: ZA, labios soplan: PA-TO', bodyAction: '👟 Palmea 3 veces', category: 'cosas', level: 3 },
  { word: 'Banana', syllables: ['Ba', 'na', 'na'], icon: '🍌', bg: 'from-yellow-400 to-amber-500', hint: 'Fruta amarilla', mouthGuide: 'Labios: BA, nariz: NA-NA', bodyAction: '🍌 Palmea 3 veces', category: 'comida', level: 3 },
  { word: 'Galleta', syllables: ['Ga', 'lle', 'ta'], icon: '🍪', bg: 'from-amber-500 to-orange-600', hint: 'Rica y crujiente', mouthGuide: 'Garganta: GA, lengua: LLE-TA', bodyAction: '🍪 Palmea 3 veces', category: 'comida', level: 3 },
  { word: 'Pollito', syllables: ['Po', 'lli', 'to'], icon: '🐤', bg: 'from-yellow-300 to-amber-400', hint: 'Dice pio pio', mouthGuide: 'Labios redondos: PO, lengua: LLI-TO', bodyAction: '🐤 Aletea los brazos', category: 'animales', level: 3 },
  { word: 'Conejo', syllables: ['Co', 'ne', 'jo'], icon: '🐰', bg: 'from-pink-300 to-rose-400', hint: 'Salta mucho', mouthGuide: 'Garganta: CO, nariz: NE, aire: JO', bodyAction: '🐰 Salta como conejo', category: 'animales', level: 3 },
  { word: 'Caballo', syllables: ['Ca', 'ba', 'llo'], icon: '🐴', bg: 'from-amber-600 to-orange-700', hint: 'Galopa rápido', mouthGuide: 'Garganta: CA, labios: BA, lengua: LLO', bodyAction: '🐴 Galopa con las manos', category: 'animales', level: 3 },
  { word: 'Estrella', syllables: ['Es', 'tre', 'lla'], icon: '⭐', bg: 'from-yellow-400 to-amber-500', hint: 'Brilla en el cielo', mouthGuide: 'Sonrisa: ES, lengua vibra: TRE-LLA', bodyAction: '⭐ Abre y cierra las manos', category: 'naturaleza', level: 3 },
  { word: 'Mariposa', syllables: ['Ma', 'ri', 'po', 'sa'], icon: '🦋', bg: 'from-purple-400 to-pink-500', hint: 'Vuela bonito', mouthGuide: 'Labios: MA, lengua vibra: RI, labios: PO, sonrisa: SA', bodyAction: '🦋 Aletea los brazos suave', category: 'animales', level: 3 },
];

const aiTips: Record<string, string[]> = {
  'Mamá':    ['Junta bien los labios como un besito para la M', 'Abre grande la boca como un león: Aaa', 'Di Ma-má dando palmaditas suaves'],
  'Papá':    ['Sopla un poquito de aire para la P', 'Abre la boca grande: Aaa', 'Di Pa-pá aplaudiendo despacito'],
  'Bebé':    ['Junta los labios suavecito para la B', 'Di Be-bé moviendo la cabeza feliz', 'La B vibra en los labios, tócalos'],
  'Nene':    ['La N sale por la nariz, tócala mientras dices NNN', 'Pega la lengua arriba para la N', 'Di Ne-ne y señálate a ti mismo'],
  'Tete':    ['Toca los dientes de arriba con la punta de la lengua: T', 'Di Te-te y haz como si bebieras', 'La T es un golpecito de la lengua'],
  'Mano':    ['Labios juntos para MA, lengua arriba para NO', 'Di Ma-no y mueve tus manitas'],
  'Dedo':    ['La punta de la lengua toca los dientes: DE', 'Di De-do y señala algo bonito'],
  'Ojo':     ['Boca bien redondita como una O', 'Di O-jo y señala tus ojitos'],
  'Pie':     ['Labios juntos y sopla para PI', 'Di Pi-e y mueve tus piececitos'],
  'Pipi':    ['Dos soplidos iguales con los labios: PI-PI', 'Di Pi-pi aplaudiendo dos veces'],
  'Boca':    ['Labios juntos vibran: BO', 'Di Bo-ca y toca tu boquita'],
  'Nariz':   ['Aire por la nariz: NNN', 'Di Na-riz y toca tu nariz bonita'],
  'Pelo':    ['Sopla los labios: PE', 'Di Pe-lo y toca tu cabecita'],
  'Gato':    ['Garganta rasposa para GA', 'Después de decirlo, di ¡Miau!'],
  'Perro':   ['La lengua vibra como un motorcito: RRRR', 'Después di ¡Guau guau!'],
  'Pato':    ['Sopla los labios: PA', 'Después di ¡Cuac cuac!'],
  'Vaca':    ['El labio de abajo toca los dientes de arriba: VA', 'Después di ¡Muuuu!'],
  'Pollito': ['Labios redondos: PO', 'Después di ¡Pio pio!'],
  'Conejo':  ['Garganta: CO', 'Después ¡salta como conejito!'],
  'Caballo': ['Garganta: CA', 'Haz sonido de galope con la lengua'],
  'Mariposa':['Labios juntos: MA', 'Aletea los brazos bonito'],
  'Agua':    ['Abre grande la boca: AAAA', 'Haz como si tomaras agüita fresca'],
  'Leche':   ['Lengua arriba para LE', 'Haz como si bebieras un vasito'],
  'Pan':     ['Sopla los labios: PA', 'Haz como si mordieras algo rico'],
  'Banana':  ['Labios juntos: BA', 'Es como decir NA dos veces'],
  'Galleta': ['Garganta: GA', 'Después haz: ñam ñam ñam'],
  'Casa':    ['Garganta rasposa: CA', 'Haz un techito con tus manitas'],
  'Luna':    ['Lengua arriba para LU', 'Mira al cielo y señala la luna'],
  'Pelota':  ['Tres palmaditas: PE-LO-TA', 'La P es un soplido fuerte de los labios'],
  'Zapato':  ['Sonrisa con aire: ZZZ', 'Señala tus zapatitos'],
  'Nube':    ['Aire por la nariz: NU', 'Sopla como el viento'],
  'Sol':     ['Sonríe grande para la S', 'Abre los brazos como un sol grande'],
  'Cama':    ['Garganta: CA', 'Pon tu cabeza en las manos como durmiendo'],
  'Mesa':    ['Labios juntos: ME', 'Toca la mesa suavecito'],
  'Estrella':['Sonríe: ES', 'Abre y cierra las manos como brillando'],
};

type Phase = 'intro' | 'listen' | 'mouth' | 'syllables' | 'body' | 'repeat' | 'great';

export default function RepeatGame({ onBack, isFirstTime, onVisit }: { onBack: () => void; isFirstTime: boolean; onVisit: () => void }) {
  const { isEnabled: aiEnabled } = useAI();
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);
  const [levelWords, setLevelWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [syllableIdx, setSyllableIdx] = useState(0);
  const [stars, setStars] = useState(0);
  const [currentTip, setCurrentTip] = useState('');
  const [showLevelPicker, setShowLevelPicker] = useState(true);
  const [totalWordsCompleted, setTotalWordsCompleted] = useState(0);
  const hasSpoken = useRef(false);
  const flowIdRef = useRef(0);
  const [isListening, setIsListening] = useState(false);
  const [listenFeedback, setListenFeedback] = useState<{ heard: string; match: 'perfect' | 'close' | 'miss' } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const micSupported = isRecognitionSupported();

  useEffect(() => {
    const words = allWords.filter(w => w.level === currentLevel);
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setLevelWords(shuffled);
    setIndex(0);
  }, [currentLevel]);

  const round = levelWords[index % Math.max(levelWords.length, 1)];

  const cancelFlow = useCallback(() => { flowIdRef.current++; }, []);

  const pickTip = (word: string) => {
    const tips = aiTips[word] || [];
    if (tips.length > 0) {
      const tip = tips[Math.floor(Math.random() * tips.length)];
      setCurrentTip(tip);
      return tip;
    }
    return '';
  };

  // ── Flujo con async/await — cada frase termina COMPLETA antes de la siguiente ──
  const runRound = useCallback(async (i: number, words: Word[]) => {
    try {
      if (words.length === 0) return;
      const myFlowId = ++flowIdRef.current;
      const item = words[i % words.length];
      const cancelled = () => flowIdRef.current !== myFlowId;

      setPhase('intro');
      setSyllableIdx(0);
      setListenFeedback(null);
      setAttempts(0);
      if (aiEnabled) pickTip(item.word);

      await new Promise(r => setTimeout(r, 400));
      if (cancelled()) return;

      setPhase('listen');
      await speakAndWait(`Escucha bien: ${item.word}. ${item.word}.`);
      if (cancelled()) return;

      if (aiEnabled) {
        setPhase('mouth');
        await speakAndWait(`Mira mi boca: ${item.mouthGuide}`);
        if (cancelled()) return;
      }

      setPhase('syllables');
      if (aiEnabled) {
        await speakAndWait('Ahora por partes, aplaude conmigo:');
        if (cancelled()) return;
      }
      for (let s = 0; s < item.syllables.length; s++) {
        if (cancelled()) return;
        setSyllableIdx(s);
        await speakAndWait(item.syllables[s].toLowerCase());
        await new Promise(r => setTimeout(r, 600));
        if (cancelled()) return;
      }

      setPhase('body');
      const bodyText = item.bodyAction.split(' ').slice(1).join(' ');
      await speakAndWait(`¡Ahora con el cuerpo! ${bodyText} mientras dices ${item.word}`);
      if (cancelled()) return;

      setPhase('repeat');
      await speakAndWait('¡Tu turno! Di la palabra fuerte y bonito.');
    } catch (e: any) {
      if (e?.message !== '__MUTED__') throw e;
    }
  }, [aiEnabled]);

  useEffect(() => {
    if (!hasSpoken.current) {
      hasSpoken.current = true;
      if (isFirstTime) onVisit();
    }
    return cancelFlow;
  }, []);

  const handleSelectLevel = async (level: 1 | 2 | 3) => {
    try {
      setCurrentLevel(level);
      setShowLevelPicker(false);
      setStars(0);
      setTotalWordsCompleted(0);
      const words = allWords.filter(w => w.level === level);
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setLevelWords(shuffled);
      setIndex(0);
      const levelLabel = level === 1 ? 'fácil' : level === 2 ? 'medio' : 'difícil';
      await speakAndWait(`¡Vamos a practicar nivel ${levelLabel}! Escucha, mira cómo se dice, y luego repite tú.`);
      runRound(0, shuffled);
    } catch (e: any) {
      if (e?.message !== '__MUTED__') throw e;
    }
  };

  const handleListen = async () => {
    try {
      if (!round) return;
      cancelFlow();
      setPhase('listen');
      await speakAndWait(`${round.word}. ${round.word}.`);
      setPhase('repeat');
    } catch (e: any) {
      if (e?.message !== '__MUTED__') throw e;
    }
  };

  const handleMouth = async () => {
    try {
      if (!round) return;
      cancelFlow();
      setPhase('mouth');
      await speakAndWait(round.mouthGuide);
      setPhase('repeat');
    } catch (e: any) {
      if (e?.message !== '__MUTED__') throw e;
    }
  };

  const handleSyllables = async () => {
    try {
      if (!round) return;
      const myFlowId = ++flowIdRef.current;
      setPhase('syllables');
      setSyllableIdx(0);
      for (let s = 0; s < round.syllables.length; s++) {
        if (flowIdRef.current !== myFlowId) return;
        setSyllableIdx(s);
        await speakAndWait(round.syllables[s].toLowerCase());
        await new Promise(r => setTimeout(r, 600));
      }
      if (flowIdRef.current !== myFlowId) return;
      setPhase('repeat');
    } catch (e: any) {
      if (e?.message !== '__MUTED__') throw e;
    }
  };

  const handleNext = async () => {
    try {
      cancelFlow();
      setStars(s => s + 1);
      setTotalWordsCompleted(t => t + 1);
      setPhase('great');
      const praises = ['¡Perfecto! ¡Lo dijiste muy bien!', '¡Excelente! ¡Eres increíble!', '¡Muy bien! ¡Sigue así campeón!', '¡Fantástico! ¡Qué bien hablas!', '¡Bravo! ¡Lo lograste!'];
      await speakAndWait(praises[Math.floor(Math.random() * praises.length)]);
      const nextIdx = index + 1;
      if (nextIdx >= levelWords.length) {
        await speakAndWait(`¡Terminaste el nivel! ¡Ganaste ${stars + 1} estrellas! ¿Vamos al siguiente?`);
        setShowLevelPicker(true);
      } else {
        setIndex(nextIdx);
        runRound(nextIdx, levelWords);
      }
    } catch (e: any) {
      if (e?.message !== '__MUTED__') throw e;
    }
  };

  const handleRepeat = () => {
    if (!round) return;
    speak(round.word.toLowerCase(), true);
  };

  // ── MICRÓFONO: Escuchar al niño ──
  const handleMic = async () => {
    if (!round || isListening) return;
    try {
      cancelFlow();
      setIsListening(true);
      setListenFeedback(null);
      
      // Dar instrucción breve
      await speakAndWait('¡Te escucho! Di la palabra.');
      
      // Escuchar al niño (5 segundos máximo)
      const result = await listenToChild(round.word, 6000);
      setIsListening(false);
      setListenFeedback({ heard: result.heard, match: result.match });
      setAttempts(a => a + 1);
      
      if (result.match === 'perfect') {
        // ¡Lo dijo bien!
        const perfectPhrases = [
          `¡Perfecto! Dijiste ${round.word} muy bien`,
          `¡Excelente! ¡Eso fue ${round.word}!`,
          `¡Bravo! ¡Suena perfecto!`,
          `¡Increíble! ¡Lo dijiste genial!`,
        ];
        await speakAndWait(perfectPhrases[Math.floor(Math.random() * perfectPhrases.length)]);
        // Auto-avanzar
        handleNext();
      } else if (result.match === 'close') {
        // Casi — animar a intentar de nuevo
        const closePhrases = [
          `¡Casi! Escuché "${result.heard}". Intenta otra vez: ${round.word}`,
          `¡Muy cerca! Vamos de nuevo: ${round.word}`,
          `¡Buen intento! Dilo así: ${round.word}`,
        ];
        await speakAndWait(closePhrases[Math.floor(Math.random() * closePhrases.length)]);
      } else {
        // No se entendió
        if (result.heard) {
          const missPhrases = [
            `Escuché "${result.heard}". Vamos a intentar otra vez: ${round.word}`,
            `No te preocupes, intenta de nuevo: ${round.word}. ${round.word}.`,
          ];
          await speakAndWait(missPhrases[Math.floor(Math.random() * missPhrases.length)]);
        } else {
          await speakAndWait(`No te escuché bien. Acércate más y di: ${round.word}`);
        }
      }
    } catch (e: any) {
      setIsListening(false);
      if (e?.message !== '__MUTED__') throw e;
    }
  };

  // ═══════════════════════════════════════════
  // SELECTOR DE NIVEL
  // ═══════════════════════════════════════════
  if (showLevelPicker) {
    return (
      <div className="h-full flex flex-col w-full overflow-hidden bg-gradient-to-b from-sky-50 via-blue-50 to-indigo-50 font-sans select-none">
        <div className="relative z-20 flex items-center justify-between shrink-0 px-3 py-1.5 bg-white/80  shadow-sm rounded-b-2xl border-b-2 border-white">
          <button onClick={onBack} className="p-1.5 bg-gray-100 text-gray-600 rounded-full active:scale-90 transition-all border-2 border-white shadow-sm">
            <Home strokeWidth={3} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-pink-100 px-3 py-1 rounded-full border-2 border-white shadow-sm">
            <span className="text-lg">🗣️</span>
            <span className="text-xs md:text-sm font-black text-pink-600 uppercase tracking-widest">Repite Conmigo</span>
          </div>
          {totalWordsCompleted > 0 && (
            <div className="flex items-center gap-1 font-black text-amber-500 text-xs bg-amber-50 px-3 py-1 rounded-full border-2 border-amber-200">⭐ {totalWordsCompleted}</div>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-6 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-2">
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-1">¿Qué nivel quieres? 🎯</h2>
            <p className="text-sm md:text-base text-slate-500 font-bold">Empieza fácil y ve subiendo</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl px-4">
            {([
              { level: 1 as const, label: 'Fácil', sublabel: 'Mamá, Papá, Mano...', icon: '🌱', bg: 'from-green-400 to-emerald-500', shadow: '#15803D', count: allWords.filter(w => w.level === 1).length },
              { level: 2 as const, label: 'Medio', sublabel: 'Casa, Gato, Perro...', icon: '🌿', bg: 'from-amber-400 to-orange-500', shadow: '#C2410C', count: allWords.filter(w => w.level === 2).length },
              { level: 3 as const, label: 'Difícil', sublabel: 'Pelota, Zapato...', icon: '🌳', bg: 'from-purple-400 to-indigo-500', shadow: '#4338CA', count: allWords.filter(w => w.level === 3).length },
            ]).map((lvl, i) => (
              <motion.button key={lvl.level} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileTap={{ scale: 0.95, y: 8 }} onClick={() => handleSelectLevel(lvl.level)} className={`bg-gradient-to-br ${lvl.bg} rounded-[2rem] p-5 md:p-8 flex flex-col items-center gap-2 border-4 border-white/90 text-white relative overflow-hidden`} style={{ boxShadow: `0 8px 0 ${lvl.shadow}` }}>
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                <span className="text-4xl md:text-6xl">{lvl.icon}</span>
                <span className="text-lg md:text-2xl font-black uppercase tracking-wider">{lvl.label}</span>
                <span className="text-xs md:text-sm font-bold opacity-80">{lvl.sublabel}</span>
                <span className="text-[10px] md:text-xs font-black bg-white/20 px-3 py-0.5 rounded-full">{lvl.count} palabras</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!round) return null;

  // ═══════════════════════════════════════════
  // PANTALLA PRINCIPAL DEL JUEGO
  // ═══════════════════════════════════════════
  return (
    <div className="h-full flex flex-col w-full overflow-hidden bg-gradient-to-b from-sky-50 via-blue-50 to-indigo-50 font-sans select-none">
      {/* HEADER */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-3 py-1.5 bg-white/80  shadow-sm rounded-b-2xl border-b-2 border-white">
        <div className="flex items-center gap-2">
          <button onClick={() => { cancelFlow(); setShowLevelPicker(true); }} className="p-1.5 bg-gray-100 text-gray-600 rounded-full active:scale-90 transition-all border-2 border-white shadow-sm">
            <ArrowLeft strokeWidth={3} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-white shadow-sm ${currentLevel === 1 ? 'bg-green-100' : currentLevel === 2 ? 'bg-amber-100' : 'bg-purple-100'}`}>
            <span className="text-sm">{currentLevel === 1 ? '🌱' : currentLevel === 2 ? '🌿' : '🌳'}</span>
            <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${currentLevel === 1 ? 'text-green-600' : currentLevel === 2 ? 'text-amber-600' : 'text-purple-600'}`}>Nivel {currentLevel}</span>
          </div>
          <div className="text-[10px] md:text-xs font-bold text-slate-400">{index + 1}/{levelWords.length}</div>
        </div>
        <motion.div key={stars} initial={{ scale: 1.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="flex items-center gap-1.5 font-black text-amber-500 text-xs md:text-sm bg-amber-50 px-3 py-1 rounded-full border-2 border-amber-200 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /><span>⭐ {stars}</span>
        </motion.div>
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="shrink-0 px-4 pt-2">
        <div className="flex items-center gap-1 max-w-lg mx-auto">
          {[
            { id: 'listen', label: '👂', title: 'Escucha' },
            { id: 'mouth', label: '👄', title: 'Boca' },
            { id: 'syllables', label: '👏', title: 'Sílabas' },
            { id: 'body', label: '💪', title: 'Cuerpo' },
            { id: 'repeat', label: '🗣️', title: 'Tú' },
          ].map((step, i, arr) => {
            const phases: Phase[] = ['listen', 'mouth', 'syllables', 'body', 'repeat'];
            const currentPhaseIndex = phases.indexOf(phase);
            const stepIndex = phases.indexOf(step.id as Phase);
            const isActive = step.id === phase;
            const isDone = stepIndex < currentPhaseIndex || phase === 'great';
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex flex-col items-center flex-1 transition-all duration-300 ${isActive ? 'scale-110' : isDone ? 'opacity-60' : 'opacity-30'}`}>
                  <span className={`text-lg md:text-xl ${isActive ? 'animate-bounce' : ''}`}>{step.label}</span>
                  <div className={`h-1 w-full rounded-full mt-0.5 transition-colors ${isDone ? 'bg-green-400' : isActive ? 'bg-amber-400' : 'bg-slate-200'}`} />
                  <span className="text-[8px] md:text-[10px] font-bold text-slate-500 mt-0.5">{step.title}</span>
                </div>
                {i < arr.length - 1 && <ChevronRight className={`w-3 h-3 mx-0.5 shrink-0 ${isDone ? 'text-green-400' : 'text-slate-200'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 md:gap-6 px-4 overflow-y-auto min-h-0 py-3 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={round.word} initial={{ scale: 0.5, opacity: 0, rotate: -15 }} animate={{ scale: phase === 'great' ? [1, 1.2, 1] : 1, opacity: 1, rotate: phase === 'great' ? [0, -10, 10, -10, 0] : 0 }} transition={{ scale: { duration: 0.5 } }} exit={{ scale: 0.5, opacity: 0, rotate: 15 }} className={`bg-gradient-to-br ${round.bg} w-28 h-28 md:w-40 md:h-40 rounded-[2rem] md:rounded-[3rem] shadow-[0_12px_25px_rgba(0,0,0,0.1),inset_0_-6px_12px_rgba(0,0,0,0.1),inset_0_6px_12px_rgba(255,255,255,0.4)] flex items-center justify-center border-[5px] md:border-[8px] border-white/90 relative overflow-hidden`}>
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <span className="text-5xl md:text-7xl drop-shadow-[0_8px_8px_rgba(0,0,0,0.2)] relative z-10">{round.icon}</span>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col items-center gap-2">
          <h3 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight drop-shadow-sm uppercase">{round.word}</h3>
          <div className="flex gap-2 md:gap-3 flex-wrap justify-center">
            {round.syllables.map((syl, i) => (
              <motion.div key={i} animate={phase === 'syllables' && syllableIdx === i ? { scale: [1, 1.3, 1], y: -8, rotate: [0, -5, 5, 0] } : {}} className={`px-4 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-lg md:text-2xl font-black border-3 md:border-4 transition-all duration-300 ${phase === 'syllables' && syllableIdx === i ? 'bg-amber-400 border-white text-white shadow-[0_8px_0_#CA8A04]' : phase === 'repeat' || phase === 'great' || phase === 'body' || (phase === 'syllables' && syllableIdx > i) ? 'bg-green-400 border-white text-white shadow-[0_8px_0_#15803D]' : 'bg-white border-slate-100 text-slate-300 opacity-60'}`}>
                {syl.toUpperCase()}
              </motion.div>
            ))}
          </div>
          <p className="text-[10px] md:text-sm text-slate-500 font-bold bg-white/70  px-4 py-1 rounded-full border border-white shadow-sm text-center uppercase tracking-wider">{round.hint}</p>
        </div>

        <AnimatePresence>
          {phase === 'mouth' && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="max-w-xs md:max-w-md bg-white/95  border-4 border-pink-200 rounded-[2rem] px-5 py-3 flex items-center gap-3 shadow-xl">
              <div className="bg-gradient-to-br from-pink-400 to-rose-500 p-2 rounded-xl shrink-0 shadow-lg"><span className="text-2xl">👄</span></div>
              <div><p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-0.5">Mira cómo se dice</p><p className="text-xs md:text-sm font-black text-pink-900 leading-tight">{round.mouthGuide}</p></div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {phase === 'body' && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="max-w-xs md:max-w-md bg-white/95  border-4 border-green-200 rounded-[2rem] px-5 py-3 flex items-center gap-3 shadow-xl">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-xl shrink-0 shadow-lg"><Hand className="w-6 h-6 text-white" /></div>
              <div><p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-0.5">¡Mueve el cuerpo!</p><p className="text-xs md:text-sm font-black text-green-900 leading-tight">{round.bodyAction}</p></div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {aiEnabled && currentTip && phase === 'repeat' && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="max-w-xs md:max-w-md bg-white/95  border-4 border-purple-200 rounded-[2rem] px-5 py-3 flex items-center gap-3 shadow-xl">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-xl shrink-0 shadow-lg"><Brain className="w-5 h-5 text-white" /></div>
              <p className="text-xs md:text-sm font-black text-purple-900 leading-tight">{currentTip}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {phase === 'great' && <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} className="text-5xl md:text-7xl">🎉</motion.div>}
        </AnimatePresence>

        {/* Feedback del micrófono */}
        <AnimatePresence>
          {listenFeedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`max-w-xs md:max-w-md  border-4 rounded-[2rem] px-5 py-3 flex items-center gap-3 shadow-xl ${
                listenFeedback.match === 'perfect' ? 'bg-green-50/95 border-green-300' :
                listenFeedback.match === 'close' ? 'bg-amber-50/95 border-amber-300' :
                'bg-red-50/95 border-red-200'
              }`}
            >
              <span className="text-3xl">{listenFeedback.match === 'perfect' ? '🎉' : listenFeedback.match === 'close' ? '👍' : '💪'}</span>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${
                  listenFeedback.match === 'perfect' ? 'text-green-500' :
                  listenFeedback.match === 'close' ? 'text-amber-500' : 'text-red-400'
                }`}>
                  {listenFeedback.match === 'perfect' ? '¡Perfecto!' : listenFeedback.match === 'close' ? '¡Casi!' : '¡Otra vez!'}
                </p>
                {listenFeedback.heard ? (
                  <p className="text-xs md:text-sm font-black text-slate-700 leading-tight">
                    Escuché: "{listenFeedback.heard}"
                  </p>
                ) : (
                  <p className="text-xs md:text-sm font-bold text-slate-500 leading-tight">No te escuché, acércate más</p>
                )}
                {attempts > 0 && <p className="text-[10px] text-slate-400 font-bold mt-0.5">Intento {attempts}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicador de escuchando */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: [1, 1.1, 1] }}
              transition={{ scale: {  duration: 1 } }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-red-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 border-4 border-white"
            >
              <Mic className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-black uppercase tracking-widest">Te escucho...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTONES */}
      <div className="shrink-0 p-3 md:p-5 bg-white/70  rounded-t-[2rem] border-t-4 border-white shadow-[0_-8px_30px_rgba(0,0,0,0.05)] relative z-20">
        <div className="flex gap-2 md:gap-4 justify-center w-full max-w-2xl mx-auto">
          <motion.button whileTap={{ scale: 0.95, y: 8 }} onPointerDown={handleListen} disabled={phase === 'great'} className="flex-1 max-w-[100px] md:max-w-[130px] relative bg-blue-500 text-white p-3 md:p-4 rounded-2xl font-black shadow-[0_6px_0_#1D4ED8] active:shadow-[0_0px_0_#1D4ED8] transition-all flex flex-col items-center gap-0.5 disabled:opacity-50 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <Volume2 className="w-6 h-6 md:w-8 md:h-8 drop-shadow-md" /><span className="uppercase text-[8px] md:text-[10px] tracking-widest font-black">Escuchar</span>
          </motion.button>
          {aiEnabled && (
            <motion.button whileTap={{ scale: 0.95, y: 8 }} onPointerDown={handleMouth} disabled={phase === 'great'} className="flex-1 max-w-[100px] md:max-w-[130px] relative bg-pink-500 text-white p-3 md:p-4 rounded-2xl font-black shadow-[0_6px_0_#BE185D] active:shadow-[0_0px_0_#BE185D] transition-all flex flex-col items-center gap-0.5 disabled:opacity-50 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              <span className="text-xl md:text-3xl drop-shadow-md">👄</span><span className="uppercase text-[8px] md:text-[10px] tracking-widest font-black">Boca</span>
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.95, y: 8 }} onPointerDown={handleSyllables} disabled={phase === 'great'} className="flex-1 max-w-[100px] md:max-w-[130px] relative bg-amber-400 text-amber-900 p-3 md:p-4 rounded-2xl font-black shadow-[0_6px_0_#CA8A04] active:shadow-[0_0px_0_#CA8A04] transition-all flex flex-col items-center gap-0.5 disabled:opacity-50 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <span className="text-xl md:text-3xl drop-shadow-md">👏</span><span className="uppercase text-[8px] md:text-[10px] tracking-widest font-black">Sílabas</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.95, y: 8 }} onPointerDown={handleRepeat} disabled={phase === 'great'} className="flex-1 max-w-[100px] md:max-w-[130px] relative bg-cyan-500 text-white p-3 md:p-4 rounded-2xl font-black shadow-[0_6px_0_#0E7490] active:shadow-[0_0px_0_#0E7490] transition-all flex flex-col items-center gap-0.5 disabled:opacity-50 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <RotateCcw className="w-6 h-6 md:w-8 md:h-8 drop-shadow-md" /><span className="uppercase text-[8px] md:text-[10px] tracking-widest font-black">Otra vez</span>
          </motion.button>
          <AnimatePresence>
            {(phase === 'repeat' || phase === 'body' || phase === 'great') && (
              <motion.button initial={{ scale: 0, opacity: 0, width: 0 }} animate={{ scale: 1, opacity: 1, width: 'auto' }} exit={{ scale: 0, opacity: 0, width: 0 }} whileTap={{ scale: 0.95, y: 8 }} onPointerDown={handleNext} className="flex-1 max-w-[120px] md:max-w-[150px] relative bg-green-500 text-white p-3 md:p-4 rounded-2xl font-black shadow-[0_6px_0_#15803D] active:shadow-[0_0px_0_#15803D] transition-all flex flex-col items-center gap-0.5 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                <span className="text-xl md:text-3xl drop-shadow-md animate-pulse">✨</span><span className="uppercase text-[8px] md:text-[10px] tracking-widest font-black whitespace-nowrap">¡Lo dije!</span>
              </motion.button>
            )}
          </AnimatePresence>
          {/* MICRÓFONO — Solo aparece en fase repeat y si el navegador lo soporta */}
          <AnimatePresence>
            {micSupported && (phase === 'repeat') && !isListening && (
              <motion.button
                initial={{ scale: 0, opacity: 0, width: 0 }}
                animate={{ scale: 1, opacity: 1, width: 'auto' }}
                exit={{ scale: 0, opacity: 0, width: 0 }}
                whileTap={{ scale: 0.95, y: 8 }}
                onPointerDown={handleMic}
                className="flex-1 max-w-[120px] md:max-w-[150px] relative bg-red-500 text-white p-3 md:p-4 rounded-2xl font-black shadow-[0_6px_0_#B91C1C] active:shadow-[0_0px_0_#B91C1C] transition-all flex flex-col items-center gap-0.5 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                <Mic className="w-6 h-6 md:w-8 md:h-8 drop-shadow-md" /><span className="uppercase text-[8px] md:text-[10px] tracking-widest font-black">🎤 Dilo</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}