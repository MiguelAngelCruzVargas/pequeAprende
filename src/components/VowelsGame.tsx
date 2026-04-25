import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft, Sparkles, BookOpen, Star } from 'lucide-react';

const vowels = [
  { letter: 'A', word: 'Avión', icon: '✈️', color: 'bg-red-500', shadow: 'shadow-[0_10px_0_#B91C1C]', activeShadow: 'active:shadow-[0_0px_0_#B91C1C]', light: 'from-red-300' },
  { letter: 'E', word: 'Elefante', icon: '🐘', color: 'bg-blue-500', shadow: 'shadow-[0_10px_0_#1D4ED8]', activeShadow: 'active:shadow-[0_0px_0_#1D4ED8]', light: 'from-blue-300' },
  { letter: 'I', word: 'Iguana', icon: '🦎', color: 'bg-emerald-500', shadow: 'shadow-[0_10px_0_#047857]', activeShadow: 'active:shadow-[0_0px_0_#047857]', light: 'from-emerald-300' },
  { letter: 'O', word: 'Oso', icon: '🐻', color: 'bg-orange-500', shadow: 'shadow-[0_10px_0_#C2410C]', activeShadow: 'active:shadow-[0_0px_0_#C2410C]', light: 'from-orange-300' },
  { letter: 'U', word: 'Uvas', icon: '🍇', color: 'bg-fuchsia-500', shadow: 'shadow-[0_10px_0_#701A75]', activeShadow: 'active:shadow-[0_0px_0_#701A75]', light: 'from-fuchsia-300' },
];

export default function VowelsGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const hasSpoken = useRef(false);
  const [readMode, setReadMode] = useState<'letter' | 'full'>('full');
  const [activeVowel, setActiveVowel] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const burstId = useRef(0);

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

  const handleVowelClick = (e: React.PointerEvent, v: typeof vowels[0]) => {
    setActiveVowel(v.letter);

    // Coordenadas para la explosión de magia
    const clientX = e.clientX;
    const clientY = e.clientY;

    // Crear partículas
    const newBurst = { id: burstId.current++, x: clientX, y: clientY, color: v.color };
    setBursts(prev => [...prev, newBurst]);
    setTimeout(() => {
      setBursts(prev => prev.filter(b => b.id !== newBurst.id));
    }, 1000);

    // Hablar
    if (readMode === 'letter') {
      speak(v.letter.toLowerCase());
    } else {
      speak(`${v.letter.toLowerCase()} de ${v.word}`);
    }

    setTimeout(() => setActiveVowel(null), 800);
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full relative overflow-hidden bg-sky-50 font-sans select-none">

      {/* Fondo hiper-animado y alegre */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_100%)]">
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.2, 0.9, 1] }}
          transition={{ duration: 12, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-64 md:w-96 h-64 md:h-96 bg-pink-300/50 rounded-full blur-[60px]"
        />
        <motion.div
          animate={{ x: [0, -50, 30, 0], y: [0, 50, -40, 0], scale: [1, 1.3, 0.8, 1] }}
          transition={{ duration: 15, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-72 md:w-[30rem] h-72 md:h-[30rem] bg-yellow-300/40 rounded-full blur-[60px]"
        />
        <motion.div
          animate={{ x: [0, 30, -30, 0], y: [0, 30, -30, 0] }}
          transition={{ duration: 10, ease: "easeInOut" }}
          className="absolute top-[40%] left-[30%] w-48 md:w-80 h-48 md:h-80 bg-cyan-300/40 rounded-full blur-[50px]"
        />
      </div>

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
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-grow flex flex-col w-full px-2 sm:px-4 md:px-8 pt-4 pb-12 overflow-y-auto custom-scrollbar relative z-10">

        {/* Título Mágico */}
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

          {/* Toggle Switch para Papás (Más sutil y amigable) */}
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

        {/* Bloques de Vocales Gigantes (Estilo Gelatina) */}
        <div className="flex flex-wrap justify-center content-start gap-4 sm:gap-6 md:gap-8 w-full max-w-[1200px] mx-auto pb-10">
          {vowels.map((v, index) => (
            <motion.button
              key={v.letter}
              initial={{ scale: 0, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 15 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9, y: 10 }} // Súper hundimiento al tocar
              onPointerDown={(e) => handleVowelClick(e, v)}
              className={`
                group relative w-[45%] sm:w-[30%] lg:w-[18%] max-w-[260px] aspect-square sm:aspect-[4/5] 
                rounded-[2.5rem] sm:rounded-[3.5rem] 
                flex flex-col items-center justify-center p-3 sm:p-5 
                border-[4px] sm:border-[6px] border-white/80 text-white overflow-visible
                transition-shadow duration-150
                ${v.color} ${v.shadow} ${v.activeShadow}
              `}
            >
              {/* Brillo 3D estilo Gominola (Glow superior) */}
              <div className={`absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b ${v.light} to-transparent opacity-80 rounded-t-[2rem] pointer-events-none`} />

              {/* Reflejo de luz curvo (blanco) */}
              <div className="absolute top-[5%] left-[10%] w-[60%] h-[20%] bg-white/50 rounded-full blur-[2px] rotate-[-15deg] pointer-events-none" />

              {/* Letra Gigante con efecto pegatina */}
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
                  style={{ WebkitTextStroke: '3px rgba(255,255,255,0.8)' }} // Borde de pegatina
                >
                  {v.letter}
                </motion.span>
              </div>

              {/* Icono animado */}
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
      </div>

      {/* SISTEMA DE PARTÍCULAS (Explosiones mágicas) */}
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
              {/* Estrellitas volando */}
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

              {/* Anillo expansivo de color */}
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