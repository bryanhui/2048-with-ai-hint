import { describe, it, expect } from 'vitest';
import { LocalStorageEventStore, MemoryEventStore } from './index.js';

describe('infrastructure index re-exports', () => {
  it('exports store implementations', () => {
    expect(LocalStorageEventStore).toBeDefined();
    expect(MemoryEventStore).toBeDefined();
  });
});
