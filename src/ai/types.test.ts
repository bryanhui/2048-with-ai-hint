import { describe, it, expect, vi } from 'vitest';
import { pickBestMove, measureMove } from './types.js';
import { makeState } from './test-helpers.js';
import { ImprovedExpectimaxStrategy } from './improved_expectimax.js';

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
    const strategy = new ImprovedExpectimaxStrategy(1, 50);
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

  it('works with async scoreMoves (Nim-like strategy)', async () => {
    const asyncStrategy = {
      name: 'async-mock',
      selectMove: vi.fn(),
      scoreMoves: vi.fn().mockResolvedValue({ up: 10, down: 5, left: 20, right: 3 }),
    };
    const state = makeState([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const result = await measureMove(asyncStrategy as unknown as import('./types.js').Strategy, state);
    expect(result.direction).toBe('left');
    expect(result.scores.left).toBe(20);
  });
});
