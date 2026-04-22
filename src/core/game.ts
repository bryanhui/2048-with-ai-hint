import { Direction, GameEvent, GameState } from './types.js';
import { canMove, hasWinningTile, initBoard, move, pickRandomEmptyCell, WINNING_TILE } from './board.js';
import { applyEvent } from './reducer.js';
import * as Events from './events.js';

export interface MoveResult {
  events: GameEvent[];
  state: GameState;
}

export function startGame(previousHighScore = 0): MoveResult {
  const seedBoard = initBoard(2);
  const event = Events.gameStarted(seedBoard);
  const state: GameState = {
    board: seedBoard,
    score: 0,
    highScore: previousHighScore,
    status: 'playing',
    history: [event],
  };
  return { events: [event], state };
}

export function executeMove(current: GameState, direction: Direction): MoveResult {
  if (current.status !== 'playing') {
    return { events: [], state: current };
  }

  const moveResult = move(current.board, direction);
  if (!moveResult.changed) {
    return { events: [], state: current };
  }

  const events: GameEvent[] = [];
  events.push(Events.boardMoved(direction, current.board, moveResult.board, moveResult.scoreDelta));

  const newScore = current.score + moveResult.scoreDelta;
  events.push(Events.scoreUpdated(newScore));

  const newHighScore = Math.max(current.highScore, newScore);
  if (newHighScore !== current.highScore) {
    events.push(Events.highScoreUpdated(newHighScore));
  }

  let state = current;
  for (const event of events) {
    state = applyEvent(state, event);
  }

  const spawnPosition = pickRandomEmptyCell(state.board);
  if (spawnPosition) {
    const spawnValue: 2 | 4 = Math.random() < 0.9 ? 2 : 4;
    const spawnEvent = Events.tileSpawned(spawnValue, spawnPosition);
    events.push(spawnEvent);
    state = applyEvent(state, spawnEvent);
  }

  if (hasWinningTile(state.board, WINNING_TILE)) {
    const winEvent = Events.gameWon(WINNING_TILE);
    events.push(winEvent);
    state = applyEvent(state, winEvent);
  } else if (!canMove(state.board)) {
    const loseEvent = Events.gameLost();
    events.push(loseEvent);
    state = applyEvent(state, loseEvent);
  }

  return { events, state };
}

