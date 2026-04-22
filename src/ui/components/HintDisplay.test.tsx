import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HintDisplay } from './HintDisplay';

describe('HintDisplay', () => {
  it('shows hint arrow, toast, and scores when visible', () => {
    render(
      <HintDisplay
        visible={true}
        direction="left"
        secondDirection="up"
        strategyName="expectimax"
        durationMs={42}
        topScore={15000}
        secondScore={8200}
      />
    );
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText(/Best: 15,000 \(Left\)/)).toBeInTheDocument();
    expect(screen.getByText(/2nd: 8,200 \(Up\)/)).toBeInTheDocument();
  });

  it('is hidden when not visible', () => {
    render(
      <HintDisplay
        visible={false}
        direction="up"
        secondDirection="down"
        strategyName="expectimax"
        durationMs={10}
        topScore={0}
        secondScore={0}
      />
    );
    expect(screen.queryByText('Up')).not.toBeInTheDocument();
  });

  it.each([
    ['up', 'Up'],
    ['down', 'Down'],
    ['left', 'Left'],
    ['right', 'Right'],
  ] as const)('arrow direction matches text for %s', (direction, label) => {
    const { container } = render(
      <HintDisplay
        visible={true}
        direction={direction}
        secondDirection="left"
        strategyName="expectimax"
        durationMs={10}
        topScore={100}
        secondScore={50}
      />
    );
    expect(screen.getByText(label)).toBeInTheDocument();
    const arrow = container.querySelector('.hint-arrow');
    expect(arrow).toHaveAttribute('data-dir', direction);
  });
});
