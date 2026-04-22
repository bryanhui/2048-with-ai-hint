import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AiHintPanel } from './AiHintPanel';

describe('AiHintPanel', () => {
  it('shows all 4 direction scores', () => {
    render(
      <AiHintPanel
        hintDirection="left"
        hintScores={{ up: 10, down: 5, left: 20, right: 3 }}
      />
    );
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/←/)).toBeInTheDocument();
    expect(screen.getByText(/→/)).toBeInTheDocument();
  });

  it('shows — for invalid moves', () => {
    render(
      <AiHintPanel
        hintDirection="left"
        hintScores={{ up: -Infinity, down: -Infinity, left: 100, right: -Infinity }}
      />
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('shows — when no hint has been requested', () => {
    render(<AiHintPanel hintDirection="left" hintScores={{}} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(4);
  });

  it('shows expectimax explanation when no hint is active', () => {
    render(<AiHintPanel hintDirection="left" hintScores={{}} />);
    expect(screen.getByText(/Expectimax scores moves/i)).toBeInTheDocument();
  });

  it('hides explanation when a hint is active', () => {
    render(
      <AiHintPanel
        hintDirection="left"
        hintScores={{ up: 10, down: 5, left: 20, right: 3 }}
      />
    );
    const explanation = screen.getByText(/Expectimax scores moves/i);
    expect(explanation).toHaveClass('ai-hint-explanation-hidden');
  });

  it('highlights the best direction', () => {
    render(
      <AiHintPanel
        hintDirection="left"
        hintScores={{ up: 10, down: 5, left: 20, right: 3 }}
      />
    );
    const bestCell = screen.getByText('←').closest('.ai-hint-score-cell');
    expect(bestCell).toHaveClass('ai-hint-score-best');
  });
});
