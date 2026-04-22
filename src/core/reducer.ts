import { GameEvent, GameState } from './types.js';
import { createEmptyBoard, spawnTile } from './board.js';

export const INITIAL_STATE: GameState = {
  board: createEmptyBoard(),
  score: 0,
  highScore: 0,
  status: 'idle',
  history: [],
};

export function applyEvent(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'GameStarted':
      return {
        ...state,
        board: event.seedBoard,
        score: 0,
        status: 'playing',
        history: [...state.history, event],
      };

    case 'BoardMoved':
      return {
        ...state,
        board: event.after,
        history: [...state.history, event],
      };

    case 'TileSpawned':
      return {
        ...state,
        board: spawnTile(state.board, event.value, event.position),
        history: [...state.history, event],
      };

    case 'GameWon':
      return {
        ...state,
        status: 'won',
        history: [...state.history, event],
      };

    case 'GameLost':
      return {
        ...state,
        status: 'lost',
        history: [...state.history, event],
      };

    case 'ScoreUpdated':
      return {
        ...state,
        score: event.total,
        history: [...state.history, event],
      };

    case 'HighScoreUpdated':
      return {
        ...state,
        highScore: event.total,
        history: [...state.history, event],
      };

    default:
      return state;
  }
}

export function reduce(events: GameEvent[], initial = INITIAL_STATE): GameState {
  return events.reduce((state, event) => applyEvent(state, event), initial);
}

export function rehydrate(events: GameEvent[]): GameState {
  return reduce(events);
}
