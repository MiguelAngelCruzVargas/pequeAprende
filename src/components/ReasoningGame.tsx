
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { CheckCircle2, XCircle } from 'lucide-react';

const colors = [
  { name: 'Rojo', hex: '#EF4444' },
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Verde', hex: '#10B981' },
  { name: 'Amarillo', hex: '#FBBF24' },
  { name: 'Morado', hex: '#8B5CF6' },
];

export default function ReasoningGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const [target, setTarget] = useState(colors[0]);
  const [options, setOptions] = useState<typeof colors>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const generateRound = (isFirstRound = false) => {
    const newTarget = colors[Math.floor(Math.random() * colors.length)];
    const shuffled = [...colors].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Ensure target is in options
    if (!shuffled.find(c => c.name === newTarget.name)) {
      shuffled[Math.floor(Math.random() * 3)] = newTarget;
    }
    
    setTarget(newTarget);
    setOptions(shuffled);
    setStatus('idle');

    if (isFirstRound) {
      if (isFirstTime) {
        speak('¡Hola! ¡Qué inteligente eres! Tengo un reto mágico para ti. Escucha con mucha atención y busca el color que te pida el mago. ¡Tú puedes lograrlo, vamos a pensar juntos!');
        setTimeout(() => speak(`¿Dónde está el color ${newTarget.name}?`), 5000);
        onVisit();
      } else {
        speak(`¿Dónde está el color ${newTarget.name}?`);
      }
    } else {
      speak(`¿Dónde está el color ${newTarget.name}?`);
    }
  };

  useEffect(() => {
    generateRound(true);
  }, [isFirstTime]);

  const handleChoice = (choice: typeof colors[0]) => {
    if (choice.name === target.name) {
      setStatus('correct');
      speak('¡Muy bien! ¡Lo lograste!');
      setTimeout(generateRound, 2000);
    } else {
      setStatus('wrong');
      speak('Oh oh, intenta otra vez.');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center gap-12 bg-white/30 backdrop-blur-sm rounded-[3rem] m-4 border-4 border-white shadow-xl">
      <h2 className="text-4xl font-black text-center text-purple-600 drop-shadow-sm">Encuentra el color</h2>
      
      {/* Target Display */}
      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={status === 'correct' ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
          className="w-48 h-48 rounded-full shadow-2xl border-[12px] border-white flex items-center justify-center text-white relative"
          style={{ backgroundColor: target.hex }}
        >
          <AnimatePresence>
            {status === 'correct' && (
              <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} className="absolute">
                <CheckCircle2 size={100} className="drop-shadow-lg" />
              </motion.div>
            )}
            {status === 'wrong' && (
              <motion.div initial={{ scale: 0, x: -20 }} animate={{ scale: 1, x: 0 }} exit={{ scale: 0 }} className="absolute">
                <XCircle size={100} className="drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <span className="text-5xl font-black text-gray-800 uppercase tracking-widest drop-shadow-sm">{target.name}</span>
      </div>

      {/* Options */}
      <div className="flex gap-10">
        {options.map((option, i) => (
          <motion.button
            key={`${option.name}-${i}`}
            whileHover={{ scale: 1.15, y: -10 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleChoice(option)}
            className="w-32 h-32 rounded-[2.5rem] shadow-xl border-[6px] border-white hover:shadow-2xl transition-all border-b-[10px] border-black/20"
            style={{ backgroundColor: option.hex }}
          />
        ))}
      </div>
    </div>
  );
}
