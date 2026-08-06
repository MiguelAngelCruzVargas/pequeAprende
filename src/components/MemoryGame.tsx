import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft, Sparkles, Brain } from 'lucide-react';

// "Memorama": memoria de TRABAJO — distinta a Parejas/Conecta, donde todo
// está siempre visible. Aquí el niño tiene que recordar DÓNDE estaba cada
// cosa después de que se voltea boca abajo, que es la habilidad real que
// se entrena con un memorama clásico.
const EMOJI_POOL = ['🐶', '🐱', '🐰', '🦁', '🐸', '🐵', '🐻', '🐼', '🐷', '🐮'];

const START_PAIRS = 3;
const MAX_PAIRS = 6;

interface Card {
  id: number;
  pairId: string;
  emoji: string;
  matched: boolean;
}

function buildDeck(pairs: number): Card[] {
  const chosen = [...EMOJI_POOL].sort(() => Math.random() - 0.5).slice(0, pairs);
  const doubled = [...chosen, ...chosen];
  return doubled
    .sort(() => Math.random() - 0.5)
    .map((emoji, i) => ({ id: i, pairId: emoji, emoji, matched: false }));
}

const MATCH_PRAISE = ['¡Pareja! ¡Muy bien!', '¡La encontraste!', '¡Excelente memoria!', '¡Genial!', '¡Perfecto!'];

export default function MemoryGame({ onBack, isFirstTime, onVisit }: { onBack: () => void, isFirstTime: boolean, onVisit: () => void }) {
  const hasSpoken = useRef(false);
  const [pairsThisRound, setPairsThisRound] = useState(START_PAIRS);
  const [cards, setCards] = useState<Card[]>(() => buildDeck(START_PAIRS));
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [totalStars, setTotalStars] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (hasSpoken.current) return;
    hasSpoken.current = true;

    if (isFirstTime) {
      speak('¡Hola! Voltea dos cartas. Si son iguales, ganas. ¡Vamos a jugar memorama!');
      onVisit();
    } else {
      speak('¡Vamos a jugar memorama! Encuentra las parejas.');
    }
  }, [isFirstTime, onVisit]);

  const initGame = (pairs: number) => {
    setCards(buildDeck(pairs));
    setFlippedIds([]);
    setMatchedCount(0);
    setLocked(false);
    setCompleted(false);
  };

  const handlePlayAgain = () => {
    const next = Math.min(pairsThisRound + 1, MAX_PAIRS);
    setPairsThisRound(next);
    initGame(next);
  };

  const handleCardTap = (card: Card) => {
    if (locked || card.matched || flippedIds.includes(card.id) || flippedIds.length >= 2 || completed) return;

    const newFlipped = [...flippedIds, card.id];
    setFlippedIds(newFlipped);

    if (newFlipped.length < 2) return;

    setLocked(true);
    const [id1, id2] = newFlipped;
    const c1 = cards.find(c => c.id === id1);
    const c2 = cards.find(c => c.id === id2);

    if (c1 && c2 && c1.pairId === c2.pairId) {
      speak(MATCH_PRAISE[Math.floor(Math.random() * MATCH_PRAISE.length)]);
      setTimeout(() => {
        setCards(prev => prev.map(c => (c.id === id1 || c.id === id2) ? { ...c, matched: true } : c));
        setFlippedIds([]);
        setLocked(false);
        setMatchedCount(m => {
          const next = m + 1;
          if (next === pairsThisRound) {
            setTotalStars(s => s + 1);
            setCompleted(true);
            setTimeout(() => speak('¡Lo lograste! ¡Terminaste el memorama!'), 400);
          }
          return next;
        });
      }, 700);
    } else {
      speak('No es pareja. ¡Inténtalo de nuevo!');
      setTimeout(() => {
        setFlippedIds([]);
        setLocked(false);
      }, 1100);
    }
  };

  const totalPairs = pairsThisRound;
  const gridCols = totalPairs <= 3 ? 'grid-cols-3' : totalPairs <= 4 ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-5';

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden play-mat-bg font-sans select-none">

      {/* HEADER */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-1.5 bg-white/80 shadow-sm rounded-b-2xl border-b-2 border-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:scale-90 transition-all border-2 border-white shadow-sm"
          >
            <ArrowLeft strokeWidth={3} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-violet-100 px-3 py-1 rounded-full border-2 border-white shadow-sm">
            <Brain className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-600" />
            <span className="text-xs md:text-sm font-black text-violet-600 uppercase tracking-widest hidden sm:block">
              Memorama
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalStars > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border-2 border-amber-200">
              <span className="text-base">⭐</span>
              <span className="font-black text-amber-600 text-sm">{totalStars}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-violet-50 px-3 py-1.5 rounded-full border-2 border-violet-100">
            <span className="text-lg">{matchedCount === totalPairs ? '🏆' : '🧩'}</span>
            <span className="font-black text-violet-600 text-sm">{matchedCount}/{totalPairs}</span>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-grow flex flex-col items-center justify-center gap-6 w-full px-4 py-6 overflow-y-auto custom-scrollbar relative z-10">
        <p className="text-lg sm:text-2xl font-black text-slate-600 text-center shrink-0">
          Voltea dos cartas y encuentra la pareja 🔎
        </p>

        <div className={`grid ${gridCols} gap-3 sm:gap-4 w-full max-w-2xl mx-auto`}>
          {cards.map((card) => {
            const isFaceUp = card.matched || flippedIds.includes(card.id);
            return (
              <motion.button
                key={card.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: card.matched ? 0.4 : 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                whileTap={!isFaceUp && !locked ? { scale: 0.92 } : {}}
                onPointerDown={() => handleCardTap(card)}
                disabled={isFaceUp || locked || card.matched}
                className="relative aspect-square touch-manipulation"
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ transformStyle: 'preserve-3d' }}
                  animate={{ rotateY: isFaceUp ? 180 : 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Reverso — visible cuando está boca abajo */}
                  <div
                    className="absolute inset-0 rounded-2xl sm:rounded-[1.75rem] bg-gradient-to-br from-indigo-400 to-violet-600 border-[5px] border-[#FFF8E9] shadow-[0_6px_0_#4338CA] flex items-center justify-center"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <span className="text-2xl sm:text-4xl opacity-80">🧩</span>
                  </div>
                  {/* Frente — visible cuando está boca arriba */}
                  <div
                    className="absolute inset-0 rounded-2xl sm:rounded-[1.75rem] bg-white border-[5px] border-[#FFF8E9] shadow-[0_6px_0_#E3D5B4] flex items-center justify-center"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <span className="text-3xl sm:text-5xl drop-shadow-sm">{card.emoji}</span>
                  </div>
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ===== OVERLAY VICTORIA ===== */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-900/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 250, damping: 18 }}
              className="bg-white rounded-[3rem] p-8 text-center shadow-2xl border-8 border-yellow-300 max-w-xs w-full"
            >
              <div className="text-5xl mb-2 flex justify-center gap-2">
                <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 0.5, repeat: 3 }}>🎉</motion.span>
                <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.5, repeat: 4 }}>🧠</motion.span>
                <motion.span animate={{ rotate: [0, -20, 20, 0] }} transition={{ duration: 0.5, repeat: 3 }}>🎉</motion.span>
              </div>
              <motion.h3
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-4xl font-black text-violet-600 mb-1"
              >
                ¡LO LOGRASTE!
              </motion.h3>
              <p className="text-violet-400 font-bold mb-1 text-lg">¡Excelente memoria! ⭐</p>
              <p className="text-amber-500 font-black mb-6 text-sm uppercase tracking-wide">⭐ {totalStars} en total</p>
              <button
                onClick={handlePlayAgain}
                className="w-full py-4 bg-violet-500 text-white rounded-2xl font-black text-xl shadow-[0_6px_0_#5b21b6] active:translate-y-1.5 active:shadow-none transition-all"
              >
                🔄 ¡Otra vez! ({Math.min(pairsThisRound + 1, MAX_PAIRS)} parejas)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
