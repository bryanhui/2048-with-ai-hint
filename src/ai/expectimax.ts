import { Board, Direction, GameState, DIRECTIONS } from '../core/types.js';
import { move, getEmptyCells, canMove, spawnTile } from '../core/board.js';
import { Strategy, pickBestMove } from './types.js';
import { evaluateBoard } from './evaluate.js';

function expectimax(board: Board, depth: number, isPlayerTurn: boolean): number {
  if (depth === 0 || !canMove(board)) {
    return evaluateBoard(board);
  }

  if (isPlayerTurn) {
    let best = -Infinity;
    for (const direction of DIRECTIONS) {
      const result = move(board, direction);
      if (!result.changed) continue;
      const score = expectimax(result.board, depth - 1, false) + result.scoreDelta;
      best = Math.max(best, score);
    }
    return best === -Infinity ? evaluateBoard(board) : best;
  }

  const empty = getEmptyCells(board);
  if (empty.length === 0) {
    return evaluateBoard(board);
  }

  // Sample more cells near the top of the tree where spawn uncertainty
  // matters most, fewer at deeper levels to keep search fast.
  const sampleSize = Math.min(empty.length, depth >= 2 ? 8 : 2);
  const sample = empty.slice(0, sampleSize);

  let total = 0;
  for (const pos of sample) {
    const with2 = spawnTile(board, 2, pos);
    const with4 = spawnTile(board, 4, pos);
    total += 0.9 * expectimax(with2, depth - 1, true);
    total += 0.1 * expectimax(with4, depth - 1, true);
  }
  return total / sample.length;
}

export class ExpectimaxStrategy implements Strategy {
  readonly name = 'expectimax';
  private readonly maxDepth: number;

  constructor(maxDepth = 4) {
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
      scores[direction] = expectimax(result.board, this.maxDepth, false) + result.scoreDelta;
    }
    return scores as Record<Direction, number>;
  }
}
