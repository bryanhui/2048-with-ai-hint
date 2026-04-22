import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockUseGame = vi.fn();
const mockUseKeyboard = vi.fn();
const mockAttachTouch = vi.fn();
const mockMeasureMove = vi.fn();
const mockNewGame = vi.fn();
const mockUndo = vi.fn();

const mockMove = vi.fn();

vi.mock('./hooks/useGame.js', () => ({
  useGame: (...args: unknown[]) => mockUseGame(...args),
}));

vi.mock('./hooks/useKeyboard.js', () => ({
  useKeyboard: (...args: unknown[]) => mockUseKeyboard(...args),
}));

vi.mock('./input.js', () => ({
  attachTouch: (...args: unknown[]) => mockAttachTouch(...args),
}));

vi.mock('../ai/index.js', () => ({
  ExpectimaxStrategy: function () {
    return {
      name: 'expectimax',
      selectMove: vi.fn(),
      scoreMoves: () => ({ up: 10, down: 5, left: 20, right: 3 }),
    };
  },
  measureMove: (...args: unknown[]) => mockMeasureMove(...args),
}));

vi.mock('../infrastructure/storage.js', () => ({
  LocalStorageEventStore: vi.fn(),
}));

vi.mock('./config.js', () => ({
  CONFIG: {
    ENABLE_STRATEGY_SELECTOR: true,
    ENABLE_AI_HINT: true,
    ENABLE_UNDO: true,
    ENABLE_YOLO: true,
    YOLO_DELAY_MS: 400,
    DEFAULT_STRATEGY: 'expectimax',
    EXPECTIMAX_DEPTH: 6,
  },
}));

import { App } from './App';

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    board: [
      [2, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ],
    score: 0,
    highScore: 100,
    status: 'playing',
    history: [],
    ...overrides,
  };
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGame.mockReturnValue({
      state: makeState(),
      move: mockMove,
      undo: mockUndo,
      newGame: mockNewGame,
    });
    mockMeasureMove.mockResolvedValue({
      direction: 'left',
      durationMs: 42,
      scores: { up: 10, down: 5, left: 20, right: 3 },
    });
  });

  it('renders the game board and score', () => {
    render(<App />);
    expect(screen.getByText('2048')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('calls newGame when New Game is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByText('New Game'));
    expect(mockNewGame).toHaveBeenCalled();
  });

  it('calls undo when Undo is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Undo'));
    expect(mockUndo).toHaveBeenCalled();
  });

  it('shows hint when AI Hint is clicked', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('AI Hint'));

    await waitFor(() => {
      expect(screen.getByText('Left')).toBeInTheDocument();
    });
  });

  it('clears previous timeout when hint is clicked again', async () => {
    render(<App />);

    fireEvent.click(screen.getByText('AI Hint'));
    await waitFor(() => {
      expect(screen.getByText('Left')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('AI Hint'));
    await waitFor(() => {
      expect(screen.getByText('Left')).toBeInTheDocument();
    });
  });

  it('does nothing when hint clicked while not playing', async () => {
    mockUseGame.mockReturnValue({
      state: makeState({ status: 'won' }),
      move: mockMove,
      undo: mockUndo,
      newGame: mockNewGame,
    });

    render(<App />);
    fireEvent.click(screen.getByText('AI Hint'));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockMeasureMove).not.toHaveBeenCalled();
  });

  it('handles hint with only one valid move score', async () => {
    mockMeasureMove.mockResolvedValue({
      direction: 'left',
      durationMs: 42,
      scores: { up: -Infinity, down: -Infinity, left: 20, right: -Infinity },
    });

    render(<App />);
    fireEvent.click(screen.getByText('AI Hint'));

    await waitFor(() => {
      expect(screen.getByText('Left')).toBeInTheDocument();
    });
  });

  it('shows game overlay when won', () => {
    mockUseGame.mockReturnValue({
      state: makeState({ status: 'won' }),
      move: mockMove,
      undo: mockUndo,
      newGame: mockNewGame,
    });

    render(<App />);
    expect(screen.getByText('You Win!')).toBeInTheDocument();
  });

  it('shows game overlay when lost', () => {
    mockUseGame.mockReturnValue({
      state: makeState({ status: 'lost' }),
      move: mockMove,
      undo: mockUndo,
      newGame: mockNewGame,
    });

    render(<App />);
    expect(screen.getByText('Game Over')).toBeInTheDocument();
  });

  it('hides overlay when Resume is clicked', () => {
    mockUseGame.mockReturnValue({
      state: makeState({ status: 'won' }),
      move: mockMove,
      undo: mockUndo,
      newGame: mockNewGame,
    });

    render(<App />);
    expect(screen.getByText('You Win!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Resume'));
    expect(screen.queryByText('You Win!')).not.toBeInTheDocument();
  });

  it('attaches touch handler to board', () => {
    render(<App />);
    expect(mockAttachTouch).toHaveBeenCalled();
  });

  it('dismisses hint overlay when board is clicked', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('AI Hint'));

    await waitFor(() => {
      expect(screen.getByText('Left')).toBeInTheDocument();
    });

    fireEvent.click(document.getElementById('board')!);
    expect(screen.queryByText('Left')).not.toBeInTheDocument();
  });

  it('dismisses hint overlay when panel is clicked', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('AI Hint'));

    await waitFor(() => {
      expect(screen.getByText('Left')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Expectimax ·/i));
    expect(screen.queryByText('Left')).not.toBeInTheDocument();
  });

  it('shows all 4 direction scores in hint', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('AI Hint'));

    await waitFor(() => {
      expect(screen.getByText(/↑/)).toBeInTheDocument();
      expect(screen.getByText(/↓/)).toBeInTheDocument();
      expect(screen.getByText(/←/)).toBeInTheDocument();
      expect(screen.getByText(/→/)).toBeInTheDocument();
    });
  });
});
