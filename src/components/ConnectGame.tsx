import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft } from 'lucide-react';

interface Item {
  id: string;
  type: 'color' | 'shape';
  value: string;
  label: string;
  icon?: string;
  displayIcon?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
}

type ConnectMode = 'shapes' | 'colors' | 'animals';

// Color de fondo vivo para cada figura — bg + borde + sombra
const ITEM_COLORS: Record<string, { bg: string; border: string; shadow: string; line: string }> = {
  circle: { bg: '#fef9c3', border: '#facc15', shadow: '#ca8a04', line: '#f59e0b' },
  capsule: { bg: '#e0e7ff', border: '#818cf8', shadow: '#3730a3', line: '#4f46e5' },
  trapezoid: { bg: '#ffedd5', border: '#fb923c', shadow: '#9a3412', line: '#f97316' },
  cross: { bg: '#dbeafe', border: '#60a5fa', shadow: '#1e3a8a', line: '#3b82f6' },
  arch: { bg: '#ecfeff', border: '#22d3ee', shadow: '#164e63', line: '#0891b2' },
  triangle: { bg: '#fee2e2', border: '#f87171', shadow: '#7f1d1d', line: '#ef4444' },
  diamond: { bg: '#fef3c7', border: '#fbbf24', shadow: '#78350f', line: '#f59e0b' },
  bowtie: { bg: '#f3e8ff', border: '#a855f7', shadow: '#581c87', line: '#7e22ce' },
  moon: { bg: '#f1f5f9', border: '#94a3b8', shadow: '#334155', line: '#64748b' },
  star4: { bg: '#fefce8', border: '#facc15', shadow: '#a16207', line: '#eab308' },
  puzzle: { bg: '#f7fee7', border: '#a3e635', shadow: '#365314', line: '#65a30d' },
  triangle_base: { bg: '#d1fae5', border: '#34d399', shadow: '#064e3b', line: '#10b981' },
  dog: { bg: '#fff7ed', border: '#fb923c', shadow: '#c2410c', line: '#f97316' },
  cat: { bg: '#fef3c7', border: '#fbbf24', shadow: '#b45309', line: '#f59e0b' },
  fish: { bg: '#e0f2fe', border: '#38bdf8', shadow: '#0369a1', line: '#0ea5e9' },
  bird: { bg: '#dcfce7', border: '#4ade80', shadow: '#15803d', line: '#22c55e' },
  rabbit: { bg: '#fdf2f8', border: '#f472b6', shadow: '#be185d', line: '#ec4899' },
  turtle: { bg: '#ecfdf5', border: '#34d399', shadow: '#065f46', line: '#10b981' },
  lion: { bg: '#fef9c3', border: '#facc15', shadow: '#ca8a04', line: '#eab308' },
  monkey: { bg: '#fee2e2', border: '#f87171', shadow: '#b91c1c', line: '#ef4444' },
};

// Color default si no hay coincidencia
const DEFAULT_ITEM_COLOR = { bg: '#f3f4f6', border: '#9ca3af', shadow: '#374151', line: '#6b7280' };

const getItemColor = (value: string) => ITEM_COLORS[value] ?? DEFAULT_ITEM_COLOR;

const SHAPES = [
  { id: 's1', type: 'shape', value: 'capsule', label: 'Cápsula', icon: '💊' },
  { id: 's2', type: 'shape', value: 'trapezoid', label: 'Trapecio', icon: '⏢' },
  { id: 's3', type: 'shape', value: 'cross', label: 'Cruz', icon: '➕' },
  { id: 's4', type: 'shape', value: 'arch', label: 'Arco', icon: '⛩️' },
  { id: 's5', type: 'shape', value: 'triangle', label: 'Triángulo Isósceles', icon: '🔺' },
  { id: 's6', type: 'shape', value: 'diamond', label: 'Diamante', icon: '💎' },
  { id: 's7', type: 'shape', value: 'bowtie', label: 'Muesca Bloque', icon: '🎀' },
  { id: 's8', type: 'shape', value: 'moon', label: 'Luna Smooth', icon: '🌙' },
  { id: 's9', type: 'shape', value: 'star4', label: 'Estrella 4 Puntas', icon: '✦' },
  { id: 's10', type: 'shape', value: 'circle', label: 'Círculo', icon: '⭕' },
  { id: 's11', type: 'shape', value: 'puzzle', label: 'Puzzle Real', icon: '🧩' },
  { id: 's12', type: 'shape', value: 'triangle_base', label: 'Triángulo Base', icon: '📐' },
];

const COLORS = [
  { id: 'c1', type: 'color', value: '#ef4444', label: 'Rojo' },
  { id: 'c2', type: 'color', value: '#22c55e', label: 'Verde' },
  { id: 'c3', type: 'color', value: '#3b82f6', label: 'Azul' },
  { id: 'c4', type: 'color', value: '#eab308', label: 'Amarillo' },
  { id: 'c5', type: 'color', value: '#a855f7', label: 'Morado' },
  { id: 'c6', type: 'color', value: '#f97316', label: 'Naranja' },
  { id: 'c7', type: 'color', value: '#ec4899', label: 'Rosa' },
  { id: 'c8', type: 'color', value: '#06b6d4', label: 'Celeste' },
];

const ANIMALS = [
  { id: 'a1', type: 'shape', value: 'dog', label: 'Perro', icon: '🐶' },
  { id: 'a2', type: 'shape', value: 'cat', label: 'Gato', icon: '🐱' },
  { id: 'a3', type: 'shape', value: 'fish', label: 'Pez', icon: '🐟' },
  { id: 'a4', type: 'shape', value: 'bird', label: 'Pájaro', icon: '🐦' },
  { id: 'a5', type: 'shape', value: 'rabbit', label: 'Conejo', icon: '🐰' },
  { id: 'a6', type: 'shape', value: 'turtle', label: 'Tortuga', icon: '🐢' },
  { id: 'a7', type: 'shape', value: 'lion', label: 'León', icon: '🦁' },
  { id: 'a8', type: 'shape', value: 'monkey', label: 'Mono', icon: '🐵' },
];

const MODES = [
  { key: 'shapes', label: 'Figuras', icon: '⭐' },
  { key: 'colors', label: 'Colores', icon: '🎨' },
  { key: 'animals', label: 'Animales', icon: '🐶' },
] as const;

const PRAISE_MESSAGES = [
  '¡Muy bien! 🎉',
  '¡Genial! ⭐',
  '¡Perfecto! 🌟',
  '¡Súper! 🚀',
  '¡Lo lograste! 🏆',
];

const MODE_HINTS: Record<ConnectMode, string> = {
  shapes: 'Conecta la misma figura.',
  colors: 'Conecta el mismo color.',
  animals: 'Conecta el mismo animal.',
};

const PAIRS_PER_ROUND = 3;

const CONFETTI_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9ff3', '#ff6348'];

let particleId = 0;

export default function ConnectGame({ onBack, isFirstTime, onVisit }: {
  onBack: () => void;
  isFirstTime: boolean;
  onVisit: () => void;
}) {
  const [mode, setMode] = useState<ConnectMode>('shapes');
  const [leftItems, setLeftItems] = useState<Item[]>([]);
  const [rightItems, setRightItems] = useState<Item[]>([]);
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [correctFlash, setCorrectFlash] = useState<string | null>(null); // leftId que acaba de conectar
  const [wrongFlash, setWrongFlash] = useState<boolean>(false);
  const [draggingFrom, setDraggingFrom] = useState<{ id: string; side: 'left' | 'right' } | null>(null);
  const [selectedTap, setSelectedTap] = useState<{ id: string; side: 'left' | 'right' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [completed, setCompleted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [praiseText, setPraiseText] = useState('');
  const [praiseVisible, setPraiseVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const ignoreNextClickRef = useRef(false);

  useEffect(() => {
    initGame();
    if (isFirstTime) {
      speak('¡Hola! Toca o arrastra para unir los iguales.');
      onVisit();
    } else {
      speak(MODE_HINTS[mode]);
    }
  }, [mode]);

  const initGame = () => {
    let pool: any[] = [];
    if (mode === 'shapes') pool = SHAPES;
    else if (mode === 'colors') pool = COLORS;
    else pool = ANIMALS;

    const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, PAIRS_PER_ROUND);

    const left = selected.map(item => ({ ...item, displayIcon: item.icon || '' }))
      .sort(() => Math.random() - 0.5);

    const right = selected.map(item => ({
      ...item,
      displayIcon: item.icon || '',
    })).sort(() => Math.random() - 0.5);

    setLeftItems(left);
    setRightItems(right);
    setConnections({});
    setSelectedTap(null);
    setCompleted(false);
    setParticles([]);
    setPraiseVisible(false);
  };

  const spawnParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: particleId++,
      x,
      y,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      angle: (i / 12) * 360,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  }, []);

  const showPraise = useCallback((msg: string) => {
    setPraiseText(msg);
    setPraiseVisible(true);
    setTimeout(() => setPraiseVisible(false), 1200);
  }, []);

  const updateMousePosFromClient = (clientX: number, clientY: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: clientX - rect.left, y: clientY - rect.top });
    }
  };

  const handleDragStart = (
    id: string,
    side: 'left' | 'right',
    clientX: number,
    clientY: number,
  ) => {
    if (completed) return;
    const isConnected = side === 'left'
      ? connections[id]
      : Object.values(connections).includes(id);
    if (isConnected) return;

    ignoreNextClickRef.current = true;
    setDraggingFrom({ id, side });
    setSelectedTap({ id, side });
    updateMousePosFromClient(clientX, clientY);
  };

  const handleMouseDown = (id: string, side: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(id, side, e.clientX, e.clientY);
  };

  const handleTouchStart = (id: string, side: 'left' | 'right', e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    handleDragStart(id, side, t.clientX, t.clientY);
  };

  const connectPair = (leftId: string, rightId: string, point?: { x: number; y: number }): boolean => {
    const leftItem = leftItems.find(i => i.id === leftId);
    const rightItem = rightItems.find(i => i.id === rightId);
    if (!leftItem || !rightItem) return false;

    if (leftItem.value === rightItem.value) {
      const newConnections = { ...connections, [leftItem.id]: rightItem.id };
      setConnections(newConnections);
      setCorrectFlash(leftItem.id);
      setTimeout(() => setCorrectFlash(null), 600);

      if (point && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        spawnParticles(point.x - containerRect.left, point.y - containerRect.top);
      }

      const praise = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
      speak(praise.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ !]/g, ''));
      showPraise(praise);

      if (Object.keys(newConnections).length === leftItems.length) {
        setCompleted(true);
        setTimeout(() => speak('¡Lo lograste! ¡Eres una estrella!'), 600);
      }
      return true;
    }

    setWrongFlash(true);
    setTimeout(() => setWrongFlash(false), 500);
    speak('¡Casi! Busca el igual.');
    return false;
  };

  const findNearestTargetId = (
    side: 'left' | 'right',
    clientX: number,
    clientY: number,
    maxDistance = 190,
  ): string | null => {
    const refs = side === 'left' ? leftRefs.current : rightRefs.current;
    const occupiedIds = new Set(
      side === 'left' ? Object.keys(connections) : Object.values(connections),
    );

    let bestId: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    Object.entries(refs).forEach(([id, el]) => {
      if (!el || occupiedIds.has(id)) return;
      const rect = (el as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const d = Math.hypot(clientX - cx, clientY - cy);
      if (d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    });

    if (bestDist <= maxDistance) return bestId;
    return null;
  };

  const completeDragAtPoint = (clientX: number, clientY: number) => {
    if (!draggingFrom) return;

    const elements = document.elementsFromPoint(clientX, clientY);
    const oppositeSide = draggingFrom.side === 'left' ? 'right' : 'left';
    const targetElement = elements.find(el => el.hasAttribute(`data-${oppositeSide}-id`));
    const targetIdFromMagnet = findNearestTargetId(oppositeSide, clientX, clientY);
    const targetId = targetElement?.getAttribute(`data-${oppositeSide}-id`) ?? targetIdFromMagnet;

    if (targetId) {
      const leftId = draggingFrom.side === 'left' ? draggingFrom.id : targetId;
      const rightId = draggingFrom.side === 'right' ? draggingFrom.id : targetId;
      connectPair(leftId, rightId, { x: clientX, y: clientY });
    }

    setDraggingFrom(null);
    setSelectedTap(null);
    window.setTimeout(() => {
      ignoreNextClickRef.current = false;
    }, 120);
  };

  const handleTapConnect = (id: string, side: 'left' | 'right') => {
    if (completed || ignoreNextClickRef.current) return;
    const isConnected = side === 'left'
      ? Boolean(connections[id])
      : Object.values(connections).includes(id);
    if (isConnected) return;

    if (!selectedTap) {
      setSelectedTap({ id, side });
      return;
    }

    if (selectedTap.side === side) {
      setSelectedTap({ id, side });
      return;
    }

    const leftId = side === 'left' ? id : selectedTap.id;
    const rightId = side === 'right' ? id : selectedTap.id;
    connectPair(leftId, rightId);
    setSelectedTap(null);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingFrom) updateMousePosFromClient(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      completeDragAtPoint(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!draggingFrom) return;
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      updateMousePosFromClient(t.clientX, t.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!draggingFrom) return;
      const t = e.changedTouches[0];
      if (!t) {
        setDraggingFrom(null);
        return;
      }
      e.preventDefault();
      completeDragAtPoint(t.clientX, t.clientY);
    };

    const handleTouchCancel = () => {
      setDraggingFrom(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: false });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [draggingFrom, leftItems, rightItems, connections, spawnParticles, showPraise]);

  const getLineCoords = (leftId: string, rightId: string) => {
    const leftEl = leftRefs.current[leftId];
    const rightEl = rightRefs.current[rightId];
    if (!leftEl || !rightEl || !containerRef.current) return null;

    const cr = containerRef.current.getBoundingClientRect();
    const lr = leftEl.getBoundingClientRect();
    const rr = rightEl.getBoundingClientRect();

    return {
      x1: lr.right - cr.left - 10,
      y1: lr.top + lr.height / 2 - cr.top,
      x2: rr.left - cr.left + 10,
      y2: rr.top + rr.height / 2 - cr.top,
    };
  };

  const getDragLine = () => {
    if (!draggingFrom || !containerRef.current) return null;
    const isLeft = draggingFrom.side === 'left';
    const startEl = isLeft ? leftRefs.current[draggingFrom.id] : rightRefs.current[draggingFrom.id];
    if (!startEl) return null;
    const cr = containerRef.current.getBoundingClientRect();
    const sr = startEl.getBoundingClientRect();
    return {
      x1: isLeft ? sr.right - cr.left - 10 : sr.left - cr.left + 10,
      y1: sr.top + sr.height / 2 - cr.top,
      x2: mousePos.x,
      y2: mousePos.y,
    };
  };

  const totalPairs = leftItems.length;
  const connectedPairs = Object.keys(connections).length;
  const progressPct = totalPairs > 0 ? (connectedPairs / totalPairs) * 100 : 0;

  return (
    <div
      className={`h-[100dvh] flex flex-col w-full overflow-hidden font-sans select-none transition-all duration-300 ${wrongFlash
          ? 'bg-gradient-to-b from-red-100 via-red-50 to-pink-50'
          : 'bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50'
        } touch-none`}
      style={{ touchAction: 'none' }}
    >
      {/* HEADER */}
      <div className="relative z-40 flex items-center justify-between px-3 py-2 bg-white/90 shadow-sm rounded-b-3xl border-b-4 border-white">
        <button
          onClick={onBack}
          className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:scale-90 transition-all border-2 border-white shadow-sm"
        >
          <ArrowLeft strokeWidth={3} className="w-5 h-5" />
        </button>

        {/* Selector de modos con iconos grandes */}
        <div className="flex gap-1.5">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl font-black transition-all border-2 text-sm ${mode === m.key
                  ? 'bg-indigo-500 text-white border-indigo-300 shadow-md scale-105'
                  : 'bg-white text-indigo-400 border-indigo-100 hover:bg-indigo-50'
                }`}
            >
              <span className="text-base">{m.icon}</span>
              <span className="hidden sm:inline text-xs uppercase tracking-wide">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Progreso */}
        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border-2 border-indigo-100">
          <span className="text-lg">{connectedPairs === totalPairs && totalPairs > 0 ? '🏆' : '🎯'}</span>
          <span className="font-black text-indigo-600 text-sm">{connectedPairs}/{totalPairs}</span>
        </div>
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="px-6 pt-2 pb-1 z-30">
        <div className="w-full h-4 bg-indigo-100 rounded-full overflow-hidden border-2 border-white shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </div>
        {/* Emojis de progreso */}
        <div className="flex justify-between mt-1 px-1">
          {Array.from({ length: totalPairs }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: i < connectedPairs ? 1 : 0.6, opacity: i < connectedPairs ? 1 : 0.3 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-lg"
            >
              {i < connectedPairs ? '⭐' : '○'}
            </motion.span>
          ))}
        </div>
      </div>

      {/* ÁREA DE JUEGO */}
      <div
        ref={containerRef}
        className="flex-grow relative flex items-center justify-center px-4 md:px-20 py-6 touch-none"
      >
        {/* SVG líneas */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {Object.entries(connections).map(([leftId, rightId]) => {
            const coords = getLineCoords(leftId as string, rightId as string);
            if (!coords) return null;
            const isNew = correctFlash === leftId;
            const leftItem = leftItems.find(i => i.id === leftId);
            const lineColor = leftItem ? getItemColor(leftItem.value).line : '#818cf8';
            return (
              <g key={`${leftId}-${rightId}`}>
                {/* Sombra oscura para que la línea siempre se vea sobre fondos claros */}
                <motion.line
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  x1={coords.x1} y1={coords.y1}
                  x2={coords.x2} y2={coords.y2}
                  stroke="#312e81"
                  strokeOpacity={0.35}
                  strokeWidth={isNew ? 24 : 18}
                  strokeLinecap="round"
                />
                {/* Línea de color principal */}
                <motion.line
                  initial={{ opacity: 0, strokeWidth: 0 }}
                  animate={{ opacity: 1, strokeWidth: isNew ? 16 : 12 }}
                  transition={{ duration: 0.3 }}
                  x1={coords.x1} y1={coords.y1}
                  x2={coords.x2} y2={coords.y2}
                  stroke={lineColor}
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
                {/* Punto de anclaje izquierdo */}
                <motion.circle
                  initial={{ r: 0 }} animate={{ r: isNew ? 12 : 10 }}
                  cx={coords.x1} cy={coords.y1}
                  fill={lineColor} stroke="#312e81" strokeWidth="2.5"
                />
                {/* Punto de anclaje derecho */}
                <motion.circle
                  initial={{ r: 0 }} animate={{ r: isNew ? 12 : 10 }}
                  cx={coords.x2} cy={coords.y2}
                  fill={lineColor} stroke="#312e81" strokeWidth="2.5"
                />
              </g>
            );
          })}

          {draggingFrom && (() => {
            const coords = getDragLine();
            if (!coords) return null;
            return (
              <line
                x1={coords.x1} y1={coords.y1}
                x2={coords.x2} y2={coords.y2}
                stroke="#4338ca"
                strokeWidth="10"
                strokeDasharray="14,8"
                strokeOpacity="0.9"
                strokeLinecap="round"
              />
            );
          })()}
        </svg>

        {/* Partículas de celebración */}
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute w-4 h-4 rounded-full pointer-events-none z-50"
            style={{ left: p.x, top: p.y, backgroundColor: p.color }}
            initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
            animate={{
              scale: 0,
              opacity: 0,
              x: Math.cos((p.angle * Math.PI) / 180) * 80,
              y: Math.sin((p.angle * Math.PI) / 180) * 80,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ))}

        {/* Texto de alabanza flotante */}
        <AnimatePresence>
          {praiseVisible && (
            <motion.div
              key={praiseText}
              initial={{ scale: 0.5, opacity: 0, y: 0 }}
              animate={{ scale: 1.4, opacity: 1, y: -30 }}
              exit={{ scale: 0.5, opacity: 0, y: -80 }}
              transition={{ duration: 0.4 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
            >
              <span className="text-4xl font-black text-white drop-shadow-[0_4px_8px_rgba(99,102,241,0.8)] bg-indigo-500 px-6 py-3 rounded-3xl border-4 border-white whitespace-nowrap">
                {praiseText}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items */}
        <div className="w-full h-full max-w-4xl flex justify-between items-center relative z-10">
          {/* Columna Izquierda */}
          <div className="flex flex-col gap-6 md:gap-10">
            {leftItems.map((item) => {
              const isConnected = !!connections[item.id];
              const isFlashing = correctFlash === item.id;
              const c = getItemColor(item.value);
              return (
                <motion.div
                  key={item.id}
                  ref={el => leftRefs.current[item.id] = el}
                  data-left-id={item.id}
                  onMouseDown={(e) => handleMouseDown(item.id, 'left', e)}
                  onTouchStart={(e) => handleTouchStart(item.id, 'left', e)}
                  onClick={() => handleTapConnect(item.id, 'left')}
                  animate={isFlashing
                    ? { scale: [1, 1.3, 0.95, 1.1, 1], rotate: [0, -5, 5, -3, 0] }
                    : selectedTap?.id === item.id && selectedTap.side === 'left'
                      ? { scale: 1.12, opacity: 1 }
                      : { scale: 1, opacity: 1 }
                  }
                  transition={{ duration: 0.5 }}
                  whileHover={!isConnected ? { scale: 1.1 } : {}}
                  whileTap={!isConnected ? { scale: 0.92 } : {}}
                  style={{
                    backgroundColor: isFlashing ? '#d1fae5' : c.bg,
                    borderColor: isFlashing ? '#4ade80' : isConnected ? c.border : c.border,
                    boxShadow: isFlashing
                      ? '0 0 0 6px #86efac'
                      : isConnected
                        ? `0 6px 0 ${c.shadow}`
                        : `0 8px 0 ${c.shadow}`,
                    touchAction: 'none',
                  }}
                  className={`
                    w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-[2rem] md:rounded-[2.5rem]
                    flex flex-col items-center justify-center gap-1 text-4xl sm:text-5xl md:text-6xl
                    border-4 cursor-pointer transition-colors relative
                  `}
                >
                  {item.type === 'color' ? (
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-white/60" style={{ backgroundColor: item.value }} />
                  ) : (
                    <span className="text-slate-800 leading-none">{item.icon}</span>
                  )}
                  <span className="text-[11px] sm:text-sm font-black text-slate-700 leading-none">{item.label}</span>
                  {/* Checkmark cuando está conectado */}
                  {isConnected && !isFlashing && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-400 border-3 border-white flex items-center justify-center text-sm font-black text-white shadow-md"
                      style={{ border: '3px solid white' }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Etiqueta central */}
          <div className="flex flex-col items-center gap-2 z-10 px-2">
            {connectedPairs < totalPairs && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="bg-white/95 rounded-2xl px-3 py-2 text-center shadow-lg border-2 border-indigo-100 max-w-[180px]"
              >
                <p className="text-[11px] sm:text-xs font-black text-indigo-500 uppercase leading-tight">
                  {selectedTap
                    ? 'Ahora toca su igual del otro lado'
                    : 'Toca o arrastra para unir iguales'}
                </p>
              </motion.div>
            )}
          </div>

          {/* Columna Derecha */}
          <div className="flex flex-col gap-6 md:gap-10">
            {rightItems.map((item) => {
              const isConnected = Object.values(connections).includes(item.id);
              const matchLeftId = Object.entries(connections).find(([, rId]) => rId === item.id)?.[0];
              const isFlashing = matchLeftId ? correctFlash === matchLeftId : false;
              const c = getItemColor(item.value);
              return (
                <motion.div
                  key={item.id}
                  ref={el => rightRefs.current[item.id] = el}
                  data-right-id={item.id}
                  onMouseDown={(e) => handleMouseDown(item.id, 'right', e)}
                  onTouchStart={(e) => handleTouchStart(item.id, 'right', e)}
                  onClick={() => handleTapConnect(item.id, 'right')}
                  animate={isFlashing
                    ? { scale: [1, 1.3, 0.95, 1.1, 1], rotate: [0, 5, -5, 3, 0] }
                    : selectedTap?.id === item.id && selectedTap.side === 'right'
                      ? { scale: 1.12, opacity: 1 }
                      : { scale: 1, opacity: 1 }
                  }
                  transition={{ duration: 0.5 }}
                  whileHover={!isConnected ? { scale: 1.1 } : {}}
                  style={{
                    backgroundColor: isFlashing ? '#d1fae5' : c.bg,
                    borderColor: isFlashing ? '#4ade80' : c.border,
                    boxShadow: isFlashing
                      ? '0 0 0 6px #86efac'
                      : isConnected
                        ? `0 6px 0 ${c.shadow}`
                        : `0 8px 0 ${c.shadow}`,
                    touchAction: 'none',
                  }}
                  className={`
                    w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-[2rem] md:rounded-[2.5rem]
                    flex flex-col items-center justify-center gap-1 text-4xl sm:text-5xl md:text-6xl
                    border-4 transition-colors relative cursor-pointer
                  `}
                >
                  {item.type === 'color' ? (
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-white/60" style={{ backgroundColor: item.value }} />
                  ) : (
                    <span className="text-slate-800 leading-none">{item.displayIcon}</span>
                  )}
                  <span className="text-[11px] sm:text-sm font-black text-slate-700 leading-none">{item.label}</span>
                  {isConnected && !isFlashing && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-400 flex items-center justify-center text-sm font-black text-white shadow-md"
                      style={{ border: '3px solid white' }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
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
                {/* Confeti decorativo */}
                <div className="text-5xl mb-2 flex justify-center gap-2">
                  <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 0.5, repeat: 3 }}>🎉</motion.span>
                  <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.5, repeat: 4 }}>🏆</motion.span>
                  <motion.span animate={{ rotate: [0, -20, 20, 0] }} transition={{ duration: 0.5, repeat: 3 }}>🎉</motion.span>
                </div>
                <motion.h3
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-4xl font-black text-indigo-600 mb-1"
                >
                  ¡LO LOGRASTE!
                </motion.h3>
                <p className="text-indigo-400 font-bold mb-6 text-lg">¡Eres una estrella! ⭐</p>
                <div className="flex gap-3">
                  <button
                    onClick={initGame}
                    className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black text-xl shadow-[0_6px_0_#4338ca] active:translate-y-1.5 active:shadow-none transition-all"
                  >
                    🔄 ¡Otra vez!
                  </button>
                </div>
                {/* Selector rápido de modo */}
                <div className="flex gap-2 mt-3">
                  {MODES.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setMode(m.key)}
                      className={`flex-1 py-3 rounded-xl font-black text-sm transition-all border-2 ${mode === m.key
                          ? 'bg-yellow-400 text-yellow-900 border-yellow-300'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      {m.icon}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Indicador de feedback de error */}
      <AnimatePresence>
        {wrongFlash && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-lg shadow-xl border-4 border-white"
          >
            ❌ ¡Ups! Busca el igual.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
