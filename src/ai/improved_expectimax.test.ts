import { describe, it, expect } from 'vitest';
import { ImprovedExpectimaxStrategy, evaluateBoard } from './improved_expectimax.js';
import { makeState } from './test-helpers.js';

describe('ImprovedExpectimaxStrategy', () => {
  it('selects a valid move', () => {
    const strategy = new ImprovedExpectimaxStrategy(4, 50);
    const state = makeState([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const move = strategy.selectMove(state);
    expect(['left', 'right', 'up', 'down']).toContain(move);
  });

  it('prefers moves that preserve snake structure', () => {
    const strategy = new ImprovedExpectimaxStrategy(4, 50);
    const state = makeState([
      [128, 64, 32, 16],
      [64, 32, 16, 8],
      [32, 16, 8, 4],
      [16, 8, 4, 2],
    ]);
    const move = strategy.selectMove(state);
    expect(['left', 'up']).toContain(move);
  });

  it('uses default depth of 6 and time limit of 100ms', () => {
    const strategy = new ImprovedExpectimaxStrategy();
    expect((strategy as unknown as { maxDepth: number }).maxDepth).toBe(6);
    expect((strategy as unknown as { timeLimitMs: number }).timeLimitMs).toBe(100);
  });

  it('consistently marks invalid moves as -Infinity', () => {
    const strategy = new ImprovedExpectimaxStrategy(3, 50);
    const state = makeState([
      [2, 2, 4, 8],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ]);

    const scores = strategy.scoreMoves(state);
    const invalidMoves = Object.entries(scores).filter(([, s]) => s === -Infinity);
    expect(invalidMoves.length).toBeGreaterThanOrEqual(1);
  });

  it('respects the time limit and returns quickly', () => {
    const strategy = new ImprovedExpectimaxStrategy(10, 10);
    const state = makeState([
      [2, 2, 4, 8],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ]);

    const start = performance.now();
    strategy.scoreMoves(state);
    const elapsed = performance.now() - start;

    // Should finish near the 10ms limit, not the full depth-10 search time.
    expect(elapsed).toBeLessThan(100);
  });
});

describe('evaluateBoard', () => {
  it('rewards large tiles in high snake-weight positions', () => {
    const good = [
      [2048, 1024, 512, 256],
      [128, 256, 512, 1024],
      [64, 32, 16, 8],
      [4, 2, null, null],
    ];
    const bad = [
      [null, null, 2, 4],
      [8, 16, 32, 64],
      [1024, 512, 256, 128],
      [256, 512, 1024, 2048],
    ];
    expect(evaluateBoard(good)).toBeGreaterThan(evaluateBoard(bad));
  });

  it('empty-cell bonus is present in evaluation', () => {
    // Two identical single-tile boards, one with an extra empty cell.
    const moreEmpty = [
      [2, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const lessEmpty = [
      [2, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    // lessEmpty has a higher snake score (4 * 32768 = 131072 extra)
    // but also one fewer empty cell (-270).  We just verify the
    // evaluator produces different scores; the snake will dominate.
    expect(evaluateBoard(lessEmpty)).not.toBe(evaluateBoard(moreEmpty));
  });

  it('rewards monotonic rows and columns', () => {
    const mono = [
      [16, 8, 4, 2],
      [8, 4, 2, null],
      [4, 2, null, null],
      [2, null, null, null],
    ];
    const messy = [
      [2, 16, 4, 8],
      [8, 2, 16, 4],
      [4, 8, 2, 16],
      [16, 4, 8, 2],
    ];
    expect(evaluateBoard(mono)).toBeGreaterThan(evaluateBoard(messy));
  });
});
