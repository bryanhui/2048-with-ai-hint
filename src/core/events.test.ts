import { describe, it, expect } from 'vitest';
import {
  gameStarted,
  boardMoved,
  tileSpawned,
  gameWon,
  gameLost,
  scoreUpdated,
  highScoreUpdated,
} from './events.js';
import { Board, Direction, Position } from './types.js';

describe('gameStarted', () => {
  it('returns a GameStarted event', () => {
    const board: Board = [
      [2, null, null, null],
      [null, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const event = gameStarted(board);
    expect(event).toEqual({ type: 'GameStarted', seedBoard: board });
  });
});

describe('boardMoved', () => {
  it('returns a BoardMoved event', () => {
    const before: Board = [
      [2, 2, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const after: Board = [
      [4, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const event = boardMoved('left' as Direction, before, after, 4);
    expect(event).toEqual({
      type: 'BoardMoved',
      direction: 'left',
      before,
      after,
      scoreDelta: 4,
    });
  });
});

describe('tileSpawned', () => {
  it('returns a TileSpawned event', () => {
    const position: Position = { row: 1, col: 2 };
    const event = tileSpawned(2, position);
    expect(event).toEqual({ type: 'TileSpawned', value: 2, position });
  });

  it('handles a value of 4', () => {
    const position: Position = { row: 0, col: 0 };
    const event = tileSpawned(4, position);
    expect(event).toEqual({ type: 'TileSpawned', value: 4, position });
  });
});

describe('gameWon', () => {
  it('returns a GameWon event', () => {
    const event = gameWon(2048);
    expect(event).toEqual({ type: 'GameWon', winningTile: 2048 });
  });
});

describe('gameLost', () => {
  it('returns a GameLost event', () => {
    const event = gameLost();
    expect(event).toEqual({ type: 'GameLost' });
  });
});

describe('scoreUpdated', () => {
  it('returns a ScoreUpdated event', () => {
    const event = scoreUpdated(128);
    expect(event).toEqual({ type: 'ScoreUpdated', total: 128 });
  });
});

describe('highScoreUpdated', () => {
  it('returns a HighScoreUpdated event', () => {
    const event = highScoreUpdated(256);
    expect(event).toEqual({ type: 'HighScoreUpdated', total: 256 });
  });
});
