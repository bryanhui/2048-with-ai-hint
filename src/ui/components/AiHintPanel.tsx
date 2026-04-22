import type React from 'react';

const DIR_ICONS: Record<string, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

interface AiHintPanelProps {
  hintVisible: boolean;
  hintDirection: string;
  strategyName: string;
  durationMs: number;
  hintScores: Record<string, number>;
  onDismiss: () => void;
}

function getStrategyDescription(): string {
  return 'Expectimax searches several moves ahead, scoring boards on tile ordering, smoothness, open cells and max tile value. It averages over random tile spawns to pick the move with the highest expected outcome.';
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function AiHintPanel({
  hintVisible,
  hintDirection,
  strategyName,
  durationMs,
  hintScores,
  onDismiss,
}: AiHintPanelProps): React.ReactElement {
  return (
    <div className="ai-hint-panel">
      {hintVisible ? (
        <div className="ai-hint-result" onClick={onDismiss}>
          <div className="ai-hint-result-header">
            <strong className="ai-hint-direction">{capitalize(hintDirection)}</strong>
            <span className="ai-hint-meta">
              {capitalize(strategyName)} · {durationMs.toFixed(0)}ms
            </span>
          </div>
          <div className="ai-hint-scores-grid">
            {Object.entries(DIR_ICONS).map(([dir, icon]) => {
              const score = hintScores[dir];
              const isBest = dir === hintDirection;
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
          <div className="ai-hint-reason">{getStrategyDescription()}</div>
        </div>
      ) : (
        <div className="ai-hint-health">
          <span className="ai-hint-placeholder">Click AI Hint for a move suggestion</span>
        </div>
      )}
    </div>
  );
}
