import { describe, it, expect } from 'vitest';
import { pickBestMove, measureMove } from './types.js';
import { makeState } from './test-helpers.js';
import { ExpectimaxStrategy } from './expectimax.js';

describe('pickBestMove', () => {
  it('returns direction with highest score', () => {
    const scores = { up: 10, down: 5, left: 20, right: 3 };
    expect(pickBestMove(scores)).toBe('left');
  });

  it('prefers earlier direction on ties', () => {
    const scores = { up: 10, down: 10, left: 10, right: 10 };
    expect(pickBestMove(scores)).toBe('up');
  });

  it('handles negative scores', () => {
    const scores = { up: -5, down: -10, left: -1, right: -20 };
    expect(pickBestMove(scores)).toBe('left');
  });
});

describe('measureMove', () => {
  it('returns direction, scores, and positive duration', async () => {
    const strategy = new ExpectimaxStrategy(1);
    const state = makeState([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const result = await measureMove(strategy, state);
    expect(result.direction).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.scores).toBeDefined();
  });
});
