
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { CheckCircle2, XCircle } from 'lucide-react';

const items = [
  { id: 'apple', icon: '🍎', name: 'Manzana', article: 'la' },
  { id: 'banana', icon: '🍌', name: 'Plátano', article: 'el' },
  { id: 'dog', icon: '🐶', name: 'Perro', article: 'el' },
  { id: 'cat', icon: '🐱', name: 'Gato', article: 'el' },
  { id: 'car', icon: '🚗', name: 'Coche', article: 'el' },
  { id: 'ball', icon: '⚽', name: 'Pelota', article: 'la' },
];

export default function MatchingGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const [target, setTarget] = useState(items[0]);
  const [options, setOptions] = useState<typeof items>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const generateRound = (isFirst = false) => {
    const newTarget = items[Math.floor(Math.random() * items.length)];
    const shuffled = [...items].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    if (!shuffled.find(i => i.id === newTarget.id)) {
      shuffled[Math.floor(Math.random() * 3)] = newTarget;
    }
    
    setTarget(newTarget);
    setOptions(shuffled);
    setStatus('idle');

    if (isFirst) {
      if (isFirstTime) {
        speak('¡Hola! ¡Vamos a jugar a los gemelos! Tenemos que buscar el que es igualito. Mira el dibujo de arriba con mucha atención y busca su pareja abajo. ¡Tú puedes encontrarlo, vamos a jugar!');
        setTimeout(() => speak(`Busca el que es igual a ${newTarget.article} ${newTarget.name}`), 5500);
        onVisit();
      } else {
        speak(`Busca el que es igual a ${newTarget.article} ${newTarget.name}`);
      }
    } else {
      speak(`Busca el que es igual a ${newTarget.article} ${newTarget.name}`);
    }
  };

  useEffect(() => {
    generateRound(true);
  }, [isFirstTime]);

  const handleChoice = (choice: typeof items[0]) => {
    if (choice.id === target.id) {
      setStatus('correct');
      speak('¡Excelente! ¡Son iguales!');
      setTimeout(() => generateRound(), 2000);
    } else {
      setStatus('wrong');
      speak('No son iguales, busca otra vez.');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center gap-12 bg-white/30 backdrop-blur-sm rounded-[3rem] m-4 border-4 border-white shadow-xl">
      <h2 className="text-4xl font-black text-center text-cyan-600 drop-shadow-sm">Busca el igual</h2>
      
      {/* Target Display */}
      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={status === 'correct' ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
          className="w-48 h-48 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center text-9xl border-[12px] border-cyan-100 relative"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={target.id}
              initial={{ opacity: 0, scale: 0, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0, rotate: 45 }}
              className="drop-shadow-xl"
            >
              {target.icon}
            </motion.span>
          </AnimatePresence>
        </motion.div>
        <span className="text-3xl font-black text-cyan-600 uppercase tracking-widest drop-shadow-sm">¿Cuál es igual?</span>
      </div>

      {/* Options */}
      <div className="flex gap-10">
        {options.map((option, i) => (
          <motion.button
            key={`${option.id}-${i}`}
            whileHover={{ scale: 1.15, y: -10 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleChoice(option)}
            className="w-32 h-32 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center text-7xl border-b-[10px] border-cyan-100 hover:border-cyan-400 transition-all"
          >
            <span className="drop-shadow-lg">{option.icon}</span>
          </motion.button>
        ))}
      </div>

      {/* Feedback Overlay */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`fixed bottom-12 px-12 py-6 rounded-full text-white font-black text-3xl flex items-center gap-4 shadow-2xl border-b-8 ${
              status === 'correct' ? 'bg-green-500 border-green-700' : 'bg-red-500 border-red-700'
            }`}
          >
            {status === 'correct' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
            {status === 'correct' ? '¡MUY BIEN!' : '¡OTRA VEZ!'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
