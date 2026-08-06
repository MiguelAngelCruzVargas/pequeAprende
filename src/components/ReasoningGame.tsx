import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { CheckCircle2, XCircle, Brain, ArrowLeft, Sparkles } from 'lucide-react';

// "Pensar" es el juego de categorización/clasificación de la app: de un
// grupo de 4 cosas, tres son de la misma categoría y una no pertenece.
// Es una habilidad de razonamiento distinta a "encontrar el color X" (eso
// ya lo cubre el modo Practica de Colores) — aquí el niño tiene que
// reconocer QUÉ tienen en común las cosas para detectar cuál sobra.
interface Category {
  name: string;
  intro: string;      // qué se dice al iniciar la ronda
  correction: string;  // qué se dice cuando falla
  items: string[];
}

const CATEGORIES: Category[] = [
  { name: 'frutas', intro: 'Todo esto son frutas, menos una. ¿Cuál NO es una fruta?', correction: 'Esa sí es una fruta. ¡Busca la diferente!', items: ['🍎', '🍌', '🍇', '🍊', '🍓', '🍉', '🍍'] },
  { name: 'animales', intro: 'Todo esto son animales, menos uno. ¿Cuál NO es un animal?', correction: 'Ese sí es un animal. ¡Busca el diferente!', items: ['🐶', '🐱', '🐮', '🐰', '🦁', '🐵', '🐘'] },
  { name: 'vehículos', intro: 'Todo esto son vehículos, menos uno. ¿Cuál NO es un vehículo?', correction: 'Ese sí es un vehículo. ¡Busca el diferente!', items: ['🚗', '🚌', '🚲', '🚂', '✈️', '🚁', '🚓'] },
  { name: 'juguetes', intro: 'Todo esto son juguetes, menos uno. ¿Cuál NO es un juguete?', correction: 'Ese sí es un juguete. ¡Busca el diferente!', items: ['⚽', '🧸', '🪀', '🎈', '🎲', '🪁', '🎯'] },
];

interface RoundOption {
  emoji: string;
  isOdd: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildRound(): { category: Category; options: RoundOption[] } {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const groupEmojis = shuffle(category.items).slice(0, 3);
  const otherCategories = CATEGORIES.filter(c => c.name !== category.name);
  const oddCategory = otherCategories[Math.floor(Math.random() * otherCategories.length)];
  const oddEmoji = oddCategory.items[Math.floor(Math.random() * oddCategory.items.length)];

  const options = shuffle([
    ...groupEmojis.map(emoji => ({ emoji, isOdd: false })),
    { emoji: oddEmoji, isOdd: true },
  ]);

  return { category, options };
}

export default function ReasoningGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const [round, setRound] = useState(() => buildRound());
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [stars, setStars] = useState(0);
  const [locked, setLocked] = useState(false);
  const hasSpokenOnMount = useRef(false);

  const goNextRound = useCallback(() => {
    const next = buildRound();
    setRound(next);
    setStatus('idle');
    setLocked(false);
    setTimeout(() => speak(next.category.intro), 200);
  }, []);

  useEffect(() => {
    if (hasSpokenOnMount.current) return;
    hasSpokenOnMount.current = true;

    if (isFirstTime) {
      speak('¡Hola! Vamos a pensar juntos. Busca la cosa diferente.');
      onVisit();
      setTimeout(() => speak(round.category.intro, false), 3200);
    } else {
      setTimeout(() => speak(round.category.intro), 300);
    }
  }, [isFirstTime, onVisit, round.category.intro]);

  const handleChoice = (option: RoundOption) => {
    if (locked || status !== 'idle') return;
    setLocked(true);

    if (option.isOdd) {
      setStatus('correct');
      setStars(s => s + 1);
      const praise = [
        '¡Eso es! ¡Muy buena mirada!',
        '¡Así se hace! ¡Ese no pertenece!',
        '¡Perfecto! ¡Lo pensaste genial!',
        '¡Excelente! ¡Eres muy listo!',
      ];
      speak(praise[Math.floor(Math.random() * praise.length)]);
      setTimeout(goNextRound, 2500);
    } else {
      setStatus('wrong');
      speak(round.category.correction);
      setTimeout(() => {
        setStatus('idle');
        setLocked(false);
      }, 1800);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden bg-gradient-to-b from-purple-50 via-fuchsia-50 to-pink-50 font-sans select-none">

      {/* HEADER COMPACTO Y ESTANDARIZADO */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-1.5 bg-white/80  shadow-sm rounded-b-2xl border-b-2 border-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:scale-90 transition-all border-2 border-white shadow-sm"
          >
            <ArrowLeft strokeWidth={3} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-purple-100 px-3 py-1 rounded-full border-2 border-white shadow-sm">
            <Brain className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600" />
            <span className="text-xs md:text-sm font-black text-purple-600 uppercase tracking-widest hidden sm:block">
              A pensar
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
      <div className="flex-grow flex flex-col items-center justify-start gap-4 sm:gap-8 w-full px-4 pt-6 pb-12 overflow-y-auto custom-scrollbar relative z-10">

        {/* Pregunta animada */}
        <div className="min-h-16 flex items-center justify-center shrink-0 max-w-lg">
          <AnimatePresence mode="wait">
            <motion.p
              key={round.category.name}
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.9 }}
              className="text-xl sm:text-3xl font-black text-slate-700 text-center drop-shadow-sm px-2"
            >
              ¿Cuál <span className="text-purple-600 bg-white/50 px-3 py-1 rounded-full border-2 border-white/50">NO pertenece</span> al grupo?
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Las 4 opciones — 3 de la misma categoría + 1 diferente */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`options-${round.category.name}-${round.options.map(o => o.emoji).join('')}`}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-2 w-full max-w-2xl px-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            {round.options.map((option, i) => {
              let buttonAnimation = {};
              if (status === 'wrong' && !option.isOdd) buttonAnimation = {};
              if (status === 'correct' && option.isOdd) buttonAnimation = { scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] };
              if (status !== 'idle' && !option.isOdd) buttonAnimation = { scale: 0.9, opacity: 0.6 };

              return (
                <motion.button
                  key={`${option.emoji}-${i}`}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, ...buttonAnimation }}
                  transition={{ delay: i * 0.08, type: 'spring' }}
                  whileHover={!locked ? { scale: 1.05 } : {}}
                  whileTap={!locked ? { scale: 0.95, y: 8 } : {}}
                  onPointerDown={() => handleChoice(option)}
                  disabled={locked}
                  className={`
                    w-full aspect-square rounded-[2rem] sm:rounded-[2.5rem]
                    border-[4px] sm:border-[6px] border-white/90 transition-all duration-200
                    flex items-center justify-center relative overflow-hidden
                    bg-gradient-to-b from-white to-slate-100
                    shadow-[0_10px_0_#CBD5E1,0_15px_20px_rgba(0,0,0,0.08)]
                    ${!locked ? 'active:shadow-[0_0px_0_#CBD5E1]' : ''}
                    ${status === 'correct' && option.isOdd ? 'ring-8 ring-green-400 ring-offset-4 ring-offset-purple-50 from-green-50 to-emerald-100' : ''}
                    touch-manipulation
                  `}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                  <span className="text-5xl sm:text-7xl drop-shadow-md relative z-10">{option.emoji}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Banner de Feedback flotante */}
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
              {status === 'correct' ? <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" /> : <XCircle className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />}
              {status === 'correct' ? '¡LO ENCONTRASTE!' : '¡SIGUE PENSANDO!'}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
