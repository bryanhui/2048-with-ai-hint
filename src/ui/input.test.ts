import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachTouch } from './input';

describe('attachTouch', () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  function createTouchEvent(
    type: string,
    touches: { clientX: number; clientY: number }[]
  ): TouchEvent {
    return new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: touches.map((t, i) =>
        new Touch({
          identifier: i,
          target: element,
          clientX: t.clientX,
          clientY: t.clientY,
        })
      ),
      changedTouches: touches.map((t, i) =>
        new Touch({
          identifier: i,
          target: element,
          clientX: t.clientX,
          clientY: t.clientY,
        })
      ),
    });
  }

  it('detects swipe left', () => {
    const handler = vi.fn();
    const cleanup = attachTouch(element, handler);

    element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
    element.dispatchEvent(createTouchEvent('touchend', [{ clientX: 50, clientY: 100 }]));

    expect(handler).toHaveBeenCalledWith('left');
    cleanup();
  });

  it('detects swipe right', () => {
    const handler = vi.fn();
    const cleanup = attachTouch(element, handler);

    element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 50, clientY: 100 }]));
    element.dispatchEvent(createTouchEvent('touchend', [{ clientX: 100, clientY: 100 }]));

    expect(handler).toHaveBeenCalledWith('right');
    cleanup();
  });

  it('detects swipe up', () => {
    const handler = vi.fn();
    const cleanup = attachTouch(element, handler);

    element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
    element.dispatchEvent(createTouchEvent('touchend', [{ clientX: 100, clientY: 50 }]));

    expect(handler).toHaveBeenCalledWith('up');
    cleanup();
  });

  it('detects swipe down', () => {
    const handler = vi.fn();
    const cleanup = attachTouch(element, handler);

    element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]));
    element.dispatchEvent(createTouchEvent('touchend', [{ clientX: 100, clientY: 100 }]));

    expect(handler).toHaveBeenCalledWith('down');
    cleanup();
  });

  it('ignores short swipes below threshold', () => {
    const handler = vi.fn();
    const cleanup = attachTouch(element, handler);

    element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
    element.dispatchEvent(createTouchEvent('touchend', [{ clientX: 105, clientY: 102 }]));

    expect(handler).not.toHaveBeenCalled();
    cleanup();
  });

  it('ignores multi-touch gestures', () => {
    const handler = vi.fn();
    const cleanup = attachTouch(element, handler);

    element.dispatchEvent(
      createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ])
    );
    element.dispatchEvent(createTouchEvent('touchend', [{ clientX: 50, clientY: 100 }]));

    expect(handler).not.toHaveBeenCalled();
    cleanup();
  });

  it('prevents default on touchmove when tracking', () => {
    const handler = vi.fn();
    const cleanup = attachTouch(element, handler);

    const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
    element.dispatchEvent(touchStart);

    const touchMove = createTouchEvent('touchmove', [{ clientX: 110, clientY: 100 }]);
    const preventDefault = vi.spyOn(touchMove, 'preventDefault');
    element.dispatchEvent(touchMove);

    expect(preventDefault).toHaveBeenCalled();
    cleanup();
  });

  it('ignores touchmove when not tracking', () => {
    const handler = vi.fn();
    const cleanup = attachTouch(element, handler);

    const touchMove = createTouchEvent('touchmove', [{ clientX: 110, clientY: 100 }]);
    const preventDefault = vi.spyOn(touchMove, 'preventDefault');
    element.dispatchEvent(touchMove);

    expect(preventDefault).not.toHaveBeenCalled();
    cleanup();
  });

  it('stops calling handler after cleanup', () => {
    const handler = vi.fn();
    const cleanup = attachTouch(element, handler);
    cleanup();

    element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
    element.dispatchEvent(createTouchEvent('touchend', [{ clientX: 50, clientY: 100 }]));

    expect(handler).not.toHaveBeenCalled();
  });
});
