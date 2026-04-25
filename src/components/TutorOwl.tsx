import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { getHint, classifyAIError } from '../lib/ai';
import { useAI } from '../lib/aiContext';
import { Sparkles, Brain } from 'lucide-react';

interface TutorOwlProps {
  message?: string;          // fallback static message
  game?: string;             // game id for AI hints
  item?: string;             // current item (letter, animal, etc.)
  autoSpeak?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function TutorOwl({ message, game, item, autoSpeak = false, size = 'md' }: TutorOwlProps) {
  const { isEnabled: aiEnabled, recordUsage } = useAI();
  const [showBubble, setShowBubble] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayMessage, setDisplayMessage] = useState(message || '');

  // Ajusté un poco los tamaños para que las sombras y bordes gruesos quepan bien
  const sizeClasses = {
    xs: 'w-12 h-12 text-2xl',
    sm: 'w-16 h-16 text-3xl',
    md: 'w-20 h-20 sm:w-24 sm:h-24 text-4xl sm:text-5xl',
    lg: 'w-28 h-28 sm:w-36 sm:h-36 text-6xl sm:text-7xl',
  };

  const showMessage = (msg: string) => {
    setDisplayMessage(msg);
    setShowBubble(true);
    setIsTalking(true);
    speak(msg);
    setTimeout(() => {
      setShowBubble(false);
      setIsTalking(false);
    }, Math.max(3500, msg.length * 85)); // Un poquito más de tiempo para que los niños lean/escuchen
  };

  const handleTap = async () => {
    if (isLoading) return;

    // Si la IA está habilitada y tenemos contexto de juego, pedimos la pista inteligente
    if (aiEnabled && game && item) {
      setIsLoading(true);
      setShowBubble(true);
      setDisplayMessage('Pensando...');
      try {
        const hint = await getHint(game, item);
        recordUsage();
        setIsLoading(false);
        showMessage(hint);
      } catch (err) {
        setIsLoading(false);
        const { userMessage } = classifyAIError(err);
        showMessage(message || userMessage);
      }
    } else if (message) {
      // Modo normal o sin contexto: usa el mensaje estático
      showMessage(message);
    }
  };

  useEffect(() => {
    if (autoSpeak && message) {
      const timer = setTimeout(() => handleTap(), 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const canUseAI = aiEnabled && game && item;

  return (
    <div className="relative flex items-end gap-3 z-30 font-sans">

      {/* Globo de Diálogo Estilo Cómic/Pegatina */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, x: 20, y: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: 20, y: 10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`
              relative bg-white rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-5 sm:py-4 
              border-4 ${canUseAI ? 'border-purple-300' : 'border-sky-300'}
              shadow-[0_8px_0_rgba(0,0,0,0.05)]
              max-w-[220px] sm:max-w-[300px] z-50
            `}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1 }}
                  className="bg-purple-100 p-1.5 rounded-full"
                >
                  <Brain className="w-5 h-5 text-purple-500" />
                </motion.div>
                <p className="text-sm font-black text-purple-600 animate-pulse tracking-wide">
                  Pensando...
                </p>
              </div>
            ) : (
              <p className={`text-sm sm:text-base font-black leading-snug ${canUseAI ? 'text-purple-700' : 'text-sky-800'}`}>
                {displayMessage}
              </p>
            )}

            {/* Colita del globo de diálogo */}
            <div className={`absolute -right-3 bottom-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-[14px] ${canUseAI ? 'border-l-purple-300' : 'border-l-sky-300'}`} />
            <div className="absolute -right-2 bottom-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-[14px] border-l-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón Físico del Búho */}
      <div className="relative">
        <motion.button
          onClick={handleTap}
          animate={isTalking
            ? { rotate: [-5, 5, -5, 5, 0], scale: [1, 1.05, 1, 1.05, 1] }
            : isLoading
              ? { scale: [1, 1.05, 1] }
              : { y: 0 }
          }
          transition={isTalking
            ? { duration: 0.5 }
            : isLoading
              ? { duration: 0.6 }
              : { duration: 0 }
          }
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95, y: 4 }}
          className={`
            ${sizeClasses[size]} 
            bg-gradient-to-b from-yellow-200 to-amber-400 
            rounded-full flex items-center justify-center 
            border-4 border-white cursor-pointer relative z-40
            shadow-[0_6px_0_#D97706,0_10px_20px_rgba(0,0,0,0.15)]
            active:shadow-[0_0px_0_#D97706,0_0px_0_rgba(0,0,0,0)]
            transition-all duration-150
          `}
          title={canUseAI ? "Toca para una pista inteligente" : "Toca para escuchar"}
        >
          {/* Reflejo estilo bola de cristal/plástico */}
          <div className="absolute top-[10%] left-[15%] w-1/3 h-1/4 bg-white/50 rounded-full blur-[1px] rotate-[-20deg] pointer-events-none" />

          <span className="drop-shadow-md relative z-10">🦉</span>

          {/* Pin mágico de IA */}
          <AnimatePresence>
            {canUseAI && !isLoading && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-1 border-2 border-white shadow-sm z-20"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Sombra proyectada en el piso para dar realismo */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-black/10 rounded-full blur-[3px] -z-10" />
      </div>
    </div>
  );
}