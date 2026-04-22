import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ExpectimaxStrategy, measureMove } from '../ai/index.js';
import { LocalStorageEventStore } from '../infrastructure/storage.js';
import { CONFIG } from './config.js';
import { useGame } from './hooks/useGame.js';
import { useKeyboard } from './hooks/useKeyboard.js';
import { attachTouch } from './input.js';
import { Board, getSpawnAndMerged } from './components/Board.js';
import { ScoreBoard } from './components/ScoreBoard.js';
import { MoveHistory } from './components/MoveHistory.js';
import { GameOverlay } from './components/GameOverlay.js';
import { HintDisplay } from './components/HintDisplay.js';


export function App(): React.ReactElement {
  const strategy = useMemo(
    () => (CONFIG.ENABLE_AI_HINT ? new ExpectimaxStrategy(CONFIG.EXPECTIMAX_DEPTH) : null),
    []
  );
  const store = useMemo(() => new LocalStorageEventStore(), []);
  const { state, move, undo, newGame } = useGame({
    store,
    gameId: 'default',
  });

  const [hintVisible, setHintVisible] = useState(false);
  const [hintDirection, setHintDirection] = useState('left');
  const [hintDuration, setHintDuration] = useState(0);
  const [hintTopScore, setHintTopScore] = useState(0);
  const [hintSecondScore, setHintSecondScore] = useState(0);
  const [hintSecondDirection, setHintSecondDirection] = useState('left');
  const hintTimeoutRef = useRef<number | null>(null);
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current !== null) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  useKeyboard(move);

  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOverlayDismissed(false);
  }, [state.status]);
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    return attachTouch(el, move);
  }, [move]);

  const handleHint = useCallback(async () => {
    if (!strategy || state.status !== 'playing') return;
    const result = await measureMove(strategy, state);
    const sorted = Object.entries(result.scores)
      .filter(([, score]) => score !== -Infinity)
      .sort(([, a], [, b]) => b - a);
    setHintDirection(result.direction);
    setHintDuration(result.durationMs);
    setHintTopScore(Math.round(sorted[0]?.[1] ?? 0));
    setHintSecondScore(Math.round(sorted[1]?.[1] ?? 0));
    setHintSecondDirection(sorted[1]?.[0] ?? 'left');
    setHintVisible(true);
    if (hintTimeoutRef.current !== null) {
      clearTimeout(hintTimeoutRef.current);
    }
    hintTimeoutRef.current = window.setTimeout(() => {
      setHintVisible(false);
    }, 2500);
  }, [state, strategy]);

  const { spawnPosition, mergedPositions } = getSpawnAndMerged(state.history);

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">2048</h1>
        <div className="scores">
          <ScoreBoard score={state.score} highScore={state.highScore} />
        </div>
      </header>

      <div className="controls">
        <button id="btn-new" className="btn" onClick={() => { setOverlayDismissed(false); newGame(); }}>
          New Game
        </button>
        {CONFIG.ENABLE_UNDO && (
          <button id="btn-undo" className="btn" onClick={undo}>
            Undo
          </button>
        )}
        {CONFIG.ENABLE_AI_HINT && (
          <button id="btn-hint" className="btn btn-gold" onClick={handleHint}>
            AI Hint
          </button>
        )}
      </div>

      {CONFIG.ENABLE_STRATEGY_SELECTOR && (
        <div className="ai-bar">
          <select id="ai-strategy" className="select" defaultValue={CONFIG.DEFAULT_STRATEGY}>
            <option value="expectimax">Expectimax</option>
          </select>
        </div>
      )}

      <div id="board" className="board" ref={boardRef}>
        <div className="grid-bg"></div>
        <Board board={state.board} spawnPosition={spawnPosition} mergedPositions={mergedPositions} />
        {CONFIG.ENABLE_AI_HINT && (
          <HintDisplay
            visible={hintVisible}
            direction={hintDirection}
            strategyName={strategy?.name ?? ''}
            durationMs={hintDuration}
            topScore={hintTopScore}
            secondScore={hintSecondScore}
            secondDirection={hintSecondDirection}
          />
        )}
      </div>

      <GameOverlay
        title={state.status === 'won' ? 'You Win!' : 'Game Over'}
        visible={!overlayDismissed && (state.status === 'won' || state.status === 'lost')}
        onRestart={() => { setOverlayDismissed(false); newGame(); }}
        onResume={() => setOverlayDismissed(true)}
      />

      <div className="history">
        <h3 className="history-title">Last Moves</h3>
        <MoveHistory history={state.history} />
      </div>
    </div>
  );
}
