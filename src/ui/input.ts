import { Direction } from '../core/types.js';

const SWIPE_THRESHOLD = 30;

export type MoveHandler = (direction: Direction) => void;

export function attachTouch(element: HTMLElement, handler: MoveHandler): () => void {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    tracking = true;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!tracking) return;
    event.preventDefault();
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (!tracking) return;
    tracking = false;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      handler(dx > 0 ? 'right' : 'left');
    } else {
      handler(dy > 0 ? 'down' : 'up');
    }
  };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: false });
  element.addEventListener('touchend', onTouchEnd);

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchmove', onTouchMove);
    element.removeEventListener('touchend', onTouchEnd);
  };
}
