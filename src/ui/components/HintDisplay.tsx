import type React from 'react';

interface HintDisplayProps {
  visible: boolean;
  direction: string;
  secondDirection: string;
  strategyName: string;
  durationMs: number;
  topScore: number;
  secondScore: number;
}

const ARROW_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
  </svg>
);

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function HintDisplay({
  visible,
  direction,
  secondDirection,
  strategyName,
  durationMs,
  topScore,
  secondScore,
}: HintDisplayProps): React.ReactElement | null {
  if (!visible) return null;

  return (
    <>
      <div className="hint-arrow" data-dir={direction}>
        <div className="hint-pulse">{ARROW_SVG}</div>
      </div>
      <div className="hint-toast">
        <div className="hint-toast-header">
          <strong>{capitalize(direction)}</strong>
          <span className="hint-meta">
            {capitalize(strategyName)} · {durationMs.toFixed(0)}ms
          </span>
        </div>
        <div className="hint-toast-scores">
          Best: {topScore.toLocaleString()} ({capitalize(direction)}) · 2nd:{' '}
          {secondScore.toLocaleString()} ({capitalize(secondDirection)})
        </div>
        <div className="hint-toast-reason">
          Expectimax searches several moves ahead, scoring boards on tile ordering,
          smoothness, open cells and max tile value. It averages over random tile
          spawns to pick the move with the highest expected outcome.
        </div>
      </div>
    </>
  );
}
