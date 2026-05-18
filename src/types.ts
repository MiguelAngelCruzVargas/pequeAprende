
export type GameScreen = 'welcome' | 'menu' | 'colors' | 'numbers' | 'vowels' | 'animals' | 'reasoning' | 'shapes' | 'matching' | 'nameit' | 'repeat' | 'soundguess' | 'coloring' | 'bubbles' | 'connect' | 'trace';

export interface GameState {
  currentScreen: GameScreen;
  userName: string;
}
