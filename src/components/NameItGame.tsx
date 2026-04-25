import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft, Sparkles, CheckCircle2, XCircle, Type } from 'lucide-react';
import TutorOwl from './TutorOwl';

// Mapeo completo con nuestro estándar de sombras 3D (Gominola/Plástico)
const items = [
  { id: 'apple', icon: '🍎', name: 'Manzana', wrong: ['Naranja', 'Uva'], bg: 'bg-red-500', shadow: 'shadow-[0_10px_0_#B91C1C]' },
  { id: 'sun', icon: '☀️', name: 'Sol', wrong: ['Luna', 'Estrella'], bg: 'bg-yellow-400', shadow: 'shadow-[0_10px_0_#CA8A04]' },
  { id: 'house', icon: '🏠', name: 'Casa', wrong: ['Carro', 'Avión'], bg: 'bg-orange-500', shadow: 'shadow-[0_10px_0_#C2410C]' },
  { id: 'fish', icon: '🐟', name: 'Pez', wrong: ['Gato', 'Pájaro'], bg: 'bg-cyan-500', shadow: 'shadow-[0_10px_0_#0E7490]' },
  { id: 'flower', icon: '🌸', name: 'Flor', wrong: ['Árbol', 'Hoja'], bg: 'bg-pink-500', shadow: 'shadow-[0_10px_0_#BE185D]' },
  { id: 'star', icon: '⭐', name: 'Estrella', wrong: ['Luna', 'Sol'], bg: 'bg-purple-500', shadow: 'shadow-[0_10px_0_#7E22CE]' },
  { id: 'ball', icon: '⚽', name: 'Pelota', wrong: ['Cubo', 'Carro'], bg: 'bg-green-500', shadow: 'shadow-[0_10px_0_#15803D]' },
  { id: 'car', icon: '🚗', name: 'Carro', wrong: ['Moto', 'Avión'], bg: 'bg-blue-500', shadow: 'shadow-[0_10px_0_#1D4ED8]' },
  { id: 'moon', icon: '🌙', name: 'Luna', wrong: ['Sol', 'Nube'], bg: 'bg-indigo-500', shadow: 'shadow-[0_10px_0_#4338CA]' },
  { id: 'bird', icon: '🐦', name: 'Pájaro', wrong: ['Pez', 'Mariposa'], bg: 'bg-emerald-500', shadow: 'shadow-[0_10px_0_#047857]' },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function NameItGame({ onBack, isFirstTime, onVisit }: { onBack: () => void; isFirstTime: boolean; onVisit: () => void }) {
  const [shuffledItems, setShuffledItems] = useState<typeof items>([]);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [correctCount, setCorrectCount] = useState(0);
  const hasSpoken = useRef(false);

  useEffect(() => {
    const list = shuffle([...items]);
    setShuffledItems(list);

    if (!hasSpoken.current) {
      hasSpoken.current = true;
      if (isFirstTime) {
        speak('¡Hola! Mira el dibujo y busca su nombre.');
        onVisit();
      }
    }
  }, [isFirstTime, onVisit]);

  const round = shuffledItems[index % shuffledItems.length];

  const loadRound = (i: number, currentList: typeof items) => {
    const item = currentList[i % currentList.length];
    const otherItems = currentList.filter(it => it.name !== item.name);
    const randomWrongs = shuffle(otherItems).slice(0, 2).map(it => it.name);

    const opts = shuffle([item.name, ...randomWrongs]);
    setOptions(opts);
    setStatus('idle');
    setTimeout(() => speak(`Esto se llama... ${item.name}. ¿Puedes encontrar la palabra?`, true), 400);
  };

  useEffect(() => {
    if (shuffledItems.length > 0) {
      loadRound(index, shuffledItems);
    }
  }, [index, shuffledItems]);

  const handleAnswer = (choice: string) => {
    if (status !== 'idle' || !round) return;

    if (choice === round.name) {
      setStatus('correct');
      setCorrectCount(c => c + 1);
      speak('¡Muy bien! ¡Correcto!');
      setTimeout(() => {
        setIndex(prev => prev + 1);
      }, 2000);
    } else {
      setStatus('wrong');
      speak(`No es esa. Es ${round.name}. ¡Inténtalo!`);
      setTimeout(() => setStatus('idle'), 1800);
    }
  };

  if (shuffledItems.length === 0) return null;

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden bg-gradient-to-b from-indigo-50 via-purple-50 to-fuchsia-50 font-sans relative select-none">

      {/* Patrón de fondo juguetón */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #E9D5FF 4px, transparent 5px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* HEADER ESTANDARIZADO */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-3 bg-white/80  shadow-sm rounded-b-3xl border-b-4 border-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 md:p-3 bg-violet-100 text-violet-600 rounded-full hover:bg-violet-200 active:scale-90 transition-all shadow-inner border-2 border-violet-200"
          >
            <ArrowLeft strokeWidth={4} className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="flex items-center gap-2 bg-gradient-to-r from-violet-400 to-fuchsia-500 px-4 py-1.5 md:py-2 rounded-full shadow-[0_4px_0_#7C3AED] text-white border-2 border-white">
            <Type className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-sm md:text-base font-black uppercase tracking-widest hidden sm:block drop-shadow-md">
              Palabras
            </span>
          </div>
        </div>

        {/* Marcador */}
        <motion.div
  key={correctCount}
  initial={{ scale: 1.5, rotate: -10 }}
  animate={{ scale: 1, rotate: 0 }}
  className="flex items-center gap-2 font-black text-amber-500 text-lg md:text-xl bg-amber-50 px-4 py-1.5 rounded-full border-2 border-amber-200 shadow-sm"
>
  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
  <span>⭐ {correctCount}</span>
</motion.div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-grow flex flex-col items-center justify-start w-full px-4 pt-4 pb-8 overflow-y-auto custom-scrollbar relative z-10">

        {/* TutorOwl como Pista */}
        <div className="flex items-center justify-center shrink-0 mb-4">
          <div className="bg-white/90  px-6 py-2 rounded-full shadow-[0_4px_0_rgba(0,0,0,0.05)] border-2 border-white flex items-center gap-2">
            <TutorOwl message={`¡Encuentra el nombre del dibujo!`} size="sm" />
          </div>
        </div>

        {/* Tarjeta Principal (Cápsula 3D) */}
        <div className="flex justify-center mb-6 sm:mb-10 w-full shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={round?.id || 'loading'}
              initial={{ scale: 0.5, y: 50, rotate: -15 }}
              animate={{
                scale: status === 'correct' ? [1, 1.1, 1] : 1,
                y: 0,
                rotate: status === 'correct' ? [0, -10, 10, 0] : 0
              }}
              exit={{ scale: 0.5, y: -50, rotate: 15, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={`
                ${round?.bg || 'bg-gray-300'} ${round?.shadow || ''}
                w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 
                rounded-[3rem] sm:rounded-[4rem] 
                flex items-center justify-center border-[8px] sm:border-[12px] border-white/90 
                relative overflow-hidden
              `}
            >
              {/* Sombra interna para dar profundidad */}
              <div className="absolute inset-0 shadow-md pointer-events-none rounded-[2.5rem] sm:rounded-[3.5rem]" />

              {/* Brillo estilo cápsula de juguete */}
              <div className="absolute top-[5%] left-[10%] w-[60%] h-[25%] bg-white/50 rounded-full blur-[2px] rotate-[-20deg] pointer-events-none" />

              <motion.span
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
                className="text-[7rem] sm:text-[9rem] lg:text-[11rem] drop-shadow-[0_15px_15px_rgba(0,0,0,0.2)] leading-none relative z-10"
              >
                {round?.icon || ''}
              </motion.span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Opciones de Palabras (Bloques 3D) */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-4xl mx-auto pb-6">
          <AnimatePresence mode="wait">
            {options.map((opt, i) => {
              const isCorrect = round && opt === round.name;

              // Animación y estilos basados en el estado
              let btnStyle = 'bg-white text-violet-700 shadow-[0_8px_0_#CBD5E1] active:shadow-[0_0px_0_#CBD5E1] border-slate-200 hover:border-violet-200';
              let btnAnim = {};

              if (status === 'correct' && isCorrect) {
                btnStyle = 'bg-green-500 text-white shadow-[0_8px_0_#15803D] border-green-400 ring-4 ring-green-200 ring-offset-2';
                btnAnim = { scale: [1, 1.1, 1] };
              } else if (status === 'wrong' && isCorrect) {
                btnStyle = 'bg-white text-violet-700 shadow-[0_8px_0_#CBD5E1] border-slate-200 ring-4 ring-yellow-300 animate-pulse';
              } else if (status === 'wrong' && !isCorrect) {
                btnStyle = 'bg-slate-100 text-slate-400 shadow-[0_4px_0_#CBD5E1] border-slate-200 opacity-60';
                btnAnim = { x: [-5, 5, -5, 5, 0] }; // Shake effect
              } else if (status === 'correct' && !isCorrect) {
                btnStyle = 'bg-slate-100 text-slate-400 shadow-[0_4px_0_#CBD5E1] border-slate-200 opacity-50';
              }

              return (
                <motion.button
                  key={`${opt}-${i}-${round?.id}`} // Forzar re-render en cada ronda
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1, ...btnAnim }}
                  transition={{ delay: i * 0.1, type: 'spring' }}
                  whileHover={status === 'idle' ? { scale: 1.03 } : {}}
                  whileTap={status === 'idle' ? { scale: 0.95, y: 10 } : {}}
                  onPointerDown={() => handleAnswer(opt)}
                  disabled={status !== 'idle'}
                  className={`
                    flex-1 sm:flex-none sm:min-w-[200px] relative px-6 py-5 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] 
                    text-3xl sm:text-4xl font-black uppercase tracking-wider 
                    border-4 transition-all duration-200 flex items-center justify-center
                    ${btnStyle}
                  `}
                >
                  <span className="drop-shadow-sm relative z-10">{opt}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Cartel de Feedback estilo Cómic/Juego */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ type: 'spring', bounce: 0.6 }}
            className={`
              fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 sm:px-12 sm:py-5 rounded-[2rem] 
              text-white font-black text-2xl sm:text-3xl flex items-center gap-4 z-50 border-4 border-white whitespace-nowrap
              ${status === 'correct'
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_12px_0_#15803D,0_20px_40px_rgba(34,197,94,0.5)]'
                : 'bg-gradient-to-r from-orange-400 to-red-500 shadow-[0_12px_0_#991B1B,0_20px_40px_rgba(239,68,68,0.5)]'}
            `}
          >
            {status === 'correct' ? <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" /> : <XCircle className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />}
            <span className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] tracking-wide">
              {status === 'correct' ? '¡CORRECTO!' : '¡CASI!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}