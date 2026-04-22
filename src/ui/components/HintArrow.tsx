import type React from 'react';

interface HintArrowProps {
  direction: string;
}

const ARROW_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
  </svg>
);

export function HintArrow({ direction }: HintArrowProps): React.ReactElement | null {
  return (
    <div className="hint-arrow" data-dir={direction}>
      <div className="hint-pulse">{ARROW_SVG}</div>
    </div>
  );
}
