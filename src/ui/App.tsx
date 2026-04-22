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
import { HintArrow } from './components/HintArrow.js';
import { AiHintPanel } from './components/AiHintPanel.js';

const LONG_PRESS_MS = 500;

export function App(): React.ReactElement {
  const strategy = useMemo(() => {
    if (!CONFIG.ENABLE_AI_HINT) return null;
    return new ExpectimaxStrategy(CONFIG.EXPECTIMAX_DEPTH);
  }, []);

  const store = useMemo(() => new LocalStorageEventStore(), []);
  const { state, move, undo, newGame } = useGame({
    store,
    gameId: 'default',
  });

  const [hintVisible, setHintVisible] = useState(false);
  const [hintDirection, setHintDirection] = useState('left');
  const [hintDuration, setHintDuration] = useState(0);
  const [hintScores, setHintScores] = useState<Record<string, number>>({});
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [yoloEnabled, setYoloEnabled] = useState(false);
  const yoloIntervalRef = useRef<number | null>(null);
  const [autoHint, setAutoHint] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const prevHistoryLengthRef = useRef(state.history.length);

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

  // YOLO auto-play interval
  useEffect(() => {
    if (!yoloEnabled || !strategy || state.status !== 'playing') {
      if (yoloIntervalRef.current !== null) {
        clearInterval(yoloIntervalRef.current);
        yoloIntervalRef.current = null;
      }
      return;
    }

    yoloIntervalRef.current = window.setInterval(async () => {
      const result = await measureMove(strategy, state);
      if (result.direction) {
        move(result.direction);
      }
    }, CONFIG.YOLO_DELAY_MS);

    return () => {
      if (yoloIntervalRef.current !== null) {
        clearInterval(yoloIntervalRef.current);
        yoloIntervalRef.current = null;
      }
    };
  }, [yoloEnabled, strategy, state, move]);

  // Dismiss hint on move; auto-generate hint when auto-hint is on
  useEffect(() => {
    if (state.history.length > prevHistoryLengthRef.current) {
      if (autoHint && strategy && state.status === 'playing') {
        measureMove(strategy, state).then((result) => {
          setHintDirection(result.direction);
          setHintDuration(result.durationMs);
          setHintScores(result.scores);
          setHintVisible(true);
        });
      } else {
        setHintVisible(false);
      }
    }
    prevHistoryLengthRef.current = state.history.length;
  }, [state.history.length, autoHint, strategy, state.status]);

  const generateHint = useCallback(async () => {
    if (!strategy || state.status !== 'playing') return;
    const result = await measureMove(strategy, state);
    setHintDirection(result.direction);
    setHintDuration(result.durationMs);
    setHintScores(result.scores);
    setHintVisible(true);
  }, [state, strategy]);

  const handleHintPointerDown = useCallback(() => {
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      setAutoHint((prev) => !prev);
      if (autoHint) {
        setHintVisible(false);
      }
    }, LONG_PRESS_MS);
  }, [autoHint]);

  const handleHintPointerUp = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      if (autoHint) {
        setAutoHint(false);
        setHintVisible(false);
      } else {
        generateHint();
      }
    }
  }, [autoHint, generateHint]);

  const handleHintPointerLeave = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const { spawnPosition, mergedPositions } = getSpawnAndMerged(state.history);

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">2048</h1>
        <div className="scores">
          <ScoreBoard score={state.score} highScore={state.highScore} />
        </div>
      </header>

      {CONFIG.ENABLE_AI_HINT && (
        <AiHintPanel
          hintVisible={hintVisible}
          hintDirection={hintDirection}
          strategyName={strategy?.name ?? ''}
          durationMs={hintDuration}
          hintScores={hintScores}
          autoHint={autoHint}
          onDismiss={() => setHintVisible(false)}
        />
      )}

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
          <button
            id="btn-hint"
            className={`btn ${autoHint ? 'btn-danger' : 'btn-gold'}`}
            onMouseDown={handleHintPointerDown}
            onMouseUp={handleHintPointerUp}
            onMouseLeave={handleHintPointerLeave}
            onTouchStart={handleHintPointerDown}
            onTouchEnd={handleHintPointerUp}
          >
            {autoHint ? 'Auto Hint' : 'AI Hint'}
          </button>
        )}
      </div>

      <div
        id="board"
        className="board"
        ref={boardRef}
        onClick={() => setHintVisible(false)}
      >
        <div className="grid-bg"></div>
        <Board board={state.board} spawnPosition={spawnPosition} mergedPositions={mergedPositions} />
        {CONFIG.ENABLE_AI_HINT && hintVisible && (
          <HintArrow direction={hintDirection} />
        )}
      </div>

      <GameOverlay
        title={state.status === 'won' ? 'You Win!' : 'Game Over'}
        visible={!overlayDismissed && (state.status === 'won' || state.status === 'lost')}
        onRestart={() => { setOverlayDismissed(false); newGame(); }}
        onResume={() => setOverlayDismissed(true)}
      />

      {CONFIG.ENABLE_YOLO && (
        <div className="yolo-controls">
          <button
            id="btn-yolo"
            className={`btn ${yoloEnabled ? 'btn-danger' : 'btn-gold'}`}
            onClick={() => setYoloEnabled((prev) => !prev)}
          >
            {yoloEnabled ? 'Stop AI' : 'YOLO AI'}
          </button>
        </div>
      )}

      {CONFIG.ENABLE_YOLO && (
        <div className="history">
          <h3 className="history-title">Last Moves</h3>
          <MoveHistory history={state.history} />
        </div>
      )}
    </div>
  );
}
