import type React from 'react';

interface WelcomeOverlayProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function WelcomeOverlay({ visible, onAccept, onDecline }: WelcomeOverlayProps): React.ReactElement | null {
  if (!visible) return null;

  return (
    <div className="overlay">
      <div className="overlay-content welcome-content">
        <h2 className="overlay-title">Welcome to 2048 AI</h2>
        <p className="welcome-hint">
          Did you know? You can long press <strong>AI Hint</strong> for auto-regeneration.
        </p>
        <p className="welcome-cookie">
          This game uses local storage to save your progress.
        </p>
        <div className="overlay-actions">
          <button id="btn-accept" className="btn btn-gold" onClick={onAccept}>
            Accept &amp; Play
          </button>
          <button id="btn-decline" className="btn" onClick={onDecline}>
            Play without saving
          </button>
        </div>
      </div>
    </div>
  );
}
