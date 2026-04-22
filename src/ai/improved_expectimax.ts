import { Board, Direction, GameState, DIRECTIONS, Position } from '../core/types.js';
import { move, getEmptyCells, canMove, spawnTile } from '../core/board.js';
import { Strategy, pickBestMove } from './types.js';

// ---------------------------------------------------------------------------
// Evaluation: snake-pattern weight matrix + smoothness + monotonicity +
// merge potential + open-space bonus.  The snake pattern is the dominant
// term; the others fine-tune the score.
// ---------------------------------------------------------------------------

/** Snake-pattern weights that reward keeping the largest tile in a corner
 *  and forming a decreasing “snake” across the board. */
const SNAKE_WEIGHTS = [
  [65536, 32768, 16384, 8192],
  [512, 1024, 2048, 4096],
  [256, 128, 64, 32],
  [16, 8, 4, 2],
];

const EMPTY_BONUS = 270;
const SMOOTHNESS_WEIGHT = 0.5;
const MONOTONICITY_BONUS = 100;
const MERGE_BONUS = 10;

function snakeScore(board: Board): number {
  let score = 0;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      score += (board[r][c] ?? 0) * SNAKE_WEIGHTS[r][c];
    }
  }
  return score;
}

function emptyScore(board: Board): number {
  return getEmptyCells(board).length * EMPTY_BONUS;
}

/** Penalty for adjacent tiles with very different values. */
function smoothness(board: Board): number {
  let penalty = 0;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length - 1; c++) {
      penalty -= Math.abs((board[r][c] ?? 0) - (board[r][c + 1] ?? 0));
    }
  }
  for (let c = 0; c < board[0].length; c++) {
    for (let r = 0; r < board.length - 1; r++) {
      penalty -= Math.abs((board[r][c] ?? 0) - (board[r + 1][c] ?? 0));
    }
  }
  return penalty;
}

/** Bonus for rows / columns that are monotonically increasing or
 *  decreasing (makes the board easier to control). */
function monotonicity(board: Board): number {
  let bonus = 0;
  for (let r = 0; r < board.length; r++) {
    let inc = true;
    let dec = true;
    for (let c = 0; c < board[r].length - 1; c++) {
      const a = board[r][c] ?? 0;
      const b = board[r][c + 1] ?? 0;
      if (a > b) inc = false;
      if (a < b) dec = false;
    }
    if (inc || dec) bonus += MONOTONICITY_BONUS;
  }
  for (let c = 0; c < board[0].length; c++) {
    let inc = true;
    let dec = true;
    for (let r = 0; r < board.length - 1; r++) {
      const a = board[r][c] ?? 0;
      const b = board[r + 1][c] ?? 0;
      if (a > b) inc = false;
      if (a < b) dec = false;
    }
    if (inc || dec) bonus += MONOTONICITY_BONUS;
  }
  return bonus;
}

/** Bonus for adjacent equal tiles (merge opportunities). */
function mergePotential(board: Board): number {
  let bonus = 0;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length - 1; c++) {
      const a = board[r][c];
      const b = board[r][c + 1];
      if (a !== null && a === b) bonus += a * MERGE_BONUS;
    }
  }
  for (let c = 0; c < board[0].length; c++) {
    for (let r = 0; r < board.length - 1; r++) {
      const a = board[r][c];
      const b = board[r + 1][c];
      if (a !== null && a === b) bonus += a * MERGE_BONUS;
    }
  }
  return bonus;
}

export function evaluateBoard(board: Board): number {
  return (
    snakeScore(board) +
    emptyScore(board) +
    smoothness(board) * SMOOTHNESS_WEIGHT +
    monotonicity(board) +
    mergePotential(board)
  );
}

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

function serializeBoard(board: Board): string {
  return board.map((r) => r.map((c) => (c ?? 0)).join('|')).join('/');
}

function spreadSample(cells: Position[], n: number): Position[] {
  if (cells.length <= n) return cells;
  const sampled: Position[] = [];
  const step = cells.length / n;
  for (let i = 0; i < n; i++) {
    sampled.push(cells[Math.floor(i * step)]);
  }
  return sampled;
}

// ---------------------------------------------------------------------------
// Expectimax core
// ---------------------------------------------------------------------------

function expectimax(
  board: Board,
  depth: number,
  isPlayerTurn: boolean,
  cache: Map<string, number>,
  startTime: number,
  timeLimitMs: number
): number {
  if (depth === 0 || !canMove(board)) {
    return evaluateBoard(board);
  }

  // Time-bounded cut-off: checked every other ply to keep overhead low.
  if (depth % 2 === 0 && performance.now() - startTime > timeLimitMs) {
    return evaluateBoard(board);
  }

  const key = `${serializeBoard(board)}:${depth}:${isPlayerTurn ? '1' : '0'}`;
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  let value: number;

  if (isPlayerTurn) {
    let best = -Infinity;
    for (const direction of DIRECTIONS) {
      const result = move(board, direction);
      if (!result.changed) continue;
      const score = expectimax(
        result.board,
        depth - 1,
        false,
        cache,
        startTime,
        timeLimitMs
      );
      best = Math.max(best, score);
    }
    value = best === -Infinity ? evaluateBoard(board) : best;
  } else {
    const empty = getEmptyCells(board);
    if (empty.length === 0) {
      value = evaluateBoard(board);
    } else {
      // Sample more cells near the top of the tree where spawn
      // uncertainty matters most, fewer at deeper levels.
      const sampleSize = Math.min(empty.length, depth >= 2 ? 8 : 2);
      const sample = spreadSample(empty, sampleSize);

      let total = 0;
      for (const pos of sample) {
        total +=
          0.9 *
          expectimax(
            spawnTile(board, 2, pos),
            depth - 1,
            true,
            cache,
            startTime,
            timeLimitMs
          );
        total +=
          0.1 *
          expectimax(
            spawnTile(board, 4, pos),
            depth - 1,
            true,
            cache,
            startTime,
            timeLimitMs
          );
      }
      value = total / sample.length;
    }
  }

  cache.set(key, value);
  return value;
}

// ---------------------------------------------------------------------------
// Strategy wrapper with iterative deepening
// ---------------------------------------------------------------------------

export class ImprovedExpectimaxStrategy implements Strategy {
  readonly name = 'improved_expectimax';
  private readonly maxDepth: number;
  private readonly timeLimitMs: number;

  constructor(maxDepth = 6, timeLimitMs = 100) {
    this.maxDepth = maxDepth;
    this.timeLimitMs = timeLimitMs;
  }

  selectMove(state: GameState): Direction {
    return pickBestMove(this.scoreMoves(state));
  }

  scoreMoves(state: GameState): Record<Direction, number> {
    const startTime = performance.now();
    let bestScores: Record<string, number> = {};

    // Iterative deepening: keep going deeper until we run out of time.
    // The scores from the deepest fully-completed depth are returned.
    for (let depth = 1; depth <= this.maxDepth; depth++) {
      const scores: Record<string, number> = {};
      let completed = true;

      for (const direction of DIRECTIONS) {
        // Global time check before starting a new direction.
        if (performance.now() - startTime > this.timeLimitMs) {
          completed = false;
          break;
        }

        const result = move(state.board, direction);
        if (!result.changed) {
          scores[direction] = -Infinity;
          continue;
        }

        const cache = new Map<string, number>();
        scores[direction] =
          expectimax(
            result.board,
            depth,
            false,
            cache,
            startTime,
            this.timeLimitMs
          ) + result.scoreDelta;
      }

      if (!completed) break;
      bestScores = scores;
    }

    return bestScores as Record<Direction, number>;
  }
}
