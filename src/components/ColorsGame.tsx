import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft, Sparkles, Palette, Target, CheckCircle2, XCircle } from 'lucide-react';

const colors = [
  { name: 'Rojo', hex: '#EF4444', text: 'text-white', shadow: 'shadow-[0_8px_0_#B91C1C]', activeShadow: 'active:shadow-[0_0px_0_#B91C1C]', emo: '🍎' },
  { name: 'Azul', hex: '#3B82F6', text: 'text-white', shadow: 'shadow-[0_8px_0_#1D4ED8]', activeShadow: 'active:shadow-[0_0px_0_#1D4ED8]', emo: '🌊' },
  { name: 'Verde', hex: '#22C55E', text: 'text-white', shadow: 'shadow-[0_8px_0_#15803D]', activeShadow: 'active:shadow-[0_0px_0_#15803D]', emo: '🌳' },
  { name: 'Amarillo', hex: '#FACC15', text: 'text-yellow-900', shadow: 'shadow-[0_8px_0_#CA8A04]', activeShadow: 'active:shadow-[0_0px_0_#CA8A04]', emo: '☀️' },
  { name: 'Naranja', hex: '#F97316', text: 'text-white', shadow: 'shadow-[0_8px_0_#C2410C]', activeShadow: 'active:shadow-[0_0px_0_#C2410C]', emo: '🍊' },
  { name: 'Rosa', hex: '#EC4899', text: 'text-white', shadow: 'shadow-[0_8px_0_#BE185D]', activeShadow: 'active:shadow-[0_0px_0_#BE185D]', emo: '🐷' },
  { name: 'Morado', hex: '#A855F7', text: 'text-white', shadow: 'shadow-[0_8px_0_#7E22CE]', activeShadow: 'active:shadow-[0_0px_0_#7E22CE]', emo: '🍇' },
  { name: 'Blanco', hex: '#FFFFFF', text: 'text-slate-800', shadow: 'shadow-[0_8px_0_#CBD5E1]', activeShadow: 'active:shadow-[0_0px_0_#CBD5E1]', emo: '☁️', extraClasses: '!border-slate-200' },
];

type ColorItem = typeof colors[0];
type Mode = 'aprende' | 'practica';
type Status = 'idle' | 'correct' | 'wrong';

function buildQuizRound(streak: number): { target: ColorItem; options: ColorItem[] } {
  const numDistractors = streak >= 5 ? 3 : streak >= 2 ? 2 : 1;
  const target = colors[Math.floor(Math.random() * colors.length)];
  const distractors = colors
    .filter(c => c.name !== target.name)
    .sort(() => Math.random() - 0.5)
    .slice(0, numDistractors);
  const options = [...distractors, target].sort(() => Math.random() - 0.5);
  return { target, options };
}

const PRAISE = ['¡Sí! ¡Ese es!', '¡Lo encontraste!', '¡Muy bien!', '¡Perfecto, campeón!', '¡Excelente ojo!'];

export default function ColorsGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const hasSpoken = useRef(false);
  const [activeColor, setActiveColor] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>('aprende');
  const [quiz, setQuiz] = useState<{ target: ColorItem; options: ColorItem[] } | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (hasSpoken.current) return;
    hasSpoken.current = true;

    if (isFirstTime) {
      speak('¡Hola! Toca cada color para escuchar su nombre.');
      onVisit();
    } else {
      speak('¡Vamos a jugar con los colores!');
    }
  }, [isFirstTime, onVisit]);

  const handleColorClick = (colorName: string) => {
    setActiveColor(colorName);
    speak(colorName);
    setTimeout(() => setActiveColor(null), 500);
  };

  const startPractica = () => {
    setMode('practica');
    setStars(0);
    setStreak(0);
    setStatus('idle');
    setLocked(false);
    const round = buildQuizRound(0);
    setQuiz(round);
    speak(`¡A jugar! Toca el color ${round.target.name}.`);
  };

  const nextQuizRound = (newStreak: number) => {
    const round = buildQuizRound(newStreak);
    setQuiz(round);
    setStatus('idle');
    setLocked(false);
    speak(`Toca el color ${round.target.name}`, false);
  };

  const handleQuizChoice = (choice: ColorItem) => {
    if (locked || !quiz) return;
    setLocked(true);

    if (choice.name === quiz.target.name) {
      setStatus('correct');
      setStars(s => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      speak(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
      setTimeout(() => nextQuizRound(newStreak), 2200);
    } else {
      setStatus('wrong');
      setStreak(0);
      speak(`Ese no es. Busca el ${quiz.target.name}`);
      setTimeout(() => {
        setStatus('idle');
        setLocked(false);
      }, 1600);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden play-mat-bg font-sans select-none">

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
            <Palette className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600" />
            <span className="text-xs md:text-sm font-black text-purple-600 uppercase tracking-widest hidden sm:block">
              Colores
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
        /* ═══════════════════════ FASE APRENDE (explorar libremente) ═══════════════════════ */
        <div className="flex-grow flex flex-col items-center w-full px-4 md:px-8 pt-4 pb-12 overflow-y-auto custom-scrollbar relative z-10">

          <div className="text-center shrink-0 mb-4 md:mb-6 w-full mt-2">
            <motion.h2
              animate={{ scale: [1, 1.05, 1], rotate: [-1, 1, -1] }}
              transition={{ duration: 4 }}
              className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 drop-shadow-sm uppercase tracking-tight flex items-center justify-center gap-2"
            >
              COLORES
            </motion.h2>
            <div className="mt-2 inline-flex items-center px-6 py-1 bg-white/50  rounded-full border-2 border-white text-purple-600 font-black uppercase text-sm md:text-lg">
              ¡Toca un bloque!
            </div>
          </div>

          <div className="card-grid-auto gap-4 md:gap-6 lg:gap-8 w-full max-w-6xl mx-auto pb-6">
            {colors.map((color, index) => (
              <motion.button
                key={color.name}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 15 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95, y: 10 }}
                onPointerDown={() => handleColorClick(color.name)}
                style={{ backgroundColor: color.hex }}
                className={`
                  group relative rounded-[2.5rem] md:rounded-[3rem]
                  flex flex-col items-center justify-center aspect-square transition-all duration-150
                  border-[6px] border-[#FFF8E9]
                  ${color.shadow} ${color.activeShadow}
                  ${color.text} ${color.extraClasses || ''}
                  touch-manipulation overflow-hidden
                `}
              >
                <motion.div
                  animate={activeColor === color.name ? { scale: [1, 1.4, 1], rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="text-6xl sm:text-[7rem] md:text-[8rem] drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform duration-300 relative z-10"
                >
                  {color.emo}
                </motion.div>

                <div className="absolute bottom-4 md:bottom-8 w-[80%] bg-black/20  rounded-full py-1.5 border border-white/10 z-10">
                  <span className="text-base md:text-2xl font-black uppercase tracking-widest drop-shadow-md">
                    {color.name}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.95, y: 6 }}
            onPointerDown={startPractica}
            className="shrink-0 mb-6 flex items-center gap-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-black uppercase tracking-widest text-sm md:text-base px-6 py-3 rounded-full border-4 border-white shadow-[0_8px_0_#7E22CE] active:shadow-[0_0px_0_#7E22CE] transition-all"
          >
            <Target className="w-5 h-5" /> A jugar
          </motion.button>
        </div>
      ) : (
        /* ═══════════════════════ FASE PRACTICA (encuentra el color) ═══════════════════════ */
        <div className="flex-grow flex flex-col items-center justify-start gap-4 sm:gap-8 w-full px-4 pt-6 pb-12 overflow-y-auto custom-scrollbar relative z-10">

          <button
            onClick={() => setMode('aprende')}
            className="shrink-0 text-[10px] md:text-xs font-black uppercase tracking-widest text-purple-500 bg-white/70 px-4 py-1.5 rounded-full border-2 border-purple-100 shadow-sm"
          >
            ← Volver a explorar
          </button>

          <div className="h-16 flex items-center justify-center shrink-0">
            <AnimatePresence mode="wait">
              {quiz && (
                <motion.p
                  key={quiz.target.name}
                  initial={{ opacity: 0, y: -16, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.9 }}
                  className="text-2xl sm:text-4xl font-black text-slate-700 text-center drop-shadow-sm"
                >
                  Toca el color <span className="text-purple-600 bg-white/50 px-3 py-1 rounded-full border-2 border-white/50">{quiz.target.name}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {quiz && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`options-${quiz.target.name}-${quiz.options.length}`}
                className="flex flex-wrap justify-center gap-4 sm:gap-8 w-full max-w-2xl px-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3 }}
              >
                {quiz.options.map((option, i) => {
                  const isCorrect = option.name === quiz.target.name;
                  let anim = {};
                  if (status === 'wrong' && !isCorrect) anim = { scale: 0.85, opacity: 0.5 };
                  if (status === 'correct' && isCorrect) anim = { scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] };

                  return (
                    <motion.button
                      key={`${option.name}-${i}`}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, ...anim }}
                      transition={{ delay: i * 0.08, type: 'spring' }}
                      whileHover={!locked ? { scale: 1.05 } : {}}
                      whileTap={!locked ? { scale: 0.95, y: 8 } : {}}
                      onPointerDown={() => handleQuizChoice(option)}
                      disabled={locked}
                      style={{ backgroundColor: option.hex }}
                      className={`
                        w-24 h-24 sm:w-36 sm:h-36 rounded-[2rem] sm:rounded-[2.5rem]
                        border-[6px] border-[#FFF8E9] transition-all duration-200
                        flex items-center justify-center relative overflow-hidden
                        ${option.shadow} ${!locked && option.activeShadow} ${option.extraClasses || ''}
                        ${status === 'correct' && isCorrect ? 'ring-8 ring-green-400 ring-offset-4 ring-offset-[#F5EDDB]' : ''}
                        touch-manipulation
                      `}
                    >
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
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
                {status === 'correct' ? '¡LO ENCONTRASTE!' : '¡SIGUE BUSCANDO!'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
