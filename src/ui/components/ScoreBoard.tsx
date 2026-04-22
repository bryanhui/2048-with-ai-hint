import type React from 'react';

interface ScoreBoardProps {
  score: number;
  highScore: number;
}

export function ScoreBoard({ score, highScore }: ScoreBoardProps): React.ReactElement {
  return (
    <>
      <div className="score-box">
        <span className="score-label">Score</span>
        <span className="score-value">{score}</span>
      </div>
      <div className="score-box">
        <span className="score-label">Best</span>
        <span className="score-value">{highScore}</span>
      </div>
    </>
  );
}
