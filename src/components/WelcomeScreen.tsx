
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { speak } from '../lib/speech';
import { Sparkles } from 'lucide-react';

export default function WelcomeScreen({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState('');

  useEffect(() => {
    speak('¡Hola! ¡Bienvenido a PequeAprendo! Introduce tu nombre para conocerte y que podamos jugar juntos.');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      speak(`¡Hola ${name}! ¡Bienvenido a PequeAprendo! ¡Vamos a jugar y a divertirnos mucho!`);
      setTimeout(() => onStart(name), 3000);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-sky-300 via-sky-100 to-green-100 overflow-hidden">
      {/* Scenic Background "Drawings" */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Sun */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-6 right-6 sm:top-10 sm:right-10 text-6xl sm:text-8xl"
        >
          ☀️
        </motion.div>
        
        {/* Clouds */}
        <motion.div animate={{ x: [-20, 20, -20] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-16 left-[5%] text-5xl sm:text-6xl opacity-60">☁️</motion.div>
        <motion.div animate={{ x: [20, -20, 20] }} transition={{ duration: 12, repeat: Infinity }} className="absolute top-32 right-[10%] text-6xl sm:text-7xl opacity-60">☁️</motion.div>
        
        {/* Ground / Grass */}
        <div className="absolute bottom-0 left-0 w-full h-1/4 bg-green-200/40" />

        {/* Trees & Flowers (Bottom) */}
        <div className="absolute bottom-0 left-0 w-full flex justify-around items-end px-4 pb-4">
          <span className="text-5xl sm:text-8xl">🌳</span>
          <span className="text-3xl sm:text-6xl">🌻</span>
          <span className="text-5xl sm:text-8xl">🌳</span>
          <span className="text-3xl sm:text-6xl">🌷</span>
          <span className="text-5xl sm:text-8xl">🌳</span>
        </div>

        {/* Floating Animals/Drawings */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} 
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-1/4 left-[15%] text-4xl sm:text-5xl"
        >
          🐦
        </motion.div>
        <motion.div 
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }} 
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 right-[15%] text-4xl sm:text-5xl"
        >
          🦋
        </motion.div>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-6 sm:p-10 rounded-[3rem] sm:rounded-[4rem] shadow-2xl border-4 border-white flex flex-col items-center gap-4 sm:gap-8 max-w-sm w-full relative z-10 mx-auto"
      >
        <motion.div 
          animate={{ 
            y: [0, -10, 0],
            rotate: [3, -3, 3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 rounded-full flex items-center justify-center text-white shadow-2xl relative"
        >
          <span className="text-5xl sm:text-8xl drop-shadow-2xl">🧙‍♂️</span>
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-2 -right-2 bg-white p-2 sm:p-3 rounded-full shadow-lg"
          >
            <Sparkles className="text-yellow-500" size={24} />
          </motion.div>
        </motion.div>
        
        <div className="text-center">
          <h2 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-1">¡HOLA!</h2>
          <p className="text-lg sm:text-2xl text-indigo-600 font-black italic tracking-wide">¿Cómo te llamas?</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 sm:gap-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Escribe tu nombre..."
            className="w-full p-4 sm:p-8 bg-white/80 rounded-2xl sm:rounded-3xl text-xl sm:text-3xl font-black text-center focus:outline-none focus:ring-8 focus:ring-purple-200 transition-all border-4 border-purple-200 focus:border-purple-400 placeholder:text-gray-300 shadow-inner"
            autoFocus
          />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!name.trim()}
            className={`w-full p-4 sm:p-8 rounded-2xl sm:rounded-3xl text-2xl sm:text-4xl font-black text-white shadow-2xl transition-all border-b-[8px] sm:border-b-[12px] ${
              name.trim() 
                ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 border-indigo-800' 
                : 'bg-gray-300 border-gray-400 cursor-not-allowed'
            }`}
          >
            ¡VAMOS!
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
