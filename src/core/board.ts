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

  for (const row of board) {
    const result = slideRow(row);
    totalScore += result.scoreDelta;
    next.push(result.row);
    if (!changed && !arraysEqual(row, result.row)) {
      changed = true;
    }
  }

  return { board: next, scoreDelta: totalScore, changed };
}

function getColumn(board: Board, col: number): Cell[] {
  return board.map((row) => row[col]);
}

function setColumn(board: Board, col: number, values: Cell[]): Board {
  const next = cloneBoard(board);
  for (let row = 0; row < BOARD_SIZE; row++) {
    next[row][col] = values[row];
  }
  return next;
}

export function move(board: Board, direction: Direction): { board: Board; scoreDelta: number; changed: boolean } {
  if (direction === 'left') {
    return moveLeft(board);
  }

  if (direction === 'right') {
    const reversed = board.map((row) => [...row].reverse());
    const result = moveLeft(reversed);
    return {
      board: result.board.map((row) => [...row].reverse()),
      scoreDelta: result.scoreDelta,
      changed: result.changed,
    };
  }

  let totalScore = 0;
  let nextBoard = cloneBoard(board);
  let changed = false;

  for (let col = 0; col < BOARD_SIZE; col++) {
    const column = getColumn(board, col);
    const toSlide = direction === 'up' ? column : [...column].reverse();
    const result = slideRow(toSlide);
    const finalColumn = direction === 'up' ? result.row : [...result.row].reverse();

    totalScore += result.scoreDelta;
    nextBoard = setColumn(nextBoard, col, finalColumn);
    if (!changed && !arraysEqual(column, finalColumn)) {
      changed = true;
    }
  }

  return { board: nextBoard, scoreDelta: totalScore, changed };
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
