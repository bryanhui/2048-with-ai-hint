import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOverlay } from './GameOverlay';

describe('GameOverlay', () => {
  it('shows title and buttons when visible', () => {
    render(<GameOverlay title="You Win!" visible={true} onRestart={vi.fn()} onResume={vi.fn()} />);
    expect(screen.getByText('You Win!')).toBeInTheDocument();
    expect(screen.getByText('Restart')).toBeInTheDocument();
    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  it('is hidden when not visible', () => {
    render(<GameOverlay title="Game Over" visible={false} onRestart={vi.fn()} onResume={vi.fn()} />);
    expect(screen.queryByText('Game Over')).not.toBeInTheDocument();
  });

  it('calls onRestart when restart clicked', () => {
    const onRestart = vi.fn();
    render(<GameOverlay title="You Win!" visible={true} onRestart={onRestart} onResume={vi.fn()} />);
    fireEvent.click(screen.getByText('Restart'));
    expect(onRestart).toHaveBeenCalled();
  });
});
