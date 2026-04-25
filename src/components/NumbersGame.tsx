import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { Star, ArrowLeft, Sparkles, Hash } from 'lucide-react';

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

export default function NumbersGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [activeNumber, setActiveNumber] = useState<number | null>(null);
  const hasSpoken = useRef(false);

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
    setTimeout(() => setActiveNumber(null), 300); // Pequeña animación del texto
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
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-grow flex flex-col w-full px-2 sm:px-4 md:px-8 pt-4 pb-8 overflow-y-auto custom-scrollbar relative z-10">

        {/* Título Mágico */}
        <div className="text-center shrink-0 mb-4 md:mb-8 mt-2 w-full">
          <motion.h2 
            animate={{ scale: [1, 1.05, 1] }}
            className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 drop-shadow-sm uppercase tracking-tight flex items-center justify-center gap-2"
          >
            NÚMEROS
          </motion.h2>
          <div className="mt-2 inline-flex items-center px-6 py-1 bg-white/50  rounded-full border border-blue-100 text-blue-600 font-black uppercase text-sm md:text-lg">
            ¡Toca para contar! 🔢
          </div>
        </div>

        <div className="w-full flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto">

          {/* Grid de Números (10 botones estilo Gominola) */}
          <div className="grid grid-cols-5 gap-2 sm:gap-4 p-2">
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
                  {/* Brillo estilo Gominola */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                  
                  {/* Reflejo de luz curvo */}
                  <div className="absolute top-[5%] left-[10%] w-[50%] h-[20%] bg-white/40 rounded-full blur-[1px] rotate-[-15deg] pointer-events-none" />

                  <motion.span
                    animate={activeNumber === num ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    className="text-2xl sm:text-5xl md:text-6xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)] relative z-10"
                  >
                    {num}
                  </motion.span>
                </motion.button>
              );
            })}
          </div>

          {/* Área de Visualización de Estrellas (Bandeja Mágica) */}
          <div className="w-full mt-2">
            <div className="bg-white/60  rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 flex flex-wrap content-center items-center justify-center gap-3 sm:gap-6 border-4 border-white shadow-md min-h-[220px] sm:min-h-[350px] relative overflow-hidden">

              <AnimatePresence mode="popLayout">
                {selected ? (
                  Array.from({ length: selected }).map((_, i) => (
                    <motion.div
                      key={`${selected}-${i}`}
                      initial={{ scale: 0, rotate: -45, y: 30 }}
                      animate={{ scale: 1, rotate: 0, y: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 200, delay: i * 0.08 }}
                      className="relative z-10"
                    >
                      <Star className="w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-yellow-400 fill-yellow-400 drop-shadow-[0_5px_10px_rgba(0,0,0,0.15)]" />
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-4 relative z-10 opacity-70">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      className="text-5xl sm:text-7xl"
                    >
                      👆
                    </motion.div>
                    <p className="text-base sm:text-2xl text-blue-500 font-black tracking-wide">
                      Selecciona un número
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}