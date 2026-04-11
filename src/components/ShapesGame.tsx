
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { speak } from '../lib/speech';
import { Circle, Square, Triangle, Hexagon } from 'lucide-react';

const shapes = [
  { name: 'Círculo', icon: Circle, color: 'text-red-500', bg: 'bg-red-100' },
  { name: 'Cuadrado', icon: Square, color: 'text-blue-500', bg: 'bg-blue-100' },
  { name: 'Triángulo', icon: Triangle, color: 'text-green-500', bg: 'bg-green-100' },
  { name: 'Hexágono', icon: Hexagon, color: 'text-purple-500', bg: 'bg-purple-100' },
];

export default function ShapesGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  useEffect(() => {
    if (isFirstTime) {
      speak('¡Hola! ¡Mira cuántas formas divertidas! Vamos a aprender las figuras geométricas juntos. Toca cada una para saber su nombre y ver qué bonitas son. ¡Círculo, cuadrado, triángulo, vamos allá!');
      onVisit();
    } else {
      speak('¡Vamos a aprender las figuras!');
    }
  }, [isFirstTime, onVisit]);

  return (
    <div className="p-6 h-full flex flex-col bg-white/30 backdrop-blur-sm rounded-[3rem] m-4 border-4 border-white shadow-xl">
      <h2 className="text-4xl font-black text-center mb-8 text-pink-600 drop-shadow-sm">Figuras Geométricas</h2>
      <div className="grid grid-cols-2 gap-8 flex-grow">
        {shapes.map((shape) => (
          <motion.button
            key={shape.name}
            whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
            whileTap={{ scale: 0.95 }}
            onClick={() => speak(shape.name)}
            className={`${shape.bg} rounded-[3rem] p-10 shadow-xl flex flex-col items-center justify-center gap-6 border-b-[12px] border-black/10 hover:shadow-2xl transition-all`}
          >
            <shape.icon size={100} className={`${shape.color} drop-shadow-lg`} strokeWidth={3} />
            <span className={`text-3xl font-black uppercase tracking-widest ${shape.color} drop-shadow-sm`}>{shape.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
