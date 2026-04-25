import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { speak } from '../lib/speech';
import { ArrowLeft, Sparkles, Palette, Trash2, Eraser, Brush } from 'lucide-react';

// Añadimos las sombras 3D exactas a la paleta
const COLORS = [
  { name: 'Rojo', value: '#EF4444', class: 'bg-red-500', shadow: 'shadow-[0_6px_0_#B91C1C]', activeShadow: 'active:shadow-[0_0px_0_#B91C1C]' },
  { name: 'Naranja', value: '#F97316', class: 'bg-orange-500', shadow: 'shadow-[0_6px_0_#C2410C]', activeShadow: 'active:shadow-[0_0px_0_#C2410C]' },
  { name: 'Amarillo', value: '#EAB308', class: 'bg-yellow-400', shadow: 'shadow-[0_6px_0_#CA8A04]', activeShadow: 'active:shadow-[0_0px_0_#CA8A04]' },
  { name: 'Verde', value: '#22C55E', class: 'bg-green-500', shadow: 'shadow-[0_6px_0_#15803D]', activeShadow: 'active:shadow-[0_0px_0_#15803D]' },
  { name: 'Azul', value: '#3B82F6', class: 'bg-blue-500', shadow: 'shadow-[0_6px_0_#1D4ED8]', activeShadow: 'active:shadow-[0_0px_0_#1D4ED8]' },
  { name: 'Morado', value: '#A855F7', class: 'bg-purple-500', shadow: 'shadow-[0_6px_0_#7E22CE]', activeShadow: 'active:shadow-[0_0px_0_#7E22CE]' },
  { name: 'Rosa', value: '#EC4899', class: 'bg-pink-500', shadow: 'shadow-[0_6px_0_#BE185D]', activeShadow: 'active:shadow-[0_0px_0_#BE185D]' },
  { name: 'Negro', value: '#1F2937', class: 'bg-gray-800', shadow: 'shadow-[0_6px_0_#111827]', activeShadow: 'active:shadow-[0_0px_0_#111827]' },
];

export default function ColoringGame({ onBack, isFirstTime, onVisit }: { onBack: () => void; isFirstTime: boolean; onVisit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(COLORS[4]); // Default Azul
  const [isDrawing, setIsDrawing] = useState(false);
  const hasSpoken = useRef(false);

  // Setup canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let imgData: ImageData | null = null;
        if (canvas.width > 0 && canvas.height > 0 && ctx) {
          try { imgData = ctx.getImageData(0, 0, canvas.width, canvas.height); } catch (e) { }
        }

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          if (imgData) {
            ctx.putImageData(imgData, 0, 0);
          }
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.lineWidth = 16; // Trazo grueso para los deditos
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const preventScroll = (e: TouchEvent) => { e.preventDefault(); };
    canvas.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  useEffect(() => {
    if (!hasSpoken.current) {
      hasSpoken.current = true;
      if (isFirstTime) {
        speak('¡A colorear! Elige un color y dibuja con tu dedito en la pizarra.');
        onVisit();
      } else {
        speak('¡Pizarra mágica! Dibuja lo que tú quieras.');
      }
    }
  }, [isFirstTime, onVisit]);

  const startDrawing = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Dibuja un punto inmediatamente por si solo dan un "toque" (tap)
    ctx.lineTo(x, y);
    ctx.strokeStyle = color.value;
    ctx.stroke();
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.strokeStyle = color.value;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      speak('¡Pizarra limpia! A dibujar de nuevo.');
    }
  };

  const selectColor = (c: typeof COLORS[0]) => {
    setColor(c);
    speak(c.name);
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full overflow-hidden bg-gradient-to-b from-rose-50 via-pink-50 to-red-50 font-sans select-none">

      {/* HEADER COMPACTO Y ESTANDARIZADO */}
      <div className="relative z-20 flex items-center justify-between shrink-0 px-4 py-1.5 bg-white shadow-sm rounded-b-2xl border-b-2 border-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:scale-90 transition-all border-2 border-white shadow-sm"
          >
            <ArrowLeft strokeWidth={3} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-rose-100 px-3 py-1 rounded-full border-2 border-white shadow-sm">
            <Brush className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-600" />
            <span className="text-xs md:text-sm font-black text-rose-600 uppercase tracking-widest hidden sm:block">
              Pizarra
            </span>
          </div>
        </div>

        {/* Botón de Limpiar reubicado para evitar toques accidentales al dibujar */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onPointerDown={clearCanvas}
          className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full flex items-center gap-2 font-black border-2 border-white shadow-sm active:bg-red-100 transition-colors"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline text-xs tracking-wide uppercase">Borrar todo</span>
        </motion.button>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-grow flex flex-col items-center w-full px-2 sm:px-4 md:px-8 pt-2 pb-4 overflow-hidden relative z-10">

        {/* Título Compacto */}
        <div className="text-center shrink-0 mb-3 md:mb-4 mt-1">
          <motion.h2 
            animate={{ scale: [1, 1.05, 1] }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 drop-shadow-sm uppercase tracking-tight"
          >
            PIZARRA MÁGICA
          </motion.h2>
        </div>

        {/* Lienzo / Pizarra (Con estilo de marco de juguete) */}
        <div className="flex-grow w-full bg-white rounded-[2.5rem] sm:rounded-[4rem] shadow-xl border-[10px] md:border-[16px] border-slate-200 overflow-hidden relative min-h-0 touch-none mx-auto max-w-6xl">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onPointerDown={(e) => { const { x, y } = getCoordinates(e); startDrawing(x, y); }}
            onPointerMove={(e) => { const { x, y } = getCoordinates(e); draw(x, y); }}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            onPointerCancel={stopDrawing}
          />

          {/* Marca de agua sutil */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03]">
            <Palette size={200} className="md:w-[400px] md:h-[400px]" />
          </div>
        </div>

        {/* Paleta de Colores Gominola (Inferior) */}
        <div className="shrink-0 mt-4 md:mt-6 pb-4 w-full max-w-6xl mx-auto flex justify-center gap-2 sm:gap-4 flex-wrap">
          {COLORS.map((c) => {
            const isSelected = color.name === c.name && color.name !== 'Borrador';
            return (
              <motion.button
                key={c.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9, y: 10 }}
                onPointerDown={() => selectColor(c)}
                className={`
                  relative w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full transition-all duration-150
                  border-4 border-white/90 overflow-hidden
                  ${c.class} ${isSelected ? `-translate-y-3 ${c.shadow}` : `opacity-90 hover:opacity-100 ${c.shadow}`}
                `}
              >
                {/* Brillo estilo Gominola */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                <div className="absolute top-[5%] left-[10%] w-[50%] h-[20%] bg-white/40 rounded-full blur-[1px] rotate-[-15deg] pointer-events-none" />
                
                {isSelected && (
                  <div className="absolute inset-0 border-4 border-white rounded-full opacity-80" />
                )}
              </motion.button>
            );
          })}

          <div className="w-1 bg-rose-200/50 mx-1 md:mx-2 rounded-full hidden sm:block" />

          {/* Botón Borrador */}
          <motion.button
            whileTap={{ scale: 0.9, y: 10 }}
            onPointerDown={() => {
              setColor({ name: 'Borrador', value: '#ffffff', class: 'bg-slate-100', shadow: 'shadow-[0_6px_0_#94A3B8]', activeShadow: 'active:shadow-[0_0px_0_#94A3B8]' });
              speak('Borrador');
            }}
            className={`
              relative flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full transition-all duration-150
              border-4 border-white/90 bg-slate-100 text-slate-600 overflow-hidden
              ${color.name === 'Borrador' ? '-translate-y-3 shadow-[0_6px_0_#94A3B8]' : 'shadow-[0_6px_0_#94A3B8] opacity-90 hover:opacity-100'}
            `}
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <Eraser className="w-5 h-5 sm:w-7 sm:h-7 relative z-10" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}