import { describe, it, expect } from 'vitest';
import { evaluateBoard } from './evaluate.js';
import { Board } from '../core/types.js';

describe('evaluateBoard', () => {
  it('scores an empty board by empty cells only', () => {
    const board: Board = [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    expect(evaluateBoard(board)).toBe(16 * 270);
  });

  it('rewards a board with a high max tile', () => {
    const board: Board = [
      [1024, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const score = evaluateBoard(board);
    expect(score).toBeGreaterThan(1024 * 16);
  });

  it('rewards monotonic rows and columns', () => {
    const monotonic: Board = [
      [128, 64, 32, 16],
      [64, 32, 16, 8],
      [32, 16, 8, 4],
      [16, 8, 4, 2],
    ];
    const flat: Board = [
      [2, 2, 2, 2],
      [2, 2, 2, 2],
      [2, 2, 2, 2],
      [2, 2, 2, 2],
    ];
    expect(evaluateBoard(monotonic)).toBeGreaterThan(evaluateBoard(flat));
  });

  it('rewards smoothness (adjacent equal tiles)', () => {
    // Boards with identical monotonicity, empty cells, max tile, and corner bonus.
    // Only smoothness differs.
    const smooth: Board = [
      [2, 2, 4, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const rough: Board = [
      [2, 4, 2, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    expect(evaluateBoard(smooth)).toBeGreaterThan(evaluateBoard(rough));
  });

  it('handles a full board with no matches', () => {
    const board: Board = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 64],
    ];
    const score = evaluateBoard(board);
    expect(typeof score).toBe('number');
    expect(Number.isFinite(score)).toBe(true);
  });
});
