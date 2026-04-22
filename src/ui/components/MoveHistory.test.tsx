import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MoveHistory } from './MoveHistory';
import { GameEvent } from '../../core/types.js';

describe('MoveHistory', () => {
  it('renders last 10 board moved events', () => {
    const history: GameEvent[] = [
      { type: 'GameStarted', seedBoard: [[null]] },
      { type: 'BoardMoved', direction: 'left', before: [[null]], after: [[null]], scoreDelta: 4 },
      { type: 'BoardMoved', direction: 'up', before: [[null]], after: [[null]], scoreDelta: 8 },
    ];
    render(<MoveHistory history={history} />);
    expect(screen.getByText('up → +8')).toBeInTheDocument();
    expect(screen.getByText('left → +4')).toBeInTheDocument();
  });
});
