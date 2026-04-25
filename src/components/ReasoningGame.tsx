import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { CheckCircle2, Brain, ArrowLeft, Sparkles } from 'lucide-react';

// Dejamos el hex para el color de fondo seguro, y las clases de Tailwind para las sombras
const colors = [
  { name: 'Rojo', hex: '#EF4444', shadow: 'shadow-[0_8px_0_#B91C1C]', activeShadow: 'active:shadow-[0_0px_0_#B91C1C]' },
  { name: 'Azul', hex: '#3B82F6', shadow: 'shadow-[0_8px_0_#1D4ED8]', activeShadow: 'active:shadow-[0_0px_0_#1D4ED8]' },
  { name: 'Verde', hex: '#10B981', shadow: 'shadow-[0_8px_0_#047857]', activeShadow: 'active:shadow-[0_0px_0_#047857]' },
  { name: 'Amarillo', hex: '#FACC15', shadow: 'shadow-[0_8px_0_#CA8A04]', activeShadow: 'active:shadow-[0_0px_0_#CA8A04]' },
  { name: 'Morado', hex: '#A855F7', shadow: 'shadow-[0_8px_0_#7E22CE]', activeShadow: 'active:shadow-[0_0px_0_#7E22CE]' },
  { name: 'Naranja', hex: '#F97316', shadow: 'shadow-[0_8px_0_#C2410C]', activeShadow: 'active:shadow-[0_0px_0_#C2410C]' },
];

function buildRound() {
  const newTarget = colors[Math.floor(Math.random() * colors.length)];
  const distractors = colors.filter(c => c.name !== newTarget.name);
  const shuffled = [...distractors].sort(() => Math.random() - 0.5).slice(0, 2);
  const opts = [...shuffled, newTarget].sort(() => Math.random() - 0.5);
  return { target: newTarget, options: opts };
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
    setTimeout(() => speak(`¿Dónde está el color ${next.target.name}?`), 200);
  }, []);

  useEffect(() => {
    if (hasSpokenOnMount.current) return;
    hasSpokenOnMount.current = true;

    if (isFirstTime) {
      speak('¡Hola! Voy a pedirte un color. ¡Tócalo fuerte!');
      onVisit();
      setTimeout(() => speak(`¿Dónde está el color ${round.target.name}?`, false), 3800);
    } else {
      setTimeout(() => speak(`¿Dónde está el color ${round.target.name}?`), 300);
    }
  }, [isFirstTime, onVisit, round.target.name]);

  const handleChoice = (choice: typeof colors[0]) => {
    if (locked || status !== 'idle') return;
    setLocked(true);

    if (choice.name === round.target.name) {
      setStatus('correct');
      setStars(s => s + 1);
      const praise = [
        '¡Lo encontraste! ¡Eres muy listo!',
        '¡Así se hace! ¡Muy bien!',
        '¡Perfecto! ¡Ese es!',
        '¡Genial! Lo lograste.',
      ];
      speak(praise[Math.floor(Math.random() * praise.length)]);
      setTimeout(goNextRound, 2500);
    } else {
      setStatus('wrong');
      speak('Mmm, ese no es. ¡Busca bien!');
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
        <div className="h-16 flex items-center justify-center shrink-0">
          <AnimatePresence mode="wait">
            <motion.p
              key={round.target.name}
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.9 }}
              className="text-2xl sm:text-4xl font-black text-slate-700 text-center drop-shadow-sm"
            >
              ¿Dónde está el <span className="text-purple-600 bg-white/50 px-3 py-1 rounded-full border-2 border-white/50">{round.target.name}</span>?
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Círculo Objetivo (Estilo Gominola Grande) */}
        <div className="shrink-0 relative flex flex-col items-center gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`target-${round.target.name}`}
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              style={{ backgroundColor: round.target.hex }}
              className="w-40 h-40 sm:w-56 sm:h-56 rounded-full shadow-md border-[10px] sm:border-[16px] border-white/90 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              <div className="absolute top-[10%] left-[15%] w-1/3 h-1/4 bg-white/40 rounded-full blur-[2px] rotate-[-30deg] pointer-events-none" />

              <AnimatePresence>
                {status === 'correct' && (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className="absolute z-10"
                  >
                    <CheckCircle2 className="w-24 h-24 sm:w-32 sm:h-32 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Opciones (Botones 3D Gominola) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`options-${round.target.name}`}
            className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-4 sm:mt-8 w-full max-w-2xl px-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            {round.options.map((option, i) => {
              const isCorrect = option.name === round.target.name;

              let buttonAnimation = {};
              if (status === 'wrong' && !isCorrect) buttonAnimation = { scale: 0.85, opacity: 0.5 };
              if (status === 'correct' && isCorrect) buttonAnimation = { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] };

              return (
                <motion.button
                  key={`${option.name}-${i}`}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, ...buttonAnimation }}
                  transition={{ delay: i * 0.08, type: 'spring' }}
                  whileHover={!locked ? { scale: 1.05 } : {}}
                  whileTap={!locked ? { scale: 0.95, y: 10 } : {}}
                  onPointerDown={() => handleChoice(option)}
                  disabled={locked}
                  style={{ backgroundColor: option.hex }}
                  className={`
                    w-24 h-24 sm:w-36 sm:h-36 rounded-[2rem] sm:rounded-[2.5rem] 
                    border-[4px] sm:border-[6px] border-white/90 transition-all duration-200
                    flex items-center justify-center relative overflow-hidden
                    ${option.shadow} ${!locked && option.activeShadow}
                    ${status === 'correct' && isCorrect ? 'ring-8 ring-green-400 ring-offset-4 ring-offset-green-50' : ''}
                    touch-manipulation
                  `}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                  <div className="absolute top-[10%] left-[15%] w-1/3 h-1/4 bg-white/40 rounded-full blur-[1px] rotate-[-30deg] pointer-events-none" />
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
              {status === 'correct' ? '🌟 ¡LO ENCONTRASTE!' : '🔍 ¡SIGUE BUSCANDO!'}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}