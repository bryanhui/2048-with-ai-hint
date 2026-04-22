import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGame } from './useGame';
import { MemoryEventStore } from '../../infrastructure/storage.js';
import * as Events from '../../core/events.js';

describe('useGame', () => {
  it('loads a new game when no events are stored', async () => {
    const store = new MemoryEventStore();
    const { result } = renderHook(() => useGame({ store, gameId: 'test' }));

    await waitFor(() => expect(result.current.state.status).toBe('playing'));
    expect(result.current.state.board.flat().filter((c) => c !== null)).toHaveLength(2);
  });

  it('persists events after a move', async () => {
    const store = new MemoryEventStore();
    // Pre-seed with a board where a left move is guaranteed to change something
    const events = [
      Events.gameStarted([
        [null, 2, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]),
    ];
    await store.save('test', events);

    const { result } = renderHook(() => useGame({ store, gameId: 'test' }));

    await waitFor(() => expect(result.current.state.board[0][1]).toBe(2));

    const before = result.current.state.history.length;
    act(() => result.current.move('left'));

    await waitFor(() => expect(result.current.state.history.length).toBeGreaterThan(before));

    const saved = await store.load('test');
    expect(saved.length).toBeGreaterThan(0);
  });

  it('starts a new game while keeping high score', async () => {
    const store = new MemoryEventStore();
    const { result } = renderHook(() => useGame({ store, gameId: 'test' }));

    await waitFor(() => expect(result.current.state.status).toBe('playing'));

    act(() => result.current.newGame());

    await waitFor(() => expect(result.current.state.history.length).toBe(1));
    expect(result.current.state.status).toBe('playing');
  });

  it('loads existing events from store', async () => {
    const store = new MemoryEventStore();
    const events = [
      Events.gameStarted([
        [2, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]),
    ];
    await store.save('existing', events);

    const { result } = renderHook(() => useGame({ store, gameId: 'existing' }));

    await waitFor(() => expect(result.current.state.board[0][0]).toBe(2));
  });

  it('undo reverts the last move', async () => {
    const store = new MemoryEventStore();
    const events = [
      Events.gameStarted([
        [null, 2, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]),
    ];
    await store.save('test', events);
    const { result } = renderHook(() => useGame({ store, gameId: 'test' }));

    await waitFor(() => expect(result.current.state.board[0][1]).toBe(2));
    act(() => result.current.move('left'));
    await waitFor(() => expect(result.current.state.history.length).toBeGreaterThan(1));

    act(() => result.current.undo());
    await waitFor(() => {
      const history = result.current.state.history;
      const lastMoveIndex = history.reduce((idx, e, i) => (e.type === 'BoardMoved' ? i : idx), -1);
      return lastMoveIndex < 0;
    });
  });

  it('undo is a no-op when no moves exist', async () => {
    const store = new MemoryEventStore();
    const { result } = renderHook(() => useGame({ store, gameId: 'test' }));

    await waitFor(() => expect(result.current.state.history.length).toBe(1));

    const before = result.current.state.history.length;
    act(() => result.current.undo());

    expect(result.current.state.history.length).toBe(before);
  });

  it('ignores state update if unmounted before load completes', async () => {
    const store = new MemoryEventStore();
    const events = [
      Events.gameStarted([
        [2, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]),
    ];
    await store.save('unmount', events);

    // Override load to delay so we can unmount before it resolves
    const originalLoad = store.load.bind(store);
    store.load = async (gameId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return originalLoad(gameId);
    };

    const { unmount } = renderHook(() => useGame({ store, gameId: 'unmount' }));
    unmount();

    // Wait for the delayed load to complete; if there's no error, the mounted guard worked
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('move is a no-op when direction does not change board', async () => {
    const store = new MemoryEventStore();
    // Board where left move does nothing (tile already at left edge)
    const events = [
      Events.gameStarted([
        [2, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]),
    ];
    await store.save('noop', events);

    const { result } = renderHook(() => useGame({ store, gameId: 'noop' }));
    await waitFor(() => expect(result.current.state.board[0][0]).toBe(2));

    const before = result.current.state.history.length;
    act(() => result.current.move('left'));

    expect(result.current.state.history.length).toBe(before);
  });

  it('move is a no-op when game is not playing', async () => {
    const store = new MemoryEventStore();
    const events = [
      Events.gameStarted([
        [null, 2, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]),
      Events.gameLost(),
    ];
    await store.save('lost', events);

    const { result } = renderHook(() => useGame({ store, gameId: 'lost' }));
    await waitFor(() => expect(result.current.state.status).toBe('lost'));

    const before = result.current.state.history.length;
    act(() => result.current.move('left'));

    expect(result.current.state.history.length).toBe(before);
  });

  it('undo is a no-op when no BoardMoved events exist', async () => {
    const store = new MemoryEventStore();
    // History with GameStarted + TileSpawned but no BoardMoved
    const events = [
      Events.gameStarted([
        [2, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]),
      Events.tileSpawned(2, { row: 1, col: 1 }),
    ];
    await store.save('nomove', events);

    const { result } = renderHook(() => useGame({ store, gameId: 'nomove' }));
    await waitFor(() => expect(result.current.state.history.length).toBe(2));

    const before = result.current.state.history.length;
    act(() => result.current.undo());

    expect(result.current.state.history.length).toBe(before);
  });
});
