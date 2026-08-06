import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft, Hand, Sparkles, Target, CheckCircle2, XCircle } from 'lucide-react';

// Partes del cuerpo — vocabulario clásico de 2-4 años. Lo que lo hace más
// que una tarjeta: cada una pide al niño tocarse la parte real ("Tócate
// tu nariz"), aprendizaje corporal/kinestésico, no solo mirar y escuchar.
const bodyParts = [
  { name: 'Nariz', emoji: '👃', touch: 'Tócate tu nariz', bg: 'bg-pink-500', shadow: 'shadow-[0_10px_0_#9d174d]', activeShadow: 'active:shadow-[0_0px_0_#9d174d]' },
  { name: 'Ojos', emoji: '👀', touch: 'Tócate tus ojitos', bg: 'bg-blue-500', shadow: 'shadow-[0_10px_0_#1e3a8a]', activeShadow: 'active:shadow-[0_0px_0_#1e3a8a]' },
  { name: 'Orejas', emoji: '👂', touch: 'Tócate tus orejitas', bg: 'bg-orange-500', shadow: 'shadow-[0_10px_0_#9a3412]', activeShadow: 'active:shadow-[0_0px_0_#9a3412]' },
  { name: 'Boca', emoji: '👄', touch: 'Tócate tu boquita', bg: 'bg-red-500', shadow: 'shadow-[0_10px_0_#7f1d1d]', activeShadow: 'active:shadow-[0_0px_0_#7f1d1d]' },
  { name: 'Manos', emoji: '✋', touch: 'Aplaude con tus manitas', bg: 'bg-emerald-500', shadow: 'shadow-[0_10px_0_#064e3b]', activeShadow: 'active:shadow-[0_0px_0_#064e3b]' },
  { name: 'Pies', emoji: '🦶', touch: 'Toca tus piecitos', bg: 'bg-purple-500', shadow: 'shadow-[0_10px_0_#581c87]', activeShadow: 'active:shadow-[0_0px_0_#581c87]' },
  { name: 'Dientes', emoji: '🦷', touch: 'Enséñame tus dientes, ¡sonríe!', bg: 'bg-cyan-500', shadow: 'shadow-[0_10px_0_#164e63]', activeShadow: 'active:shadow-[0_0px_0_#164e63]' },
];

type PartItem = typeof bodyParts[0];
type Mode = 'aprende' | 'practica';
type Status = 'idle' | 'correct' | 'wrong';

function buildRound(streak: number): { target: PartItem; options: PartItem[] } {
  const numDistractors = streak >= 4 ? 3 : streak >= 2 ? 2 : 1;
  const target = bodyParts[Math.floor(Math.random() * bodyParts.length)];
  const distractors = bodyParts
    .filter(p => p.name !== target.name)
    .sort(() => Math.random() - 0.5)
    .slice(0, numDistractors);
  const options = [...distractors, target].sort(() => Math.random() - 0.5);
  return { target, options };
}

const PRAISE = ['¡Sí, esa es!', '¡Muy bien!', '¡Conoces bien tu cuerpo!', '¡Perfecto!', '¡Excelente!'];

export default function BodyPartsGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const hasSpoken = useRef(false);
  const [activePart, setActivePart] = useState<string | null>(null);
  const flowIdRef = useRef(0);

  const [mode, setMode] = useState<Mode>('aprende');
  const [quiz, setQuiz] = useState<{ target: PartItem; options: PartItem[] } | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (hasSpoken.current) return;
    hasSpoken.current = true;

    if (isFirstTime) {
      speak('¡Hola! Vamos a conocer tu cuerpo. Toca una tarjeta.');
      onVisit();
    } else {
      speak('¡Vamos a jugar con las partes del cuerpo!');
    }
  }, [isFirstTime, onVisit]);

  const handlePartClick = (p: PartItem) => {
    setActivePart(p.name);
    const myFlowId = ++flowIdRef.current;
    const cancelled = () => flowIdRef.current !== myFlowId;

    speak(p.name);
    setTimeout(() => setActivePart(null), 800);

    setTimeout(() => {
      if (!cancelled()) speak(p.touch, false);
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
    speak(`¿Dónde están ${round.target.name === 'Boca' || round.target.name === 'Nariz' ? 'tu' : 'tus'} ${round.target.name.toLowerCase()}?`);
  };

  const nextRound = (newStreak: number) => {
    const round = buildRound(newStreak);
    setQuiz(round);
    setStatus('idle');
    setLocked(false);
    speak(`¿Dónde están ${round.target.name === 'Boca' || round.target.name === 'Nariz' ? 'tu' : 'tus'} ${round.target.name.toLowerCase()}?`, false);
  };

  const handleQuizChoice = (choice: PartItem) => {
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
      speak(`Esa no. Busca ${quiz.target.name.toLowerCase()}`);
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
          <div className="flex items-center gap-1.5 bg-rose-100 px-3 py-1 rounded-full border-2 border-white shadow-sm">
            <Hand className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-600" />
            <span className="text-xs md:text-sm font-black text-rose-600 uppercase tracking-widest hidden sm:block">
              Mi Cuerpo
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
              className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 drop-shadow-sm uppercase tracking-tight"
            >
              MI CUERPO
            </motion.h2>
            <div className="mt-2 inline-flex items-center px-6 py-1 bg-white/80 rounded-full border border-rose-100 text-rose-600 font-black uppercase text-sm md:text-lg">
              ¡Toca y tócate! 🙌
            </div>
          </div>

          <div className="card-grid-auto gap-5 md:gap-8 w-full max-w-[1200px] mx-auto pb-6">
            {bodyParts.map((p, index) => (
              <motion.button
                key={p.name}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, type: "spring", stiffness: 200, damping: 15 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95, y: 10 }}
                onPointerDown={() => handlePartClick(p)}
                className={`
                  group relative rounded-[2.5rem] md:rounded-[3rem]
                  flex flex-col items-center justify-center aspect-square transition-all duration-150
                  border-[6px] border-[#FFF8E9]
                  ${p.bg} ${p.shadow} ${p.activeShadow}
                  touch-manipulation overflow-hidden
                `}
              >
                <motion.div
                  animate={activePart === p.name ? { scale: [1, 1.3, 1], rotate: [0, -8, 8, 0] } : { scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl sm:text-[6.5rem] md:text-[7.5rem] drop-shadow-[0_10px_10px_rgba(0,0,0,0.25)] relative z-10"
                >
                  {p.emoji}
                </motion.div>

                <div className="absolute bottom-4 md:bottom-6 w-[85%] bg-black/25 rounded-full py-1.5 z-10">
                  <span className="text-sm sm:text-base md:text-xl font-black uppercase tracking-wide text-white drop-shadow-md block text-center">
                    {p.name}
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
              className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white font-black uppercase tracking-widest text-sm md:text-base px-6 py-3 rounded-full border-4 border-white shadow-[0_8px_0_#9d174d] active:shadow-[0_0px_0_#9d174d] transition-all"
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
            className="shrink-0 text-[10px] md:text-xs font-black uppercase tracking-widest text-rose-600 bg-white/70 px-4 py-1.5 rounded-full border-2 border-rose-100 shadow-sm"
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
                  Toca <span className="text-rose-600 bg-white/50 px-3 py-1 rounded-full border-2 border-white/50">{quiz.target.name.toLowerCase()}</span>
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
