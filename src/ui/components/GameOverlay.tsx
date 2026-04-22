import type React from 'react';

interface GameOverlayProps {
  title: string;
  visible: boolean;
  onRestart: () => void;
  onResume: () => void;
}

export function GameOverlay({ title, visible, onRestart, onResume }: GameOverlayProps): React.ReactElement | null {
  if (!visible) return null;

  return (
    <div className="overlay">
      <div className="overlay-content">
        <h2 className="overlay-title">{title}</h2>
        <button id="btn-restart" className="btn btn-gold" onClick={onRestart}>New Game</button>
        <button id="btn-resume" className="btn" onClick={onResume}>Back to Game</button>
      </div>
    </div>
  );
}
