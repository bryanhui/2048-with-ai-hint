import { describe, it, expect } from 'vitest';
import {
  createEmptyBoard,
  boardsEqual,
  getEmptyCells,
  spawnTile,
  hasWinningTile,
  moveLeft,
  moveRight,
  moveUp,
  moveDown,
  move,
  canMove,
  pickRandomEmptyCell,
} from './board.js';

describe('createEmptyBoard', () => {
  it('returns a 4x4 board of nulls', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(4);
    expect(board.every((row) => row.length === 4)).toBe(true);
    expect(board.flat().every((cell) => cell === null)).toBe(true);
  });
});

describe('boardsEqual', () => {
  it('returns true for identical boards', () => {
    const a = [
      [2, null],
      [null, 4],
    ];
    const b = [
      [2, null],
      [null, 4],
    ];
    expect(boardsEqual(a, b)).toBe(true);
  });

  it('returns false for different boards', () => {
    const a = [
      [2, null],
      [null, 4],
    ];
    const b = [
      [2, null],
      [null, 8],
    ];
    expect(boardsEqual(a, b)).toBe(false);
  });
});

describe('getEmptyCells', () => {
  it('returns all empty positions', () => {
    const board = [
      [2, null, 2, null],
      [null, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const empty = getEmptyCells(board);
    expect(empty).toEqual([
      { row: 0, col: 1 },
      { row: 0, col: 3 },
      { row: 1, col: 0 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
    ]);
  });
});

describe('spawnTile', () => {
  it('places a tile at the given position', () => {
    const board = createEmptyBoard();
    const next = spawnTile(board, 2, { row: 1, col: 2 });
    expect(next[1][2]).toBe(2);
    expect(next[0][0]).toBe(null);
  });
});

describe('hasWinningTile', () => {
  it('returns true when target tile exists', () => {
    const board = createEmptyBoard();
    board[0][0] = 2048;
    expect(hasWinningTile(board)).toBe(true);
  });

  it('returns false when target tile does not exist', () => {
    const board = createEmptyBoard();
    board[0][0] = 1024;
    expect(hasWinningTile(board)).toBe(false);
  });
});

describe('moveLeft', () => {
  it('slides and merges tiles to the left', () => {
    const board = [
      [null, 8, 2, 2],
      [4, 2, null, 2],
      [null, null, null, null],
      [null, null, null, 2],
    ];
    const result = moveLeft(board);
    expect(result.board).toEqual([
      [8, 4, null, null],
      [4, 4, null, null],
      [null, null, null, null],
      [2, null, null, null],
    ]);
    expect(result.scoreDelta).toBe(8);
    expect(result.changed).toBe(true);
  });

  it('returns changed false when board does not change', () => {
    const board = [
      [2, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = moveLeft(board);
    expect(result.changed).toBe(false);
  });

  it('double merge: [2,2,2,2] → [4,4,null,null] with score 8', () => {
    const board = [
      [2, 2, 2, 2],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = moveLeft(board);
    expect(result.board).toEqual([
      [4, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ]);
    expect(result.scoreDelta).toBe(8);
    expect(result.changed).toBe(true);
  });

  it('double merge: [2,2,4,4] → [4,8,null,null] with score 12', () => {
    const board = [
      [2, 2, 4, 4],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = moveLeft(board);
    expect(result.board).toEqual([
      [4, 8, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ]);
    expect(result.scoreDelta).toBe(12);
    expect(result.changed).toBe(true);
  });
});

describe('moveRight', () => {
  it('slides and merges tiles to the right', () => {
    const board = [
      [2, 2, 8, null],
      [2, null, 2, 4],
      [null, null, null, null],
      [2, null, null, null],
    ];
    const result = moveRight(board);
    expect(result.board).toEqual([
      [null, null, 4, 8],
      [null, null, 4, 4],
      [null, null, null, null],
      [null, null, null, 2],
    ]);
    expect(result.scoreDelta).toBe(8);
    expect(result.changed).toBe(true);
  });

  it('returns changed false when board does not change', () => {
    const board = [
      [null, null, 4, 2],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = moveRight(board);
    expect(result.changed).toBe(false);
  });

  it('double merge: [2,2,2,2] → [null,null,4,4] with score 8', () => {
    const board = [
      [2, 2, 2, 2],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = moveRight(board);
    expect(result.board).toEqual([
      [null, null, 4, 4],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ]);
    expect(result.scoreDelta).toBe(8);
    expect(result.changed).toBe(true);
  });

  it('double merge: [2,2,4,4] → [null,null,4,8] with score 12', () => {
    const board = [
      [2, 2, 4, 4],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = moveRight(board);
    expect(result.board).toEqual([
      [null, null, 4, 8],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ]);
    expect(result.scoreDelta).toBe(12);
    expect(result.changed).toBe(true);
  });
});

describe('moveUp', () => {
  it('slides and merges tiles upward', () => {
    const board = [
      [null, 4, null, null],
      [8, 2, null, null],
      [2, null, null, null],
      [2, 2, null, 2],
    ];
    const result = moveUp(board);
    expect(result.board).toEqual([
      [8, 4, null, 2],
      [4, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ]);
    expect(result.scoreDelta).toBe(8);
    expect(result.changed).toBe(true);
  });

  it('returns changed false when board does not change', () => {
    const board = [
      [2, null, null, null],
      [4, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = moveUp(board);
    expect(result.changed).toBe(false);
  });

  it('double merge in column: [2,2,2,2] → [4,4,null,null] with score 8', () => {
    const board = [
      [2, null, null, null],
      [2, null, null, null],
      [2, null, null, null],
      [2, null, null, null],
    ];
    const result = moveUp(board);
    expect(result.board).toEqual([
      [4, null, null, null],
      [4, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ]);
    expect(result.scoreDelta).toBe(8);
    expect(result.changed).toBe(true);
  });
});

describe('moveDown', () => {
  it('slides and merges tiles downward', () => {
    const board = [
      [2, 2, null, null],
      [2, null, null, null],
      [8, 2, null, null],
      [null, 4, null, 2],
    ];
    const result = moveDown(board);
    expect(result.board).toEqual([
      [null, null, null, null],
      [null, null, null, null],
      [4, 4, null, null],
      [8, 4, null, 2],
    ]);
    expect(result.scoreDelta).toBe(8);
    expect(result.changed).toBe(true);
  });

  it('returns changed false when board does not change', () => {
    const board = [
      [null, null, null, null],
      [null, null, null, null],
      [2, null, null, null],
      [4, null, null, null],
    ];
    const result = moveDown(board);
    expect(result.changed).toBe(false);
  });

  it('double merge in column: [2,2,2,2] → [null,null,4,4] with score 8', () => {
    const board = [
      [2, null, null, null],
      [2, null, null, null],
      [2, null, null, null],
      [2, null, null, null],
    ];
    const result = moveDown(board);
    expect(result.board).toEqual([
      [null, null, null, null],
      [null, null, null, null],
      [4, null, null, null],
      [4, null, null, null],
    ]);
    expect(result.scoreDelta).toBe(8);
    expect(result.changed).toBe(true);
  });
});

describe('move (all directions)', () => {
  const base = [
    [null, 8, 2, 2],
    [4, 2, null, 2],
    [null, null, null, null],
    [null, null, null, 2],
  ];

  it('left', () => {
    const result = move(base, 'left');
    expect(result.board).toEqual([
      [8, 4, null, null],
      [4, 4, null, null],
      [null, null, null, null],
      [2, null, null, null],
    ]);
    expect(result.scoreDelta).toBe(8);
    expect(result.changed).toBe(true);
  });

  it('right', () => {
    const result = move(base, 'right');
    expect(result.board).toEqual([
      [null, null, 8, 4],
      [null, null, 4, 4],
      [null, null, null, null],
      [null, null, null, 2],
    ]);
    expect(result.scoreDelta).toBe(8);
    expect(result.changed).toBe(true);
  });

  it('up', () => {
    const result = move(base, 'up');
    expect(result.board).toEqual([
      [4, 8, 2, 4],
      [null, 2, null, 2],
      [null, null, null, null],
      [null, null, null, null],
    ]);
    expect(result.scoreDelta).toBe(4);
    expect(result.changed).toBe(true);
  });

  it('down', () => {
    const result = move(base, 'down');
    expect(result.board).toEqual([
      [null, null, null, null],
      [null, null, null, null],
      [null, 8, null, 2],
      [4, 2, 2, 4],
    ]);
    expect(result.scoreDelta).toBe(4);
    expect(result.changed).toBe(true);
  });

  it('returns changed false when board does not change', () => {
    const stuck = [
      [2, 4, 8, 16],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ];
    expect(move(stuck, 'left').changed).toBe(false);
    expect(move(stuck, 'right').changed).toBe(false);
    expect(move(stuck, 'up').changed).toBe(false);
    expect(move(stuck, 'down').changed).toBe(false);
  });
});

describe('canMove', () => {
  it('returns true when empty cells exist', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, null],
    ];
    expect(canMove(board)).toBe(true);
  });

  it('returns true when adjacent merges are possible', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 4],
    ];
    expect(canMove(board)).toBe(true);
  });

  it('returns false when board is full and no merges possible', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(canMove(board)).toBe(false);
  });
});

describe('pickRandomEmptyCell', () => {
  it('returns null for a full board', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(pickRandomEmptyCell(board)).toBeNull();
  });

  it('returns an empty position', () => {
    const board = createEmptyBoard();
    const pos = pickRandomEmptyCell(board);
    expect(pos).not.toBeNull();
    expect(board[pos!.row][pos!.col]).toBeNull();
  });
});
