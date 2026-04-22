import type React from 'react';
import { GameEvent } from '../../core/types.js';

interface MoveHistoryProps {
  history: GameEvent[];
}

export function MoveHistory({ history }: MoveHistoryProps): React.ReactElement {
  const moves = history
    .filter((e): e is Extract<GameEvent, { type: 'BoardMoved' }> => e.type === 'BoardMoved')
    .slice(-10)
    .reverse();

  return (
    <ul id="move-history">
      {moves.map((move, index) => (
        <li key={`${move.direction}-${index}`}>{`${move.direction} → +${move.scoreDelta}`}</li>
      ))}
    </ul>
  );
}
