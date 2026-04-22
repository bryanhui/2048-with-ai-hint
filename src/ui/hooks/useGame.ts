import { useCallback, useEffect, useState } from 'react';
import { Direction, GameState } from '../../core/types.js';
import { startGame, executeMove } from '../../core/game.js';
import { rehydrate, INITIAL_STATE } from '../../core/reducer.js';
import { EventStore } from '../../infrastructure/storage.js';
import { CONFIG } from '../config.js';

interface UseGameOptions {
  store: EventStore;
  gameId: string;
}

interface UseGameResult {
  state: GameState;
  move: (direction: Direction) => void;
  undo: () => void;
  newGame: () => void;
}

export function useGame({ store, gameId }: UseGameOptions): UseGameResult {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  useEffect(() => {
    let mounted = true;
    store.load(gameId).then((events) => {
      if (!mounted) return;
      if (events.length > 0) {
        setState(rehydrate(events));
      } else {
        const started = startGame();
        setState(started.state);
        store.save(gameId, started.state.history).catch(() => {});
      }
    });
    return () => {
      mounted = false;
    };
  }, [store, gameId]);

  const persist = useCallback(
    (newState: GameState) => {
      store.save(gameId, newState.history).catch(() => {});
    },
    [store, gameId]
  );

  const move = useCallback(
    (direction: Direction) => {
      setState((current) => {
        if (current.status !== 'playing') return current;
        const result = executeMove(current, direction);
        if (result.events.length === 0) return current;
        persist(result.state);
        return result.state;
      });
    },
    [persist]
  );

  const undo = useCallback(() => {
    if (!CONFIG.ENABLE_UNDO) return;
    setState((current) => {
      if (current.history.length <= 1) return current;

      let lastMoveIndex = -1;
      for (let i = current.history.length - 1; i >= 0; i--) {
        if (current.history[i].type === 'BoardMoved') {
          lastMoveIndex = i;
          break;
        }
      }
      if (lastMoveIndex <= 0) return current;

      const events = current.history.slice(0, lastMoveIndex);
      const newState = rehydrate(events);
      persist(newState);
      return newState;
    });
  }, [persist]);

  const newGame = useCallback(() => {
    setState((current) => {
      const started = startGame(current.highScore);
      persist(started.state);
      return started.state;
    });
  }, [persist]);

  return { state, move, undo, newGame };
}
