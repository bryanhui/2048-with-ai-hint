import { GameState } from '../core/types.js';

export function makeState(board: number[][]): GameState {
  return {
    board: board.map((row) => row.map((c) => (c === 0 ? null : c))),
    score: 0,
    highScore: 0,
    status: 'playing',
    history: [],
  };
}
