
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { speak } from '../lib/speech';

const animals = [
  { name: 'Perro', icon: '🐶', sound: '¡Guau, guau!', article: 'El' },
  { name: 'Gato', icon: '🐱', sound: '¡Miau, miau!', article: 'El' },
  { name: 'Vaca', icon: '🐮', sound: '¡Muuuuu!', article: 'La' },
  { name: 'Pollito', icon: '🐥', sound: '¡Pío, pío, pío!', article: 'El' },
  { name: 'León', icon: '🦁', sound: '¡Grrr, grrr!', article: 'El' },
  { name: 'Mono', icon: '🐵', sound: '¡Uh uh, ah ah!', article: 'El' },
  { name: 'Oveja', icon: '🐑', sound: '¡Beeee, beeee!', article: 'La' },
  { name: 'Pato', icon: '🦆', sound: '¡Cuac, cuac!', article: 'El' },
];

export default function AnimalsGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  useEffect(() => {
    if (isFirstTime) {
      speak('¡Hola! ¡Bienvenido a la selva de los animales! Vamos a descubrir cómo hablan nuestros amigos. Toca a cada animal para escuchar su nombre y el sonido tan divertido que hace. ¡Va a ser genial!');
      onVisit();
    } else {
      speak('¡Vamos a jugar con los animales!');
    }
  }, [isFirstTime, onVisit]);

  return (
    <div className="p-6 h-full flex flex-col bg-white/30 backdrop-blur-sm rounded-[3rem] m-4 border-4 border-white shadow-xl">
      <h2 className="text-4xl font-black text-center mb-8 text-orange-600 drop-shadow-sm">¿Cómo hace el animal?</h2>
      <div className="grid grid-cols-2 gap-6 flex-grow overflow-y-auto pb-6">
        {animals.map((animal) => (
          <motion.button
            key={animal.name}
            whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              speak(`${animal.article} ${animal.name}`);
              setTimeout(() => speak(animal.sound), 1000);
            }}
            className="bg-white rounded-[2.5rem] p-8 shadow-lg flex flex-col items-center justify-center gap-4 border-b-8 border-orange-100 hover:border-orange-400 transition-all"
          >
            <span className="text-7xl drop-shadow-md">{animal.icon}</span>
            <span className="text-2xl font-black text-gray-700 tracking-tight">{animal.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
