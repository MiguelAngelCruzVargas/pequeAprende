import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { useAI } from '../lib/aiContext';
import { Sparkles, ArrowLeft, Cloud, Volume2, Flame } from 'lucide-react';

const SOUNDS = [
  { text: '¡PAA!', say: 'Paaa. ¡Repítelo tú!', color: 'from-pink-400 to-rose-500', label: 'PAA' },
  { text: '¡MAA!', say: 'Maaa. ¡Con tu boquita!', color: 'from-purple-400 to-violet-500', label: 'MAA' },
  { text: '¡PO!', say: 'Po. Redondea los labios.', color: 'from-cyan-400 to-sky-500', label: 'PO' },
  { text: '¡MU!', say: 'Muuu. ¡Como la vaquita!', color: 'from-green-400 to-emerald-500', label: 'MU' },
  { text: '¡BA!', say: 'Baaa. ¡Tú puedes!', color: 'from-orange-400 to-amber-500', label: 'BA' },
  { text: '¡BO!', say: 'Boo. ¡Sopla fuerte!', color: 'from-indigo-400 to-blue-500', label: 'BO' },
  { text: '¡BEE!', say: 'Beee. ¡Como la ovejita!', color: 'from-lime-400 to-green-500', label: 'BEE' },
  { text: '¡A!', say: 'Aaaa. ¡Abre la boca!', color: 'from-yellow-400 to-orange-400', label: 'A' },
  { text: '¡O!', say: 'Ooo. ¡Labios redondos!', color: 'from-fuchsia-400 to-pink-500', label: 'O' },
  { text: '¡GUAU!', say: '¡Guau guau! ¡Como el perrito!', color: 'from-teal-400 to-cyan-600', label: 'GUAU' },
];

const AI_TIPS = [
  '¡Mira mi boca! ¿Puedes hacer lo mismo?',
  '¡Sopla la burbuja con los labios en "o"!',
  '¡Muy bien! Cada burbuja te enseña a hablar.',
  'Los labios juntos para el sonido "P" y "B".',
  '¡Inténtalo de nuevo con tu boquita!',
  '¡Atrapa la burbuja dorada para más puntos!',
];

interface Bubble {
  id: number;
  leftPercent: number; // Porcentaje seguro de la pantalla (20% a 80%)
  size: number;
  sound: typeof SOUNDS[0];
  color: string;
  speed: number;
  isGolden: boolean; // NUEVA MECÁNICA
}

interface SplashInfo {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
  isGolden: boolean;
}

let bubbleAudio: HTMLAudioElement | null = null;
let goldenAudio: HTMLAudioElement | null = null;

function playPopSound(isGolden: boolean) {
  if (isGolden) {
    if (!goldenAudio) goldenAudio = new Audio('/sonidos/BURBUJA.mp3'); // Puedes cambiarlo por un sonido de campanita mágico
    goldenAudio.currentTime = 0;
    goldenAudio.volume = 1;
    goldenAudio.playbackRate = 1.5; // Lo hacemos sonar más "mágico" y rápido
    goldenAudio.play().catch(() => { });
  } else {
    if (!bubbleAudio) bubbleAudio = new Audio('/sonidos/BURBUJA.mp3');
    bubbleAudio.currentTime = 0;
    bubbleAudio.volume = 0.8;
    bubbleAudio.playbackRate = 1.0 + (Math.random() * 0.2); // Pequeña variación para no aburrir
    bubbleAudio.play().catch(() => { });
  }
}

export default function BubblesGame({ onBack, isFirstTime, onVisit }: { onBack: () => void; isFirstTime: boolean; onVisit: () => void }) {
  const { isEnabled: aiEnabled } = useAI();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [splashes, setSplashes] = useState<SplashInfo[]>([]);
  const [currentTip, setCurrentTip] = useState(AI_TIPS[0]);

  // Stats del juego
  const [popCount, setPopCount] = useState(0);
  const [combo, setCombo] = useState(0);

  const bubbleIdCounter = useRef(0);
  const splashIdCounter = useRef(0);
  const hasSpoken = useRef(false);
  const tipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const safeTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      fn();
      timeoutsRef.current.delete(id);
    }, delay);
    timeoutsRef.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timeoutsRef.current.forEach(clearTimeout);
      if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!aiEnabled) return;
    const id = setInterval(() => {
      setCurrentTip(AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)]);
    }, 6000);
    return () => clearInterval(id);
  }, [aiEnabled]);

  useEffect(() => {
    if (!hasSpoken.current) {
      hasSpoken.current = true;
      if (isFirstTime) {
        speak('¡A explotar burbujas! Si eres rápido harás un combo. ¡Cuidado con las doradas!');
        onVisit();
      } else {
        speak('¡Burbujas mágicas! ¡Toca y repite!');
      }
    }
  }, [isFirstTime, onVisit]);

  const spawnBubble = useCallback(() => {
    setBubbles(prev => {
      if (prev.length >= 7) return prev;

      const isGolden = Math.random() > 0.85; // 15% de probabilidad de ser dorada
      const sound = SOUNDS[Math.floor(Math.random() * SOUNDS.length)];
      const speed = isGolden ? 5 + Math.random() * 2 : 8 + Math.random() * 4;
      const id = bubbleIdCounter.current++;

      // Lógica para evitar que se encimen (Overlap)
      let leftPercent = 20 + Math.random() * 60;
      let attempts = 0;
      const minDistance = 15; // Distancia mínima del 15% entre burbujas

      while (attempts < 5) {
        const tooClose = prev.some(b => Math.abs(b.leftPercent - leftPercent) < minDistance);
        if (!tooClose) break;
        leftPercent = 20 + Math.random() * 60;
        attempts++;
      }

      safeTimeout(() => {
        setBubbles(p => p.filter(b => b.id !== id));
      }, speed * 1000 + 500);

      return [...prev, {
        id,
        leftPercent,
        size: isGolden ? 130 + Math.random() * 30 : 110 + Math.random() * 60,
        sound,
        color: isGolden ? 'from-yellow-300 to-amber-500' : sound.color,
        speed,
        isGolden
      }];
    });
  }, [safeTimeout]);

  useEffect(() => {
    const interval = setInterval(spawnBubble, 1000);
    spawnBubble();
    return () => clearInterval(interval);
  }, [spawnBubble]);

  const handlePop = (e: React.PointerEvent, bubble: Bubble) => {
    e.preventDefault();
    e.stopPropagation();

    setBubbles(prev => {
      const exists = prev.some(b => b.id === bubble.id);
      if (!exists) return prev;

      // Físicas y sonido
      playPopSound(bubble.isGolden);

      // Actualizar puntaje y COMBO
      setPopCount(c => c + (bubble.isGolden ? 5 : 1));
      setCombo(c => c + 1);

      // Reiniciar el timer del combo (si no explota otra en 2.5s, se pierde el combo)
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => {
        setCombo(0);
      }, 2500);

      // Partículas y Splash
      const splashId = splashIdCounter.current++;
      setSplashes(s => [...s, {
        id: splashId,
        text: bubble.isGolden ? '+5' : bubble.sound.text,
        color: bubble.color,
        x: e.clientX,
        y: e.clientY,
        isGolden: bubble.isGolden
      }]);

      if (aiEnabled) setCurrentTip(AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)]);

      // Hablar (Solo si no es dorada, la dorada es un bonus)
      if (!bubble.isGolden) {
        if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
        tipTimerRef.current = setTimeout(() => {
          speak(bubble.sound.say, true);
        }, 350);
      }

      safeTimeout(() => {
        setSplashes(s => s.filter(item => item.id !== splashId));
      }, 1500);

      return prev.filter(b => b.id !== bubble.id);
    });
  };

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden select-none bg-gradient-to-t from-sky-200 via-indigo-100 to-cyan-50 font-sans touch-none">

      {/* Nubes Paralaje de Fondo */}
      {[0.1, 0.4, 0.8, 0.2].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute text-white/40 pointer-events-none"
          style={{ top: `${10 + i * 20}%`, left: `${pos * 100}%`, transform: `scale(${1 + i * 0.2})` }}
          animate={{ x: [0, 40, 0], y: [0, 10, 0] }}
          transition={{ duration: 15 + i * 5, ease: 'easeInOut' }}
        >
          <Cloud className="w-24 h-24 sm:w-40 sm:h-40 fill-white" />
        </motion.div>
      ))}

      {/* HEADER ESTANDARIZADO */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 bg-white/80  shadow-sm rounded-b-3xl border-b-4 border-white pointer-events-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 bg-sky-100 text-sky-600 rounded-full hover:bg-sky-200 active:scale-90 transition-all shadow-inner border-2 border-sky-200"
          >
            <ArrowLeft strokeWidth={4} className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-sky-400 to-blue-500 px-3 py-1.5 rounded-full shadow-[0_3px_0_#0284C7] border-2 border-white">
            <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
            <span className="text-xs md:text-base font-black text-white uppercase tracking-wider hidden sm:block drop-shadow-md">
              Sílabas
            </span>
          </div>
        </div>

        {/* Medidores (Puntaje y Combo) */}
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {combo > 1 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-1 font-black text-orange-600 text-sm md:text-base bg-orange-100 px-3 py-1.5 rounded-full border-2 border-orange-300"
              >
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                <span>x{combo}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            key={popCount}
            initial={{ scale: 1.3, rotate: 10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="flex items-center gap-2 font-black text-pink-600 text-base md:text-lg bg-gradient-to-b from-pink-50 to-rose-100 px-4 py-1.5 rounded-full border-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.05)]"
          >
            <span className="drop-shadow-sm font-black">⭐ {popCount}</span>
          </motion.div>
        </div>
      </div>

      {/* AI Banner flotante */}
      <AnimatePresence>
        {aiEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-[80px] left-0 right-0 z-30 flex justify-center px-4 pointer-events-none"
          >
            <motion.div
              key={currentTip}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="bg-white/95  text-indigo-700 px-6 py-2.5 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.1)] border-2 border-indigo-100 flex items-center gap-3 max-w-xs sm:max-w-md pointer-events-auto"
            >
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse shrink-0" />
              <p className="text-xs sm:text-sm font-black text-center leading-tight">{currentTip}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ÁREA DE BURBUJAS */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {bubbles.map(bubble => (
            <motion.button
              key={bubble.id}
              initial={{ y: '20vh', scale: 0.5, opacity: 0, x: '-50%' }}
              animate={{
                y: '-120vh',
                scale: 1,
                opacity: 1,
                x: ['-50%', '-20%', '-80%', '-50%'],
              }}
              exit={{ scale: 1.6, opacity: 0, filter: 'blur(15px)', transition: { duration: 0.2 } }}
              transition={{
                y: { duration: bubble.speed, ease: 'linear' },
                x: { duration: 3 + Math.random() * 2, ease: 'easeInOut', repeat: Infinity },
                opacity: { duration: 0.5 },
              }}
              onPointerDown={(e) => handlePop(e, bubble)}
              style={{
                left: `${bubble.leftPercent}%`,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                position: 'absolute',
                bottom: 0,
              }}
              className="rounded-full flex items-center justify-center relative pointer-events-auto focus:outline-none group cursor-pointer touch-none"
            >
              {/* Esfera de Jabón Normal o Dorada */}
              <div
                className={`absolute inset-0 rounded-full transition-transform duration-300 group-hover:scale-105 ${bubble.isGolden ? 'animate-pulse' : ''}`}
                style={{
                  background: bubble.isGolden
                    ? `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0%, rgba(252, 211, 77, 0.5) 30%, rgba(245, 158, 11, 0.2) 70%, rgba(255, 255, 255, 0.6) 100%)`
                    : `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.2) 20%, rgba(200, 230, 255, 0.1) 60%, rgba(255, 255, 255, 0.4) 100%)`,
                  boxShadow: bubble.isGolden
                    ? `inset 0 0 30px rgba(252,211,77,0.8), 0 0 20px rgba(245,158,11,0.5)`
                    : `inset 0 0 20px rgba(255,255,255,0.6), inset 10px 0 30px rgba(255, 0, 255, 0.1), inset -10px 0 30px rgba(0, 255, 255, 0.1), 0 10px 20px rgba(0,0,0,0.05)`,
                  border: bubble.isGolden ? '2px solid rgba(252, 211, 77, 0.8)' : '1.5px solid rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(1px)'
                }}
              />

              {/* Brillo */}
              <div
                className="absolute rounded-full bg-white/80"
                style={{
                  width: '35%', height: '20%', top: '12%', left: '18%',
                  transform: 'rotate(-45deg)', filter: 'blur(1px)'
                }}
              />

              {/* Contenido (Si es dorada, muestra estrella, si no el texto) */}
              {bubble.isGolden ? (
                <Sparkles className="w-1/2 h-1/2 text-yellow-500 fill-yellow-200 drop-shadow-md z-10" />
              ) : (
                <span
                  className={`relative z-10 font-black text-transparent bg-gradient-to-br ${bubble.color} bg-clip-text drop-shadow-[0_2px_3px_rgba(255,255,255,0.9)]`}
                  style={{ fontSize: `${bubble.size * 0.3}px` }}
                >
                  {bubble.sound.label}
                </span>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Explosión y Feedback */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {splashes.map(splash => (
            <motion.div
              key={splash.id}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none flex items-center justify-center"
              style={{ left: splash.x, top: splash.y }}
            >
              {/* Ondas */}
              {[0, 1].map(i => (
                <motion.div
                  key={`ring-${i}`}
                  initial={{ scale: 0.2, opacity: 0.8 }}
                  animate={{ scale: splash.isGolden ? 3.5 + i : 2.5 + i, opacity: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                  className={`absolute rounded-full w-32 h-32 bg-gradient-to-br ${splash.color} opacity-40 mix-blend-screen blur-sm`}
                />
              ))}

              {/* Partículas (Más grandes y doradas si es combo/dorada) */}
              {Array.from({ length: splash.isGolden ? 12 : 8 }).map((_, i) => {
                const angle = (i / (splash.isGolden ? 12 : 8)) * Math.PI * 2;
                const distance = (splash.isGolden ? 120 : 90) + Math.random() * 50;
                return (
                  <motion.div
                    key={`p-${i}`}
                    initial={{ x: 0, y: 0, scale: 0.8, opacity: 1 }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance + 40,
                      scale: 0,
                      opacity: 0,
                      rotate: 180
                    }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className={`absolute w-4 h-4 rounded-full bg-gradient-to-br ${splash.isGolden ? 'from-yellow-300 to-amber-500' : splash.color} shadow-lg`}
                  />
                );
              })}

              {/* Texto */}
              <motion.div
                initial={{ scale: 0.2, opacity: 0, y: 0 }}
                animate={{ scale: [0.2, 1.4, 1.2], opacity: [1, 1, 0], y: -80 }}
                transition={{ duration: 1.2, times: [0, 0.3, 1], ease: 'easeOut' }}
                className={`text-7xl sm:text-9xl font-black text-transparent bg-gradient-to-br ${splash.color} bg-clip-text whitespace-nowrap drop-shadow-[0_15px_30px_rgba(0,0,0,0.3)]`}
                style={{ WebkitTextStroke: '3px white' }}
              >
                {splash.text}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Banner inferior (Solo si no hay combos activos para no saturar) */}
      <AnimatePresence>
        {combo < 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-0 right-0 z-30 flex justify-center pointer-events-none px-4"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, ease: "easeInOut" }}
              className="bg-white/90  px-8 py-3 rounded-full border-4 border-white shadow-[0_15px_35px_rgba(0,0,0,0.1)] flex items-center gap-3"
            >
              <span className="text-2xl animate-bounce">👆</span>
              <p className="text-base sm:text-xl font-black text-sky-600 uppercase tracking-wider">
                ¡Toca rápido para combo!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}