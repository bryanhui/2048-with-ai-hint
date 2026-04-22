import { Board, Cell, Direction, Position } from './types.js';

export let BOARD_SIZE = 4;

/** Test helper to temporarily change board dimension */
export function setBoardSize(size: number): void {
  BOARD_SIZE = size;
}
export const WINNING_TILE = 2048;

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function boardsEqual(a: Board, b: Board): boolean {
  return a.every((row, r) => row.every((cell, c) => cell === b[r][c]));
}

export function getEmptyCells(board: Board): Position[] {
  const empty: Position[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) {
        empty.push({ row, col });
      }
    }
  }
  return empty;
}

export function spawnTile(board: Board, value: 2 | 4, position: Position): Board {
  const next = cloneBoard(board);
  next[position.row][position.col] = value;
  return next;
}

export function hasWinningTile(board: Board, target = WINNING_TILE): boolean {
  return board.some((row) => row.some((cell) => cell === target));
}

function slideRow(row: Cell[]): { row: Cell[]; scoreDelta: number } {
  const nonNull = row.filter((cell): cell is number => cell !== null);
  const merged: Cell[] = [];
  let scoreDelta = 0;

  for (let i = 0; i < nonNull.length; i++) {
    if (i + 1 < nonNull.length && nonNull[i] === nonNull[i + 1]) {
      const value = nonNull[i] * 2;
      merged.push(value);
      scoreDelta += value;
      i++;
    } else {
      merged.push(nonNull[i]);
    }
  }

  while (merged.length < BOARD_SIZE) {
    merged.push(null);
  }

  return { row: merged, scoreDelta };
}

function arraysEqual(a: Cell[], b: Cell[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function moveLeft(board: Board): { board: Board; scoreDelta: number; changed: boolean } {
  let totalScore = 0;
  const next: Board = [];
  let changed = false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = board[r];
    const result = slideRow(row);
    totalScore += result.scoreDelta;
    next.push(result.row);
    if (!changed && !arraysEqual(row, result.row)) {
      changed = true;
    }
  }

  return { board: next, scoreDelta: totalScore, changed };
}

export function moveRight(board: Board): { board: Board; scoreDelta: number; changed: boolean } {
  let totalScore = 0;
  const next: Board = [];
  let changed = false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = board[r];
    const result = slideRow([...row].reverse());
    const finalRow = [...result.row].reverse();
    totalScore += result.scoreDelta;
    next.push(finalRow);
    if (!changed && !arraysEqual(row, finalRow)) {
      changed = true;
    }
  }

  return { board: next, scoreDelta: totalScore, changed };
}

export function moveUp(board: Board): { board: Board; scoreDelta: number; changed: boolean } {
  let totalScore = 0;
  const next = cloneBoard(board);
  let changed = false;

  for (let c = 0; c < BOARD_SIZE; c++) {
    const column: Cell[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      column.push(board[r][c]);
    }
    const result = slideRow(column);
    for (let r = 0; r < BOARD_SIZE; r++) {
      next[r][c] = result.row[r];
    }
    totalScore += result.scoreDelta;
    if (!changed && !arraysEqual(column, result.row)) {
      changed = true;
    }
  }

  return { board: next, scoreDelta: totalScore, changed };
}

export function moveDown(board: Board): { board: Board; scoreDelta: number; changed: boolean } {
  let totalScore = 0;
  const next = cloneBoard(board);
  let changed = false;

  for (let c = 0; c < BOARD_SIZE; c++) {
    const column: Cell[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      column.push(board[r][c]);
    }
    const result = slideRow([...column].reverse());
    const finalColumn = [...result.row].reverse();
    for (let r = 0; r < BOARD_SIZE; r++) {
      next[r][c] = finalColumn[r];
    }
    totalScore += result.scoreDelta;
    if (!changed && !arraysEqual(column, finalColumn)) {
      changed = true;
    }
  }

  return { board: next, scoreDelta: totalScore, changed };
}

export function move(board: Board, direction: Direction): { board: Board; scoreDelta: number; changed: boolean } {
  switch (direction) {
    case 'left':
      return moveLeft(board);
    case 'right':
      return moveRight(board);
    case 'up':
      return moveUp(board);
    case 'down':
      return moveDown(board);
  }
}

export function canMove(board: Board): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[row][col];
      if (cell === null) return true;
      if (col + 1 < BOARD_SIZE && board[row][col + 1] === cell) return true;
      if (row + 1 < BOARD_SIZE && board[row + 1][col] === cell) return true;
    }
  }
  return false;
}

export function initBoard(count = 2): Board {
  let board = createEmptyBoard();
  const empty = getEmptyCells(board);
  for (let i = 0; i < Math.min(count, empty.length); i++) {
    const index = Math.floor(Math.random() * empty.length);
    const [pos] = empty.splice(index, 1);
    board = spawnTile(board, Math.random() < 0.9 ? 2 : 4, pos);
  }
  return board;
}

export function pickRandomEmptyCell(board: Board): Position | null {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}
