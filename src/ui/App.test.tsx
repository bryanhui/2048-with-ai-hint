import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

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
  MemoryEventStore: vi.fn(),
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
    localStorage.setItem('storage_consent', 'accepted');
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

  afterEach(() => {
    localStorage.clear();
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

  it('resets auto-hint and YOLO on New Game', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);

    // Enable auto-hint
    const btn = screen.getByText('AI Hint');
    fireEvent.mouseDown(btn);
    vi.advanceTimersByTime(600);
    fireEvent.mouseUp(btn);

    await waitFor(() => {
      expect(screen.getByText('Auto Hint')).toBeInTheDocument();
    });

    // Enable YOLO
    fireEvent.click(screen.getByText('YOLO'));
    expect(screen.getByText('Last Moves')).toBeInTheDocument();

    // Click New Game
    fireEvent.click(screen.getByText('New Game'));
    expect(mockNewGame).toHaveBeenCalled();

    // Auto-hint and YOLO should be off
    expect(screen.queryByText('Auto Hint')).not.toBeInTheDocument();
    expect(screen.queryByText('Last Moves')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('calls undo when Undo is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Undo'));
    expect(mockUndo).toHaveBeenCalled();
  });

  it('populates hint scores when AI Hint is clicked', async () => {
    render(<App />);
    // Before clicking, all scores are —
    const dashesBefore = screen.getAllByText('—');
    expect(dashesBefore.length).toBe(4);

    fireEvent.mouseDown(screen.getByText('AI Hint'));
    fireEvent.mouseUp(screen.getByText('AI Hint'));

    await waitFor(() => {
      // After clicking, scores should be populated (not all —)
      expect(screen.queryAllByText('—').length).toBeLessThan(4);
    });
  });

  it('clears manual hint scores after a move when auto-hint and YOLO are off', async () => {
    const { rerender } = render(<App />);

    fireEvent.mouseDown(screen.getByText('AI Hint'));
    fireEvent.mouseUp(screen.getByText('AI Hint'));

    await waitFor(() => {
      expect(screen.queryAllByText('—').length).toBeLessThan(4);
    });

    // Simulate a move without auto-hint or YOLO
    mockUseGame.mockReturnValue({
      state: makeState({ history: [{ direction: 'up', board: [], scoreDelta: 0 }] }),
      move: mockMove,
      undo: mockUndo,
      newGame: mockNewGame,
    });
    rerender(<App />);

    // Scores should be cleared, all — again
    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBe(4);
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
    fireEvent.mouseDown(screen.getByText('AI Hint'));
    fireEvent.mouseUp(screen.getByText('AI Hint'));

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
    fireEvent.mouseDown(screen.getByText('AI Hint'));
    fireEvent.mouseUp(screen.getByText('AI Hint'));

    await waitFor(() => {
      expect(screen.getByText('20')).toBeInTheDocument();
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

  it('hides overlay when Back to Game is clicked', () => {
    mockUseGame.mockReturnValue({
      state: makeState({ status: 'won' }),
      move: mockMove,
      undo: mockUndo,
      newGame: mockNewGame,
    });

    render(<App />);
    expect(screen.getByText('You Win!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back to Game'));
    expect(screen.queryByText('You Win!')).not.toBeInTheDocument();
  });

  it('shows error when trying to move after winning', () => {
    mockUseGame.mockReturnValue({
      state: makeState({ status: 'won' }),
      move: mockMove,
      undo: mockUndo,
      newGame: mockNewGame,
    });

    render(<App />);
    fireEvent.click(screen.getByText('Back to Game'));

    const wrappedMove = mockUseKeyboard.mock.calls.at(-1)?.[0];
    expect(wrappedMove).toBeDefined();
    act(() => wrappedMove('up'));

    expect(screen.getByText('Game over (you won)')).toBeInTheDocument();
  });

  it('shows error when trying to move after losing', () => {
    mockUseGame.mockReturnValue({
      state: makeState({ status: 'lost' }),
      move: mockMove,
      undo: mockUndo,
      newGame: mockNewGame,
    });

    render(<App />);
    fireEvent.click(screen.getByText('Back to Game'));

    const wrappedMove = mockUseKeyboard.mock.calls.at(-1)?.[0];
    expect(wrappedMove).toBeDefined();
    act(() => wrappedMove('up'));

    expect(screen.getByText('Game over (you lost)')).toBeInTheDocument();
  });

  it('move error auto-dismisses after 2 seconds', async () => {
    mockUseGame.mockReturnValue({
      state: makeState({ status: 'won' }),
      move: mockMove,
      undo: mockUndo,
      newGame: mockNewGame,
    });

    render(<App />);
    fireEvent.click(screen.getByText('Back to Game'));

    const wrappedMove = mockUseKeyboard.mock.calls.at(-1)?.[0];
    act(() => wrappedMove('up'));

    expect(screen.getByText('Game over (you won)')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Game over (you won)')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('attaches touch handler to board', () => {
    render(<App />);
    expect(mockAttachTouch).toHaveBeenCalled();
  });

  it('shows all 4 direction scores in hint panel', () => {
    render(<App />);
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/←/)).toBeInTheDocument();
    expect(screen.getByText(/→/)).toBeInTheDocument();
  });

  it('long press on AI Hint enables auto-hint mode', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);
    const btn = screen.getByText('AI Hint');

    fireEvent.mouseDown(btn);
    vi.advanceTimersByTime(600);
    fireEvent.mouseUp(btn);

    await waitFor(() => {
      expect(screen.getByText('Auto Hint')).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('auto-hint generates hint immediately when enabled', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);
    const btn = screen.getByText('AI Hint');

    fireEvent.mouseDown(btn);
    vi.advanceTimersByTime(600);
    fireEvent.mouseUp(btn);

    await waitFor(() => {
      expect(mockMeasureMove).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('auto-hint generates hint after a move', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockMeasureMove.mockResolvedValueOnce({
      direction: 'left',
      durationMs: 42,
      scores: { up: 10, down: 5, left: 20, right: 3 },
    });

    const { rerender } = render(<App />);
    const btn = screen.getByText('AI Hint');

    fireEvent.mouseDown(btn);
    vi.advanceTimersByTime(600);
    fireEvent.mouseUp(btn);

    await waitFor(() => {
      expect(screen.getByText('Auto Hint')).toBeInTheDocument();
    });

    mockUseGame.mockReturnValue({
      state: makeState({ history: [{ direction: 'up', board: [], scoreDelta: 0 }] }),
      move: mockMove,
      undo: mockUndo,
      newGame: mockNewGame,
    });
    rerender(<App />);

    await waitFor(() => {
      expect(mockMeasureMove).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('clicking AI Hint while auto-hint is active disables it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);
    const btn = screen.getByText('AI Hint');

    fireEvent.mouseDown(btn);
    vi.advanceTimersByTime(600);
    fireEvent.mouseUp(btn);

    await waitFor(() => {
      expect(screen.getByText('Auto Hint')).toBeInTheDocument();
    });

    fireEvent.mouseDown(btn);
    fireEvent.mouseUp(btn);

    await waitFor(() => {
      expect(screen.queryByText('Auto Hint')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('hides MoveHistory when YOLO is off', () => {
    render(<App />);
    expect(screen.queryByText('Last Moves')).not.toBeInTheDocument();
  });

  it('shows MoveHistory when YOLO is turned on', () => {
    render(<App />);
    fireEvent.click(screen.getByText('YOLO'));
    expect(screen.getByText('Last Moves')).toBeInTheDocument();
  });

  it('YOLO mode populates hint scores after auto-move', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockMeasureMove.mockResolvedValue({
      direction: 'left',
      durationMs: 42,
      scores: { up: 10, down: 5, left: 20, right: 3 },
    });

    const { rerender } = render(<App />);
    fireEvent.click(screen.getByText('YOLO'));

    expect(screen.getByText('Last Moves')).toBeInTheDocument();

    vi.advanceTimersByTime(500);

    mockUseGame.mockReturnValue({
      state: makeState({ history: [{ direction: 'left', board: [], scoreDelta: 0 }] }),
      move: mockMove,
      undo: mockUndo,
      newGame: mockNewGame,
    });
    rerender(<App />);

    await waitFor(() => {
      expect(mockMeasureMove).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('hint panel stays visible after board click', () => {
    render(<App />);
    fireEvent.click(document.getElementById('board')!);
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/←/)).toBeInTheDocument();
    expect(screen.getByText(/→/)).toBeInTheDocument();
  });

  it('hides MoveHistory when YOLO is turned off', () => {
    render(<App />);
    fireEvent.click(screen.getByText('YOLO'));
    expect(screen.getByText('Last Moves')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Stop YOLO'));
    expect(screen.queryByText('Last Moves')).not.toBeInTheDocument();
  });
});

describe('App welcome overlay', () => {
  beforeEach(() => {
    localStorage.clear();
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

  afterEach(() => {
    localStorage.clear();
  });

  it('shows welcome overlay on first load', () => {
    render(<App />);
    expect(screen.getByText('Welcome to 2048 AI')).toBeInTheDocument();
  });

  it('does not show welcome overlay when consent already given', () => {
    localStorage.setItem('storage_consent', 'accepted');
    render(<App />);
    expect(screen.queryByText('Welcome to 2048 AI')).not.toBeInTheDocument();
  });

  it('shows welcome overlay when consent was previously declined (stale flag)', () => {
    localStorage.setItem('storage_consent', 'declined');
    render(<App />);
    expect(screen.getByText('Welcome to 2048 AI')).toBeInTheDocument();
    expect(localStorage.getItem('storage_consent')).toBeNull();
  });

  it('stores accepted consent and hides overlay on accept', () => {
    render(<App />);
    expect(screen.getByText('Welcome to 2048 AI')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Accept and play'));
    expect(screen.queryByText('Welcome to 2048 AI')).not.toBeInTheDocument();
    expect(localStorage.getItem('storage_consent')).toBe('accepted');
  });

  it('does not store anything on decline', () => {
    render(<App />);
    expect(screen.getByText('Welcome to 2048 AI')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Reject and play'));
    expect(screen.queryByText('Welcome to 2048 AI')).not.toBeInTheDocument();
    expect(localStorage.getItem('storage_consent')).toBeNull();
  });

  it('shows welcome again after decline (no persistence)', () => {
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByText('Reject and play'));
    expect(screen.queryByText('Welcome to 2048 AI')).not.toBeInTheDocument();

    unmount();
    render(<App />);
    expect(screen.getByText('Welcome to 2048 AI')).toBeInTheDocument();
  });

  it('clears stale declined flag on load', () => {
    localStorage.setItem('storage_consent', 'declined');
    render(<App />);
    expect(screen.getByText('Welcome to 2048 AI')).toBeInTheDocument();
    expect(localStorage.getItem('storage_consent')).toBeNull();
  });
});
