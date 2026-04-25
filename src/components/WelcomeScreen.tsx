import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import TutorOwl from './TutorOwl';
import { Sparkles } from 'lucide-react';

export default function WelcomeScreen({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState('');
  const [letterBubbles, setLetterBubbles] = useState<string[]>([]);

  useEffect(() => {
    speak('¡Hola amiguito! Escribe tu nombre para empezar a jugar.');
  }, []);

  useEffect(() => {
    setLetterBubbles(name.toUpperCase().split(''));
  }, [name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      speak(`¡Hola ${name}! ¡Llegó la hora de divertirnos!`).then(() => {
        onStart(name);
      });
    }
  };

  // Elementos flotantes decorativos con formas orgánicas
  const floatingShapes = [
    { type: 'blob1', color: 'from-yellow-300 to-orange-400', top: '8%', left: '5%', size: 80 },
    { type: 'blob2', color: 'from-pink-300 to-pink-500', top: '12%', right: '8%', size: 60 },
    { type: 'blob3', color: 'from-cyan-300 to-blue-400', top: '65%', left: '3%', size: 70 },
    { type: 'blob4', color: 'from-purple-300 to-purple-500', bottom: '20%', right: '6%', size: 55 },
    { type: 'blob5', color: 'from-green-300 to-emerald-400', top: '35%', left: '2%', size: 50 },
    { type: 'star', color: 'from-orange-400 to-red-400', top: '55%', right: '10%', size: 45 },
  ];

  return (
    <div className="relative flex-grow flex flex-col items-center justify-center p-4 overflow-hidden min-h-0 bg-gradient-to-br from-purple-200 via-pink-100 to-yellow-100">
      {/* Decorative Characters in Bubbles */}
      <motion.div
        className="absolute -bottom-10 -left-10 w-48 sm:w-80 z-0"
        animate={{ 
          y: [0, -20, 0],
          rotate: [-5, 5, -5]
        }}
        transition={{ duration: 7, ease: "easeInOut" }}
      >
        <div className="relative w-full h-full p-8">
          <div className="absolute inset-0 bg-white/40  rounded-full scale-90" />
          <img
            src="/mascots.png"
            alt="Amiguitos"
            className="relative w-full h-full object-contain rounded-[3rem] border-8 border-white shadow-2xl rotate-3"
          />
        </div>
      </motion.div>

      <motion.div
        className="absolute -top-10 -right-10 w-48 sm:w-80 z-0"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [5, -5, 5]
        }}
        transition={{ duration: 9, ease: "easeInOut" }}
      >
        <div className="relative w-full h-full p-8">
          <div className="absolute inset-0 bg-white/40  rounded-full scale-90" />
          <img
            src="/decoration.png"
            alt="Sol y Nubes"
            className="relative w-full h-full object-contain rounded-[3rem] border-8 border-white shadow-2xl -rotate-3"
          />
        </div>
      </motion.div>

      {/* Formas orgánicas flotantes */}
      {floatingShapes.map((shape, index) => (
        <motion.div
          key={index}
          className={`absolute bg-gradient-to-br ${shape.color} opacity-60`}
          style={{
            width: shape.size,
            height: shape.size,
            top: shape.top,
            bottom: shape.bottom,
            left: shape.left,
            right: shape.right,
            borderRadius: shape.type === 'star' ? '30% 70% 70% 30% / 30% 30% 70% 70%' : '60% 40% 30% 70% / 60% 30% 70% 40%',
          }}
          animate={{
            y: [0, -25, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
            borderRadius: shape.type === 'star'
              ? ['30% 70% 70% 30% / 30% 30% 70% 70%', '70% 30% 30% 70% / 70% 70% 30% 30%', '30% 70% 70% 30% / 30% 30% 70% 70%']
              : ['60% 40% 30% 70% / 60% 30% 70% 40%', '30% 60% 70% 40% / 50% 60% 30% 60%', '60% 40% 30% 70% / 60% 30% 70% 40%'],
          }}
          transition={{
            duration: 4 + index * 0.5,
            ease: "easeInOut",
            delay: index * 0.3,
          }}
        />
      ))}

      {/* Partículas brillantes flotantes */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute"
          style={{
            left: `${10 + i * 7}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -600],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            delay: i * 0.5,
            ease: "easeOut",
          }}
        >
          <Sparkles size={16} className="text-yellow-400" fill="currentColor" />
        </motion.div>
      ))}

      {/* Puntos indicadores arriba */}
      <div className="absolute top-[calc(50%-260px)] sm:top-[calc(50%-300px)] left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-orange-400 rounded-full shadow-lg"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Contenedor principal con forma creativa */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 15
        }}
        className="relative w-full max-w-sm sm:max-w-md z-10"
      >
        {/* Búho en nube flotante */}
        <motion.div
          className="absolute -top-16 left-1/2 -translate-x-1/2 z-20"
          animate={{
            y: [0, -15, 0],
            rotate: [-3, 3, -3],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut"
          }}
        >
          <motion.div
            className="relative w-28 h-28 bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 rounded-full shadow-2xl flex items-center justify-center"
            animate={{
              boxShadow: [
                '0 20px 60px rgba(251, 191, 36, 0.5)',
                '0 25px 80px rgba(251, 191, 36, 0.7)',
                '0 20px 60px rgba(251, 191, 36, 0.5)',
              ],
            }}
            transition={{ duration: 2 }}
          >
            {/* Aro decorativo */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-white/50"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, ease: "linear" }}
            />
            <TutorOwl size="lg" message="¡Hola! Vamos a jugar." />
          </motion.div>
        </motion.div>

        {/* Contenedor principal con forma de nube/blob */}
        <div className="relative bg-white/95  pt-20 pb-8 px-8 shadow-2xl" style={{
          borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
        }}>
          {/* Título con letras animadas */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center gap-1 mb-3">
              {['¡', 'H', 'O', 'L', 'A', '!'].map((letter, i) => (
                <motion.span
                  key={i}
                  className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            <motion.p
              className="text-lg sm:text-xl text-purple-600 font-bold flex items-center justify-center gap-2"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2 }}
            >
              <motion.span
                className="text-2xl"
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ duration: 1.5 }}
              >
                👋
              </motion.span>
              ¿Cómo te llamas?
            </motion.p>
          </div>

          {/* Input como burbujas de letras */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Área de burbujas de letras */}
            <div className="min-h-[80px] flex flex-wrap justify-center items-center gap-2 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-[2rem] border-4 border-purple-200 shadow-inner">
              <AnimatePresence mode="popLayout">
                {letterBubbles.length > 0 ? (
                  letterBubbles.map((letter, index) => (
                    <motion.div
                      key={`${letter}-${index}`}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{
                        scale: 1,
                        rotate: 0,
                        y: [0, -5, 0],
                      }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{
                        scale: { type: "spring", stiffness: 500, damping: 15 },
                        y: { duration: 2, delay: index * 0.1 }
                      }}
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <span className="text-2xl sm:text-3xl font-black text-white">
                        {letter}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    className="text-xl font-bold text-purple-300"
                  >
                    Escribe aquí...
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Input oculto para capturar texto */}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-white/80  rounded-2xl text-xl font-bold text-purple-700 focus:outline-none border-3 border-purple-300 focus:border-purple-500 transition-all text-center uppercase shadow-md"
              placeholder="Toca para escribir..."
              autoFocus
              maxLength={12}
            />

            {/* Botón creativo */}
            <motion.button
              type="submit"
              disabled={!name.trim()}
              whileTap={{ scale: 0.95 }}
              animate={name.trim() ? {
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 10px 40px rgba(74, 222, 128, 0.4)',
                  '0 15px 60px rgba(74, 222, 128, 0.7)',
                  '0 10px 40px rgba(74, 222, 128, 0.4)',
                ],
              } : {}}
              transition={{ duration: 2 }}
              className={`w-full py-6 rounded-full text-2xl font-black text-white shadow-2xl transition-all relative overflow-hidden ${name.trim()
                  ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-500'
                  : 'bg-gray-300 text-gray-400'
                }`}
            >
              {/* Efecto de brillo animado */}
              {name.trim() && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, ease: "linear" }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-3">
                ¡EMPEZAR!
                <motion.span
                  animate={name.trim() ? { x: [0, 5, 0] } : {}}
                  transition={{ duration: 1 }}
                >
                  🚀
                </motion.span>
              </span>
            </motion.button>
          </form>
        </div>

        {/* Decoraciones alrededor del contenedor */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`deco-${i}`}
            className="absolute w-6 h-6 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full"
            style={{
              top: `${20 + i * 15}%`,
              [i % 2 === 0 ? 'left' : 'right']: -12,
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}