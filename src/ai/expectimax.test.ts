import { describe, it, expect } from 'vitest';
import { ExpectimaxStrategy } from './expectimax.js';
import { makeState } from './test-helpers.js';

describe('ExpectimaxStrategy', () => {
  it('selects a valid move', () => {
    const strategy = new ExpectimaxStrategy(2);
    const state = makeState([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const move = strategy.selectMove(state);
    expect(['left', 'right', 'up', 'down']).toContain(move);
  });

  it('prefers moves that preserve structure', () => {
    const strategy = new ExpectimaxStrategy(2);
    const state = makeState([
      [128, 64, 32, 16],
      [64, 32, 16, 8],
      [32, 16, 8, 4],
      [16, 8, 4, 2],
    ]);
    const move = strategy.selectMove(state);
    expect(['left', 'up']).toContain(move);
  });
});
