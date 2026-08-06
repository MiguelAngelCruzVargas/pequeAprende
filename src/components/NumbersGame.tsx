import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { Star, ArrowLeft, Sparkles, Hash, Target, CheckCircle2, XCircle } from 'lucide-react';

// Paleta de colores mapeada con sus sombras exactas para el efecto 3D
const numberStyles = [
  { bg: 'bg-red-500', shadow: 'shadow-[0_6px_0_#B91C1C]', activeShadow: 'active:shadow-[0_0px_0_#B91C1C]' },
  { bg: 'bg-blue-500', shadow: 'shadow-[0_6px_0_#1D4ED8]', activeShadow: 'active:shadow-[0_0px_0_#1D4ED8]' },
  { bg: 'bg-emerald-500', shadow: 'shadow-[0_6px_0_#047857]', activeShadow: 'active:shadow-[0_0px_0_#047857]' },
  { bg: 'bg-yellow-400', shadow: 'shadow-[0_6px_0_#CA8A04]', activeShadow: 'active:shadow-[0_0px_0_#CA8A04]', text: 'text-yellow-900' },
  { bg: 'bg-pink-500', shadow: 'shadow-[0_6px_0_#BE185D]', activeShadow: 'active:shadow-[0_0px_0_#BE185D]' },
  { bg: 'bg-purple-500', shadow: 'shadow-[0_6px_0_#7E22CE]', activeShadow: 'active:shadow-[0_0px_0_#7E22CE]' },
  { bg: 'bg-orange-500', shadow: 'shadow-[0_6px_0_#C2410C]', activeShadow: 'active:shadow-[0_0px_0_#C2410C]' },
  { bg: 'bg-cyan-500', shadow: 'shadow-[0_6px_0_#0E7490]', activeShadow: 'active:shadow-[0_0px_0_#0E7490]' },
  { bg: 'bg-indigo-500', shadow: 'shadow-[0_6px_0_#4338CA]', activeShadow: 'active:shadow-[0_0px_0_#4338CA]' },
  { bg: 'bg-teal-500', shadow: 'shadow-[0_6px_0_#0F766E]', activeShadow: 'active:shadow-[0_0px_0_#0F766E]' }
];

const COUNT_OBJECTS = [
  { emoji: '🍎', plural: 'manzanas' },
  { emoji: '⭐', plural: 'estrellas' },
  { emoji: '🎈', plural: 'globos' },
  { emoji: '🐟', plural: 'peces' },
  { emoji: '🌸', plural: 'flores' },
  { emoji: '🍪', plural: 'galletas' },
];

type Mode = 'aprende' | 'practica';
type Status = 'idle' | 'correct' | 'wrong';

function buildCountRound(streak: number) {
  const maxCount = streak >= 5 ? 10 : streak >= 2 ? 7 : 5;
  const count = 1 + Math.floor(Math.random() * maxCount);
  const object = COUNT_OBJECTS[Math.floor(Math.random() * COUNT_OBJECTS.length)];

  const optionSet = new Set<number>([count]);
  while (optionSet.size < 3) {
    const delta = Math.floor(Math.random() * 5) - 2; // -2..+2
    const candidate = count + delta;
    if (candidate >= 1 && candidate <= 10) optionSet.add(candidate);
  }
  const options = [...optionSet].sort(() => Math.random() - 0.5);

  return { count, object, options };
}

const PRAISE = ['¡Contaste perfecto!', '¡Así se hace!', '¡Muy bien contado!', '¡Excelente!', '¡Genial, campeón!'];

export default function NumbersGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [activeNumber, setActiveNumber] = useState<number | null>(null);
  const hasSpoken = useRef(false);

  const [mode, setMode] = useState<Mode>('aprende');
  const [round, setRound] = useState<ReturnType<typeof buildCountRound> | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (hasSpoken.current) return;
    hasSpoken.current = true;

    if (isFirstTime) {
      speak('¡Hola! Vamos a contar. Toca un número.');
      onVisit();
    } else {
      speak('¡Vamos a jugar con los números!');
    }
  }, [isFirstTime, onVisit]);

  const handleSelect = (num: number) => {
    setSelected(num);
    setActiveNumber(num);
    speak(`${num}`);
    setTimeout(() => setActiveNumber(null), 300);
  };

  const startPractica = () => {
    setMode('practica');
    setStars(0);
    setStreak(0);
    setStatus('idle');
    setLocked(false);
    const r = buildCountRound(0);
    setRound(r);
    speak(`¿Cuántas ${r.object.plural} hay? ¡Cuenta con tu dedito!`);
  };

  const nextRound = (newStreak: number) => {
    const r = buildCountRound(newStreak);
    setRound(r);
    setStatus('idle');
    setLocked(false);
    speak(`¿Cuántas ${r.object.plural} hay?`, false);
  };

  const handleAnswer = (num: number) => {
    if (locked || !round) return;
    setLocked(true);

    if (num === round.count) {
      setStatus('correct');
      setStars(s => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      speak(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
      setTimeout(() => nextRound(newStreak), 2200);
    } else {
      setStatus('wrong');
      setStreak(0);
      speak(`Casi. Son ${round.count}. ¡Cuenta otra vez!`);
      setTimeout(() => {
        setStatus('idle');
        setLocked(false);
      }, 1800);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden bg-gradient-to-b from-sky-50 via-blue-50 to-indigo-50 font-sans select-none">

      {/* HEADER COMPACTO Y ESTANDARIZADO */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-1.5 bg-white/80  shadow-sm rounded-b-2xl border-b-2 border-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:scale-90 transition-all border-2 border-white shadow-sm"
          >
            <ArrowLeft strokeWidth={3} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-blue-100 px-3 py-1 rounded-full border-2 border-white shadow-sm">
            <Hash className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
            <span className="text-xs md:text-sm font-black text-blue-600 uppercase tracking-widest hidden sm:block">
              Números
            </span>
          </div>
        </div>

        {mode === 'practica' && (
          <motion.div
            key={stars}
            initial={{ scale: 1.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="flex items-center gap-2 font-black text-amber-500 text-xs md:text-sm bg-amber-50 px-3 py-1 rounded-full border-2 border-amber-200 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /><span>⭐ {stars}</span>
          </motion.div>
        )}
      </div>

      {mode === 'aprende' ? (
        /* ═══════════════════════ FASE APRENDE ═══════════════════════ */
        <div className="flex-grow flex flex-col w-full px-2 sm:px-4 md:px-8 pt-4 pb-8 overflow-y-auto custom-scrollbar relative z-10">

          <div className="text-center shrink-0 mb-4 md:mb-6 mt-2 w-full">
            <motion.h2
              animate={{ scale: [1, 1.05, 1] }}
              className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 drop-shadow-sm uppercase tracking-tight flex items-center justify-center gap-2"
            >
              NÚMEROS
            </motion.h2>
            <div className="mt-1 inline-flex items-center px-6 py-1 bg-white/50 rounded-full border border-blue-100 text-blue-600 font-black uppercase text-xs sm:text-base md:text-lg">
              ¡Toca para contar! 🔢
            </div>
          </div>

          <div className="w-full flex flex-col gap-4 sm:gap-6 max-w-5xl mx-auto">

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 p-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num, i) => {
                const style = numberStyles[i];
                return (
                  <motion.button
                    key={num}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9, y: 10 }}
                    onPointerDown={() => handleSelect(num)}
                    className={`
                      group relative aspect-square rounded-[1.5rem] sm:rounded-[2rem]
                      flex items-center justify-center transition-all duration-150
                      border-2 sm:border-4 border-white/90
                      ${style.bg} ${style.shadow} ${style.activeShadow}
                      ${style.text || 'text-white'}
                      touch-manipulation overflow-hidden
                    `}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                    <div className="absolute top-[5%] left-[10%] w-[50%] h-[20%] bg-white/40 rounded-full blur-[1px] rotate-[-15deg] pointer-events-none" />

                    <motion.span
                      animate={activeNumber === num ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                      className="text-3xl sm:text-5xl md:text-6xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)] relative z-10"
                    >
                      {num}
                    </motion.span>
                  </motion.button>
                );
              })}
            </div>

            <div className="w-full mt-2">
              <div className="bg-white/60 rounded-[2.5rem] sm:rounded-[3.5rem] p-4 sm:p-8 flex flex-wrap content-center items-center justify-center gap-2 sm:gap-4 border-4 border-white shadow-md min-h-[160px] sm:min-h-[250px] md:min-h-[300px] relative overflow-hidden">

                <AnimatePresence mode="popLayout">
                  {selected ? (
                    Array.from({ length: selected }).map((_, i) => (
                      <motion.div
                        key={`${selected}-${i}`}
                        initial={{ scale: 0, rotate: -45, y: 30 }}
                        animate={{ scale: 1, rotate: 0, y: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: i * 0.05 }}
                        className="relative z-10"
                      >
                        <Star className="w-8 h-8 sm:w-14 sm:h-14 lg:w-20 lg:h-20 text-yellow-400 fill-yellow-400 drop-shadow-[0_5px_10px_rgba(0,0,0,0.15)]" />
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center gap-2 relative z-10 opacity-70">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="text-4xl sm:text-6xl"
                      >
                        👆
                      </motion.div>
                      <p className="text-sm sm:text-2xl text-blue-500 font-black tracking-wide">
                        Selecciona un número
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex justify-center pb-8">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.95, y: 6 }}
                onPointerDown={startPractica}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black uppercase tracking-widest text-sm md:text-base px-6 py-3 rounded-full border-4 border-white shadow-[0_8px_0_#3730A3] active:shadow-[0_0px_0_#3730A3] transition-all"
              >
                <Target className="w-5 h-5" /> A jugar
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        /* ═══════════════════════ FASE PRACTICA (contar de verdad) ═══════════════════════ */
        <div className="flex-grow flex flex-col items-center justify-start gap-4 sm:gap-8 w-full px-4 pt-6 pb-12 overflow-y-auto custom-scrollbar relative z-10">

          <button
            onClick={() => setMode('aprende')}
            className="shrink-0 text-[10px] md:text-xs font-black uppercase tracking-widest text-blue-500 bg-white/70 px-4 py-1.5 rounded-full border-2 border-blue-100 shadow-sm"
          >
            ← Volver a explorar
          </button>

          {round && (
            <>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${round.object.emoji}-${round.count}`}
                  initial={{ opacity: 0, y: -16, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.9 }}
                  className="text-2xl sm:text-4xl font-black text-slate-700 text-center drop-shadow-sm shrink-0"
                >
                  ¿Cuántas <span className="text-blue-600">{round.object.plural}</span> hay?
                </motion.p>
              </AnimatePresence>

              <div className="bg-white/60 rounded-[2.5rem] p-6 sm:p-8 flex flex-wrap content-center items-center justify-center gap-3 sm:gap-4 border-4 border-white shadow-md min-h-[140px] sm:min-h-[200px] max-w-2xl w-full shrink-0">
                {Array.from({ length: round.count }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: i * 0.06 }}
                    className="text-4xl sm:text-6xl drop-shadow-md"
                  >
                    {round.object.emoji}
                  </motion.span>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-4 sm:gap-8 w-full max-w-xl px-2 shrink-0">
                {round.options.map((num, i) => {
                  const isCorrect = num === round.count;
                  const style = numberStyles[num - 1];
                  let anim = {};
                  if (status === 'wrong' && !isCorrect) anim = { scale: 0.85, opacity: 0.5 };
                  if (status === 'correct' && isCorrect) anim = { scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] };

                  return (
                    <motion.button
                      key={`${num}-${i}`}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, ...anim }}
                      transition={{ delay: i * 0.08, type: 'spring' }}
                      whileHover={!locked ? { scale: 1.05 } : {}}
                      whileTap={!locked ? { scale: 0.95, y: 8 } : {}}
                      onPointerDown={() => handleAnswer(num)}
                      disabled={locked}
                      className={`
                        w-20 h-20 sm:w-28 sm:h-28 rounded-[1.75rem] sm:rounded-[2.25rem]
                        border-[4px] sm:border-[6px] border-white/90 transition-all duration-200
                        flex items-center justify-center relative overflow-hidden
                        ${style.bg} ${!locked && style.activeShadow} ${style.shadow}
                        ${style.text || 'text-white'}
                        ${status === 'correct' && isCorrect ? 'ring-8 ring-green-400 ring-offset-4 ring-offset-blue-50' : ''}
                        touch-manipulation
                      `}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                      <span className="text-3xl sm:text-4xl font-black drop-shadow-md relative z-10">{num}</span>
                    </motion.button>
                  );
                })}
              </div>
            </>
          )}

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
                {status === 'correct' ? <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" /> : <XCircle className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />}
                {status === 'correct' ? '¡CONTASTE BIEN!' : '¡CUENTA OTRA VEZ!'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
