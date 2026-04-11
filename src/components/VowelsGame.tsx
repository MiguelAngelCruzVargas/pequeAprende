
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { speak } from '../lib/speech';

const vowels = [
  { letter: 'A', word: 'Avión', icon: '✈️', color: 'bg-red-100 text-red-600', article: 'el' },
  { letter: 'E', word: 'Elefante', icon: '🐘', color: 'bg-blue-100 text-blue-600', article: 'el' },
  { letter: 'I', word: 'Iguana', icon: '🦎', color: 'bg-green-100 text-green-600', article: 'la' },
  { letter: 'O', word: 'Oso', icon: '🐻', color: 'bg-orange-100 text-orange-600', article: 'el' },
  { letter: 'U', word: 'Uvas', icon: '🍇', color: 'bg-purple-100 text-purple-600', article: 'las' },
];

export default function VowelsGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  useEffect(() => {
    if (isFirstTime) {
      speak('¡Hola! ¡Qué emoción! Vamos a aprender las vocales juntos. Toca cada letra mágica para ver un dibujo sorpresa y escuchar cómo suena. ¡A, E, I, O, U, vamos a divertirnos!');
      onVisit();
    } else {
      speak('¡Vamos a aprender las vocales!');
    }
  }, [isFirstTime, onVisit]);

  return (
    <div className="p-6 h-full flex flex-col bg-white/30 backdrop-blur-sm rounded-[3rem] m-4 border-4 border-white shadow-xl">
      <h2 className="text-4xl font-black text-center mb-8 text-pink-600 drop-shadow-sm">Las Vocales</h2>
      <div className="grid grid-cols-1 gap-6 flex-grow overflow-y-auto pb-8 pr-2">
        {vowels.map((v) => (
          <motion.button
            key={v.letter}
            whileHover={{ scale: 1.02, x: 10 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              speak(v.letter);
              setTimeout(() => speak(`${v.article} ${v.word}`), 1000);
            }}
            className={`flex items-center gap-8 p-8 rounded-[2.5rem] shadow-lg border-b-8 border-black/10 transition-all ${v.color} hover:shadow-2xl`}
          >
            <span className="text-8xl font-black w-32 drop-shadow-md">{v.letter}</span>
            <div className="flex items-center gap-8 bg-white/40 p-6 rounded-3xl flex-grow shadow-inner">
              <span className="text-7xl drop-shadow-sm">{v.icon}</span>
              <span className="text-4xl font-black uppercase tracking-widest">{v.word}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
