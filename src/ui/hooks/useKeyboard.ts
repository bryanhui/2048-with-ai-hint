import { useEffect } from 'react';
import { Direction } from '../../core/types.js';

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export function useKeyboard(onDirection: (direction: Direction) => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_MAP[event.key];
      if (direction) {
        event.preventDefault();
        onDirection(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDirection]);
}
