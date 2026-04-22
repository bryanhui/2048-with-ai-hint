import { Direction, GameState, DIRECTIONS } from '../core/types.js';

export interface Strategy {
  readonly name: string;
  selectMove(state: GameState): Promise<Direction> | Direction;
  scoreMoves(state: GameState): Promise<Record<Direction, number>> | Record<Direction, number>;
}

export function pickBestMove(scores: Record<Direction, number>): Direction {
  let best: Direction = 'left';
  let bestScore = -Infinity;
  for (const d of DIRECTIONS) {
    if (scores[d] > bestScore) {
      bestScore = scores[d];
      best = d;
    }
  }
  return best;
}

export interface TimedMoveResult {
  direction: Direction;
  durationMs: number;
  scores: Record<Direction, number>;
}

export async function measureMove(
  strategy: Strategy,
  state: GameState
): Promise<TimedMoveResult> {
  const start = performance.now();
  const scores = await strategy.scoreMoves(state);
  const direction = pickBestMove(scores);
  const durationMs = performance.now() - start;
  return { direction, durationMs, scores };
}
