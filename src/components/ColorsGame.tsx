
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { speak } from '../lib/speech';

const colors = [
  { name: 'Rojo', hex: '#EF4444', text: 'text-white' },
  { name: 'Azul', hex: '#3B82F6', text: 'text-white' },
  { name: 'Verde', hex: '#10B981', text: 'text-white' },
  { name: 'Amarillo', hex: '#FBBF24', text: 'text-black' },
  { name: 'Naranja', hex: '#F97316', text: 'text-white' },
  { name: 'Rosa', hex: '#EC4899', text: 'text-white' },
  { name: 'Morado', hex: '#8B5CF6', text: 'text-white' },
  { name: 'Blanco', hex: '#FFFFFF', text: 'text-black', border: 'border-2 border-gray-200' },
];

export default function ColorsGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  useEffect(() => {
    if (isFirstTime) {
      speak('¡Hola! ¡Qué alegría verte! Vamos a jugar con los colores más bonitos del mundo. Toca cada color para escuchar su nombre y ver qué brillante es. ¡Vamos a aprender los colores juntos!');
      onVisit();
    } else {
      speak('¡Vamos a jugar con los colores!');
    }
  }, [isFirstTime, onVisit]);

  return (
    <div className="p-6 h-full flex flex-col bg-white/30 backdrop-blur-sm rounded-[3rem] m-4 border-4 border-white shadow-xl">
      <h2 className="text-4xl font-black text-center mb-8 text-purple-600 drop-shadow-sm">¡Toca los colores!</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-grow">
        {colors.map((color) => (
          <motion.button
            key={color.name}
            whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
            whileTap={{ scale: 0.9 }}
            onClick={() => speak(color.name)}
            style={{ backgroundColor: color.hex }}
            className={`rounded-[2rem] shadow-lg flex items-center justify-center text-3xl font-black ${color.text} ${color.border || ''} transition-all border-b-8 border-black/20 hover:shadow-2xl`}
          >
            <span className="drop-shadow-md">{color.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
