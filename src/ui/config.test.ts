import { describe, it, expect } from 'vitest';
import { CONFIG } from './config';

describe('config', () => {
  it('exports feature flags', () => {
    expect(typeof CONFIG.ENABLE_AI_HINT).toBe('boolean');
    expect(typeof CONFIG.ENABLE_UNDO).toBe('boolean');
    expect(typeof CONFIG.ENABLE_STRATEGY_SELECTOR).toBe('boolean');
  });

  it('exports strategy settings', () => {
    expect(CONFIG.DEFAULT_STRATEGY).toBeDefined();
    expect(typeof CONFIG.EXPECTIMAX_DEPTH).toBe('number');
  });
});
