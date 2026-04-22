import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeOverlay } from './WelcomeOverlay';

describe('WelcomeOverlay', () => {
  it('is hidden when not visible', () => {
    render(<WelcomeOverlay visible={false} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.queryByText('Welcome to 2048 AI')).not.toBeInTheDocument();
  });

  it('shows welcome message when visible', () => {
    render(<WelcomeOverlay visible={true} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByText('Welcome to 2048 AI')).toBeInTheDocument();
  });

  it('shows the long press hint', () => {
    render(<WelcomeOverlay visible={true} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByText(/Did you know\?/i)).toBeInTheDocument();
    expect(screen.getByText(/long press/i)).toBeInTheDocument();
  });

  it('shows cookie consent notice', () => {
    render(<WelcomeOverlay visible={true} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByText(/cookies/i)).toBeInTheDocument();
    expect(screen.getByText(/high score will not be auto-saved/i)).toBeInTheDocument();
  });

  it('shows accept and decline buttons', () => {
    render(<WelcomeOverlay visible={true} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByText('Accept and play')).toBeInTheDocument();
    expect(screen.getByText('Reject and play')).toBeInTheDocument();
  });

  it('calls onAccept when accept clicked', () => {
    const onAccept = vi.fn();
    render(<WelcomeOverlay visible={true} onAccept={onAccept} onDecline={vi.fn()} />);
    fireEvent.click(screen.getByText('Accept and play'));
    expect(onAccept).toHaveBeenCalled();
  });

  it('calls onDecline when decline clicked', () => {
    const onDecline = vi.fn();
    render(<WelcomeOverlay visible={true} onAccept={vi.fn()} onDecline={onDecline} />);
    fireEvent.click(screen.getByText('Reject and play'));
    expect(onDecline).toHaveBeenCalled();
  });
});
