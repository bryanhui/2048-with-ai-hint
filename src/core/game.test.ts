import { describe, it, expect } from 'vitest';
import { startGame, executeMove } from './game.js';

describe('startGame', () => {
  it('returns a playing state with two tiles', () => {
    const result = startGame();
    expect(result.state.status).toBe('playing');
    expect(result.state.score).toBe(0);
    const tiles = result.state.board.flat().filter((c) => c !== null);
    expect(tiles.length).toBe(2);
  });
});

describe('executeMove', () => {
  it('does nothing when status is not playing', () => {
    const state = {
      ...startGame().state,
      status: 'won' as const,
    };
    const result = executeMove(state, 'left');
    expect(result.events).toHaveLength(0);
    expect(result.state).toBe(state);
  });

  it('does nothing for an invalid move', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, null],
    ];
    const state = { ...startGame().state, board };
    const result = executeMove(state, 'up');
    expect(result.events).toHaveLength(0);
  });

  it('emits move, score, tile spawned events for valid move', () => {
    const board = [
      [2, 2, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const state = { ...startGame().state, board };
    const result = executeMove(state, 'left');

    const moveEvent = result.events.find((e) => e.type === 'BoardMoved');
    const scoreEvent = result.events.find((e) => e.type === 'ScoreUpdated');
    const spawnEvent = result.events.find((e) => e.type === 'TileSpawned');

    expect(moveEvent).toBeDefined();
    expect(scoreEvent).toBeDefined();
    expect(spawnEvent).toBeDefined();
    expect(result.state.board.flat().filter((c) => c !== null).length).toBe(2);
  });

  it('detects win condition', () => {
    const board = [
      [1024, 1024, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const state = { ...startGame().state, board };
    const result = executeMove(state, 'left');
    expect(result.events.some((e) => e.type === 'GameWon')).toBe(true);
    expect(result.state.status).toBe('won');
  });

  it('detects loss condition after valid move', () => {
    const board = [
      [2, 2, 8, 16],
      [16, 32, 64, 128],
      [256, 512, 1024, 2],
      [4, 8, 16, 32],
    ];
    const state = { ...startGame().state, board };
    const result = executeMove(state, 'left');
    expect(result.events.some((e) => e.type === 'GameLost')).toBe(true);
    expect(result.state.status).toBe('lost');
  });
});
