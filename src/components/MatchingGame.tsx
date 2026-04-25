import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { useAI } from '../lib/aiContext';
import { CheckCircle2, XCircle, ArrowLeft, CopyPlus, Star } from 'lucide-react';
import TutorOwl from './TutorOwl';

const items = [
  { id: 'apple', icon: '🍎', name: 'Manzana', tipo: 'esta fruta' },
  { id: 'banana', icon: '🍌', name: 'Plátano', tipo: 'esta fruta' },
  { id: 'dog', icon: '🐶', name: 'Perro', tipo: 'este animal' },
  { id: 'cat', icon: '🐱', name: 'Gato', tipo: 'este animal' },
  { id: 'car', icon: '🚗', name: 'Coche', tipo: 'este transporte' },
  { id: 'ball', icon: '⚽', name: 'Pelota', tipo: 'este juguete' },
];

export default function MatchingGame({ userName, onBack, isFirstTime, onVisit }: { userName: string, onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const { isEnabled: aiEnabled } = useAI();
  const [target, setTarget] = useState(items[0]);
  const [options, setOptions] = useState<typeof items>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [stars, setStars] = useState(0);
  const hasSpokenOnMount = useRef(false);

  const generateRound = (isFirst = false) => {
    const newTarget = items[Math.floor(Math.random() * items.length)];
    const shuffled = [...items].sort(() => 0.5 - Math.random()).slice(0, 3);

    if (!shuffled.find(i => i.id === newTarget.id)) {
      shuffled[Math.floor(Math.random() * 3)] = newTarget;
    }

    setTarget(newTarget);
    setOptions(shuffled);
    setStatus('idle');

    if (isFirst) {
      if (hasSpokenOnMount.current) return;
      hasSpokenOnMount.current = true;
      if (isFirstTime) {
        speak(`¡Hola! Busca la pareja de ${newTarget.tipo}`);
        onVisit();
      } else {
        speak(`Busca la pareja de ${newTarget.tipo}`);
      }
    } else {
      speak(`Busca la pareja de ${newTarget.tipo}`, false);
    }
  };

  useEffect(() => {
    generateRound(true);
  }, []);

  const handleChoice = (choice: typeof items[0]) => {
    if (status !== 'idle') return;

    const niño = userName.trim() ? userName : 'amiguito';

    if (choice.id === target.id) {
      setStatus('correct');
      setStars(s => s + 1);
      const successPhrases = aiEnabled
        ? [`¡Felicidades ${niño}! Tu cerebro con IA es asombroso. ✨`, `¡Wow ${niño}! Un análisis perfecto.`]
        : [`¡Felicidades ${niño}! Eres increíble.`, `¡Excelente ${niño}! Son igualitos.`];

      speak(successPhrases[Math.floor(Math.random() * successPhrases.length)]);
      setTimeout(() => generateRound(), 4000);
    } else {
      setStatus('wrong');
      speak(`Mmm, esa no es. ¡Vamos a intentarlo de nuevo, ${niño}!`);
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  return (
    <div
      className="h-[100dvh] flex flex-col w-full overflow-hidden bg-sky-300 font-sans relative select-none"
      style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.3) 4px, transparent 5px)',
        backgroundSize: '36px 36px'
      }}
    >

      {/* HEADER COMPACTO */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-1.5 bg-white shadow-sm rounded-b-2xl border-b-2 border-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 md:p-2 bg-sky-100 text-sky-600 rounded-full hover:bg-sky-200 active:scale-90 transition-all shadow-inner border-2 border-sky-200"
          >
            <ArrowLeft strokeWidth={4} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-sky-400 to-blue-500 px-3 py-1 rounded-full shadow-[0_3px_0_#0284C7] border-2 border-white">
            <CopyPlus className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            <span className="text-xs md:text-sm font-black text-white uppercase tracking-wider hidden sm:block drop-shadow-md">
              Parejas
            </span>
          </div>
        </div>

        <motion.div
          key={stars}
          initial={{ scale: 1.5, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          className="flex items-center gap-1.5 font-black text-amber-600 text-xs md:text-sm bg-gradient-to-b from-yellow-300 to-amber-400 px-3 py-1 rounded-full border-2 border-white shadow-[0_4px_0_#D97706]"
        >
          <Star className="w-4 h-4 text-white fill-white drop-shadow-md animate-pulse" />
          <span className="drop-shadow-md text-white font-black">{stars}</span>
        </motion.div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-start gap-8 sm:gap-12 pb-20 w-full pt-8 px-4 overflow-y-auto custom-scrollbar relative z-10">

        <div className="flex items-center justify-center shrink-0">
          <div className="bg-white px-6 py-2 rounded-full shadow-[0_6px_0_rgba(0,0,0,0.1)] border-4 border-white flex items-center gap-2">
            <TutorOwl message="¡Busca el dibujo igual!" size="sm" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 shrink-0">
          <motion.div
            animate={
              status === 'correct'
                ? { scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }
                : { y: [0, -10, 0] }
            }
            transition={
              status === 'correct'
                ? { type: 'spring', duration: 0.6 }
                : {  duration: 3, ease: "easeInOut" }
            }
            className="w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-white via-blue-50 to-sky-100 rounded-[3rem] sm:rounded-[4rem] shadow-xl border-[12px] border-white flex items-center justify-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-white/40 rounded-full blur-[2px] opacity-70 pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.span
                key={target.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: 'spring', bounce: 0.6 }}
                className="text-8xl sm:text-[10rem] drop-shadow-[0_15px_15px_rgba(0,0,0,0.2)] relative z-10"
              >
                {target.icon}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 pb-8 w-full max-w-3xl px-2">
          {options.map((option, i) => {
            const isCorrect = option.id === target.id;

            return (
              <motion.button
                key={`${option.id}-${i}`}
                initial={{ opacity: 0, y: 50, rotate: -10 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: i * 0.15, type: 'spring', bounce: 0.5 }}
                whileHover={status === 'idle' ? { scale: 1.05 } : {}}
                whileTap={status === 'idle' ? { scale: 0.95, y: 12 } : {}}
                onPointerDown={() => handleChoice(option)}
                disabled={status !== 'idle'}
                className={`
                  relative w-28 h-28 sm:w-44 sm:h-44 rounded-[2.5rem] sm:rounded-[3.5rem] 
                  flex items-center justify-center text-6xl sm:text-8xl transition-all duration-200
                  border-[6px] border-white/90 overflow-hidden
                  bg-gradient-to-b from-white to-slate-100
                  shadow-[0_12px_0_#94A3B8,0_15px_20px_rgba(0,0,0,0.1)]
                  active:shadow-[0_0px_0_#94A3B8,0_0px_0_rgba(0,0,0,0)]
                  ${status === 'correct' && !isCorrect ? 'opacity-30 scale-90 shadow-none translate-y-3' : ''}
                  ${status === 'correct' && isCorrect ? 'bg-gradient-to-b from-green-300 to-green-500 border-green-200 shadow-[0_12px_0_#15803D] scale-110 -translate-y-4' : ''}
                  ${status === 'wrong' && !isCorrect ? 'opacity-50 blur-[1px]' : ''}
                  touch-manipulation
                `}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                <div className="absolute top-[5%] left-[10%] w-[50%] h-[20%] bg-white/40 rounded-full blur-[1px] rotate-[-15deg] pointer-events-none" />

                <span className="drop-shadow-[0_8px_8px_rgba(0,0,0,0.15)] relative z-10">
                  {option.icon}
                </span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 50, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0, y: 50, rotate: 5 }}
              transition={{ type: 'spring', bounce: 0.6 }}
              className={`
                fixed bottom-10 px-8 py-5 sm:px-12 sm:py-6 rounded-[2rem] text-white font-black text-2xl sm:text-4xl flex items-center gap-4 z-50 border-8 border-white
                ${status === 'correct'
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_15px_0_#15803D,0_20px_40px_rgba(34,197,94,0.5)]'
                  : 'bg-gradient-to-r from-orange-400 to-red-500 shadow-[0_15px_0_#991B1B,0_20px_40px_rgba(239,68,68,0.5)]'}
              `}
            >
              {status === 'correct' ? <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" /> : <XCircle className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />}
              <span className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] tracking-wide">
                {status === 'correct' ? '¡SÚPER!' : '¡CASI!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}