import type React from 'react';

const DIR_ICONS: Record<string, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

interface AiHintPanelProps {
  hintDirection: string;
  hintScores: Record<string, number>;
}

export function AiHintPanel({
  hintDirection,
  hintScores,
}: AiHintPanelProps): React.ReactElement {
  const hasHint = Object.values(hintScores).some(
    (s) => s !== -Infinity && s !== undefined
  );

  return (
    <div className="ai-hint-panel">
      <p className={`ai-hint-explanation ${hasHint ? 'ai-hint-explanation-hidden' : ''}`}>
        Expectimax scores moves by simulating future board states.
      </p>
      <div className="ai-hint-scores-grid">
        {Object.entries(DIR_ICONS).map(([dir, icon]) => {
          const score = hintScores[dir];
          const isBest = dir === hintDirection && score !== -Infinity && score !== undefined;
          const isInvalid = score === -Infinity || score === undefined;
          return (
            <div key={dir} className={`ai-hint-score-cell ${isBest ? 'ai-hint-score-best' : ''}`}>
              <span className="ai-hint-score-icon">{icon}</span>
              <span className="ai-hint-score-value">
                {isInvalid ? '—' : Math.round(score).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
