import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import TutorOwl from './TutorOwl';

const rounds = [
  {
    sound: '🐶',    soundName: 'Guau guau',  question: '¿Qué animal hace ese sonido?',
    correct: { icon: '🐶', name: 'Perro' },
    wrong: [{ icon: '🐱', name: 'Gato' }, { icon: '🦆', name: 'Pato' }],
    audioId: 'perro.mp3',
    bg: 'bg-orange-400',
  },
  {
    sound: '🐱',    soundName: 'Miau miau',  question: '¿Qué animal hace ese sonido?',
    correct: { icon: '🐱', name: 'Gato' },
    wrong: [{ icon: '🐶', name: 'Perro' }, { icon: '🐮', name: 'Vaca' }],
    audioId: 'gato.mp3',
    bg: 'bg-blue-400',
  },
  {
    sound: '🐮',    soundName: 'Muuuu',      question: '¿Qué animal hace ese sonido?',
    correct: { icon: '🐮', name: 'Vaca' },
    wrong: [{ icon: '🐑', name: 'Oveja' }, { icon: '🐶', name: 'Perro' }],
    audioId: 'u_jd81cxyq22-cow-mooing-343423.mp3',
    bg: 'bg-emerald-400',
  },
  {
    sound: '🐑',    soundName: 'Beeee',      question: '¿Qué animal hace ese sonido?',
    correct: { icon: '🐑', name: 'Oveja' },
    wrong: [{ icon: '🐮', name: 'Vaca' }, { icon: '🦆', name: 'Pato' }],
    audioId: 'stu9-sheep-352668.mp3',
    bg: 'bg-slate-400',
  },
  {
    sound: '🦆',    soundName: 'Cuac cuac',  question: '¿Qué animal hace ese sonido?',
    correct: { icon: '🦆', name: 'Pato' },
    wrong: [{ icon: '🐔', name: 'Gallina' }, { icon: '🐱', name: 'Gato' }],
    audioId: 'pato.mp3',
    bg: 'bg-cyan-400',
  },
  {
    sound: '🦁',    soundName: 'Grrrrr',     question: '¿Qué animal hace ese sonido?',
    correct: { icon: '🦁', name: 'León' },
    wrong: [{ icon: '🐻', name: 'Oso' }, { icon: '🐯', name: 'Tigre' }],
    audioId: 'leo.mp3',
    bg: 'bg-red-400',
  },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function SoundGuessGame({ onBack, isFirstTime, onVisit }: { onBack: () => void; isFirstTime: boolean; onVisit: () => void }) {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'listening' | 'correct' | 'wrong'>('idle');
  const [options, setOptions] = useState<Array<{ icon: string; name: string }>>([]);
  const [stars, setStars] = useState(0);
  const hasSpoken = useRef(false);
  const round = rounds[index % rounds.length];
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const playAnimalSound = () => {
    if (status === 'listening') return;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    const audio = new Audio(`/sonidos/${round.audioId}`);
    currentAudioRef.current = audio;
    audio.play().catch(console.error);
    setStatus('listening');
    audio.onended = () => setStatus('idle');
  };

  const loadRound = (i: number, first = false) => {
    const r = rounds[i % rounds.length];
    const opts = shuffle([r.correct, ...r.wrong]);
    setOptions(opts);
    setStatus('idle');
    setTimeout(() => {
      speak(`¿Qué animal hace este sonido? ¡Escucha bien!`, true);
      setTimeout(() => {
        const audio = new Audio(`/sonidos/${r.audioId}`);
        currentAudioRef.current = audio;
        audio.play().catch(console.error);
        setStatus('listening');
        audio.onended = () => setStatus('idle');
      }, 1500);
    }, first ? 200 : 400);
  };

  useEffect(() => {
    if (!hasSpoken.current) {
      hasSpoken.current = true;
      if (isFirstTime) {
        speak('¡Hola! Vamos a adivinar qué animal hace ese sonido. ¡Escucha!');
        onVisit();
        setTimeout(() => loadRound(0, true), 3000);
      } else {
        loadRound(0, true);
      }
    }
    return () => { currentAudioRef.current?.pause(); };
  }, []);

  const handleAnswer = (choice: { icon: string; name: string }) => {
    if (status === 'correct' || status === 'wrong') return;
    if (choice.name === round.correct.name) {
      setStatus('correct');
      setStars(s => s + 1);
      speak(`¡Correcto! Es el ${round.correct.name}. ¡Muy bien!`);
      setTimeout(() => {
        const next = index + 1;
        setIndex(next);
        loadRound(next);
      }, 2200);
    } else {
      setStatus('wrong');
      speak(`No exactamente. Era el ${round.correct.name}.`);
      setTimeout(() => setStatus('idle'), 1800);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 font-sans select-none">
      
      {/* HEADER COMPACTO Y ESTANDARIZADO */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-1.5 bg-white/80  shadow-sm rounded-b-2xl border-b-2 border-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:scale-90 transition-all border-2 border-white shadow-sm"
          >
            <ArrowLeft strokeWidth={3} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-emerald-100 px-3 py-1 rounded-full border-2 border-white shadow-sm">
            <TutorOwl message="¡Escucha!" size="xs" />
            <span className="text-xs md:text-sm font-black text-emerald-600 uppercase tracking-widest hidden sm:block">
              ¿Quién soy?
            </span>
          </div>
        </div>

        <motion.div
          key={stars}
          initial={{ scale: 1.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="flex items-center gap-1.5 font-black text-amber-500 text-xs md:text-sm bg-amber-50 px-3 py-1 rounded-full border-2 border-amber-200 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>⭐ {stars}</span>
        </motion.div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-grow flex flex-col items-center justify-start gap-4 md:gap-8 w-full px-4 pt-4 pb-12 overflow-y-auto custom-scrollbar relative z-10">

        {/* Título de la pregunta */}
        <div className="text-center shrink-0 mt-2">
          <motion.h2 
            animate={{ scale: [1, 1.05, 1] }}
            className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 drop-shadow-sm uppercase"
          >
            ¿QUIÉN SOY?
          </motion.h2>
          <p className="text-xs md:text-sm text-teal-600 font-black uppercase tracking-widest mt-1 bg-white/50 px-4 py-0.5 rounded-full border border-teal-100 inline-block">
            ¡Toca el botón y escucha!
          </p>
        </div>

        {/* Big Sound Button (Estilo Gominola Gigante) */}
        <div className="flex justify-center shrink-0">
          <motion.button
            onPointerDown={playAnimalSound}
            animate={status === 'listening'
              ? { scale: [1.1, 1.25, 1.1], rotate: [-4, 4, -4, 4, 0] }
              : { y: [0, -10, 0] }
            }
            transition={status === 'listening'
              ? { duration: 0.4 }
              : { duration: 3, ease: "easeInOut" }
            }
            whileTap={{ scale: 0.9, y: 15 }}
            className={`
              w-44 h-44 sm:w-64 sm:h-64 rounded-[3.5rem] 
              shadow-[0_20px_0_rgba(0,0,0,0.1),inset_0_-10px_20px_rgba(0,0,0,0.15)] 
              flex flex-col items-center justify-center gap-2 border-[8px] sm:border-[12px] border-white/95 
              relative overflow-hidden transition-colors duration-300
              ${round.bg}
            `}
          >
            {/* Brillo estilo Gominola */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
            <div className="absolute top-[8%] left-[12%] w-[40%] h-[20%] bg-white/50 rounded-full blur-[2px] rotate-[-25deg] pointer-events-none" />

            <motion.span
              animate={{ scale: status === 'listening' ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.5, repeat: status === 'listening' ? Infinity : 0 }}
              className="text-8xl sm:text-[9rem] leading-none relative z-10 drop-shadow-[0_8px_8px_rgba(0,0,0,0.2)]"
            >
              🔊
            </motion.span>
            
            <span className="text-white font-black text-sm sm:text-xl relative z-10 drop-shadow-md uppercase tracking-widest">
              {status === 'listening' ? '¡OYE!' : 'TOCAR'}
            </span>

            {/* Sound wave rings */}
            <AnimatePresence>
              {status === 'listening' && [0, 1].map(i => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, delay: i * 0.4 }}
                  className="absolute inset-0 border-8 border-white/40 rounded-[3.5rem]"
                />
              ))}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Animal Options (Botones 3D Gominola) */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-[900px] px-2">
          {options.map((opt, i) => {
            const isCorrect = opt.name === round.correct.name;
            let style = 'bg-white border-white shadow-[0_10px_0_#E2E8F0]';
            
            if (status === 'correct' && isCorrect) style = 'bg-green-400 border-white shadow-[0_10px_0_#15803D] ring-8 ring-green-100';
            if (status === 'wrong') {
              style = isCorrect ? 'bg-green-300 border-white shadow-[0_10px_0_#15803D] opacity-100 animate-pulse' : 'bg-red-50 border-white shadow-[0_6px_0_#FDA4AF] opacity-50 scale-90';
            }

            return (
              <motion.button
                key={opt.name}
                initial={{ scale: 0, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: "spring" }}
                whileHover={status === 'idle' ? { scale: 1.05 } : {}}
                whileTap={status === 'idle' ? { scale: 0.9, y: 15 } : {}}
                onPointerDown={() => handleAnswer(opt)}
                disabled={status !== 'idle' && status !== 'listening'}
                className={`
                  ${style} relative rounded-[2.5rem] p-4 sm:p-6 flex flex-col items-center justify-center 
                  border-[6px] transition-all duration-300 overflow-hidden aspect-square sm:aspect-auto
                `}
              >
                {/* Brillo estilo Gominola para las opciones */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                
                <span className="text-5xl sm:text-7xl leading-none drop-shadow-md z-10">{opt.icon}</span>
                <span className="text-xs sm:text-lg font-black uppercase tracking-wider mt-1 sm:mt-2 text-inherit z-10 drop-shadow-sm truncate w-full text-center">
                  {opt.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Feedback floating banner */}
        <AnimatePresence>
          {(status === 'correct' || status === 'wrong') && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', bounce: 0.6 }}
              className={`
                fixed bottom-8 px-10 py-4 rounded-full font-black text-white text-xl md:text-2xl shadow-2xl z-50 border-4 border-white
                ${status === 'correct' 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-600 shadow-[0_12px_0_#15803D]' 
                  : 'bg-gradient-to-r from-red-400 to-rose-600 shadow-[0_12px_0_#991B1B]'}
              `}
            >
              {status === 'correct' ? '🌟 ¡CORRECTO!' : `ES EL ${round.correct.name.toUpperCase()} ${round.sound}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
