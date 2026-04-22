import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tile } from './Tile';

describe('Tile', () => {
  it('renders the tile value', () => {
    render(<Tile value={128} row={1} col={2} isNew={false} isMerged={false} />);
    expect(screen.getByText('128')).toBeInTheDocument();
  });

  it('adds spawn class for new tiles', () => {
    render(<Tile value={2} row={0} col={0} isNew={true} isMerged={false} />);
    expect(screen.getByText('2')).toHaveClass('tile-spawn');
  });

  it('adds merge class for merged tiles', () => {
    render(<Tile value={4} row={0} col={0} isNew={false} isMerged={true} />);
    expect(screen.getByText('4')).toHaveClass('tile-merge');
  });

  it('sets data attributes for position', () => {
    render(<Tile value={4} row={2} col={3} isNew={false} isMerged={false} />);
    const tile = screen.getByText('4');
    expect(tile).toHaveAttribute('data-row', '2');
    expect(tile).toHaveAttribute('data-col', '3');
  });
});
