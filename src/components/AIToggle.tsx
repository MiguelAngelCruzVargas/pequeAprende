/**
 * AI Mode Toggle Button — appears in the header
 * Shows: current mode (AI/Normal), daily usage bar, and toggle switch
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAI } from '../lib/aiContext';

export default function AIToggle() {
  const { mode, isEnabled, isLimitReached, isOnline, dailyCount, dailyLimit, toggleAI, resetLimit } = useAI();
  const [showPanel, setShowPanel] = useState(false);

  const usagePct = Math.min((dailyCount / dailyLimit) * 100, 100);
  const isNearLimit = usagePct >= 80;

  return (
    <div className="relative">
      {/* Toggle Pill Button */}
      <motion.button
        onClick={() => setShowPanel(v => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-[3px] shadow-lg transition-all duration-300 text-sm font-black ${
          !isOnline
            ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-amber-100'
            : isEnabled
            ? 'bg-violet-500 border-violet-700 text-white shadow-violet-300'
            : 'bg-gray-200 border-gray-300 text-gray-500'
        }`}
      >
        {/* Animated indicator dot */}
        <motion.div
          animate={
            !isOnline
              ? { scale: 1, opacity: 0.6 }
              : isEnabled
              ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }
              : { scale: 1, opacity: 0.4 }
          }
          transition={{ duration: 1.5, repeat: isEnabled && isOnline ? Infinity : 0 }}
          className={`w-2.5 h-2.5 rounded-full ${!isOnline ? 'bg-amber-400' : isEnabled ? 'bg-green-300' : 'bg-gray-400'}`}
        />
        <span className="hidden sm:inline">
          {!isOnline ? '📶 Local' : isEnabled ? '🧠 IA' : '📚 Normal'}
        </span>
        <span className="sm:hidden">
          {!isOnline ? '📶' : isEnabled ? '🧠' : '📚'}
        </span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {showPanel && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPanel(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute right-0 top-14 z-50 w-72 bg-white rounded-3xl shadow-2xl border-4 border-white overflow-hidden"
            >
              {/* Header */}
              <div className={`px-5 py-4 ${!isOnline ? 'bg-gradient-to-r from-amber-500 to-orange-600' : isEnabled ? 'bg-gradient-to-r from-violet-500 to-purple-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{!isOnline ? '📶' : isEnabled ? '🧠' : '📚'}</span>
                    <div>
                      <p className="font-black text-lg leading-none">
                        {!isOnline ? 'Modo Offline / Local' : `Modo ${isEnabled ? 'Inteligente' : 'Normal'}`}
                      </p>
                      <p className="text-xs text-white/80 mt-0.5">
                        {!isOnline ? 'Jugando sin internet' : isEnabled ? 'El tutor usa IA para ayudar' : 'Pistas básicas sin IA'}
                      </p>
                    </div>
                  </div>
                  {/* Toggle Switch */}
                  {isOnline ? (
                    <motion.button
                      onClick={toggleAI}
                      disabled={isLimitReached}
                      title={isLimitReached ? 'Límite diario alcanzado' : 'Activar/Desactivar IA'}
                      className={`relative w-14 h-7 rounded-full border-2 transition-colors duration-300 ${
                        isEnabled ? 'bg-green-400 border-green-600' : 'bg-white/30 border-white/50'
                      } ${isLimitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <motion.div
                        animate={{ x: isEnabled ? 28 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                      />
                    </motion.button>
                  ) : (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Sin Wifi</span>
                  )}
                </div>
              </div>

              {/* Daily Usage Bar / Offline Info */}
              {!isOnline ? (
                <div className="px-5 py-4 border-b border-gray-100 bg-amber-50/50">
                  <p className="text-xs text-amber-800 font-bold leading-relaxed">
                    🌟 <strong>¡PequeAprendo es Offline!</strong> No tienes conexión a internet. Los juegos, sonidos, dibujos y el reconocimiento de voz siguen funcionando al 100% en modo local de forma segura y divertida. ¡Perfecto para viajar!
                  </p>
                </div>
              ) : (
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                    <span>Uso hoy</span>
                    <span className={isNearLimit ? 'text-orange-500' : ''}>{dailyCount} / {dailyLimit} pistas</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full transition-colors ${
                        usagePct >= 100 ? 'bg-red-500' :
                        usagePct >= 80  ? 'bg-orange-400' :
                        'bg-violet-500'
                      }`}
                    />
                  </div>
                  {isLimitReached && (
                    <p className="text-xs text-orange-600 font-black mt-2 text-center">
                      😴 El tutor descansa hasta mañana. ¡Modo Normal activado!
                    </p>
                  )}
                </div>
              )}

              {/* Mode Comparison */}
              <div className="px-5 py-4 grid grid-cols-2 gap-3">
                <div className={`rounded-2xl p-3 border-2 text-center ${isEnabled && isOnline ? 'border-violet-300 bg-violet-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                  <p className="text-xl mb-1">🧠</p>
                  <p className="text-xs font-black text-violet-700">Modo IA</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-1">Pistas personalizadas • Celebraciones dinámicas</p>
                </div>
                <div className={`rounded-2xl p-3 border-2 text-center ${!isEnabled || !isOnline ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                  <p className="text-xl mb-1">📚</p>
                  <p className="text-xs font-black text-blue-700">Modo Normal</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-1">Pistas fijas • Sin conexión</p>
                </div>
              </div>

              {/* Reset button (developer use) */}
              {isLimitReached && isOnline && (
                <div className="px-5 pb-4">
                  <button
                    onClick={() => { resetLimit(); setShowPanel(false); }}
                    className="w-full text-xs text-center text-gray-400 hover:text-gray-600 py-2 underline"
                  >
                    Reiniciar límite (solo para pruebas)
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
