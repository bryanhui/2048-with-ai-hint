import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setBoardSize, createEmptyBoard, moveLeft, canMove } from './board.js';
import { startGame } from './game.js';

describe('5×5 board', () => {
  beforeEach(() => {
    setBoardSize(5);
  });

  afterEach(() => {
    setBoardSize(4);
  });

  it('creates a 5×5 empty board', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(5);
    expect(board.every((row) => row.length === 5)).toBe(true);
    expect(board.flat().every((cell) => cell === null)).toBe(true);
  });

  it('slides and merges tiles on a 5×5 board', () => {
    const board = [
      [null, 8, 2, 2, null],
      [4, 2, null, 2, null],
      [null, null, null, null, null],
      [null, null, null, null, 2],
      [null, null, null, null, null],
    ];
    const result = moveLeft(board);
    expect(result.board).toEqual([
      [8, 4, null, null, null],
      [4, 4, null, null, null],
      [null, null, null, null, null],
      [2, null, null, null, null],
      [null, null, null, null, null],
    ]);
    expect(result.scoreDelta).toBe(8);
    expect(result.changed).toBe(true);
  });

  it('detects no moves on a full 5×5 board', () => {
    const board = [
      [2, 4, 2, 4, 2],
      [4, 2, 4, 2, 4],
      [2, 4, 2, 4, 2],
      [4, 2, 4, 2, 4],
      [2, 4, 2, 4, 2],
    ];
    expect(canMove(board)).toBe(false);
  });

  it('starts a game with two tiles on a 5×5 board', () => {
    const result = startGame();
    expect(result.state.board).toHaveLength(5);
    expect(result.state.board.every((row) => row.length === 5)).toBe(true);
    const tiles = result.state.board.flat().filter((c) => c !== null);
    expect(tiles.length).toBe(2);
  });
});
