
export type GameScreen = 'welcome' | 'menu' | 'colors' | 'numbers' | 'vowels' | 'animals' | 'reasoning' | 'shapes' | 'matching';

export interface GameState {
  currentScreen: GameScreen;
  userName: string;
}
