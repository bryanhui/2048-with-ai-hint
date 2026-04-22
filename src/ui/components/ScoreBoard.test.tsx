import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreBoard } from './ScoreBoard';

describe('ScoreBoard', () => {
  it('renders score and high score in separate boxes', () => {
    render(<ScoreBoard score={128} highScore={256} />);
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('256')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('Best')).toBeInTheDocument();
  });
});
