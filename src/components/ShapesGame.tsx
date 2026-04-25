import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { speak } from '../lib/speech';
import { Circle, Square, Triangle, Star, Heart, ArrowLeft, Sparkles, Shapes } from 'lucide-react';

const shapes = [
  { name: 'Círculo', Icon: Circle, bg: 'bg-red-500', shadow: 'shadow-[0_8px_0_#B91C1C]', activeShadow: 'active:shadow-[0_0px_0_#B91C1C]' },
  { name: 'Cuadrado', Icon: Square, bg: 'bg-blue-500', shadow: 'shadow-[0_8px_0_#1D4ED8]', activeShadow: 'active:shadow-[0_0px_0_#1D4ED8]' },
  { name: 'Triángulo', Icon: Triangle, bg: 'bg-yellow-400', shadow: 'shadow-[0_8px_0_#CA8A04]', activeShadow: 'active:shadow-[0_0px_0_#CA8A04]' },
  { name: 'Estrella', Icon: Star, bg: 'bg-purple-500', shadow: 'shadow-[0_8px_0_#7E22CE]', activeShadow: 'active:shadow-[0_0px_0_#7E22CE]' },
  { name: 'Corazón', Icon: Heart, bg: 'bg-pink-500', shadow: 'shadow-[0_8px_0_#BE185D]', activeShadow: 'active:shadow-[0_0px_0_#BE185D]' },
];

export default function ShapesGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const hasSpoken = useRef(false);
  const [activeShape, setActiveShape] = useState<string | null>(null);

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
    // Reinicia el estado activo para permitir que la animación se repita
    setTimeout(() => setActiveShape(null), 500);
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden bg-gradient-to-b from-indigo-50 via-purple-50 to-fuchsia-50 font-sans select-none">

      {/* HEADER COMPACTO Y ESTANDARIZADO */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-1.5 bg-white/80  shadow-sm rounded-b-2xl border-b-2 border-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:scale-90 transition-all border-2 border-white shadow-sm"
          >
            <ArrowLeft strokeWidth={3} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-pink-100 px-3 py-1 rounded-full border-2 border-white shadow-sm">
            <Shapes className="w-3.5 h-3.5 md:w-4 md:h-4 text-pink-600" />
            <span className="text-xs md:text-sm font-black text-pink-600 uppercase tracking-widest hidden sm:block">
              Figuras
            </span>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-grow flex flex-col w-full px-4 md:px-8 pt-4 pb-8 overflow-y-auto custom-scrollbar relative z-10">

        {/* Título Mágico */}
        <div className="text-center shrink-0 mb-6 md:mb-10 w-full mt-2">
          <motion.h2 
            animate={{ scale: [1, 1.05, 1] }}
            className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 drop-shadow-sm uppercase tracking-tight flex items-center justify-center gap-2"
          >
            FIGURAS
          </motion.h2>
          <div className="mt-2 inline-flex items-center px-6 py-1 bg-white/50  rounded-full border border-purple-100 text-purple-600 font-black uppercase text-sm md:text-lg">
            ¡Toca una figura! 🚀
          </div>
        </div>

        {/* Cuadrícula de Figuras (Bloques Gominola) */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8 w-full max-w-[1400px] mx-auto pb-10 px-2">
          {shapes.map((shape, index) => (
            <motion.button
              key={shape.name}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 15 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95, y: 10 }}
              onPointerDown={() => handleShapeClick(shape.name)}
              className={`
                group relative rounded-[2.5rem] md:rounded-[3.5rem] 
                flex flex-col items-center justify-center aspect-square transition-all duration-150 
                border-4 sm:border-[6px] border-white/90
                ${shape.bg} ${shape.shadow} ${shape.activeShadow}
                touch-manipulation overflow-hidden
              `}
            >
              {/* Brillo estilo Gominola */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              
              {/* Reflejo de luz curvo */}
              <div className="absolute top-[5%] left-[10%] w-[50%] h-[20%] bg-white/40 rounded-full blur-[1px] rotate-[-15deg] pointer-events-none" />

              {/* Contenedor del Icono */}
              <motion.div
                animate={activeShape === shape.name ? { scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
                className="mb-4 sm:mb-6 mt-[-10%] relative z-10"
              >
                <shape.Icon className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] fill-white transition-transform group-hover:scale-110" />
              </motion.div>

              {/* Etiqueta del Nombre Estilo Sticker */}
              <div className="absolute bottom-4 md:bottom-8 w-[80%] bg-black/15  rounded-full py-1.5 border border-white/10 z-10">
                <span className="text-base sm:text-lg md:text-2xl font-black uppercase tracking-widest text-white drop-shadow-md">
                  {shape.name}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}