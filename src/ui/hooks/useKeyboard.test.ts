import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboard } from './useKeyboard';

describe('useKeyboard', () => {
  it('calls handler on arrow key presses', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard(handler));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(handler).toHaveBeenCalledWith('left');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(handler).toHaveBeenCalledWith('up');
  });

  it('ignores non-arrow keys', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard(handler));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(handler).not.toHaveBeenCalled();
  });
});
