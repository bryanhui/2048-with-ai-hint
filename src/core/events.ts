import { Board, Direction, GameEvent, Position } from './types.js';

export function gameStarted(seedBoard: Board): GameEvent {
  return { type: 'GameStarted', seedBoard };
}

export function boardMoved(
  direction: Direction,
  before: Board,
  after: Board,
  scoreDelta: number
): GameEvent {
  return { type: 'BoardMoved', direction, before, after, scoreDelta };
}

export function tileSpawned(value: 2 | 4, position: Position): GameEvent {
  return { type: 'TileSpawned', value, position };
}

export function gameWon(winningTile: number): GameEvent {
  return { type: 'GameWon', winningTile };
}

export function gameLost(): GameEvent {
  return { type: 'GameLost' };
}

export function scoreUpdated(total: number): GameEvent {
  return { type: 'ScoreUpdated', total };
}

export function highScoreUpdated(total: number): GameEvent {
  return { type: 'HighScoreUpdated', total };
}
