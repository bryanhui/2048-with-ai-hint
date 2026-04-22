export type Cell = number | null;
export type Board = Cell[][];
export type Direction = 'up' | 'down' | 'left' | 'right';
export const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
export type Position = { row: number; col: number };
export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface GameState {
  board: Board;
  score: number;
  highScore: number;
  status: GameStatus;
  history: GameEvent[];
}

export type GameEvent =
  | { type: 'GameStarted'; seedBoard: Board }
  | { type: 'BoardMoved'; direction: Direction; before: Board; after: Board; scoreDelta: number }
  | { type: 'TileSpawned'; value: 2 | 4; position: Position }
  | { type: 'GameWon'; winningTile: number }
  | { type: 'GameLost' }
  | { type: 'ScoreUpdated'; total: number }
  | { type: 'HighScoreUpdated'; total: number };
