import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak, speakAndWait } from '../lib/speech';
import { ArrowLeft, Sparkles, Trash2, Eraser, Check, Palette, Smile } from 'lucide-react';
import TutorOwl from './TutorOwl';
import { useAI } from '../lib/aiContext';
import { askAI, classifyAIError } from '../lib/ai';

// Colores gomita para pintar
const BRUSH_COLORS = [
  { name: 'Mágico', value: 'rainbow', class: 'bg-gradient-to-tr from-pink-400 via-yellow-400 to-cyan-400 animate-pulse', shadow: 'shadow-[0_6px_0_#64748B]' },
  { name: 'Morado', value: '#A855F7', class: 'bg-purple-500', shadow: 'shadow-[0_6px_0_#7E22CE]' },
  { name: 'Rosa', value: '#EC4899', class: 'bg-pink-500', shadow: 'shadow-[0_6px_0_#BE185D]' },
  { name: 'Azul', value: '#3B82F6', class: 'bg-blue-500', shadow: 'shadow-[0_6px_0_#1D4ED8]' },
  { name: 'Naranja', value: '#F97316', class: 'bg-orange-500', shadow: 'shadow-[0_6px_0_#C2410C]' },
  { name: 'Verde', value: '#22C55E', class: 'bg-green-500', shadow: 'shadow-[0_6px_0_#15803D]' },
];

const SHAPE_NAMES: Record<string, string> = {
  '◯': 'el círculo',
  '□': 'el cuadrado',
  '△': 'el triángulo',
  '☆': 'la estrella',
  '♡': 'el corazón',
  '◇': 'el rombo',
  '☾': 'la luna'
};

const TARGETS = {
  vowels: ['A', 'E', 'I', 'O', 'U'],
  numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  shapes: ['◯', '□', '△', '☆', '♡', '◇', '☾']
};

interface Point {
  x: number;
  y: number;
}

type Stroke = Point[];

const TRACE_PATHS: Record<string, Stroke[]> = {
  // Vocales
  'A': [
    [{ x: 50, y: 15 }, { x: 25, y: 85 }], // Trazo 1: diagonal izquierda
    [{ x: 50, y: 15 }, { x: 75, y: 85 }], // Trazo 2: diagonal derecha
    [{ x: 33, y: 55 }, { x: 67, y: 55 }]  // Trazo 3: barra media
  ],
  'E': [
    [{ x: 70, y: 15 }, { x: 30, y: 15 }, { x: 30, y: 85 }, { x: 70, y: 85 }], // Trazo 1: barra sup, espina, barra inf
    [{ x: 30, y: 50 }, { x: 60, y: 50 }]                                      // Trazo 2: barra central
  ],
  'I': [
    [{ x: 30, y: 15 }, { x: 70, y: 15 }], // Trazo 1: barra superior
    [{ x: 50, y: 15 }, { x: 50, y: 85 }], // Trazo 2: línea vertical
    [{ x: 30, y: 85 }, { x: 70, y: 85 }]  // Trazo 3: barra inferior
  ],
  'O': [
    [
      { x: 50, y: 15 },
      { x: 75, y: 22 },
      { x: 85, y: 50 },
      { x: 75, y: 78 },
      { x: 50, y: 85 },
      { x: 25, y: 78 },
      { x: 15, y: 50 },
      { x: 25, y: 22 },
      { x: 50, y: 15 }
    ] // Trazo 1: círculo completo
  ],
  'U': [
    [
      { x: 25, y: 15 },
      { x: 25, y: 55 },
      { x: 30, y: 78 },
      { x: 50, y: 85 },
      { x: 70, y: 78 },
      { x: 75, y: 55 },
      { x: 75, y: 15 }
    ] // Trazo 1: curva de la U
  ],
  // Números
  '0': [
    [
      { x: 50, y: 15 },
      { x: 75, y: 22 },
      { x: 85, y: 50 },
      { x: 75, y: 78 },
      { x: 50, y: 85 },
      { x: 25, y: 78 },
      { x: 15, y: 50 },
      { x: 25, y: 22 },
      { x: 50, y: 15 }
    ]
  ],
  '1': [
    [{ x: 35, y: 35 }, { x: 50, y: 15 }], // Ganchito
    [{ x: 50, y: 15 }, { x: 50, y: 85 }], // Línea vertical
    [{ x: 30, y: 85 }, { x: 70, y: 85 }]  // Base
  ],
  '2': [
    [
      { x: 28, y: 30 },
      { x: 38, y: 16 },
      { x: 62, y: 16 },
      { x: 72, y: 30 },
      { x: 72, y: 45 },
      { x: 30, y: 85 }
    ], // Curva superior y diagonal
    [{ x: 30, y: 85 }, { x: 72, y: 85 }]  // Base horizontal
  ],
  '3': [
    [{ x: 30, y: 20 }, { x: 70, y: 20 }, { x: 50, y: 48 }], // Bucle superior
    [{ x: 50, y: 48 }, { x: 72, y: 62 }, { x: 68, y: 82 }, { x: 45, y: 85 }, { x: 30, y: 78 }] // Bucle inferior
  ],
  '4': [
    [{ x: 60, y: 15 }, { x: 25, y: 60 }, { x: 75, y: 60 }], // L vertical-diagonal-horizontal
    [{ x: 60, y: 40 }, { x: 60, y: 85 }]  // Cruz vertical
  ],
  '5': [
    [{ x: 35, y: 15 }, { x: 35, y: 45 }, { x: 65, y: 52 }, { x: 65, y: 78 }, { x: 50, y: 85 }, { x: 35, y: 78 }], // Espina y bucle
    [{ x: 35, y: 15 }, { x: 65, y: 15 }]  // Techo
  ],
  '6': [
    [
      { x: 65, y: 15 },
      { x: 42, y: 32 },
      { x: 30, y: 55 },
      { x: 35, y: 80 },
      { x: 65, y: 80 },
      { x: 70, y: 60 },
      { x: 55, y: 48 },
      { x: 35, y: 55 }
    ] // Espiral y círculo inferior
  ],
  '7': [
    [{ x: 30, y: 15 }, { x: 70, y: 15 }, { x: 45, y: 85 }], // Techo y diagonal
    [{ x: 37, y: 50 }, { x: 57, y: 50 }]  // Barra horizontal
  ],
  '8': [
    [
      { x: 50, y: 50 },
      { x: 30, y: 32 },
      { x: 50, y: 15 },
      { x: 70, y: 32 },
      { x: 50, y: 50 },
      { x: 30, y: 68 },
      { x: 50, y: 85 },
      { x: 70, y: 68 },
      { x: 50, y: 50 }
    ] // Ocho continuo
  ],
  '9': [
    [
      { x: 68, y: 50 },
      { x: 42, y: 50 },
      { x: 32, y: 32 },
      { x: 50, y: 15 },
      { x: 68, y: 32 },
      { x: 68, y: 85 }
    ] // Cabeza redonda y cola vertical
  ],
  '10': [
    // El 1
    [{ x: 20, y: 35 }, { x: 30, y: 15 }, { x: 30, y: 85 }],
    // El 0
    [
      { x: 65, y: 15 },
      { x: 78, y: 22 },
      { x: 85, y: 50 },
      { x: 78, y: 78 },
      { x: 65, y: 85 },
      { x: 52, y: 78 },
      { x: 45, y: 50 },
      { x: 52, y: 22 },
      { x: 65, y: 15 }
    ]
  ],
  // Figuras
  '◯': [
    [
      { x: 50, y: 15 },
      { x: 75, y: 25 },
      { x: 85, y: 50 },
      { x: 75, y: 75 },
      { x: 50, y: 85 },
      { x: 25, y: 75 },
      { x: 15, y: 50 },
      { x: 25, y: 25 },
      { x: 50, y: 15 }
    ]
  ],
  '□': [
    [{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 80 }, { x: 20, y: 80 }, { x: 20, y: 20 }]
  ],
  '△': [
    [{ x: 50, y: 15 }, { x: 80, y: 85 }, { x: 20, y: 85 }, { x: 50, y: 15 }]
  ],
  '☆': [
    [
      { x: 50, y: 15 },
      { x: 61, y: 38 },
      { x: 86, y: 38 },
      { x: 66, y: 53 },
      { x: 73, y: 79 },
      { x: 50, y: 63 },
      { x: 27, y: 79 },
      { x: 34, y: 53 },
      { x: 14, y: 38 },
      { x: 39, y: 38 },
      { x: 50, y: 15 }
    ]
  ],
  '♡': [
    [
      { x: 50, y: 30 },
      { x: 35, y: 15 },
      { x: 15, y: 30 },
      { x: 20, y: 55 },
      { x: 50, y: 85 },
      { x: 80, y: 55 },
      { x: 85, y: 30 },
      { x: 65, y: 15 },
      { x: 50, y: 30 }
    ]
  ],
  '◇': [
    [{ x: 50, y: 15 }, { x: 80, y: 50 }, { x: 50, y: 85 }, { x: 20, y: 50 }, { x: 50, y: 15 }]
  ],
  '☾': [
    [
      { x: 35, y: 15 },
      { x: 60, y: 25 },
      { x: 70, y: 50 },
      { x: 60, y: 75 },
      { x: 35, y: 85 },
      { x: 50, y: 72 },
      { x: 55, y: 50 },
      { x: 50, y: 28 },
      { x: 35, y: 15 }
    ]
  ]
};

interface Particle {
  id: number;
  emoji: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  duration?: number;
}

export default function TraceGame({ onBack, isFirstTime, onVisit }: { onBack: () => void; isFirstTime: boolean; onVisit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastX = useRef<number | null>(null);
  const lastY = useRef<number | null>(null);
  const hueRef = useRef<number>(0);
  const { isEnabled: aiEnabled, recordUsage } = useAI();

  const [activeTab, setActiveTab] = useState<'vowels' | 'numbers' | 'shapes'>('vowels');
  const [selectedChar, setSelectedChar] = useState('A');
  const [brushColor, setBrushColor] = useState(BRUSH_COLORS[0]); // default Mágico
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Estados para el modo guiado
  const [isGuided, setIsGuided] = useState(true);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [completedStrokes, setCompletedStrokes] = useState<Stroke[]>([]);
  const [currentDrawnPoints, setCurrentDrawnPoints] = useState<Point[]>([]);
  const [completedDrawnPaths, setCompletedDrawnPaths] = useState<Point[][]>([]);
  const [visitedIndices, setVisitedIndices] = useState<number[]>([]);
  const [showNextButton, setShowNextButton] = useState(false);
  const [drawingPointer, setDrawingPointer] = useState<Point | null>(null);

  // Estados de IA y tutor
  const [owlMessage, setOwlMessage] = useState('¡Vamos a trazar letras y números! Toca una arriba para empezar.');
  const [isChecking, setIsChecking] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const hasSpoken = useRef(false);

  const resetGuidedState = () => {
    setCurrentStrokeIndex(0);
    setCompletedStrokes([]);
    setCompletedDrawnPaths([]);
    setCurrentDrawnPoints([]);
    setVisitedIndices([]);
    setShowNextButton(false);
    setDrawingPointer(null);
  };

  // Función matemática de apoyo: distancia de un punto p a un segmento v-w
  const distToSegment = (p: Point, v: Point, w: Point) => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  };

  // Inicialización de voz al entrar
  useEffect(() => {
    if (hasSpoken.current) return;
    hasSpoken.current = true;
    if (isFirstTime) {
      speak('¡Trazos mágicos! Con tu dedito, sigue el camino para dibujar.');
      onVisit();
    } else {
      speak('¡Vamos a dibujar las vocales y los números!');
    }
  }, [isFirstTime, onVisit]);

  // Prevenir gestos de zoom táctil y rebote de página en iPad/iOS Safari
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefault = (e: TouchEvent) => {
      // Bloquea el desplazamiento del dedo sobre el canvas en Safari
      if (e.touches.length <= 1) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.addEventListener('touchmove', preventDefault, { passive: false });
    canvas.addEventListener('touchend', preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefault);
      canvas.removeEventListener('touchmove', preventDefault);
      canvas.removeEventListener('touchend', preventDefault);
    };
  }, []);

  // Redibujar la plantilla cuando cambie el carácter seleccionado, pestaña, tamaño o modo
  useEffect(() => {
    resetGuidedState();
    resetCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChar, activeTab, isGuided]);

  // Configurar el canvas y el listener para reajustes
  useEffect(() => {
    const handleResize = () => {
      resetCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChar, activeTab, isGuided]);

  const drawTemplate = (ctx: CanvasRenderingContext2D, width: number, height: number, char: string) => {
    ctx.save();

    // Rellenar de blanco el fondo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calcular un tamaño de letra adecuado que quepa en el canvas
    const size = Math.min(width, height) * 0.72;
    ctx.font = `900 ${size}px "Comic Sans MS", "Chalkboard SE", "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Dibujar relleno suave (celeste pastel) para guiar la forma
    ctx.fillStyle = '#F0F9FF';
    ctx.fillText(char, width / 2, height / 2 + size * 0.05);

    // 2. Dibujar contorno punteado (Línea discontinua celeste)
    ctx.strokeStyle = '#93C5FD'; // Celeste claro de alta visibilidad para niños
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([12, 12]); // Punteado grande e infantil
    ctx.strokeText(char, width / 2, height / 2 + size * 0.05);

    ctx.restore();
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Dimensionar físicamente el canvas por el pixel ratio (Retina / High-DPI)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Fijar el tamaño en píxeles CSS
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Escalar todas las operaciones de dibujo
      ctx.scale(dpr, dpr);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 20; // Pincel más grueso ideal para niños
      if (!isGuided) {
        drawTemplate(ctx, rect.width, rect.height, selectedChar);
      }
    }
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    if (!isGuided) {
      ctx.restore();
      return;
    }

    // 1. Rellenar de blanco el fondo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const strokes = TRACE_PATHS[selectedChar] || [];
    const scaleX = (val: number) => (val * width) / 100;
    const scaleY = (val: number) => (val * height) / 100;

    // 2. Dibujar las carreteras guías (todas las del carácter)
    strokes.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(scaleX(stroke[0].x), scaleY(stroke[0].y));
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(scaleX(stroke[i].x), scaleY(stroke[i].y));
      }
      // Dibujar carretera base gris suave
      ctx.strokeStyle = '#F1F5F9';
      ctx.lineWidth = 55;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Contorno interno un poco más oscuro
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 45;
      ctx.stroke();

      // Línea discontinua central
      ctx.strokeStyle = '#93C5FD';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 16]);
      ctx.stroke();
      ctx.restore();
    });

    // 3. Dibujar los trazos ya completados por el niño (su dibujo real freehand)
    completedDrawnPaths.forEach((path) => {
      if (path.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(scaleX(path[0].x), scaleY(path[0].y));
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(scaleX(path[i].x), scaleY(path[i].y));
      }
      ctx.strokeStyle = '#10B981'; // Verde esmeralda premium
      ctx.lineWidth = 24;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    });

    // 4. Dibujar el trazo actual en proceso (dibujo real freehand del dedo)
    if (currentDrawnPoints.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(scaleX(currentDrawnPoints[0].x), scaleY(currentDrawnPoints[0].y));
      for (let i = 1; i < currentDrawnPoints.length; i++) {
        ctx.lineTo(scaleX(currentDrawnPoints[i].x), scaleY(currentDrawnPoints[i].y));
      }
      ctx.strokeStyle = brushColor.value === 'rainbow' ? '#F43F5E' : brushColor.value;
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }

    // 5. Dibujar los puntos de control del trazo activo
    const activeStroke = strokes[currentStrokeIndex];
    if (activeStroke) {
      activeStroke.forEach((pt, i) => {
        const px = scaleX(pt.x);
        const py = scaleY(pt.y);
        const isReached = visitedIndices.includes(i);

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        if (isReached) {
          ctx.fillStyle = '#10B981'; // Verde completado
        } else {
          ctx.fillStyle = '#EAB308'; // Amarillo activo/pendiente
        }
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // Estrella latente en los puntos no alcanzados
        if (!isReached) {
          ctx.save();
          ctx.font = '26px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const time = Date.now() / 200;
          const scale = 1.0 + Math.sin(time) * 0.15;
          ctx.translate(px, py);
          ctx.scale(scale, scale);
          ctx.fillText('⭐', 0, -2);
          ctx.restore();
        }
      });
    }

    ctx.restore();
  };

  // Loop de redibujado de animación en modo guiado
  useEffect(() => {
    if (!isGuided) return;
    let animId: number;
    const loop = () => {
      redraw();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuided, completedDrawnPaths, currentDrawnPoints, visitedIndices, currentStrokeIndex, selectedChar, activeTab, brushColor, drawingPointer]);

  // Dibujo en Canvas con PointerEvents optimizado segment-by-segment (O(1))
  const startDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    lastX.current = x;
    lastY.current = y;

    // Dibujar un círculo al inicio del toque
    ctx.save();
    ctx.beginPath();
    const brushWidth = isEraser ? 36 : 20;
    ctx.arc(x, y, brushWidth / 2, 0, Math.PI * 2);

    if (isEraser) {
      ctx.fillStyle = '#ffffff';
    } else if (brushColor.value === 'rainbow') {
      ctx.fillStyle = `hsl(${hueRef.current}, 95%, 60%)`;
      hueRef.current = (hueRef.current + 5) % 360;
    } else {
      ctx.fillStyle = brushColor.value;
    }

    ctx.fill();
    ctx.restore();
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing || lastX.current === null || lastY.current === null) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lastX.current, lastY.current);
    ctx.lineTo(x, y);

    const brushWidth = isEraser ? 36 : 20;

    if (isEraser) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushWidth;
    } else if (brushColor.value === 'rainbow') {
      ctx.strokeStyle = `hsl(${hueRef.current}, 95%, 60%)`;
      hueRef.current = (hueRef.current + 5) % 360; // Desplazamiento suave de tono
      ctx.lineWidth = brushWidth;
    } else {
      ctx.strokeStyle = brushColor.value;
      ctx.lineWidth = brushWidth;
    }

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.restore();

    lastX.current = x;
    lastY.current = y;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastX.current = null;
    lastY.current = null;
  };

  const getCoordinates = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleSelectChar = (char: string) => {
    setSelectedChar(char);
    setIsEraser(false);

    // Hablar la instrucción
    let itemPrefix = '';
    let spokenText = '';

    if (activeTab === 'vowels') {
      itemPrefix = 'la letra';
      spokenText = `¡Vamos a dibujar la letra ${char}!`;
      setOwlMessage(`Sigue los puntitos con tu dedito para dibujar la letra ${char}.`);
    } else if (activeTab === 'numbers') {
      itemPrefix = 'el número';
      spokenText = `¡Vamos a dibujar el número ${char}!`;
      setOwlMessage(`Sigue los puntitos con tu dedito para dibujar el número ${char}.`);
    } else if (activeTab === 'shapes') {
      itemPrefix = SHAPE_NAMES[char] || 'la figura';
      spokenText = `¡Vamos a dibujar ${itemPrefix}!`;
      setOwlMessage(`Sigue los puntitos con tu dedito para dibujar ${itemPrefix}.`);
    }

    speak(spokenText);
  };

  const handleTabChange = (tab: 'vowels' | 'numbers' | 'shapes') => {
    setActiveTab(tab);
    const nextChar = TARGETS[tab][0];
    setSelectedChar(nextChar);
    setIsEraser(false);

    let introText = '';
    if (tab === 'vowels') introText = 'las vocales';
    else if (tab === 'numbers') introText = 'los números';
    else if (tab === 'shapes') introText = 'las figuras';

    speak(`¡Ahora dibujemos ${introText}!`);
    setOwlMessage(`Elige uno de los botones de arriba y dibújalo en la pizarra.`);
  };

  // Burst de partículas tipo confeti al adivinar/comprobar o completar trazo
  const triggerCelebrationParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const emojis = ['🌟', '✨', '🎉', '🍎', '🐱', '🎨', '🚀', '💖', '🧸', '🌈'];
    const newParticles: Particle[] = Array.from({ length: 20 }).map((_, i) => ({
      id: Date.now() + i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      startX: centerX,
      startY: centerY,
      x: Math.random() * 300 - 150, // offset del centro
      y: Math.random() * 200 - 180, // volar hacia arriba
      scale: Math.random() * 1.0 + 0.8,
      rotate: Math.random() * 360,
      duration: 2.2,
    }));
    setParticles(newParticles);
    // Eliminar las partículas después de 2.3 segundos
    setTimeout(() => setParticles([]), 2300);
  };

  // Pequeñas chispas al alcanzar un punto de control
  const triggerPointSparkParticles = (px: number, py: number) => {
    const emojis = ['✨', '⭐', '💫', '🌟', '🎨'];
    const newParticles: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i + 100,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      startX: px,
      startY: py,
      x: Math.random() * 80 - 40,
      y: Math.random() * 80 - 40,
      scale: Math.random() * 0.6 + 0.5,
      rotate: Math.random() * 180,
      duration: 1.0,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    // Limpiar chispas después de 1.1s
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.duration !== 1.0));
    }, 1100);
  };

  // Pulso de advertencia en caso de toque fallido
  const triggerPulseParticles = (px: number, py: number) => {
    const newParticles: Particle[] = [{
      id: Date.now() + 500,
      emoji: '⭕',
      startX: px,
      startY: py,
      x: 0,
      y: 0,
      scale: 2.5,
      rotate: 0,
      duration: 0.8,
    }];
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticles[0].id));
    }, 900);
  };

  const handleCharacterCompleted = () => {
    triggerCelebrationParticles();

    // Felicitar
    const targetName = activeTab === 'shapes' ? (SHAPE_NAMES[selectedChar] || selectedChar) : selectedChar;
    const isVowel = activeTab === 'vowels';
    const isNumber = activeTab === 'numbers';
    const prefix = isVowel ? 'la letra' : isNumber ? 'el número' : 'la figura';

    const congratulations = [
      `¡Increíble! Has trazado ${prefix} ${targetName} perfectamente. ¡Eres una estrella! ⭐`,
      `¡Qué hermoso dibujo! Completaste ${prefix} ${targetName} muy bien. ¡Súper inteligente! 🎉`,
      `¡Bravo! Lograste dibujar ${prefix} ${targetName}. ¡Excelente trabajo! 💖`
    ];

    const message = congratulations[Math.floor(Math.random() * congratulations.length)];
    setOwlMessage(message);
    speak(message);

    setShowNextButton(true);
  };

  const handleNextCharacter = () => {
    setShowNextButton(false);
    const targetList = TARGETS[activeTab];
    const currentIndex = targetList.indexOf(selectedChar);
    if (currentIndex !== -1 && currentIndex + 1 < targetList.length) {
      // Pasar al siguiente carácter
      const nextChar = targetList[currentIndex + 1];
      handleSelectChar(nextChar);
    } else {
      // Llegó al final de la categoría
      speak('¡Felicidades! Completaste todos los trazos de esta lista. ¡Elige otra arriba!');
      setOwlMessage('¡Eres increíble! Has terminado todos los trazos. Elige otra categoría arriba.');
      resetGuidedState();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const { x, y } = getCoordinates(e);

    if (!isGuided) {
      startDrawing(x, y);
      return;
    }

    // MODO GUIADO
    const strokes = TRACE_PATHS[selectedChar] || [];
    const activeStroke = strokes[currentStrokeIndex];
    if (!activeStroke) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // Buscar si el niño tocó cerca de CUALQUIER punto de control del trazo activo
    let matchedIndex = -1;
    for (let i = 0; i < activeStroke.length; i++) {
      const ptX = (activeStroke[i].x * width) / 100;
      const ptY = (activeStroke[i].y * height) / 100;
      const dist = Math.hypot(x - ptX, y - ptY);
      if (dist < 60) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex !== -1) {
      // Iniciar trazo guiado desde el punto tocado
      setIsDrawing(true);
      setVisitedIndices([matchedIndex]);

      const normX = (x / width) * 100;
      const normY = (y / height) * 100;
      setCurrentDrawnPoints([{ x: normX, y: normY }]);
      setDrawingPointer({ x, y });
      speak('¡Eso es! Sigue las estrellas.');
    } else {
      // Avisar y hacer brillar los puntos
      speak('Toca una estrella para empezar a dibujar.');
      activeStroke.forEach((pt) => {
        const px = (pt.x * width) / 100;
        const py = (pt.y * height) / 100;
        triggerPulseParticles(px, py);
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const { x, y } = getCoordinates(e);

    if (!isGuided) {
      draw(x, y);
      return;
    }

    // MODO GUIADO
    if (!isDrawing) return;

    const strokes = TRACE_PATHS[selectedChar] || [];
    const activeStroke = strokes[currentStrokeIndex];
    if (!activeStroke) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // Validar desviación del camino
    let minDist = Infinity;
    for (let k = 0; k < activeStroke.length - 1; k++) {
      const ptA = activeStroke[k];
      const ptB = activeStroke[k + 1];
      const ax = (ptA.x * width) / 100;
      const ay = (ptA.y * height) / 100;
      const bx = (ptB.x * width) / 100;
      const by = (ptB.y * height) / 100;
      const d = distToSegment({ x, y }, { x: ax, y: ay }, { x: bx, y: by });
      if (d < minDist) {
        minDist = d;
      }
    }

    if (minDist > 85) {
      // Se desvió demasiado del camino de la letra
      setIsDrawing(false);
      setCurrentDrawnPoints([]);
      setVisitedIndices([]);
      setDrawingPointer(null);
      speak('¡Uy! Te saliste del camino.');
      return;
    }

    // Registrar el punto de dibujo freehand del niño
    const normX = (x / width) * 100;
    const normY = (y / height) * 100;
    const newPoints = [...currentDrawnPoints, { x: normX, y: normY }];
    setCurrentDrawnPoints(newPoints);
    setDrawingPointer({ x, y });

    // Comprobar si tocó un punto que aún no ha sido visitado
    for (let i = 0; i < activeStroke.length; i++) {
      if (!visitedIndices.includes(i)) {
        const ptX = (activeStroke[i].x * width) / 100;
        const ptY = (activeStroke[i].y * height) / 100;
        const dist = Math.hypot(x - ptX, y - ptY);

        if (dist < 50) {
          const nextVisited = [...visitedIndices, i];
          setVisitedIndices(nextVisited);
          triggerPointSparkParticles(ptX, ptY);

          // Verificar si ya completó todos los puntos de este trazo
          if (nextVisited.length === activeStroke.length) {
            setCompletedDrawnPaths((prev) => [...prev, newPoints]);
            const nextCompleted = [...completedStrokes, activeStroke];
            setCompletedStrokes(nextCompleted);
            setIsDrawing(false);
            setCurrentDrawnPoints([]);
            setVisitedIndices([]);
            setDrawingPointer(null);

            if (currentStrokeIndex + 1 < strokes.length) {
              setCurrentStrokeIndex(currentStrokeIndex + 1);
              speak('¡Bien hecho! Sigue el siguiente trazo.');
            } else {
              handleCharacterCompleted();
            }
          }
          break;
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (!isGuided) {
      stopDrawing();
      return;
    }

    // MODO GUIADO
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentDrawnPoints([]);
      setVisitedIndices([]);
      setDrawingPointer(null);
      speak('Inténtalo de nuevo.');
    }
  };

  // Comprobar dibujo con IA o Fallback local
  const checkDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isChecking) return;

    setIsChecking(true);
    setOwlMessage('Mirando tu dibujo...');

    const wordPrefix = activeTab === 'vowels' ? 'letra' : activeTab === 'numbers' ? 'número' : 'figura';
    const targetName = activeTab === 'shapes' ? (SHAPE_NAMES[selectedChar] || selectedChar) : selectedChar;

    // Voz inmediata del tutor indicando que está analizando
    speak('¡A ver, a ver! Deja que mire tu hermoso dibujo...');

    // 1. Exportar canvas como Base64 (JPEG comprimido a 0.8 para velocidad)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64Image = dataUrl.split(',')[1]; // quitar el prefijo data:image/jpeg;base64,

    if (aiEnabled) {
      try {
        const response = await askAI(
          `El niño está jugando a trazar con su dedito la ${wordPrefix} "${targetName}" sobre un lienzo con una plantilla punteada. Analiza su dibujo y dile algo extremadamente cariñoso, alentador y divertido en español de máximo 2 oraciones. ¡Felicítalo mucho por su esfuerzo!`,
          {
            provider: 'auto',
            context: { game: 'trace', item: selectedChar },
            imageBase64: base64Image,
          }
        );
        recordUsage();
        triggerCelebrationParticles();
        setOwlMessage(response.text);
        speak(response.text);
      } catch (err) {
        // Fallback local en caso de fallo de red de la IA
        localFeedbackFallback();
      } finally {
        setIsChecking(false);
      }
    } else {
      // Si la IA está desactivada, usar felicitación enriquecida local
      setTimeout(() => {
        localFeedbackFallback();
        setIsChecking(false);
      }, 1000);
    }
  };

  const localFeedbackFallback = () => {
    triggerCelebrationParticles();

    const targetName = activeTab === 'shapes' ? (SHAPE_NAMES[selectedChar] || selectedChar) : selectedChar;
    const congrats = [
      `¡Guau! ¡Te quedó precioso! Has dibujado ${activeTab === 'vowels' ? 'la letra' : activeTab === 'numbers' ? 'el número' : 'la figura'} ${targetName} muy bien. ¡Eres un gran artista! 🌟`,
      `¡Increíble! ¡Qué bonito trazo! Sigue así, lo haces súper bien. 🎉`,
      `¡Qué hermoso te ha quedado! ¡Eres muy inteligente! ¿Hacemos otro? 💖`
    ];

    const randomCongrat = congrats[Math.floor(Math.random() * congrats.length)];
    setOwlMessage(randomCongrat);
    speak(randomCongrat);
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-100 font-sans select-none touch-none">

      {/* HEADER COMPACTO */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-1.5 bg-white shadow-sm rounded-b-2xl border-b-2 border-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:scale-90 transition-all border-2 border-white shadow-sm"
          >
            <ArrowLeft strokeWidth={3} className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          <div className="flex items-center gap-1.5 bg-orange-100 px-3 py-1 rounded-full border-2 border-white shadow-sm">
            <span className="text-lg">✍️</span>
            <span className="text-xs md:text-sm font-black text-orange-600 uppercase tracking-widest hidden sm:block">
              Trazos Mágicos
            </span>
          </div>
        </div>

        {/* Control de pestañas (Vocales, Números, Figuras) con estilo 3D */}
        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-full border border-slate-200 shadow-inner">
          <button
            onClick={() => handleTabChange('vowels')}
            className={`px-2.5 py-1 text-xs md:text-sm font-black rounded-full transition-all duration-150 ${activeTab === 'vowels'
              ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            🔤 Vocales
          </button>
          <button
            onClick={() => handleTabChange('numbers')}
            className={`px-2.5 py-1 text-xs md:text-sm font-black rounded-full transition-all duration-150 ${activeTab === 'numbers'
              ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            🔢 Números
          </button>
          <button
            onClick={() => handleTabChange('shapes')}
            className={`px-2.5 py-1 text-xs md:text-sm font-black rounded-full transition-all duration-150 ${activeTab === 'shapes'
              ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            🔷 Figuras
          </button>
        </div>

        {/* Botón de Borrar Pizarra */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onPointerDown={() => {
            resetGuidedState();
            resetCanvas();
            speak('¡Pizarra limpia! A dibujar de nuevo.');
          }}
          className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-black border-2 border-white shadow-sm active:bg-red-100 transition-colors text-xs"
        >
          <Trash2 size={14} />
          <span className="hidden md:inline uppercase tracking-wider">Limpiar</span>
        </motion.button>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-grow flex flex-col items-center w-full px-2 sm:px-4 md:px-8 pt-2 pb-3 overflow-hidden relative z-10 min-h-0">

        {/* CAROUSEL DE BOTONES DE SELECCIÓN (VOCALES O NÚMEROS) */}
        <div className="shrink-0 w-full max-w-6xl mx-auto mb-2 overflow-x-auto custom-scrollbar py-2">
          <div className="flex gap-2 sm:gap-4 px-2 justify-start sm:justify-center min-w-max">
            {TARGETS[activeTab].map((char) => {
              const isSelected = selectedChar === char;
              return (
                <motion.button
                  key={char}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9, y: 8 }}
                  onPointerDown={() => handleSelectChar(char)}
                  className={`
                    relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl font-black text-xl sm:text-3xl
                    flex items-center justify-center border-4 border-white/90 transition-all duration-150
                    ${isSelected
                      ? '-translate-y-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_8px_0_#C2410C]'
                      : 'bg-white text-orange-500 shadow-[0_6px_0_#E2E8F0] opacity-90'
                    }
                  `}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl pointer-events-none" />
                  <span className="drop-shadow-md">{char}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* CONTENEDOR CENTRAL: LIENZO Y TUTOR OWL */}
        <div className="flex-grow w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 items-stretch overflow-hidden min-h-0 relative">

          {/* LIENZO DE DIBUJO CON MARCO ESTILO JUGUETE */}
          <div className="flex-1 bg-white rounded-[2rem] sm:rounded-[3rem] shadow-xl border-[8px] sm:border-[12px] border-slate-200 overflow-hidden relative min-h-0 touch-none">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair bg-white"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />

            {/* Efecto de partículas de celebración flotando sobre el lienzo */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <AnimatePresence>
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0, x: p.startX, y: p.startY, rotate: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: p.scale,
                      x: p.startX + p.x,
                      y: p.startY + p.y,
                      rotate: p.rotate,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: p.duration || 1.8, ease: 'easeOut' }}
                    className="absolute text-3xl sm:text-5xl select-none -ml-5 -mt-5"
                  >
                    {p.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* COLUMNA LATERAL: TUTOR Y ACCIONES */}
          <div className="shrink-0 flex flex-row lg:flex-col justify-between items-center lg:justify-start gap-4 p-2 sm:p-4 bg-white/70 backdrop-blur-md rounded-3xl border-4 border-white shadow-lg lg:w-72">

            {/* Mascot Owl y Burbuja */}
            <div className="flex-1 lg:flex-none flex items-center justify-center lg:py-6">
              <TutorOwl
                message={owlMessage}
                game="trace"
                item={selectedChar}
                size="md"
              />
            </div>

            {/* Selector de Modo: Guiado vs Libre */}
            <div className="w-full bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner flex shrink-0">
              <button
                type="button"
                onPointerDown={() => {
                  setIsGuided(true);
                  speak('Modo guiado. ¡Sigue las estrellitas!');
                  setOwlMessage('¡Sigue los puntitos y las estrellas con tu dedito para trazar!');
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all duration-150 flex items-center justify-center gap-1 ${isGuided
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                ✨ Guiado
              </button>
              <button
                type="button"
                onPointerDown={() => {
                  setIsGuided(false);
                  speak('Modo libre. ¡Pinta lo que quieras!');
                  setOwlMessage('¡Dibuja libremente sobre la pizarra!');
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all duration-150 flex items-center justify-center gap-1 ${!isGuided
                  ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                🎨 Libre
              </button>
            </div>

            {/* Caja de herramientas: Colores y Borrador */}
            <div className="flex flex-col gap-2 w-auto lg:w-full items-center">
              <span className="text-xs font-black text-orange-600 uppercase tracking-widest hidden lg:block mb-1">
                🎨 Pinceles
              </span>
              <div className="flex lg:grid lg:grid-cols-3 gap-2 flex-wrap justify-center">
                {BRUSH_COLORS.map((c) => {
                  const isSelected = brushColor.name === c.name && !isEraser;
                  return (
                    <motion.button
                      key={c.name}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9, y: 6 }}
                      onPointerDown={() => {
                        setBrushColor(c);
                        setIsEraser(false);
                        speak(c.name);
                      }}
                      className={`
                        relative w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-150 border-3 border-white
                        ${c.class} ${c.shadow}
                        ${isSelected ? '-translate-y-1.5 ring-4 ring-orange-300' : 'opacity-90'}
                      `}
                      title={c.name}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-full" />
                    </motion.button>
                  );
                })}

                {/* Botón Borrador Físico */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9, y: 6 }}
                  onPointerDown={() => {
                    setIsEraser(true);
                    speak('Borrador');
                  }}
                  className={`
        
                    relative w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-150 border-3 border-white
                    bg-slate-100 text-slate-600 flex items-center justify-center shadow-[0_4px_0_#94A3B8]
                    ${isEraser ? '-translate-y-1.5 ring-4 ring-slate-300 shadow-[0_6px_0_#94A3B8]' : 'opacity-90'}
                  `}
                  title="Borrador"
                >
                  <Eraser size={14} className="sm:size-5" />
                </motion.button>
              </div>
            </div>

            {/* BOTÓN MÁGICO DE COMPROBACIÓN */}
            <div className="w-auto lg:w-full lg:mt-auto">
              {isGuided && showNextButton ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, y: 4 }}
                  onPointerDown={handleNextCharacter}
                  className="w-full py-3 px-4 sm:py-4 rounded-2xl sm:rounded-3xl font-black text-white text-sm sm:text-lg flex items-center justify-center gap-2 border-4 border-white bg-gradient-to-r from-orange-500 to-yellow-500 shadow-[0_6px_0_#C2410C] animate-bounce"
                >
                  <span>SIGUIENTE ➔</span>
                </motion.button>
              ) : (
                <motion.button
                  disabled={isChecking || (isGuided && !showNextButton)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, y: 4 }}
                  onPointerDown={checkDrawing}
                  className={`
                    w-full py-3 px-4 sm:py-4 rounded-2xl sm:rounded-3xl font-black text-white text-sm sm:text-lg
                    flex items-center justify-center gap-2 border-4 border-white
                    ${isChecking
                      ? 'bg-gray-300 shadow-[0_6px_0_#9CA3AF] cursor-not-allowed'
                      : isGuided
                        ? 'bg-gray-200 text-slate-400 shadow-[0_6px_0_#CBD5E1] cursor-not-allowed'
                        : aiEnabled
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-[0_6px_0_#4338CA]'
                          : 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_6px_0_#047857]'
                    }
                  `}
                >
                  {isChecking ? (
                    <div className="flex items-center gap-1.5 animate-pulse">
                      <span>🤔</span>
                      <span>Analizando...</span>
                    </div>
                  ) : isGuided ? (
                    <>
                      <span>✨ Guiado</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      <span>COMPROBAR</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
