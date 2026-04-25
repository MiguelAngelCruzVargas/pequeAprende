import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft, Sparkles, Palette } from 'lucide-react';

const colors = [
  { name: 'Rojo', hex: '#EF4444', text: 'text-white', shadow: 'shadow-[0_8px_0_#B91C1C]', activeShadow: 'active:shadow-[0_0px_0_#B91C1C]', emo: '🍎' },
  { name: 'Azul', hex: '#3B82F6', text: 'text-white', shadow: 'shadow-[0_8px_0_#1D4ED8]', activeShadow: 'active:shadow-[0_0px_0_#1D4ED8]', emo: '🌊' },
  { name: 'Verde', hex: '#22C55E', text: 'text-white', shadow: 'shadow-[0_8px_0_#15803D]', activeShadow: 'active:shadow-[0_0px_0_#15803D]', emo: '🌳' },
  { name: 'Amarillo', hex: '#FACC15', text: 'text-yellow-900', shadow: 'shadow-[0_8px_0_#CA8A04]', activeShadow: 'active:shadow-[0_0px_0_#CA8A04]', emo: '☀️' },
  { name: 'Naranja', hex: '#F97316', text: 'text-white', shadow: 'shadow-[0_8px_0_#C2410C]', activeShadow: 'active:shadow-[0_0px_0_#C2410C]', emo: '🍊' },
  { name: 'Rosa', hex: '#EC4899', text: 'text-white', shadow: 'shadow-[0_8px_0_#BE185D]', activeShadow: 'active:shadow-[0_0px_0_#BE185D]', emo: '🐷' },
  { name: 'Morado', hex: '#A855F7', text: 'text-white', shadow: 'shadow-[0_8px_0_#7E22CE]', activeShadow: 'active:shadow-[0_0px_0_#7E22CE]', emo: '🍇' },
  { name: 'Blanco', hex: '#FFFFFF', text: 'text-slate-800', shadow: 'shadow-[0_8px_0_#CBD5E1]', activeShadow: 'active:shadow-[0_0px_0_#CBD5E1]', emo: '☁️', extraClasses: 'border-4 border-slate-200' },
];

export default function ColorsGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const hasSpoken = useRef(false);
  const [activeColor, setActiveColor] = useState<string | null>(null);

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
    // Quitamos el estado activo después de un momento para que pueda volver a rebotar
    setTimeout(() => setActiveColor(null), 500);
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 font-sans select-none">

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
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-grow flex flex-col items-center w-full px-4 md:px-8 pt-4 pb-12 overflow-y-auto custom-scrollbar relative z-10">

        {/* Título Mágico */}
        <div className="text-center shrink-0 mb-6 md:mb-10 w-full mt-2">
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

        {/* Cuadrícula de Colores (Bloques Gominola) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 w-full max-w-6xl mx-auto pb-10">
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
                group relative rounded-[2.5rem] md:rounded-[3.5rem] 
                flex flex-col items-center justify-center aspect-square transition-all duration-150 
                border-4 sm:border-[6px] border-white/90
                ${color.shadow} ${color.activeShadow}
                ${color.text} ${color.extraClasses || ''}
                touch-manipulation overflow-hidden
              `}
            >
              {/* Brillo estilo Gominola (Inner Glow superior) */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              
              {/* Reflejo de luz curvo (blanco) */}
              <div className="absolute top-[5%] left-[10%] w-[60%] h-[20%] bg-white/40 rounded-full blur-[2px] rotate-[-15deg] pointer-events-none" />

              {/* Contenedor del Emoji */}
              <motion.div
                animate={activeColor === color.name ? { scale: [1, 1.4, 1], rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="text-6xl sm:text-[7rem] md:text-[8rem] drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform duration-300 relative z-10"
              >
                {color.emo}
              </motion.div>

              {/* Etiqueta del Nombre al estilo Sticker */}
              <div className="absolute bottom-4 md:bottom-8 w-[80%] bg-black/20  rounded-full py-1.5 border border-white/10 z-10">
                <span className="text-base md:text-2xl font-black uppercase tracking-widest drop-shadow-md">
                  {color.name}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}