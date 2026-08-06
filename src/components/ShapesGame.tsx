import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft, Shapes, Sparkles, Target, CheckCircle2, XCircle } from 'lucide-react';

// Formas básicas para 2-4 años (las que de verdad se enseñan a esa edad).
// Se dibujan como paths sólidos (no outline) para que se vean como bloques
// de juguete, igual que el resto de la app.
const CircleIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="35" /></svg>
);
const SquareIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><rect x="20" y="20" width="60" height="60" rx="10" /></svg>
);
const TriangleIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><path d="M50,14 L88,82 a5,5 0 0,1 -4.3,7.5 h-67.4 a5,5 0 0,1 -4.3,-7.5 z" /></svg>
);
const RectangleIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><rect x="10" y="28" width="80" height="44" rx="8" /></svg>
);
const HeartIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><path d="M50,88 C15,62 2,42 2,25 C2,8 18,-2 34,8 C41,13 46,19 50,27 C54,19 59,13 66,8 C82,-2 98,8 98,25 C98,42 85,62 50,88 z" /></svg>
);
const StarIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><path d="M50,4 L62,37 L98,37 L69,58 L80,92 L50,71 L20,92 L31,58 L2,37 L38,37 z" /></svg>
);
const OvalIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><ellipse cx="50" cy="50" rx="44" ry="28" /></svg>
);
const RhombusIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><path d="M50,6 L94,50 L50,94 L6,50 z" /></svg>
);

const shapes = [
  { name: 'Círculo', Icon: CircleIcon, bg: 'bg-blue-500', shadow: 'shadow-[0_12px_0_#1e3a8a]', activeShadow: 'active:shadow-[0_0px_0_#1e3a8a]' },
  { name: 'Cuadrado', Icon: SquareIcon, bg: 'bg-red-500', shadow: 'shadow-[0_12px_0_#7f1d1d]', activeShadow: 'active:shadow-[0_0px_0_#7f1d1d]' },
  { name: 'Triángulo', Icon: TriangleIcon, bg: 'bg-emerald-500', shadow: 'shadow-[0_12px_0_#064e3b]', activeShadow: 'active:shadow-[0_0px_0_#064e3b]' },
  { name: 'Rectángulo', Icon: RectangleIcon, bg: 'bg-orange-500', shadow: 'shadow-[0_12px_0_#9a3412]', activeShadow: 'active:shadow-[0_0px_0_#9a3412]' },
  { name: 'Corazón', Icon: HeartIcon, bg: 'bg-pink-500', shadow: 'shadow-[0_12px_0_#9d174d]', activeShadow: 'active:shadow-[0_0px_0_#9d174d]' },
  { name: 'Estrella', Icon: StarIcon, bg: 'bg-yellow-400', shadow: 'shadow-[0_12px_0_#a16207]', activeShadow: 'active:shadow-[0_0px_0_#a16207]' },
  { name: 'Óvalo', Icon: OvalIcon, bg: 'bg-purple-500', shadow: 'shadow-[0_12px_0_#581c87]', activeShadow: 'active:shadow-[0_0px_0_#581c87]' },
  { name: 'Rombo', Icon: RhombusIcon, bg: 'bg-cyan-500', shadow: 'shadow-[0_12px_0_#164e63]', activeShadow: 'active:shadow-[0_0px_0_#164e63]' },
];

type ShapeItem = typeof shapes[0];
type Mode = 'aprende' | 'practica';
type Status = 'idle' | 'correct' | 'wrong';

function buildShapeRound(streak: number): { target: ShapeItem; options: ShapeItem[] } {
  const numDistractors = streak >= 5 ? 3 : streak >= 2 ? 2 : 1;
  const target = shapes[Math.floor(Math.random() * shapes.length)];
  const distractors = shapes
    .filter(s => s.name !== target.name)
    .sort(() => Math.random() - 0.5)
    .slice(0, numDistractors);
  const options = [...distractors, target].sort(() => Math.random() - 0.5);
  return { target, options };
}

const PRAISE = ['¡Esa es! ¡Muy bien!', '¡La encontraste!', '¡Perfecto!', '¡Genial, sigue así!', '¡Eres un experto en formas!'];

export default function ShapesGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const hasSpoken = useRef(false);
  const [activeShape, setActiveShape] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>('aprende');
  const [quiz, setQuiz] = useState<{ target: ShapeItem; options: ShapeItem[] } | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (hasSpoken.current) return;
    hasSpoken.current = true;

    if (isFirstTime) {
      speak('¡Hola! Mira cuántas formas divertidas. Toca cada una.');
      onVisit();
    } else {
      speak('¡Vamos a aprender las figuras!');
    }
  }, [isFirstTime, onVisit]);

  const handleShapeClick = (shapeName: string) => {
    setActiveShape(shapeName);
    speak(shapeName);
    setTimeout(() => setActiveShape(null), 500);
  };

  const startPractica = () => {
    setMode('practica');
    setStars(0);
    setStreak(0);
    setStatus('idle');
    setLocked(false);
    const round = buildShapeRound(0);
    setQuiz(round);
    speak(`¡A jugar! Toca el ${round.target.name.toLowerCase()}.`);
  };

  const nextRound = (newStreak: number) => {
    const round = buildShapeRound(newStreak);
    setQuiz(round);
    setStatus('idle');
    setLocked(false);
    speak(`Toca el ${round.target.name.toLowerCase()}`, false);
  };

  const handleQuizChoice = (choice: ShapeItem) => {
    if (locked || !quiz) return;
    setLocked(true);

    if (choice.name === quiz.target.name) {
      setStatus('correct');
      setStars(s => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      speak(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
      setTimeout(() => nextRound(newStreak), 2200);
    } else {
      setStatus('wrong');
      setStreak(0);
      speak(`Ese no es. Busca el ${quiz.target.name.toLowerCase()}`);
      setTimeout(() => {
        setStatus('idle');
        setLocked(false);
      }, 1600);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-100 font-sans select-none">

      {/* HEADER COMPACTO Y ESTANDARIZADO */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-2 bg-white/90 backdrop-blur-md shadow-md rounded-b-3xl border-b-4 border-amber-200/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white text-amber-600 rounded-2xl hover:bg-amber-50 active:scale-90 transition-all border-b-4 border-amber-200 shadow-sm"
          >
            <ArrowLeft strokeWidth={3} className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="flex items-center gap-2 bg-amber-100 px-4 py-1.5 rounded-2xl border-2 border-white shadow-inner">
            <Shapes className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
            <span className="text-sm md:text-base font-black text-amber-700 uppercase tracking-widest hidden sm:block">
              Mis Figuras
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
        <div className="flex-grow flex flex-col w-full px-4 md:px-8 pt-6 pb-12 overflow-y-auto custom-scrollbar relative z-10">

          <div className="text-center shrink-0 mb-6 md:mb-10 w-full">
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, scale: [1, 1.02, 1] }}
              className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-600 drop-shadow-md uppercase tracking-tighter"
            >
              FIGURAS
            </motion.h2>
            <div className="mt-2 inline-flex items-center px-8 py-1.5 bg-white/80 backdrop-blur-sm rounded-2xl border-b-4 border-amber-100 text-amber-700 font-black uppercase text-base md:text-lg shadow-lg">
              ¡Toca un bloque mágico! ✨
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10 w-full max-w-[1400px] mx-auto pb-6 px-2">
            {shapes.map((shape, index) => (
              <motion.button
                key={shape.name}
                initial={{ scale: 0, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.9, y: 12, rotate: 0 }}
                onPointerDown={() => handleShapeClick(shape.name)}
                className={`
                  group relative rounded-[2.5rem] md:rounded-[3rem]
                  flex flex-col items-center justify-center aspect-[1/1.25] transition-all duration-150
                  border-4 sm:border-[8px] border-white/40
                  ${shape.bg} ${shape.shadow} ${shape.activeShadow}
                  touch-manipulation overflow-hidden
                `}
              >
                <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                <div className="absolute top-[8%] left-[12%] w-[35%] h-[15%] bg-white/30 rounded-full blur-[1px] rotate-[-20deg] pointer-events-none" />

                <motion.div
                  animate={activeShape === shape.name ? { scale: [1, 1.2, 0.9, 1.1, 1], rotate: [0, 10, -10, 5, 0] } : { scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10 mb-8 md:mb-12"
                >
                  <shape.Icon className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 text-white drop-shadow-[0_10px_6px_rgba(0,0,0,0.2)]" />
                </motion.div>

                <div className="absolute bottom-5 md:bottom-7 w-[85%] left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm rounded-2xl py-2 border border-white/30 z-10">
                  <span className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tighter text-white drop-shadow-lg">
                    {shape.name}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="flex justify-center pb-6">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.95, y: 6 }}
              onPointerDown={startPractica}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black uppercase tracking-widest text-sm md:text-base px-6 py-3 rounded-full border-4 border-white shadow-[0_8px_0_#9A3412] active:shadow-[0_0px_0_#9A3412] transition-all"
            >
              <Target className="w-5 h-5" /> A jugar
            </motion.button>
          </div>
        </div>
      ) : (
        /* ═══════════════════════ FASE PRACTICA (encuentra la figura) ═══════════════════════ */
        <div className="flex-grow flex flex-col items-center justify-start gap-4 sm:gap-8 w-full px-4 pt-6 pb-12 overflow-y-auto custom-scrollbar relative z-10">

          <button
            onClick={() => setMode('aprende')}
            className="shrink-0 text-[10px] md:text-xs font-black uppercase tracking-widest text-amber-600 bg-white/70 px-4 py-1.5 rounded-full border-2 border-amber-100 shadow-sm"
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
                  Toca el <span className="text-amber-600 bg-white/50 px-3 py-1 rounded-full border-2 border-white/50">{quiz.target.name}</span>
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
                      key={option.name}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, ...anim }}
                      transition={{ delay: i * 0.08, type: 'spring' }}
                      whileHover={!locked ? { scale: 1.05 } : {}}
                      whileTap={!locked ? { scale: 0.95, y: 8 } : {}}
                      onPointerDown={() => handleQuizChoice(option)}
                      disabled={locked}
                      className={`
                        w-24 h-24 sm:w-36 sm:h-36 rounded-[2rem] sm:rounded-[2.5rem]
                        border-[4px] sm:border-[6px] border-white/90 transition-all duration-200
                        flex items-center justify-center relative overflow-hidden
                        ${option.bg} ${!locked && option.activeShadow} ${option.shadow}
                        ${status === 'correct' && isCorrect ? 'ring-8 ring-green-400 ring-offset-4 ring-offset-amber-50' : ''}
                        touch-manipulation
                      `}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                      <div className="absolute top-[10%] left-[15%] w-1/3 h-1/4 bg-white/40 rounded-full blur-[1px] rotate-[-30deg] pointer-events-none" />
                      <option.Icon className="w-14 h-14 sm:w-20 sm:h-20 text-white drop-shadow-md relative z-10" />
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
                {status === 'correct' ? '¡ESA ES!' : '¡SIGUE BUSCANDO!'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
