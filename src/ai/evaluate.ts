import { Board } from '../core/types.js';
import { getEmptyCells, BOARD_SIZE } from '../core/board.js';

// Heuristic weights tuned for 4×4 boards.
// Empty cells are heavily weighted because open space is critical for survival.
// Monotonicity rewards ordered rows/cols. Smoothness rewards mergeable neighbors.
// Corner bonus keeps the max tile anchored in a corner (key for high scores).
const MONOTONICITY_WEIGHT = 47;
const SMOOTHNESS_WEIGHT = 11;
const EMPTY_WEIGHT = 270;
const MAX_TILE_WEIGHT = 16;
const CORNER_WEIGHT = 100;

export function evaluateBoard(board: Board): number {
  const empty = getEmptyCells(board).length;
  let maxTile = 0;
  let maxRow = -1;
  let maxCol = -1;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const cell = board[r][c];
      if (cell !== null && cell > maxTile) {
        maxTile = cell;
        maxRow = r;
        maxCol = c;
      }
    }
  }
  const mono = monotonicity(board);
  const smooth = smoothness(board);
  const corner =
    maxTile > 0 &&
    ((maxRow === 0 && maxCol === 0) ||
      (maxRow === 0 && maxCol === BOARD_SIZE - 1) ||
      (maxRow === BOARD_SIZE - 1 && maxCol === 0) ||
      (maxRow === BOARD_SIZE - 1 && maxCol === BOARD_SIZE - 1))
      ? maxTile
      : 0;

  return (
    mono * MONOTONICITY_WEIGHT +
    smooth * SMOOTHNESS_WEIGHT +
    empty * EMPTY_WEIGHT +
    maxTile * MAX_TILE_WEIGHT +
    corner * CORNER_WEIGHT
  );
}

function monotonicity(board: Board): number {
  let score = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    let left = 0;
    let right = 0;
    for (let col = 0; col < BOARD_SIZE - 1; col++) {
      const a = board[row][col] ?? 0;
      const b = board[row][col + 1] ?? 0;
      if (a > b) left += a - b;
      else if (b > a) right += b - a;
    }
    score += Math.max(left, right);
  }
  for (let col = 0; col < BOARD_SIZE; col++) {
    let up = 0;
    let down = 0;
    for (let row = 0; row < BOARD_SIZE - 1; row++) {
      const a = board[row][col] ?? 0;
      const b = board[row + 1][col] ?? 0;
      if (a > b) up += a - b;
      else if (b > a) down += b - a;
    }
    score += Math.max(up, down);
  }
  return score;
}

function smoothness(board: Board): number {
  let score = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const val = board[row][col];
      if (val === null) continue;
      if (col < BOARD_SIZE - 1 && board[row][col + 1] === val) score += val;
      if (row < BOARD_SIZE - 1 && board[row + 1][col] === val) score += val;
    }
  }
  return score;
}
