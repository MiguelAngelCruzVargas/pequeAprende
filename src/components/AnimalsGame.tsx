import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft, Sparkles, PawPrint } from 'lucide-react';

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

export default function AnimalsGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const hasSpoken = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeAnimal, setActiveAnimal] = useState<string | null>(null);

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

  const handleAnimalClick = (animal: typeof animals[0]) => {
    // Activa la animación del emoji
    setActiveAnimal(animal.name);
    setTimeout(() => setActiveAnimal(null), 800);

    // Limpia sonidos pendientes o en reproducción
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Habla el nombre
    speak(`${animal.article} ${animal.name}`, true);

    // Reproduce el sonido del animal con retraso
    if (animal.audioId) {
      timeoutRef.current = setTimeout(() => {
        const audio = new Audio(`/sonidos/${animal.audioId}`);
        audioRef.current = audio;
        audio.volume = 1;
        audio.play().catch(e => console.error("Audio error", e));
      }, 1200);
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
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-grow flex flex-col w-full px-4 md:px-8 pt-4 pb-8 overflow-y-auto custom-scrollbar relative z-10">

        {/* Título Mágico */}
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

        {/* Cuadrícula de Animales (Estilo Gominola) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 w-full max-w-[1200px] mx-auto pb-10">
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
              {/* Brillo estilo Gominola */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              
              {/* Reflejo de luz curvo */}
              <div className="absolute top-[5%] left-[10%] w-[50%] h-[20%] bg-white/40 rounded-full blur-[1px] rotate-[-15deg] pointer-events-none" />

              {/* Contenedor del Emoji */}
              <motion.div
                animate={activeAnimal === animal.name ? { scale: [1, 1.4, 1], rotate: [0, 15, -15, 10, -10, 0] } : { scale: 1 }}
                transition={{ duration: 0.6 }}
                className="text-6xl sm:text-[7rem] md:text-[8rem] drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform duration-300 mb-4 sm:mb-6 relative z-10"
              >
                {animal.icon}
              </motion.div>

              {/* Etiqueta del Nombre Estilo Sticker */}
              <div className="absolute bottom-4 md:bottom-8 w-[80%] bg-black/40 rounded-full py-1.5 border border-white/10 z-10">
                <span className="text-base sm:text-lg md:text-3xl font-black uppercase tracking-widest text-white drop-shadow-md">
                  {animal.name}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}