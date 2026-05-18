import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speak, speakAndWait } from '../lib/speech';
import { ArrowLeft, Sparkles, Trash2, Eraser, Check, Palette, Smile } from 'lucide-react';
import TutorOwl from './TutorOwl';
import { useAI } from '../lib/aiContext';
import { askAI, classifyAIError } from '../lib/ai';

// Colores gomita para pintar
const BRUSH_COLORS = [
  { name: 'Morado', value: '#A855F7', class: 'bg-purple-500', shadow: 'shadow-[0_6px_0_#7E22CE]' },
  { name: 'Rosa', value: '#EC4899', class: 'bg-pink-500', shadow: 'shadow-[0_6px_0_#BE185D]' },
  { name: 'Azul', value: '#3B82F6', class: 'bg-blue-500', shadow: 'shadow-[0_6px_0_#1D4ED8]' },
  { name: 'Naranja', value: '#F97316', class: 'bg-orange-500', shadow: 'shadow-[0_6px_0_#C2410C]' },
  { name: 'Verde', value: '#22C55E', class: 'bg-green-500', shadow: 'shadow-[0_6px_0_#15803D]' },
];

const TARGETS = {
  vowels: ['A', 'E', 'I', 'O', 'U'],
  numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
};

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

export default function TraceGame({ onBack, isFirstTime, onVisit }: { onBack: () => void; isFirstTime: boolean; onVisit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isEnabled: aiEnabled, recordUsage } = useAI();

  const [activeTab, setActiveTab] = useState<'vowels' | 'numbers'>('vowels');
  const [selectedChar, setSelectedChar] = useState('A');
  const [brushColor, setBrushColor] = useState(BRUSH_COLORS[0]); // default Morado
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Estados de IA y tutor
  const [owlMessage, setOwlMessage] = useState('¡Vamos a trazar letras y números! Toca una arriba para empezar.');
  const [isChecking, setIsChecking] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const hasSpoken = useRef(false);

  // Inicialización de voz al entrar
  useEffect(() => {
    if (hasSpoken.current) return;
    hasSpoken.current = true;
    if (isFirstTime) {
      speak('¡Trazos mágicos! Con tu dedito, sigue la línea punteada para dibujar.');
      onVisit();
    } else {
      speak('¡Vamos a dibujar las vocales y los números!');
    }
  }, [isFirstTime, onVisit]);

  // Redibujar la plantilla cuando cambie el carácter seleccionado, pestaña, o tamaño
  useEffect(() => {
    resetCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChar, activeTab]);

  // Configurar el canvas y el listener para reajustes
  useEffect(() => {
    const handleResize = () => {
      resetCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChar]);

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

    // 1. Dibujar relleno ultra suave (fucsia/azul pastel) para guiar la forma
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(char, width / 2, height / 2 + size * 0.05);

    // 2. Dibujar contorno punteado (Línea discontinua)
    ctx.strokeStyle = '#CBD5E1'; // Gris suave pero visible
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([16, 16]); // Punteado grande e infantil
    ctx.strokeText(char, width / 2, height / 2 + size * 0.05);

    // 3. Dibujar estrellita guía al inicio de cada trazo de manera ilustrativa
    ctx.restore();
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    // Ajustar dimensiones del canvas físicamente al contenedor
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 16; // Trazo grueso ideal para dedos de niños
      drawTemplate(ctx, canvas.width, canvas.height, selectedChar);
    }
  };

  // Dibujo en Canvas con PointerEvents
  const startDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);

    ctx.strokeStyle = isEraser ? '#ffffff' : brushColor.value;
    ctx.lineWidth = isEraser ? 36 : 16; // Borrador más grueso que el pincel
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([]); // Dibujo continuo, quitar el punteado de la plantilla

    ctx.stroke();
    ctx.restore();
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.save();
    ctx.lineTo(x, y);
    ctx.strokeStyle = isEraser ? '#ffffff' : brushColor.value;
    ctx.lineWidth = isEraser ? 36 : 16;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.restore();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Soporte multipunto / multitáctil (extraer el primer puntero)
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleSelectChar = (char: string) => {
    setSelectedChar(char);
    setIsEraser(false);
    
    // Hablar la instrucción
    const itemPrefix = activeTab === 'vowels' ? 'la letra' : 'el número';
    speak(`¡Vamos a dibujar ${itemPrefix} ${char}!`);
    setOwlMessage(`Sigue los puntitos con tu dedito para dibujar ${itemPrefix} ${char}.`);
  };

  const handleTabChange = (tab: 'vowels' | 'numbers') => {
    setActiveTab(tab);
    const nextChar = TARGETS[tab][0];
    setSelectedChar(nextChar);
    setIsEraser(false);

    const introText = tab === 'vowels' ? 'las vocales' : 'los números';
    speak(`¡Ahora dibujemos ${introText}!`);
    setOwlMessage(`Elige uno de los botones de arriba y dibújalo en la pizarra.`);
  };

  // Burst de partículas tipo confeti al adivinar/comprobar
  const triggerCelebrationParticles = () => {
    const emojis = ['🌟', '✨', '🎉', '🍎', '🐱', '🎨', '🚀', '💖', '🧸', '🌈'];
    const newParticles: Particle[] = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: Math.random() * 80 - 40, // offset del centro
      y: Math.random() * 60 - 30,
      scale: Math.random() * 0.8 + 0.6,
      rotate: Math.random() * 360,
    }));
    setParticles(newParticles);
    // Eliminar las partículas después de 2 segundos
    setTimeout(() => setParticles([]), 2200);
  };

  // Comprobar dibujo con IA o Fallback local
  const checkDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isChecking) return;

    setIsChecking(true);
    setOwlMessage('Mirando tu dibujo...');
    
    const wordPrefix = activeTab === 'vowels' ? 'letra' : 'número';

    // Voz inmediata del tutor indicando que está analizando
    speak('¡A ver, a ver! Deja que mire tu hermoso dibujo...');

    // 1. Exportar canvas como Base64 (JPEG comprimido a 0.8 para velocidad)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64Image = dataUrl.split(',')[1]; // quitar el prefijo data:image/jpeg;base64,

    if (aiEnabled) {
      try {
        const response = await askAI(
          `El niño está jugando a trazar con su dedito la ${wordPrefix} "${selectedChar}" sobre un lienzo con una plantilla punteada. Analiza su dibujo y dile algo extremadamente cariñoso, alentador y divertido en español de máximo 2 oraciones. ¡Felicítalo mucho por su esfuerzo!`,
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
    
    const congrats = [
      `¡Guau! ¡Te quedó precioso! Has dibujado la ${activeTab === 'vowels' ? 'letra' : 'cifra'} ${selectedChar} muy bien. ¡Eres un gran artista! 🌟`,
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

        {/* Control de pestañas (Vocales vs Números) con estilo 3D */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
          <button
            onClick={() => handleTabChange('vowels')}
            className={`px-3 py-1 text-xs md:text-sm font-black rounded-full transition-all duration-150 ${
              activeTab === 'vowels'
                ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🔤 Vocales
          </button>
          <button
            onClick={() => handleTabChange('numbers')}
            className={`px-3 py-1 text-xs md:text-sm font-black rounded-full transition-all duration-150 ${
              activeTab === 'numbers'
                ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🔢 Números
          </button>
        </div>

        {/* Botón de Borrar Pizarra */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onPointerDown={resetCanvas}
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
                    ${
                      isSelected
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
              onPointerDown={(e) => { const { x, y } = getCoordinates(e); startDrawing(x, y); }}
              onPointerMove={(e) => { const { x, y } = getCoordinates(e); draw(x, y); }}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              onPointerCancel={stopDrawing}
            />

            {/* Efecto de partículas de celebración flotando sobre el lienzo */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
              <AnimatePresence>
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: p.scale,
                      x: p.x * 6,
                      y: p.y * 6 - 80,
                      rotate: p.rotate,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                    className="absolute text-4xl sm:text-6xl select-none"
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
              <motion.button
                disabled={isChecking}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95, y: 4 }}
                onPointerDown={checkDrawing}
                className={`
                  w-full py-3 px-4 sm:py-4 rounded-2xl sm:rounded-3xl font-black text-white text-sm sm:text-lg
                  flex items-center justify-center gap-2 border-4 border-white
                  ${
                    isChecking
                      ? 'bg-gray-300 shadow-[0_6px_0_#9CA3AF] cursor-not-allowed'
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
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    <span>COMPROBAR</span>
                  </>
                )}
              </motion.button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
