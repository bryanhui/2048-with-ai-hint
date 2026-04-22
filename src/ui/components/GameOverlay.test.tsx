import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOverlay } from './GameOverlay';

describe('GameOverlay', () => {
  it('shows title and buttons when visible', () => {
    render(<GameOverlay title="You Win!" visible={true} onRestart={vi.fn()} onResume={vi.fn()} />);
    expect(screen.getByText('You Win!')).toBeInTheDocument();
    expect(screen.getByText('New Game')).toBeInTheDocument();
    expect(screen.getByText('Back to Game')).toBeInTheDocument();
  });

  it('is hidden when not visible', () => {
    render(<GameOverlay title="Game Over" visible={false} onRestart={vi.fn()} onResume={vi.fn()} />);
    expect(screen.queryByText('Game Over')).not.toBeInTheDocument();
  });

  it('calls onRestart when New Game clicked', () => {
    const onRestart = vi.fn();
    render(<GameOverlay title="You Win!" visible={true} onRestart={onRestart} onResume={vi.fn()} />);
    fireEvent.click(screen.getByText('New Game'));
    expect(onRestart).toHaveBeenCalled();
  });

  it('calls onResume when Back to Game clicked', () => {
    const onResume = vi.fn();
    render(<GameOverlay title="You Win!" visible={true} onRestart={vi.fn()} onResume={onResume} />);
    fireEvent.click(screen.getByText('Back to Game'));
    expect(onResume).toHaveBeenCalled();
  });
});
