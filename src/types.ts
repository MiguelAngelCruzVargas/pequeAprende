
export type GameScreen = 'welcome' | 'menu' | 'colors' | 'numbers' | 'vowels' | 'animals' | 'reasoning' | 'shapes' | 'matching' | 'nameit' | 'repeat' | 'soundguess' | 'coloring' | 'bubbles';

export interface GameState {
  currentScreen: GameScreen;
  userName: string;
}
