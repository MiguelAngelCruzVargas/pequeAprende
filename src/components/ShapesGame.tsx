import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { speak } from '../lib/speech';
import { Circle, Square, Triangle, Star, Heart, Hexagon, Pentagon, Diamond, ArrowLeft, Shapes } from 'lucide-react';

const CapsuleIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor">
    <path d="M30,25 h40 a20,20 0 0,1 0,50 h-40 a20,20 0 0,1 0,-50 z" />
  </svg>
);

const TrapezoidIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor">
    <path d="M35,30 h30 a5,5 0 0,1 4.5,3 l12,35 a5,5 0 0,1 -4.5,7 h-54 a5,5 0 0,1 -4.5,-7 l12,-35 a5,5 0 0,1 4.5,-3 z" />
  </svg>
);

const CrossIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor">
    <path d="M35,20 h30 v15 h15 v30 h-15 v15 h-30 v-15 h-15 v-30 h15 z" />
  </svg>
);

const ArchIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor">
    <path d="M20,75 v-25 a30,30 0 0,1 60,0 v25 a5,5 0 0,1 -5,5 h-50 a5,5 0 0,1 -5,-5 z" />
  </svg>
);

const TriangleIsoIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor">
    <path d="M50,20 a5,5 0 0,1 4.5,2.5 l30,52 a5,5 0 0,1 -4.5,7.5 h-60 a5,5 0 0,1 -4.5,-7.5 l30,-52 a5,5 0 0,1 4.5,-2.5 z" />
  </svg>
);

const DiamondIconCustom = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor">
    <path d="M50,20 L85,50 L50,80 L15,50 z" />
  </svg>
);

const BowtieIconCustom = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor">
    <path d="M15,45 a3,3 0 0,1 3,-3 h20 v-10 a3,3 0 0,1 3,-3 h18 a3,3 0 0,1 3,3 v10 h20 a3,3 0 0,1 3,3 v15 a3,3 0 0,1 -3,3 h-20 v10 a3,3 0 0,1 -3,3 h-18 a3,3 0 0,1 -3,-3 v-10 h-20 a3,3 0 0,1 -3,-3 z" />
  </svg>
);

const MoonIconCustom = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor">
    <path d="M40,25 a25,25 0 1,0 0,50 L40,55 a6,6 0 0,1 0,-10 L40,25 z" />
  </svg>
);

const Star4IconCustom = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor">
    <path d="M50,20 Q55,45 80,50 Q55,55 50,80 Q45,55 20,50 Q45,45 50,20 z" />
  </svg>
);

const CircleIconCustom = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor">
    <circle cx="50" cy="50" r="35" />
  </svg>
);

const PuzzleIconCustom = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor">
    <path d="M25,25 h50 v15 a10,10 0 0,0 0,20 v15 h-50 v-15 a10,10 0 0,0 0,-20 v-15 z" />
  </svg>
);

const TriangleBaseIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor">
    <path d="M10,75 h80 L50,25 z" />
  </svg>
);

const shapes = [
  { name: 'Cápsula', Icon: CapsuleIcon, bg: 'bg-indigo-400', shadow: 'shadow-[0_12px_0_#3730a3]', activeShadow: 'active:shadow-[0_0px_0_#3730a3]', isSolid: true },
  { name: 'Trapecio', Icon: TrapezoidIcon, bg: 'bg-orange-500', shadow: 'shadow-[0_12px_0_#9a3412]', activeShadow: 'active:shadow-[0_0px_0_#9a3412]', isSolid: true },
  { name: 'Cruz', Icon: CrossIcon, bg: 'bg-blue-500', shadow: 'shadow-[0_12px_0_#1e3a8a]', activeShadow: 'active:shadow-[0_0px_0_#1e3a8a]', isSolid: true },
  { name: 'Arco', Icon: ArchIcon, bg: 'bg-cyan-500', shadow: 'shadow-[0_12px_0_#164e63]', activeShadow: 'active:shadow-[0_0px_0_#164e63]', isSolid: true },
  { name: 'Triángulo', Icon: TriangleIsoIcon, bg: 'bg-red-500', shadow: 'shadow-[0_12px_0_#7f1d1d]', activeShadow: 'active:shadow-[0_0px_0_#7f1d1d]', isSolid: true },
  { name: 'Diamante', Icon: DiamondIconCustom, bg: 'bg-amber-500', shadow: 'shadow-[0_12px_0_#78350f]', activeShadow: 'active:shadow-[0_0px_0_#78350f]', isSolid: true },
  { name: 'Pajarita', Icon: BowtieIconCustom, bg: 'bg-purple-500', shadow: 'shadow-[0_12px_0_#581c87]', activeShadow: 'active:shadow-[0_0px_0_#581c87]', isSolid: true },
  { name: 'Luna', Icon: MoonIconCustom, bg: 'bg-slate-400', shadow: 'shadow-[0_12px_0_#334155]', activeShadow: 'active:shadow-[0_0px_0_#334155]', isSolid: true },
  { name: 'Estrella 4', Icon: Star4IconCustom, bg: 'bg-yellow-300', shadow: 'shadow-[0_12px_0_#a16207]', activeShadow: 'active:shadow-[0_0px_0_#a16207]', isSolid: true },
  { name: 'Círculo', Icon: CircleIconCustom, bg: 'bg-blue-600', shadow: 'shadow-[0_12px_0_#1e3a8a]', activeShadow: 'active:shadow-[0_0px_0_#1e3a8a]', isSolid: true },
  { name: 'Pieza', Icon: PuzzleIconCustom, bg: 'bg-lime-500', shadow: 'shadow-[0_12px_0_#365314]', activeShadow: 'active:shadow-[0_0px_0_#365314]', isSolid: true },
  { name: 'Triángulo Base', Icon: TriangleBaseIcon, bg: 'bg-emerald-500', shadow: 'shadow-[0_12px_0_#064e3b]', activeShadow: 'active:shadow-[0_0px_0_#064e3b]', isSolid: true },
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
    setTimeout(() => setActiveShape(null), 500);
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
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-grow flex flex-col w-full px-4 md:px-8 pt-6 pb-12 overflow-y-auto custom-scrollbar relative z-10">

        {/* Título Mágico */}
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

        {/* Cuadrícula de Figuras (Bloques Estilo Juguete de Madera) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8 lg:gap-10 w-full max-w-[1600px] mx-auto pb-20 px-2">
          {shapes.map((shape: any, index) => (
            <motion.button
              key={shape.name}
              initial={{ scale: 0, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{
                delay: index * 0.05,
                type: "spring",
                stiffness: 260,
                damping: 20
              }}
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
              {/* Brillo de bloque sólido */}
              <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
              <div className="absolute top-[8%] left-[12%] w-[35%] h-[15%] bg-white/30 rounded-full blur-[1px] rotate-[-20deg] pointer-events-none" />

              {/* Contenedor del Icono */}
              <motion.div
                animate={activeShape === shape.name ? {
                  scale: [1, 1.2, 0.9, 1.1, 1],
                  rotate: [0, 10, -10, 5, 0]
                } : { scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 mb-8 md:mb-12"
              >
                <shape.Icon
                  strokeWidth={shape.thick ? 5 : 2.5}
                  className={`w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 text-white drop-shadow-[0_10px_6px_rgba(0,0,0,0.2)] transition-all ${shape.isSolid ? 'fill-white' : 'fill-white/10 group-hover:fill-white/20'}`}
                />
              </motion.div>

              {/* Etiqueta del Nombre */}
              <div className="absolute bottom-5 md:bottom-7 w-[85%] left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm rounded-2xl py-2 border border-white/30 z-10">
                <span className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tighter text-white drop-shadow-lg">
                  {shape.name}
                </span>
              </div>

              {/* Partículas de brillo al tocar */}
              {activeShape === shape.name && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 1, scale: 0 }}
                      animate={{ opacity: 0, scale: 1.5, x: (i - 2.5) * 40, y: (i % 2 === 0 ? -1 : 1) * 40 }}
                      className="w-4 h-4 bg-white rounded-full absolute"
                    />
                  ))}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
