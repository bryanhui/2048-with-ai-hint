import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiHintPanel } from './AiHintPanel';

describe('AiHintPanel', () => {
  const baseProps = {
    hintVisible: false,
    hintDirection: 'left',
    hintScores: { up: 10, down: 5, left: 20, right: 3 } as Record<string, number>,
    strategyName: 'expectimax',
    durationMs: 42,
    autoHint: false,
    onDismiss: vi.fn(),
  };

  it('renders placeholder when hint is not visible', () => {
    render(<AiHintPanel {...baseProps} />);
    expect(screen.getByText(/Click AI Hint/i)).toBeInTheDocument();
  });

  it('renders auto-hint placeholder when auto-hint is on', () => {
    render(<AiHintPanel {...baseProps} autoHint={true} />);
    expect(screen.getByText(/Auto Hint/i)).toBeInTheDocument();
  });

  it('renders hint overlay when visible', () => {
    render(<AiHintPanel {...baseProps} hintVisible={true} />);
    expect(screen.getByText('Left', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/Expectimax ·/i)).toBeInTheDocument();
  });

  it('shows all 4 direction scores', () => {
    render(<AiHintPanel {...baseProps} hintVisible={true} />);
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/←/)).toBeInTheDocument();
    expect(screen.getByText(/→/)).toBeInTheDocument();
  });

  it('shows — for invalid moves', () => {
    render(
      <AiHintPanel
        {...baseProps}
        hintVisible={true}
        hintScores={{ up: -Infinity, down: -Infinity, left: 100, right: -Infinity }}
      />
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('calls onDismiss when overlay clicked', () => {
    const onDismiss = vi.fn();
    render(<AiHintPanel {...baseProps} hintVisible={true} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Left', { selector: 'strong' }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
