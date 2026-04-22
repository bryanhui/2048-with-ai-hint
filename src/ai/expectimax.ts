import { Board, Direction, GameState, DIRECTIONS, Position } from '../core/types.js';
import { move, getEmptyCells, canMove, spawnTile } from '../core/board.js';
import { Strategy, pickBestMove } from './types.js';
import { evaluateBoard } from './evaluate.js';

function spreadSample(cells: Position[], n: number): Position[] {
  if (cells.length <= n) return cells;
  const sampled: Position[] = [];
  const step = cells.length / n;
  for (let i = 0; i < n; i++) {
    sampled.push(cells[Math.floor(i * step)]);
  }
  return sampled;
}

function serializeBoard(board: Board): string {
  return board.map((r) => r.map((c) => (c ?? 0)).join('|')).join('/');
}

function expectimax(
  board: Board,
  depth: number,
  isPlayerTurn: boolean,
  cache: Map<string, number>
): number {
  if (depth === 0 || !canMove(board)) {
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
      const score = expectimax(result.board, depth - 1, false, cache) + result.scoreDelta;
      best = Math.max(best, score);
    }
    value = best === -Infinity ? evaluateBoard(board) : best;
  } else {
    const empty = getEmptyCells(board);
    if (empty.length === 0) {
      value = evaluateBoard(board);
    } else {
      // Sample more cells near the top of the tree where spawn uncertainty
      // matters most, fewer at deeper levels to keep search fast.
      // Use an even spread instead of row-major slice to avoid biasing
      // toward top-left spawns when evaluating right/down moves.
      const sampleSize = Math.min(empty.length, depth >= 2 ? 8 : 2);
      const sample = spreadSample(empty, sampleSize);

      let total = 0;
      for (const pos of sample) {
        total += 0.9 * expectimax(spawnTile(board, 2, pos), depth - 1, true, cache);
        total += 0.1 * expectimax(spawnTile(board, 4, pos), depth - 1, true, cache);
      }
      value = total / sample.length;
    }
  }

  cache.set(key, value);
  return value;
}

export class ExpectimaxStrategy implements Strategy {
  readonly name = 'expectimax';
  private readonly maxDepth: number;

  constructor(maxDepth = 6) {
    this.maxDepth = maxDepth;
  }

  selectMove(state: GameState): Direction {
    return pickBestMove(this.scoreMoves(state));
  }

  scoreMoves(state: GameState): Record<Direction, number> {
    const scores: Record<string, number> = {};
    for (const direction of DIRECTIONS) {
      const result = move(state.board, direction);
      if (!result.changed) {
        scores[direction] = -Infinity;
        continue;
      }
      scores[direction] = expectimax(result.board, this.maxDepth, false, new Map()) + result.scoreDelta;
    }
    return scores as Record<Direction, number>;
  }
}
