
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { Star } from 'lucide-react';

export default function NumbersGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (isFirstTime) {
      speak('¡Hola! ¡Bienvenido al mundo de los números! Vamos a jugar a contar estrellas brillantes. Toca un número y contaremos juntos hasta llegar a él. ¡Uno, dos, tres, vamos a contar!');
      onVisit();
    } else {
      speak('¡Vamos a contar números!');
    }
  }, [isFirstTime, onVisit]);

  const handleSelect = (num: number) => {
    setSelected(num);
    speak(`${num}`);
    // Count up to the number
    for (let i = 1; i <= num; i++) {
      setTimeout(() => speak(`${i}`, false), i * 600);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-white/30 backdrop-blur-sm rounded-[3rem] m-4 border-4 border-white shadow-xl">
      <h2 className="text-5xl font-black text-center mb-8 text-blue-600 drop-shadow-sm">¡Cuenta conmigo!</h2>
      
      <div className="flex-grow flex flex-col gap-10">
        {/* Number Grid */}
        <div className="grid grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <motion.button
              key={num}
              whileHover={{ scale: 1.1, y: -10, rotate: [0, -5, 5, 0] }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSelect(num)}
              className={`aspect-square rounded-[2rem] text-5xl font-black flex items-center justify-center shadow-xl transition-all border-b-[12px] ${
                selected === num 
                  ? 'bg-gradient-to-b from-blue-400 to-blue-600 text-white border-blue-800' 
                  : 'bg-white text-blue-500 border-gray-200 hover:border-blue-200'
              }`}
            >
              <span className="drop-shadow-md">{num}</span>
            </motion.button>
          ))}
        </div>

        {/* Visualization Area */}
        <div className="flex-grow bg-white/60 rounded-[3rem] p-10 flex flex-wrap items-center justify-center gap-8 border-6 border-dashed border-blue-200 shadow-inner min-h-[250px]">
          <AnimatePresence mode="popLayout">
            {selected ? (
              Array.from({ length: selected }).map((_, i) => (
                <motion.div
                  key={`${selected}-${i}`}
                  initial={{ scale: 0, rotate: -45, y: 50 }}
                  animate={{ scale: 1, rotate: 0, y: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 150, delay: i * 0.1 }}
                >
                  <Star size={80} className="text-yellow-400 fill-yellow-400 drop-shadow-xl" />
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center gap-6">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-8xl"
                >
                  ✨
                </motion.div>
                <p className="text-3xl text-blue-500 font-black italic tracking-wide">¡Toca un número para ver las estrellas!</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
