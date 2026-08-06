import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft, Sparkles, PawPrint, Target, CheckCircle2, XCircle } from 'lucide-react';

const animals = [
  { name: 'Perro', icon: '🐶', audioId: 'perro.mp3', article: 'El', bg: 'bg-orange-500', shadow: 'shadow-[0_8px_0_#C2410C]', activeShadow: 'active:shadow-[0_0px_0_#C2410C]' },
  { name: 'Gato', icon: '🐱', audioId: 'gato.mp3', article: 'El', bg: 'bg-blue-500', shadow: 'shadow-[0_8px_0_#1D4ED8]', activeShadow: 'active:shadow-[0_0px_0_#1D4ED8]' },
  { name: 'Vaca', icon: '🐮', audioId: 'u_jd81cxyq22-cow-mooing-343423.mp3', article: 'La', bg: 'bg-emerald-500', shadow: 'shadow-[0_8px_0_#047857]', activeShadow: 'active:shadow-[0_0px_0_#047857]' },
  { name: 'Pollito', icon: '🐥', audioId: 'nikin-short-chick-sound-171389.mp3', article: 'El', bg: 'bg-yellow-400', shadow: 'shadow-[0_8px_0_#CA8A04]', activeShadow: 'active:shadow-[0_0px_0_#CA8A04]' },
  { name: 'León', icon: '🦁', audioId: 'leo.mp3', article: 'El', bg: 'bg-red-500', shadow: 'shadow-[0_8px_0_#B91C1C]', activeShadow: 'active:shadow-[0_0px_0_#B91C1C]' },
  { name: 'Mono', icon: '🐵', audioId: 'u_5cr518l76d-kicks-337331.mp3', article: 'El', bg: 'bg-amber-500', shadow: 'shadow-[0_8px_0_#B45309]', activeShadow: 'active:shadow-[0_0px_0_#B45309]' },
  { name: 'Oveja', icon: '🐑', audioId: 'stu9-sheep-352668.mp3', article: 'La', bg: 'bg-slate-400', shadow: 'shadow-[0_8px_0_#334155]', activeShadow: 'active:shadow-[0_0px_0_#334155]' },
  { name: 'Pato', icon: '🦆', audioId: 'pato.mp3', article: 'El', bg: 'bg-cyan-500', shadow: 'shadow-[0_8px_0_#0E7490]', activeShadow: 'active:shadow-[0_0px_0_#0E7490]' },
];

type AnimalItem = typeof animals[0];
type Mode = 'aprende' | 'practica';
type Status = 'idle' | 'correct' | 'wrong';

function buildAnimalRound(streak: number): { target: AnimalItem; options: AnimalItem[] } {
  const numDistractors = streak >= 5 ? 3 : streak >= 2 ? 2 : 1;
  const target = animals[Math.floor(Math.random() * animals.length)];
  const distractors = animals
    .filter(a => a.name !== target.name)
    .sort(() => Math.random() - 0.5)
    .slice(0, numDistractors);
  const options = [...distractors, target].sort(() => Math.random() - 0.5);
  return { target, options };
}

const PRAISE = ['¡Lo encontraste!', '¡Así se hace!', '¡Muy bien!', '¡Genial, sigue así!', '¡Eres un experto en animales!'];

export default function AnimalsGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const hasSpoken = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeAnimal, setActiveAnimal] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>('aprende');
  const [quiz, setQuiz] = useState<{ target: AnimalItem; options: AnimalItem[] } | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (hasSpoken.current) return;
    hasSpoken.current = true;

    if (isFirstTime) {
      speak('¡Hola! Vamos a descubrir cómo hablan nuestros amigos. Toca a cada animal.');
      onVisit();
    } else {
      speak('¡Vamos a jugar con los animales!');
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isFirstTime, onVisit]);

  const handleAnimalClick = (animal: AnimalItem) => {
    setActiveAnimal(animal.name);
    setTimeout(() => setActiveAnimal(null), 800);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    speak(`${animal.article} ${animal.name}`, true);

    if (animal.audioId) {
      timeoutRef.current = setTimeout(() => {
        const audio = new Audio(`/sonidos/${animal.audioId}`);
        audioRef.current = audio;
        audio.volume = 1;
        audio.play().catch(e => console.error("Audio error", e));
      }, 1200);
    }
  };

  const startPractica = () => {
    setMode('practica');
    setStars(0);
    setStreak(0);
    setStatus('idle');
    setLocked(false);
    const round = buildAnimalRound(0);
    setQuiz(round);
    speak(`¿Dónde está ${round.target.article.toLowerCase()} ${round.target.name.toLowerCase()}?`);
  };

  const nextRound = (newStreak: number) => {
    const round = buildAnimalRound(newStreak);
    setQuiz(round);
    setStatus('idle');
    setLocked(false);
    speak(`¿Dónde está ${round.target.article.toLowerCase()} ${round.target.name.toLowerCase()}?`, false);
  };

  const handleQuizChoice = (choice: AnimalItem) => {
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
      speak(`Ese no es. Busca ${quiz.target.article.toLowerCase()} ${quiz.target.name.toLowerCase()}`);
      setTimeout(() => {
        setStatus('idle');
        setLocked(false);
      }, 1600);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-50 font-sans select-none">

      {/* HEADER COMPACTO Y ESTANDARIZADO */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-1.5 bg-white shadow-sm rounded-b-2xl border-b-2 border-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:scale-90 transition-all border-2 border-white shadow-sm"
          >
            <ArrowLeft strokeWidth={3} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-orange-100 px-3 py-1 rounded-full border-2 border-white shadow-sm">
            <PawPrint className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-600" />
            <span className="text-xs md:text-sm font-black text-orange-600 uppercase tracking-widest hidden sm:block">
              Animales
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

          <div className="text-center shrink-0 mb-6 md:mb-10 w-full mt-2">
            <motion.h2
              animate={{ scale: [1, 1.05, 1] }}
              className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 drop-shadow-sm uppercase tracking-tight flex items-center justify-center gap-2"
            >
              ¡ANIMALES!
            </motion.h2>
            <div className="mt-2 inline-flex items-center px-6 py-1 bg-white/80 rounded-full border border-orange-100 text-orange-600 font-black uppercase text-sm md:text-lg">
              ¿Cómo hace el animal? 🐾
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 w-full max-w-[1200px] mx-auto pb-6">
            {animals.map((animal, index) => (
              <motion.button
                key={animal.name}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 15 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95, y: 10 }}
                onPointerDown={() => handleAnimalClick(animal)}
                className={`
                  group relative rounded-[2.5rem] md:rounded-[3.5rem]
                  flex flex-col items-center justify-center aspect-square transition-all duration-150
                  border-4 sm:border-[6px] border-white/90
                  ${animal.bg} ${animal.shadow} ${animal.activeShadow}
                  touch-manipulation overflow-hidden
                `}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                <div className="absolute top-[5%] left-[10%] w-[50%] h-[20%] bg-white/40 rounded-full blur-[1px] rotate-[-15deg] pointer-events-none" />

                <motion.div
                  animate={activeAnimal === animal.name ? { scale: [1, 1.4, 1], rotate: [0, 15, -15, 10, -10, 0] } : { scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="text-6xl sm:text-[7rem] md:text-[8rem] drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform duration-300 mb-4 sm:mb-6 relative z-10"
                >
                  {animal.icon}
                </motion.div>

                <div className="absolute bottom-4 md:bottom-8 w-[80%] bg-black/40 rounded-full py-1.5 border border-white/10 z-10">
                  <span className="text-base sm:text-lg md:text-3xl font-black uppercase tracking-widest text-white drop-shadow-md">
                    {animal.name}
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
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black uppercase tracking-widest text-sm md:text-base px-6 py-3 rounded-full border-4 border-white shadow-[0_8px_0_#9A3412] active:shadow-[0_0px_0_#9A3412] transition-all"
            >
              <Target className="w-5 h-5" /> A jugar
            </motion.button>
          </div>
        </div>
      ) : (
        /* ═══════════════════════ FASE PRACTICA (encuentra el animal) ═══════════════════════ */
        <div className="flex-grow flex flex-col items-center justify-start gap-4 sm:gap-8 w-full px-4 pt-6 pb-12 overflow-y-auto custom-scrollbar relative z-10">

          <button
            onClick={() => setMode('aprende')}
            className="shrink-0 text-[10px] md:text-xs font-black uppercase tracking-widest text-orange-500 bg-white/70 px-4 py-1.5 rounded-full border-2 border-orange-100 shadow-sm"
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
                  ¿Dónde está {quiz.target.article.toLowerCase()} <span className="text-orange-600 bg-white/50 px-3 py-1 rounded-full border-2 border-white/50">{quiz.target.name}</span>?
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
                        ${status === 'correct' && isCorrect ? 'ring-8 ring-green-400 ring-offset-4 ring-offset-orange-50' : ''}
                        touch-manipulation
                      `}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                      <div className="absolute top-[10%] left-[15%] w-1/3 h-1/4 bg-white/40 rounded-full blur-[1px] rotate-[-30deg] pointer-events-none" />
                      <span className="text-5xl sm:text-6xl drop-shadow-md relative z-10">{option.icon}</span>
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
