import { describe, it, expect } from 'vitest';
import { INITIAL_STATE, applyEvent, reduce } from './reducer.js';
import * as Events from './events.js';

describe('applyEvent', () => {
  it('applies GameStarted', () => {
    const board = [
      [2, null],
      [null, 2],
    ];
    const event = Events.gameStarted(board);
    const state = applyEvent(INITIAL_STATE, event);
    expect(state.board).toEqual(board);
    expect(state.status).toBe('playing');
    expect(state.score).toBe(0);
  });

  it('applies BoardMoved', () => {
    const before = [
      [null, 2],
      [null, null],
    ];
    const after = [
      [2, null],
      [null, null],
    ];
    const state = { ...INITIAL_STATE, board: before, status: 'playing' as const };
    const event = Events.boardMoved('left', before, after, 0);
    const next = applyEvent(state, event);
    expect(next.board).toEqual(after);
  });

  it('applies TileSpawned', () => {
    const board = [
      [2, null],
      [null, null],
    ];
    const state = { ...INITIAL_STATE, board, status: 'playing' as const };
    const event = Events.tileSpawned(4, { row: 0, col: 1 });
    const next = applyEvent(state, event);
    expect(next.board[0][1]).toBe(4);
  });

  it('applies ScoreUpdated', () => {
    const state = { ...INITIAL_STATE, score: 10 };
    const event = Events.scoreUpdated(20);
    const next = applyEvent(state, event);
    expect(next.score).toBe(20);
  });

  it('applies HighScoreUpdated', () => {
    const state = { ...INITIAL_STATE, highScore: 10 };
    const event = Events.highScoreUpdated(30);
    const next = applyEvent(state, event);
    expect(next.highScore).toBe(30);
  });

  it('applies GameWon', () => {
    const state = { ...INITIAL_STATE, status: 'playing' as const };
    const event = Events.gameWon(2048);
    const next = applyEvent(state, event);
    expect(next.status).toBe('won');
  });

  it('applies GameLost', () => {
    const state = { ...INITIAL_STATE, status: 'playing' as const };
    const event = Events.gameLost();
    const next = applyEvent(state, event);
    expect(next.status).toBe('lost');
  });
});

describe('reduce', () => {
  it('reconstructs state from event stream', () => {
    const board = [
      [2, null],
      [null, 2],
    ];
    const events = [
      Events.gameStarted(board),
      Events.boardMoved('left', board, [
        [2, 2],
        [null, null],
      ], 0),
      Events.scoreUpdated(4),
      Events.highScoreUpdated(4),
    ];
    const state = reduce(events);
    expect(state.board).toEqual([
      [2, 2],
      [null, null],
    ]);
    expect(state.score).toBe(4);
    expect(state.highScore).toBe(4);
    expect(state.status).toBe('playing');
  });
});
