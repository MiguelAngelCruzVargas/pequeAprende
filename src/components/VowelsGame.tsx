import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft, Sparkles, BookOpen, Star, Target, CheckCircle2, XCircle } from 'lucide-react';

const vowels = [
  { letter: 'A', word: 'Avión', icon: '✈️', color: 'bg-red-500', shadow: 'shadow-[0_10px_0_#B91C1C]', activeShadow: 'active:shadow-[0_0px_0_#B91C1C]', light: 'from-red-300' },
  { letter: 'E', word: 'Elefante', icon: '🐘', color: 'bg-blue-500', shadow: 'shadow-[0_10px_0_#1D4ED8]', activeShadow: 'active:shadow-[0_0px_0_#1D4ED8]', light: 'from-blue-300' },
  { letter: 'I', word: 'Iguana', icon: '🦎', color: 'bg-emerald-500', shadow: 'shadow-[0_10px_0_#047857]', activeShadow: 'active:shadow-[0_0px_0_#047857]', light: 'from-emerald-300' },
  { letter: 'O', word: 'Oso', icon: '🐻', color: 'bg-orange-500', shadow: 'shadow-[0_10px_0_#C2410C]', activeShadow: 'active:shadow-[0_0px_0_#C2410C]', light: 'from-orange-300' },
  { letter: 'U', word: 'Uvas', icon: '🍇', color: 'bg-fuchsia-500', shadow: 'shadow-[0_10px_0_#701A75]', activeShadow: 'active:shadow-[0_0px_0_#701A75]', light: 'from-fuchsia-300' },
];

type VowelItem = typeof vowels[0];
type Mode = 'aprende' | 'practica';
type Status = 'idle' | 'correct' | 'wrong';

function buildVowelRound(streak: number): { target: VowelItem; options: VowelItem[] } {
  const numDistractors = streak >= 4 ? 4 : streak >= 2 ? 3 : 2;
  const target = vowels[Math.floor(Math.random() * vowels.length)];
  const distractors = vowels
    .filter(v => v.letter !== target.letter)
    .sort(() => Math.random() - 0.5)
    .slice(0, numDistractors);
  const options = [...distractors, target].sort(() => Math.random() - 0.5);
  return { target, options };
}

const PRAISE = ['¡Correcto! ¡Muy bien!', '¡Sí, esa es!', '¡Eres un genio de las letras!', '¡Perfecto!', '¡Lo lograste!'];

export default function VowelsGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const hasSpoken = useRef(false);
  const [readMode, setReadMode] = useState<'letter' | 'full'>('full');
  const [activeVowel, setActiveVowel] = useState<string | null>(null);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const burstId = useRef(0);

  const [mode, setMode] = useState<Mode>('aprende');
  const [quiz, setQuiz] = useState<{ target: VowelItem; options: VowelItem[] } | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (hasSpoken.current) return;
    hasSpoken.current = true;

    if (isFirstTime) {
      speak('¡Mira las vocales! Toca una para jugar.');
      onVisit();
    } else {
      speak('¡Vamos a jugar con las vocales!');
    }
  }, [isFirstTime, onVisit]);

  const handleVowelClick = (e: React.PointerEvent, v: VowelItem) => {
    setActiveVowel(v.letter);

    const clientX = e.clientX;
    const clientY = e.clientY;

    const newBurst = { id: burstId.current++, x: clientX, y: clientY, color: v.color };
    setBursts(prev => [...prev, newBurst]);
    setTimeout(() => {
      setBursts(prev => prev.filter(b => b.id !== newBurst.id));
    }, 1000);

    if (readMode === 'letter') {
      speak(v.letter.toLowerCase());
    } else {
      speak(`${v.letter.toLowerCase()} de ${v.word}`);
    }

    setTimeout(() => setActiveVowel(null), 800);
  };

  const startPractica = () => {
    setMode('practica');
    setStars(0);
    setStreak(0);
    setStatus('idle');
    setLocked(false);
    const round = buildVowelRound(0);
    setQuiz(round);
    speak(`¿Con qué vocal empieza ${round.target.word}?`);
  };

  const nextRound = (newStreak: number) => {
    const round = buildVowelRound(newStreak);
    setQuiz(round);
    setStatus('idle');
    setLocked(false);
    speak(`¿Con qué vocal empieza ${round.target.word}?`, false);
  };

  const handleQuizChoice = (choice: VowelItem) => {
    if (locked || !quiz) return;
    setLocked(true);

    if (choice.letter === quiz.target.letter) {
      setStatus('correct');
      setStars(s => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      speak(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
      setTimeout(() => nextRound(newStreak), 2200);
    } else {
      setStatus('wrong');
      setStreak(0);
      speak(`Mmm, no. ${quiz.target.word} empieza con ${quiz.target.letter.toLowerCase()}`);
      setTimeout(() => {
        setStatus('idle');
        setLocked(false);
      }, 1800);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full relative overflow-hidden play-mat-bg font-sans select-none">

      {/* HEADER */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-1 sm:py-1.5 bg-white/80  shadow-sm rounded-b-2xl border-b-2 border-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 md:p-2 bg-white/90 text-sky-500 rounded-full hover:bg-white active:scale-90 transition-all shadow-sm border-2 border-sky-50"
          >
            <ArrowLeft strokeWidth={4} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-sky-400 to-blue-500 px-3 py-1 rounded-full shadow-[0_3px_0_#0284C7] text-white border-2 border-white">
            <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm font-black uppercase tracking-wider hidden sm:block drop-shadow-md">
              Vocales
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
        <div className="flex-grow flex flex-col w-full px-2 sm:px-4 md:px-8 pt-4 pb-12 overflow-y-auto custom-scrollbar relative z-10">

          <div className="text-center shrink-0 mb-4 sm:mb-8 w-full flex flex-col items-center">
            <motion.h2
              animate={{ scale: [1, 1.05, 1], rotate: [-2, 2, -2] }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="text-6xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.1)] uppercase tracking-tight flex items-center justify-center gap-2"
            >
              <Sparkles className="text-yellow-400 w-10 h-10 md:w-14 md:h-14 hidden sm:block animate-pulse" />
              ¡Vocales!
              <Sparkles className="text-yellow-400 w-10 h-10 md:w-14 md:h-14 hidden sm:block animate-pulse" />
            </motion.h2>

            <div className="flex items-center justify-center p-1.5 mt-2 bg-white/70  rounded-full shadow-md border-4 border-white max-w-[300px] mx-auto">
              <button
                onClick={() => setReadMode('letter')}
                className={`flex-1 py-2 rounded-full text-sm font-black transition-all duration-300 flex items-center justify-center gap-1
                  ${readMode === 'letter' ? 'bg-sky-500 text-white shadow-[0_4px_0_#0284C7]' : 'text-slate-400 hover:text-sky-500'}`}
              >
                🅰️ Letra
              </button>
              <button
                onClick={() => setReadMode('full')}
                className={`flex-1 py-2 rounded-full text-sm font-black transition-all duration-300 flex items-center justify-center gap-1
                  ${readMode === 'full' ? 'bg-sky-500 text-white shadow-[0_4px_0_#0284C7]' : 'text-slate-400 hover:text-sky-500'}`}
              >
                🐻 Todo
              </button>
            </div>
          </div>

          <div className="card-grid-auto gap-5 sm:gap-6 md:gap-8 w-full max-w-[1200px] mx-auto pb-6">
            {vowels.map((v, index) => (
              <motion.button
                key={v.letter}
                initial={{ scale: 0, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9, y: 10 }}
                onPointerDown={(e) => handleVowelClick(e, v)}
                className={`
                  group relative aspect-square
                  rounded-[2.5rem] sm:rounded-[3rem]
                  flex flex-col items-center justify-center p-3 sm:p-5
                  border-[6px] border-[#FFF8E9] text-white overflow-visible
                  transition-shadow duration-150
                  ${v.color} ${v.shadow} ${v.activeShadow}
                `}
              >
                <div className="flex-1 w-full flex items-center justify-center relative z-10 pt-2">
                  <motion.span
                    animate={{
                      scale: activeVowel === v.letter ? [1, 1.4, 1] : [1, 1.05, 1],
                      rotate: activeVowel === v.letter ? [0, -10, 10, 0] : [0, 2, -2, 0]
                    }}
                    transition={{
                      duration: activeVowel === v.letter ? 0.5 : 3 + index,
                      repeat: activeVowel === v.letter ? 0 : Infinity
                    }}
                    className="text-[6rem] sm:text-[8rem] lg:text-[9rem] font-black leading-none text-white transition-transform drop-shadow-[0_8px_10px_rgba(0,0,0,0.3)]"
                    style={{ WebkitTextStroke: '3px rgba(255,255,255,0.8)' }}
                  >
                    {v.letter}
                  </motion.span>
                </div>

                <div className="flex flex-col items-center gap-1 sm:gap-2 relative z-10 pb-1">
                  <motion.span
                    animate={activeVowel === v.letter ? { scale: [1, 1.5, 1], y: [0, -20, 0] } : {}}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="text-6xl sm:text-7xl lg:text-[6rem] leading-none drop-shadow-xl"
                  >
                    {v.icon}
                  </motion.span>
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
              className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black uppercase tracking-widest text-sm md:text-base px-6 py-3 rounded-full border-4 border-white shadow-[0_8px_0_#0369A1] active:shadow-[0_0px_0_#0369A1] transition-all"
            >
              <Target className="w-5 h-5" /> A jugar
            </motion.button>
          </div>
        </div>
      ) : (
        /* ═══════════════════════ FASE PRACTICA (encuentra la vocal) ═══════════════════════ */
        <div className="flex-grow flex flex-col items-center justify-start gap-4 sm:gap-8 w-full px-4 pt-6 pb-12 overflow-y-auto custom-scrollbar relative z-10">

          <button
            onClick={() => setMode('aprende')}
            className="shrink-0 text-[10px] md:text-xs font-black uppercase tracking-widest text-sky-500 bg-white/70 px-4 py-1.5 rounded-full border-2 border-sky-100 shadow-sm"
          >
            ← Volver a explorar
          </button>

          {quiz && (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={quiz.target.word}
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-2 shrink-0"
                >
                  <span className="text-7xl sm:text-9xl drop-shadow-lg">{quiz.target.icon}</span>
                  <p className="text-2xl sm:text-4xl font-black text-slate-700 text-center drop-shadow-sm">
                    ¿Con qué vocal empieza <span className="text-sky-600">{quiz.target.word}</span>?
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-2xl px-2 shrink-0">
                {quiz.options.map((option, i) => {
                  const isCorrect = option.letter === quiz.target.letter;
                  let anim = {};
                  if (status === 'wrong' && !isCorrect) anim = { scale: 0.85, opacity: 0.5 };
                  if (status === 'correct' && isCorrect) anim = { scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] };

                  return (
                    <motion.button
                      key={option.letter}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, ...anim }}
                      transition={{ delay: i * 0.08, type: 'spring' }}
                      whileHover={!locked ? { scale: 1.05 } : {}}
                      whileTap={!locked ? { scale: 0.95, y: 8 } : {}}
                      onPointerDown={() => handleQuizChoice(option)}
                      disabled={locked}
                      className={`
                        w-20 h-20 sm:w-28 sm:h-28 rounded-[1.75rem] sm:rounded-[2.25rem]
                        border-[6px] border-[#FFF8E9] transition-all duration-200
                        flex items-center justify-center relative overflow-hidden text-white
                        ${option.color} ${!locked && option.activeShadow} ${option.shadow}
                        ${status === 'correct' && isCorrect ? 'ring-8 ring-green-400 ring-offset-4 ring-offset-[#F5EDDB]' : ''}
                        touch-manipulation
                      `}
                    >
                      <span className="text-3xl sm:text-5xl font-black drop-shadow-md relative z-10" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.6)' }}>
                        {option.letter}
                      </span>
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
                {status === 'correct' ? '¡ESA ES!' : '¡ESCUCHA DE NUEVO!'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* SISTEMA DE PARTÍCULAS (solo en modo Aprende) */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {bursts.map(burst => (
            <motion.div
              key={burst.id}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none flex items-center justify-center"
              style={{ left: burst.x, top: burst.y, transform: 'translate(-50%, -50%)' }}
            >
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const distance = 60 + Math.random() * 60;
                return (
                  <motion.div
                    key={`star-${i}`}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance + 20,
                      scale: [0, 1.5, 0],
                      opacity: [1, 1, 0],
                      rotate: Math.random() * 360
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute"
                  >
                    <Star className={`w-6 h-6 sm:w-10 sm:h-10 fill-white text-yellow-300 drop-shadow-md`} />
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ scale: 0.2, opacity: 0.8, borderWidth: '15px' }}
                animate={{ scale: 3, opacity: 0, borderWidth: '2px' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`absolute rounded-full border-white w-24 h-24 ${burst.color} mix-blend-overlay`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
