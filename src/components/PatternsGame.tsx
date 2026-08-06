import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { CheckCircle2, XCircle, Puzzle, ArrowLeft, Sparkles } from 'lucide-react';

// "Patrones": pensamiento lógico/pre-matemático — reconocer QUÉ SIGUE en
// una secuencia que se repite. Es una habilidad distinta a categorizar
// (Pensar) o encontrar-el-color (Colores): aquí hay que notar el RITMO
// (A-B-A-B...) y predecir el siguiente paso, no solo reconocer algo.
interface ColorDef { name: string; hex: string; shadow: string }

const COLOR_POOL: ColorDef[] = [
  { name: 'Rojo', hex: '#ef4444', shadow: '#7f1d1d' },
  { name: 'Azul', hex: '#3b82f6', shadow: '#1e3a8a' },
  { name: 'Verde', hex: '#10b981', shadow: '#064e3b' },
  { name: 'Amarillo', hex: '#facc15', shadow: '#a16207' },
  { name: 'Morado', hex: '#a855f7', shadow: '#581c87' },
  { name: 'Naranja', hex: '#f97316', shadow: '#9a3412' },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildRound(streak: number) {
  // Empieza con patrón A-B (2 colores alternando), sube a A-B-C con la racha.
  const unitSize = streak >= 4 ? 3 : 2;
  const unit = shuffle(COLOR_POOL).slice(0, unitSize);
  const sequence: ColorDef[] = Array.from({ length: 6 }, (_, i) => unit[i % unitSize]);
  const answer = sequence[sequence.length - 1];
  const visible = sequence.slice(0, -1);

  const optionNames = new Set<string>([answer.name]);
  for (const c of shuffle(COLOR_POOL.filter(c => c.name !== answer.name))) {
    if (optionNames.size >= 3) break;
    optionNames.add(c.name);
  }
  const options = shuffle([...optionNames].map(name => COLOR_POOL.find(c => c.name === name)!));

  return { visible, answer, options };
}

type Status = 'idle' | 'correct' | 'wrong';

const PRAISE = ['¡Sí, así sigue!', '¡Muy bien! ¡Descubriste el patrón!', '¡Genial! ¡Qué buena mirada!', '¡Perfecto! ¡Eres un experto en patrones!', '¡Excelente!'];

export default function PatternsGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const [round, setRound] = useState(() => buildRound(0));
  const [status, setStatus] = useState<Status>('idle');
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [locked, setLocked] = useState(false);
  const hasSpokenOnMount = useRef(false);

  const goNextRound = useCallback((newStreak: number) => {
    const next = buildRound(newStreak);
    setRound(next);
    setStatus('idle');
    setLocked(false);
    setTimeout(() => speak('Mira el patrón. ¿Qué color sigue?', false), 200);
  }, []);

  useEffect(() => {
    if (hasSpokenOnMount.current) return;
    hasSpokenOnMount.current = true;

    if (isFirstTime) {
      speak('¡Hola! Vamos a descubrir patrones. Mira los colores y adivina cuál sigue.');
      onVisit();
      setTimeout(() => speak('Mira el patrón. ¿Qué color sigue?', false), 3600);
    } else {
      setTimeout(() => speak('Mira el patrón. ¿Qué color sigue?'), 300);
    }
  }, [isFirstTime, onVisit]);

  const handleChoice = (choice: ColorDef) => {
    if (locked || status !== 'idle') return;
    setLocked(true);

    if (choice.name === round.answer.name) {
      setStatus('correct');
      setStars(s => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      speak(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
      setTimeout(() => goNextRound(newStreak), 2400);
    } else {
      setStatus('wrong');
      setStreak(0);
      speak('Mmm, ese no sigue. ¡Mira bien el ritmo de los colores!');
      setTimeout(() => {
        setStatus('idle');
        setLocked(false);
      }, 1800);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden play-mat-bg font-sans select-none">

      {/* HEADER */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-1.5 bg-white/80 shadow-sm rounded-b-2xl border-b-2 border-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:scale-90 transition-all border-2 border-white shadow-sm"
          >
            <ArrowLeft strokeWidth={3} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-indigo-100 px-3 py-1 rounded-full border-2 border-white shadow-sm">
            <Puzzle className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600" />
            <span className="text-xs md:text-sm font-black text-indigo-600 uppercase tracking-widest hidden sm:block">
              Patrones
            </span>
          </div>
        </div>

        <motion.div
          key={stars}
          initial={{ scale: 1.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="flex items-center gap-2 font-black text-amber-500 text-xs md:text-sm bg-amber-50 px-3 py-1 rounded-full border-2 border-amber-200 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>⭐ {stars}</span>
        </motion.div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-grow flex flex-col items-center justify-start gap-6 sm:gap-10 w-full px-4 pt-8 pb-12 overflow-y-auto custom-scrollbar relative z-10">

        <motion.p
          animate={{ scale: [1, 1.03, 1] }}
          className="text-2xl sm:text-4xl font-black text-slate-700 text-center drop-shadow-sm shrink-0"
        >
          ¿Qué color <span className="text-indigo-600">sigue</span>?
        </motion.p>

        {/* La secuencia con el espacio final vacío */}
        <AnimatePresence mode="wait">
          <motion.div
            key={round.visible.map(c => c.name).join('') + round.answer.name}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center bg-white/70 rounded-[2.5rem] px-6 py-8 sm:px-10 sm:py-10 border-4 border-white shadow-md max-w-3xl"
          >
            {round.visible.map((c, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring' }}
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-[1.25rem] sm:rounded-[1.5rem] border-[5px] border-[#FFF8E9] shrink-0"
                style={{ backgroundColor: c.hex, boxShadow: `0 6px 0 ${c.shadow}` }}
              />
            ))}
            {/* Espacio con el signo de pregunta */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-[1.25rem] sm:rounded-[1.5rem] border-[5px] border-dashed border-indigo-300 bg-indigo-50 flex items-center justify-center shrink-0"
            >
              <span className="text-2xl sm:text-4xl font-black text-indigo-400">?</span>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Opciones */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`options-${round.answer.name}-${round.options.length}`}
            className="flex flex-wrap justify-center gap-4 sm:gap-8 w-full max-w-2xl px-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            {round.options.map((option, i) => {
              const isCorrect = option.name === round.answer.name;
              let anim = {};
              if (status === 'wrong' && !isCorrect) anim = { scale: 0.85, opacity: 0.5 };
              if (status === 'correct' && isCorrect) anim = { scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] };

              return (
                <motion.button
                  key={option.name}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, ...anim }}
                  transition={{ delay: i * 0.08, type: 'spring' }}
                  whileHover={!locked ? { scale: 1.05 } : {}}
                  whileTap={!locked ? { scale: 0.95, y: 8 } : {}}
                  onPointerDown={() => handleChoice(option)}
                  disabled={locked}
                  style={{ backgroundColor: option.hex, boxShadow: !locked ? `0 8px 0 ${option.shadow}` : `0 2px 0 ${option.shadow}` }}
                  className={`
                    w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] sm:rounded-[2.5rem]
                    border-[6px] border-[#FFF8E9] transition-all duration-200
                    flex items-center justify-center relative overflow-hidden
                    ${status === 'correct' && isCorrect ? 'ring-8 ring-green-400 ring-offset-4 ring-offset-[#F5EDDB]' : ''}
                    touch-manipulation
                  `}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6, y: 50 }}
              transition={{ type: 'spring', bounce: 0.6 }}
              className={`
                fixed bottom-8 px-8 py-3 rounded-full font-black text-white text-lg sm:text-2xl shadow-2xl z-50
                flex items-center gap-3 border-4 border-white
                ${status === 'correct'
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_10px_0_#15803D,0_20px_40px_rgba(34,197,94,0.4)]'
                  : 'bg-gradient-to-r from-orange-400 to-red-500 shadow-[0_10px_0_#991B1B,0_20px_40px_rgba(239,68,68,0.4)]'}
              `}
            >
              {status === 'correct' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8 animate-pulse" />}
              {status === 'correct' ? '¡LO DESCUBRISTE!' : '¡SIGUE PENSANDO!'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
