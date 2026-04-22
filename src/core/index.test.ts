import { describe, it, expect } from 'vitest';
import {
  createEmptyBoard,
  move,
  canMove,
  initBoard,
  startGame,
  executeMove,
  reduce,
  rehydrate,
  gameStarted,
  boardMoved,
  tileSpawned,
  gameWon,
  gameLost,
  scoreUpdated,
  highScoreUpdated,
} from './index.js';

describe('core index re-exports', () => {
  it('exports board functions', () => {
    expect(createEmptyBoard).toBeDefined();
    expect(move).toBeDefined();
    expect(canMove).toBeDefined();
    expect(initBoard).toBeDefined();
  });

  it('exports game functions', () => {
    expect(startGame).toBeDefined();
    expect(executeMove).toBeDefined();
  });

  it('exports reducer functions', () => {
    expect(reduce).toBeDefined();
    expect(rehydrate).toBeDefined();
  });

  it('exports event creators', () => {
    expect(gameStarted).toBeDefined();
    expect(boardMoved).toBeDefined();
    expect(tileSpawned).toBeDefined();
    expect(gameWon).toBeDefined();
    expect(gameLost).toBeDefined();
    expect(scoreUpdated).toBeDefined();
    expect(highScoreUpdated).toBeDefined();
  });
});
