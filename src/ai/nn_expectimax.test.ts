import { describe, it, expect } from 'vitest';
import {
  NnExpectimaxStrategy,
  boardToBitboard,
  bitboardToBoard,
} from './nn_expectimax.js';
import { makeState } from './test-helpers.js';

describe('NnExpectimaxStrategy', () => {
  it('selects a valid move', () => {
    const strategy = new NnExpectimaxStrategy();
    const state = makeState([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const move = strategy.selectMove(state);
    expect(['left', 'right', 'up', 'down']).toContain(move);
  });

  it('returns identical scores on repeated calls', () => {
    const strategy = new NnExpectimaxStrategy();
    const state = makeState([
      [2, 2, 4, 8],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ]);
    const scores1 = strategy.scoreMoves(state);
    const scores2 = strategy.scoreMoves(state);
    expect(scores1).toEqual(scores2);
  });

  it('marks invalid moves as 0', () => {
    const strategy = new NnExpectimaxStrategy();
    const state = makeState([
      [2, 4, 8, 16],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ]);
    const scores = strategy.scoreMoves(state);
    const zeroMoves = Object.values(scores).filter((s) => s === 0);
    expect(zeroMoves.length).toBeGreaterThanOrEqual(1);
  });
});

describe('boardToBitboard / bitboardToBoard', () => {
  it('round-trips an empty board', () => {
    const board = [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    expect(bitboardToBoard(boardToBitboard(board))).toEqual(board);
  });

  it('round-trips a board with various tiles', () => {
    const board = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2048, null],
      [null, null, null, null],
    ];
    expect(bitboardToBoard(boardToBitboard(board))).toEqual(board);
  });
});
