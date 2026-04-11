/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Hash, 
  Type, 
  Dog, 
  Brain, 
  Home,
  Volume2,
  Shapes,
  Layers
} from 'lucide-react';
import { GameScreen } from './types';
import { speak } from './lib/speech';

// Game Components
import ColorsGame from './components/ColorsGame';
import NumbersGame from './components/NumbersGame';
import VowelsGame from './components/VowelsGame';
import AnimalsGame from './components/AnimalsGame';
import ReasoningGame from './components/ReasoningGame';
import ShapesGame from './components/ShapesGame';
import MatchingGame from './components/MatchingGame';
import WelcomeScreen from './components/WelcomeScreen';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('welcome');
  const [userName, setUserName] = useState('');
  const [visitedGames, setVisitedGames] = useState<Set<string>>(new Set());

  const markAsVisited = useCallback((gameId: string) => {
    setVisitedGames(prev => {
      if (prev.has(gameId)) return prev;
      const next = new Set(prev);
      next.add(gameId);
      return next;
    });
  }, []);

  const menuItems = [
    { id: 'colors', label: 'Colores', icon: Palette, color: 'bg-red-400' },
    { id: 'numbers', label: 'Números', icon: Hash, color: 'bg-blue-400' },
    { id: 'vowels', label: 'Vocales', icon: Type, color: 'bg-green-400' },
    { id: 'animals', label: 'Animales', icon: Dog, color: 'bg-yellow-400' },
    { id: 'shapes', label: 'Figuras', icon: Shapes, color: 'bg-pink-400' },
    { id: 'matching', label: 'Iguales', icon: Layers, color: 'bg-cyan-400' },
    { id: 'reasoning', label: 'Pensar', icon: Brain, color: 'bg-purple-400' },
  ];

  const renderScreen = () => {
    switch (screen) {
      case 'welcome': 
        return <WelcomeScreen onStart={(name) => {
          setUserName(name);
          setScreen('menu');
        }} />;
      case 'colors': return <ColorsGame onBack={() => setScreen('menu')} isFirstTime={!visitedGames.has('colors')} onVisit={() => markAsVisited('colors')} />;
      case 'numbers': return <NumbersGame onBack={() => setScreen('menu')} isFirstTime={!visitedGames.has('numbers')} onVisit={() => markAsVisited('numbers')} />;
      case 'vowels': return <VowelsGame onBack={() => setScreen('menu')} isFirstTime={!visitedGames.has('vowels')} onVisit={() => markAsVisited('vowels')} />;
      case 'animals': return <AnimalsGame onBack={() => setScreen('menu')} isFirstTime={!visitedGames.has('animals')} onVisit={() => markAsVisited('animals')} />;
      case 'reasoning': return <ReasoningGame onBack={() => setScreen('menu')} isFirstTime={!visitedGames.has('reasoning')} onVisit={() => markAsVisited('reasoning')} />;
      case 'shapes': return <ShapesGame onBack={() => setScreen('menu')} isFirstTime={!visitedGames.has('shapes')} onVisit={() => markAsVisited('shapes')} />;
      case 'matching': return <MatchingGame onBack={() => setScreen('menu')} isFirstTime={!visitedGames.has('matching')} onVisit={() => markAsVisited('matching')} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen font-sans overflow-hidden relative flex flex-col bg-[#fffbeb]">
      {/* Floating Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-20 left-10 text-6xl opacity-20"
        >
          🦁
        </motion.div>
        <motion.div 
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-40 right-20 text-6xl opacity-20"
        >
          🪄
        </motion.div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute bottom-40 left-20 text-6xl opacity-20"
        >
          ⭐
        </motion.div>
        <motion.div 
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute bottom-20 right-10 text-6xl opacity-20"
        >
          🐘
        </motion.div>
      </div>

      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b-4 border-orange-100">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-black text-orange-500 flex items-center gap-3"
        >
          <motion.div 
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 bg-gradient-to-tr from-orange-400 to-yellow-300 rounded-xl flex items-center justify-center text-white shadow-lg"
          >
            P
          </motion.div>
          <span className="drop-shadow-sm">PequeAprendo</span>
        </motion.h1>
        
        {screen !== 'menu' && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setScreen('menu')}
            className="bg-white p-3 rounded-full shadow-md text-gray-600 hover:text-orange-500 transition-colors"
          >
            <Home size={24} />
          </motion.button>
        )}
      </header>

      <main className="relative z-10 flex-grow overflow-y-auto pb-12 bg-gradient-to-b from-orange-50/50 to-yellow-50/50">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {screen === 'menu' ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 p-4 sm:p-8 max-w-7xl mx-auto items-center">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setScreen(item.id as GameScreen);
                    }}
                    className={`${item.color} rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-8 shadow-xl flex flex-col items-center justify-center gap-3 sm:gap-6 text-white border-b-[8px] sm:border-b-[12px] border-black/20 hover:shadow-2xl transition-all relative overflow-hidden group min-h-[160px] sm:min-h-[200px]`}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="bg-white/30 p-3 sm:p-6 rounded-[1.2rem] sm:rounded-[2rem] shadow-inner">
                      <item.icon size={32} className="xs:w-10 xs:h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 drop-shadow-lg" />
                    </div>
                    <span className="text-lg sm:text-2xl font-black uppercase tracking-wider drop-shadow-md text-center leading-tight">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            ) : (
              renderScreen()
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Decorative elements */}
      <div className="fixed bottom-0 left-0 w-full h-24 bg-green-200/30 -z-10 blur-3xl rounded-t-full" />
      <div className="fixed top-20 right-0 w-48 h-48 bg-yellow-200/30 -z-10 blur-3xl rounded-full" />
    </div>
  );
}
