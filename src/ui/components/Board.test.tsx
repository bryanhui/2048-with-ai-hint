import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Board } from './Board';

describe('Board', () => {
  it('renders tiles for non-null cells', () => {
    const board = [
      [2, null, 4, null],
      [null, 8, null, null],
      [null, null, null, null],
      [null, null, null, 16],
    ];
    render(<Board board={board} spawnPosition={undefined} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
  });

  it('marks the spawned tile as new', () => {
    const board = [
      [2, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    render(<Board board={board} spawnPosition={{ row: 0, col: 0 }} />);
    expect(screen.getByText('2')).toHaveClass('tile-spawn');
  });
});
