/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameScreen } from './types';
import { stopSpeaking, resumeSpeaking } from './lib/speech';

// Game Components
import ColorsGame from './components/ColorsGame';
import NumbersGame from './components/NumbersGame';
import VowelsGame from './components/VowelsGame';
import AnimalsGame from './components/AnimalsGame';
import ReasoningGame from './components/ReasoningGame';
import ShapesGame from './components/ShapesGame';
import MatchingGame from './components/MatchingGame';
import WelcomeScreen from './components/WelcomeScreen';
import NameItGame from './components/NameItGame';
import RepeatGame from './components/RepeatGame';
import SoundGuessGame from './components/SoundGuessGame';
import ColoringGame from './components/ColoringGame';
import BubblesGame from './components/BubblesGame';
import ConnectGame from './components/ConnectGame';
import AIToggle from './components/AIToggle';
import { AIProvider, useAI } from './lib/aiContext';

// Mapeo con el sistema Premium de Sombras 3D
const menuItems = [
  { id: 'vowels', label: 'Vocales', emoji: '🔤', gradient: 'from-pink-400 to-rose-500', shadow: 'shadow-[0_10px_0_#BE185D]', activeShadow: 'active:shadow-[0_0px_0_#BE185D]', category: 'Aprender' },
  { id: 'numbers', label: 'Números', emoji: '🔢', gradient: 'from-blue-400 to-blue-600', shadow: 'shadow-[0_10px_0_#1D4ED8]', activeShadow: 'active:shadow-[0_0px_0_#1D4ED8]', category: 'Aprender' },
  { id: 'colors', label: 'Colores', emoji: '🎨', gradient: 'from-violet-400 to-purple-600', shadow: 'shadow-[0_10px_0_#7E22CE]', activeShadow: 'active:shadow-[0_0px_0_#7E22CE]', category: 'Aprender' },
  { id: 'animals', label: 'Animales', emoji: '🦁', gradient: 'from-orange-400 to-amber-500', shadow: 'shadow-[0_10px_0_#C2410C]', activeShadow: 'active:shadow-[0_0px_0_#C2410C]', category: 'Aprender' },
  { id: 'shapes', label: 'Figuras', emoji: '🔷', gradient: 'from-emerald-400 to-green-500', shadow: 'shadow-[0_10px_0_#15803D]', activeShadow: 'active:shadow-[0_0px_0_#15803D]', category: 'Aprender' },
  { id: 'matching', label: 'Iguales', emoji: '🎭', gradient: 'from-cyan-400 to-teal-500', shadow: 'shadow-[0_10px_0_#0F766E]', activeShadow: 'active:shadow-[0_0px_0_#0F766E]', category: 'Aprender' },
  { id: 'reasoning', label: 'Pensar', emoji: '🧠', gradient: 'from-purple-500 to-indigo-500', shadow: 'shadow-[0_10px_0_#4338CA]', activeShadow: 'active:shadow-[0_0px_0_#4338CA]', category: 'Aprender' },
  { id: 'coloring', label: 'Pizarra', emoji: '🖍️', gradient: 'from-rose-400 to-red-500', shadow: 'shadow-[0_10px_0_#B91C1C]', activeShadow: 'active:shadow-[0_0px_0_#B91C1C]', category: 'Aprender' },
  { id: 'nameit', label: 'Nombres', emoji: '💬', gradient: 'from-fuchsia-400 to-pink-600', shadow: 'shadow-[0_10px_0_#BE185D]', activeShadow: 'active:shadow-[0_0px_0_#BE185D]', category: 'Habla' },
  { id: 'repeat', label: 'Repite', emoji: '🗣️', gradient: 'from-lime-400 to-green-500', shadow: 'shadow-[0_10px_0_#15803D]', activeShadow: 'active:shadow-[0_0px_0_#15803D]', category: 'Habla' },
  { id: 'soundguess', label: 'Sonidos', emoji: '👂', gradient: 'from-yellow-400 to-orange-500', shadow: 'shadow-[0_10px_0_#C2410C]', activeShadow: 'active:shadow-[0_0px_0_#C2410C]', category: 'Habla' },
  { id: 'bubbles', label: 'Burbujas', emoji: '🫧', gradient: 'from-cyan-300 to-blue-500', shadow: 'shadow-[0_10px_0_#1D4ED8]', activeShadow: 'active:shadow-[0_0px_0_#1D4ED8]', category: 'Habla' },
  { id: 'connect', label: 'Conecta', emoji: '🔗', gradient: 'from-indigo-400 to-purple-600', shadow: 'shadow-[0_10px_0_#4338CA]', activeShadow: 'active:shadow-[0_0px_0_#4338CA]', category: 'Aprender' },
];

const APP_STORAGE_KEY = 'peque_app_state_v1';
const ALL_SCREENS: GameScreen[] = [
  'welcome', 'menu', 'colors', 'numbers', 'vowels', 'animals', 'reasoning',
  'shapes', 'matching', 'nameit', 'repeat', 'soundguess', 'coloring', 'bubbles', 'connect',
];

const GAME_IDS = new Set(menuItems.map(item => item.id));

function isGameScreen(value: unknown): value is GameScreen {
  return typeof value === 'string' && ALL_SCREENS.includes(value as GameScreen);
}

function loadPersistedAppState(): { screen: GameScreen; userName: string; visitedGames: string[] } {
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) return { screen: 'welcome', userName: '', visitedGames: [] };
    const parsed = JSON.parse(raw) as {
      screen?: unknown;
      userName?: unknown;
      visitedGames?: unknown;
    };

    const rawScreen = isGameScreen(parsed.screen) ? parsed.screen : 'welcome';
    const userName = typeof parsed.userName === 'string' ? parsed.userName.slice(0, 60) : '';
    // If a name already exists, skip welcome on next app launch.
    const screen: GameScreen = userName.trim() ? (rawScreen === 'welcome' ? 'menu' : rawScreen) : rawScreen;
    const visitedGames = Array.isArray(parsed.visitedGames)
      ? parsed.visitedGames.filter((id): id is string => typeof id === 'string' && GAME_IDS.has(id))
      : [];

    return { screen, userName, visitedGames };
  } catch {
    return { screen: 'welcome', userName: '', visitedGames: [] };
  }
}

function AppHeader({ screen, setScreen }: { screen: GameScreen; setScreen: (s: GameScreen) => void }) {
  const { mode, toggleAI } = useAI();
  return (
    <header className="relative shrink-0 z-50 px-3 py-1.5 sm:px-6 sm:py-2 flex justify-between items-center bg-white/85  border-b-4 border-white shadow-[0_6px_20px_rgba(0,0,0,0.08)] rounded-b-[1.5rem]">
      <div className="flex items-center">
        <motion.div
          initial={{ opacity: 0, x: -20, rotate: -5 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          className="flex items-baseline"
        >
          {/* Logo estilo pegatina 3D */}
          <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-500 drop-shadow-[0_3px_2px_rgba(239,68,68,0.4)] italic leading-none" style={{ WebkitTextStroke: '1.5px white' }}>
            P
          </span>
          <span className="text-xl sm:text-2xl font-black -ml-0.5 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 uppercase tracking-tighter italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)]" style={{ WebkitTextStroke: '1px white' }}>
            equeAprendo
          </span>
        </motion.div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 bg-white/50 p-1.5 rounded-full border-2 border-white shadow-inner">
        <AIToggle mode={mode} onToggle={toggleAI} />
      </div>
    </header>
  );
}

function App() {
  const [screen, setScreen] = useState<GameScreen>(() => loadPersistedAppState().screen);
  const [userName, setUserName] = useState(() => loadPersistedAppState().userName);
  const [visitedGames, setVisitedGames] = useState<Set<string>>(
    () => new Set(loadPersistedAppState().visitedGames),
  );
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));

  useEffect(() => {
    // Safety net: ensure voice is enabled when the app is opened/reloaded.
    resumeSpeaking();
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        APP_STORAGE_KEY,
        JSON.stringify({
          screen,
          userName,
          visitedGames: [...visitedGames],
          updatedAt: Date.now(),
        }),
      );
    } catch {}
  }, [screen, userName, visitedGames]);

  const handleSetScreen = (newScreen: GameScreen) => {
    stopSpeaking();      // Mata la voz actual + activa flag de silencio
    setScreen(newScreen);
    resumeSpeaking();     // Reactiva la voz para el nuevo juego
  };

  const markAsVisited = useCallback((gameId: string) => {
    setVisitedGames(prev => {
      const next = new Set(prev);
      next.add(gameId);
      return next;
    });
  }, []);

  const renderScreen = () => {
    switch (screen) {
      case 'welcome': return <WelcomeScreen onStart={(name) => { setUserName(name); handleSetScreen('menu'); }} />;
      case 'colors': return <ColorsGame onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('colors')} onVisit={() => markAsVisited('colors')} />;
      case 'numbers': return <NumbersGame onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('numbers')} onVisit={() => markAsVisited('numbers')} />;
      case 'vowels': return <VowelsGame onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('vowels')} onVisit={() => markAsVisited('vowels')} />;
      case 'animals': return <AnimalsGame onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('animals')} onVisit={() => markAsVisited('animals')} />;
      case 'reasoning': return <ReasoningGame onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('reasoning')} onVisit={() => markAsVisited('reasoning')} />;
      case 'shapes': return <ShapesGame onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('shapes')} onVisit={() => markAsVisited('shapes')} />;
      case 'matching': return <MatchingGame userName={userName} onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('matching')} onVisit={() => markAsVisited('matching')} />;
      case 'nameit': return <NameItGame onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('nameit')} onVisit={() => markAsVisited('nameit')} />;
      case 'repeat': return <RepeatGame onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('repeat')} onVisit={() => markAsVisited('repeat')} />;
      case 'soundguess': return <SoundGuessGame onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('soundguess')} onVisit={() => markAsVisited('soundguess')} />;
      case 'coloring': return <ColoringGame onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('coloring')} onVisit={() => markAsVisited('coloring')} />;
      case 'bubbles': return <BubblesGame onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('bubbles')} onVisit={() => markAsVisited('bubbles')} />;
      case 'connect': return <ConnectGame onBack={() => handleSetScreen('menu')} isFirstTime={!visitedGames.has('connect')} onVisit={() => markAsVisited('connect')} />;
      default: return null;
    }
  };

  const categories = [
    { name: 'Aprender con IA', label: '📚 Explora y Aprende', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    { name: 'Hablar y Practicar', label: '🗣️ A Hablar', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' }
  ];

  return (
    <div className="relative w-full h-[100svh] min-h-[100svh] font-sans overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-green-100 flex flex-col">
      {isOffline && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-full bg-amber-100 text-amber-800 border-2 border-amber-300 shadow-md font-black text-xs sm:text-sm uppercase tracking-wide">
          Modo sin internet: juegos locales activos
        </div>
      )}

      {/* CAPA DE FONDO — Usando CSS puro para máximo rendimiento en iPad */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">

        {/* Sol estático con CSS animation */}
        <img
          src="/decoration.png"
          alt=""
          className="absolute -top-10 -right-10 w-[25rem] md:w-[40rem] select-none opacity-50 z-0 animate-gentle-pulse"
        />

        {/* Nubes con CSS animation — 0% JS */}
        <div className="absolute top-[15%] left-0 text-7xl opacity-60 animate-cloud-1">☁️</div>
        <div className="absolute top-[25%] left-0 text-8xl opacity-50 animate-cloud-2">☁️</div>
        <div className="absolute top-[10%] left-0 text-6xl opacity-40 animate-cloud-3">☁️</div>

        {/* Globo estático */}
        <div className="absolute text-7xl md:text-8xl select-none opacity-80 animate-float" style={{ left: '15%', top: '25%' }}>🎈</div>

        {/* Colinas rodantes SVG — Sin animación */}
        <div className="absolute bottom-0 left-0 w-full h-[35%] opacity-60">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
            <path fill="#86efac" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-[70%]" preserveAspectRatio="none">
            <path fill="#4ade80" d="M0,160L60,170.7C120,181,240,203,360,192C480,181,600,139,720,144C840,149,960,203,1080,202.7C1200,203,1320,149,1380,122.7L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
        </div>

        {/* Elementos Terrestres — Estáticos, sin Framer Motion */}
        {(screen === 'menu' || screen === 'welcome') && (
          <div className="absolute bottom-0 left-0 w-full flex justify-around items-end px-4 pb-4 md:pb-8">
            <span className="text-6xl md:text-8xl drop-shadow-lg">🌳</span>
            <span className="text-5xl md:text-7xl drop-shadow-md">🌸</span>
            <span className="text-7xl md:text-9xl drop-shadow-lg">🌲</span>
            <span className="text-5xl md:text-6xl drop-shadow-md">🍄</span>
            <span className="text-4xl md:text-5xl drop-shadow-md">🦋</span>
            <span className="text-6xl md:text-8xl drop-shadow-lg">🌳</span>
          </div>
        )}
      </div>

      {screen === 'menu' && <AppHeader screen={screen} setScreen={handleSetScreen} />}

      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ duration: 0.15 }}
            className="w-full flex-1 flex flex-col min-h-0"
          >
            {screen === 'menu' ? (
              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 md:px-12 pt-4 pb-6 custom-scrollbar relative z-10">

                {/* Decoraciones Estilo Sticker */}
                <motion.div
                  className="fixed bottom-[-5%] right-[-5%] w-64 md:w-96 pointer-events-none -z-10 opacity-60"
                  animate={{ y: [0, -20, 0], rotate: [2, -2, 2] }}
                  transition={{ duration: 6, ease: "easeInOut" }}
                >
                  <img src="/mascots.png" alt="" className="w-full drop-shadow-2xl" />
                </motion.div>

                <div className="max-w-[1400px] mx-auto pb-12">
                  {categories.map((cat, catIdx) => (
                    <motion.div 
                      key={cat.name} 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: catIdx * 0.1 }}
                      className="mb-10 lg:mb-16"
                    >
                      {/* Letrero de Categoría Premium */}
                      <div className="flex justify-center sm:justify-start mb-6 sm:mb-8 px-4">
                        <div className={`relative px-6 py-2 sm:px-8 sm:py-3 rounded-[2rem] flex items-center justify-center transform -rotate-2 hover:rotate-0 transition-transform`}>
                          <div className={`absolute inset-0 bg-white/60 blur-md rounded-[2rem]`}></div>
                          <div className={`absolute inset-0 ${cat.bg} border-[5px] ${cat.border} opacity-90 rounded-[2rem] shadow-inner`}></div>
                          <h2 className={`relative z-10 text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-[0.1em] ${cat.color} drop-shadow-[0_2px_0_white] flex items-center gap-3`}>
                            {cat.label}
                          </h2>
                        </div>
                      </div>

                      {/* Grid de Juegos Rediseñado */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8 px-4">
                        {menuItems.filter(m => cat.name === 'Aprender con IA' ? m.category === 'Aprender' : m.category === 'Habla').map((item, i) => (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03, duration: 0.3 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSetScreen(item.id as GameScreen)}
                            className="group relative aspect-[4/5] sm:aspect-square w-full rounded-[2.5rem] sm:rounded-[3rem] p-0 overflow-hidden outline-none"
                          >
                            {/* Base de la tarjeta con la super sombra 3D */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-[2.5rem] sm:rounded-[3rem] border-[6px] border-white/90 ${item.shadow} ${item.activeShadow} transition-none lg:transition-all`}></div>
                            
                            {/* Brillo principal (Top Highlight) */}
                            <div className="absolute top-0 inset-x-4 h-1/3 bg-gradient-to-b from-white/70 to-transparent rounded-b-full opacity-60"></div>
                            
                            {/* Reflejo estilo vidrio en los bordes */}
                            <div className="absolute inset-[6px] rounded-[2.2rem] border-2 border-white/40 pointer-events-none"></div>

                            {/* Contenido (Emoji y Texto) */}
                            <div className="relative h-full flex flex-col items-center justify-between py-6 px-3">
                              {/* Decoración de estrellitas sutiles */}
                              <div className="absolute top-4 right-4 text-white/50 text-xl font-black">✦</div>
                              <div className="absolute bottom-16 left-4 text-white/40 text-lg font-black">✧</div>

                              <div className="flex-1 flex items-center justify-center w-full">
                                <motion.div
                                  className="text-[4.5rem] sm:text-7xl lg:text-8xl drop-shadow-md"
                                  whileHover={{ y: -5, scale: 1.1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {item.emoji}
                                </motion.div>
                              </div>

                              {/* Cartelito con el nombre */}
                              <div className="w-full relative mt-auto px-1 sm:px-2">
                                <div className="absolute inset-0 bg-black/20 rounded-2xl blur-[2px] transform translate-y-1"></div>
                                <div className="relative bg-white/20  w-full py-2 sm:py-2.5 rounded-2xl border-t border-white/50 border-b border-black/10 flex items-center justify-center shadow-lg">
                                  <span className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-[0.15em] text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] px-1 truncate w-full text-center">
                                    {item.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-transparent">
                {renderScreen()}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function Root() {
  return (
    <AIProvider>
      <App />
    </AIProvider>
  );
}
