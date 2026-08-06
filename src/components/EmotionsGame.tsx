import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft, Smile, Sparkles, Target, CheckCircle2, XCircle } from 'lucide-react';

// Emociones básicas para 2-4 años — vocabulario emocional + un empujoncito
// de autorregulación (nombrar lo que sientes es el primer paso). Cada una
// trae un gesto para que el niño lo imite, no solo mire el emoji.
const emotions = [
  { name: 'Feliz', emoji: '😃', gesture: 'Sonríe bien grande como esta carita', bg: 'bg-yellow-400', shadow: 'shadow-[0_10px_0_#a16207]', activeShadow: 'active:shadow-[0_0px_0_#a16207]' },
  { name: 'Triste', emoji: '😢', gesture: 'Haz una carita triste, como si fueras a llorar', bg: 'bg-blue-500', shadow: 'shadow-[0_10px_0_#1e3a8a]', activeShadow: 'active:shadow-[0_0px_0_#1e3a8a]' },
  { name: 'Enojado', emoji: '😠', gesture: 'Frunce el ceño bien fuerte', bg: 'bg-red-500', shadow: 'shadow-[0_10px_0_#7f1d1d]', activeShadow: 'active:shadow-[0_0px_0_#7f1d1d]' },
  { name: 'Sorprendido', emoji: '😲', gesture: 'Abre mucho los ojos y la boca', bg: 'bg-purple-500', shadow: 'shadow-[0_10px_0_#581c87]', activeShadow: 'active:shadow-[0_0px_0_#581c87]' },
  { name: 'Asustado', emoji: '😱', gesture: 'Tápate la boca con las manitas', bg: 'bg-indigo-500', shadow: 'shadow-[0_10px_0_#3730a3]', activeShadow: 'active:shadow-[0_0px_0_#3730a3]' },
  { name: 'Cansado', emoji: '😴', gesture: 'Cierra los ojitos y bosteza', bg: 'bg-teal-500', shadow: 'shadow-[0_10px_0_#115e59]', activeShadow: 'active:shadow-[0_0px_0_#115e59]' },
];

type EmotionItem = typeof emotions[0];
type Mode = 'aprende' | 'practica';
type Status = 'idle' | 'correct' | 'wrong';

function buildRound(streak: number): { target: EmotionItem; options: EmotionItem[] } {
  const numDistractors = streak >= 4 ? 3 : streak >= 2 ? 2 : 1;
  const target = emotions[Math.floor(Math.random() * emotions.length)];
  const distractors = emotions
    .filter(e => e.name !== target.name)
    .sort(() => Math.random() - 0.5)
    .slice(0, numDistractors);
  const options = [...distractors, target].sort(() => Math.random() - 0.5);
  return { target, options };
}

const PRAISE = ['¡Sí, esa es!', '¡Muy bien!', '¡Eres un experto en emociones!', '¡Perfecto!', '¡Lo sentiste bien!'];

export default function EmotionsGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const hasSpoken = useRef(false);
  const [activeEmotion, setActiveEmotion] = useState<string | null>(null);
  const flowIdRef = useRef(0);

  const [mode, setMode] = useState<Mode>('aprende');
  const [quiz, setQuiz] = useState<{ target: EmotionItem; options: EmotionItem[] } | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (hasSpoken.current) return;
    hasSpoken.current = true;

    if (isFirstTime) {
      speak('¡Hola! Vamos a conocer las emociones. Toca una carita.');
      onVisit();
    } else {
      speak('¡Vamos a jugar con las emociones!');
    }
  }, [isFirstTime, onVisit]);

  const handleEmotionClick = async (e: EmotionItem) => {
    setActiveEmotion(e.name);
    const myFlowId = ++flowIdRef.current;
    const cancelled = () => flowIdRef.current !== myFlowId;

    speak(e.name);
    setTimeout(() => setActiveEmotion(null), 800);

    // Pequeña pausa antes del gesto para no atropellar el nombre.
    setTimeout(() => {
      if (!cancelled()) speak(e.gesture, false);
    }, 900);
  };

  const startPractica = () => {
    setMode('practica');
    setStars(0);
    setStreak(0);
    setStatus('idle');
    setLocked(false);
    const round = buildRound(0);
    setQuiz(round);
    speak(`¿Cuál carita está ${round.target.name.toLowerCase()}?`);
  };

  const nextRound = (newStreak: number) => {
    const round = buildRound(newStreak);
    setQuiz(round);
    setStatus('idle');
    setLocked(false);
    speak(`¿Cuál carita está ${round.target.name.toLowerCase()}?`, false);
  };

  const handleQuizChoice = (choice: EmotionItem) => {
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
      speak(`Esa no. Busca la carita ${quiz.target.name.toLowerCase()}`);
      setTimeout(() => {
        setStatus('idle');
        setLocked(false);
      }, 1600);
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
          <div className="flex items-center gap-1.5 bg-yellow-100 px-3 py-1 rounded-full border-2 border-white shadow-sm">
            <Smile className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-600" />
            <span className="text-xs md:text-sm font-black text-yellow-700 uppercase tracking-widest hidden sm:block">
              Emociones
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
        <div className="flex-grow flex flex-col w-full px-4 md:px-8 pt-4 pb-8 overflow-y-auto custom-scrollbar relative z-10">

          <div className="text-center shrink-0 mb-6 md:mb-8 w-full mt-2">
            <motion.h2
              animate={{ scale: [1, 1.05, 1] }}
              className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 drop-shadow-sm uppercase tracking-tight"
            >
              ¡EMOCIONES!
            </motion.h2>
            <div className="mt-2 inline-flex items-center px-6 py-1 bg-white/80 rounded-full border border-yellow-100 text-yellow-700 font-black uppercase text-sm md:text-lg">
              ¿Cómo te sientes hoy? 🥰
            </div>
          </div>

          <div className="card-grid-auto gap-5 md:gap-8 w-full max-w-[1200px] mx-auto pb-6">
            {emotions.map((e, index) => (
              <motion.button
                key={e.name}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 200, damping: 15 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95, y: 10 }}
                onPointerDown={() => handleEmotionClick(e)}
                className={`
                  group relative rounded-[2.5rem] md:rounded-[3rem]
                  flex flex-col items-center justify-center aspect-square transition-all duration-150
                  border-[6px] border-[#FFF8E9]
                  ${e.bg} ${e.shadow} ${e.activeShadow}
                  touch-manipulation overflow-hidden
                `}
              >
                <motion.div
                  animate={activeEmotion === e.name ? { scale: [1, 1.3, 1], rotate: [0, -8, 8, 0] } : { scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl sm:text-[6.5rem] md:text-[7.5rem] drop-shadow-[0_10px_10px_rgba(0,0,0,0.25)] relative z-10"
                >
                  {e.emoji}
                </motion.div>

                <div className="absolute bottom-4 md:bottom-6 w-[85%] bg-black/25 rounded-full py-1.5 z-10">
                  <span className="text-sm sm:text-base md:text-xl font-black uppercase tracking-wide text-white drop-shadow-md block text-center">
                    {e.name}
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
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-black uppercase tracking-widest text-sm md:text-base px-6 py-3 rounded-full border-4 border-white shadow-[0_8px_0_#9A3412] active:shadow-[0_0px_0_#9A3412] transition-all"
            >
              <Target className="w-5 h-5" /> A jugar
            </motion.button>
          </div>
        </div>
      ) : (
        /* ═══════════════════════ FASE PRACTICA ═══════════════════════ */
        <div className="flex-grow flex flex-col items-center justify-start gap-4 sm:gap-8 w-full px-4 pt-6 pb-12 overflow-y-auto custom-scrollbar relative z-10">

          <button
            onClick={() => setMode('aprende')}
            className="shrink-0 text-[10px] md:text-xs font-black uppercase tracking-widest text-yellow-700 bg-white/70 px-4 py-1.5 rounded-full border-2 border-yellow-100 shadow-sm"
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
                  ¿Cuál carita está <span className="text-orange-600 bg-white/50 px-3 py-1 rounded-full border-2 border-white/50">{quiz.target.name.toLowerCase()}</span>?
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
                        border-[6px] border-[#FFF8E9] transition-all duration-200
                        flex items-center justify-center relative overflow-hidden
                        ${option.bg} ${!locked && option.activeShadow} ${option.shadow}
                        ${status === 'correct' && isCorrect ? 'ring-8 ring-green-400 ring-offset-4 ring-offset-[#F5EDDB]' : ''}
                        touch-manipulation
                      `}
                    >
                      <span className="text-5xl sm:text-6xl drop-shadow-md relative z-10">{option.emoji}</span>
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
