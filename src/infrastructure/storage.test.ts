import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryEventStore, LocalStorageEventStore } from './storage.js';
import * as Events from '../core/events.js';

describe('MemoryEventStore', () => {
  it('round-trips events', async () => {
    const store = new MemoryEventStore();
    const events = [Events.gameStarted([[2, null], [null, 2]])];
    await store.save('game1', events);
    const loaded = await store.load('game1');
    expect(loaded).toEqual(events);
  });

  it('returns empty array for missing game', async () => {
    const store = new MemoryEventStore();
    const loaded = await store.load('missing');
    expect(loaded).toEqual([]);
  });
});

describe('LocalStorageEventStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips events via localStorage', async () => {
    const store = new LocalStorageEventStore();
    const events = [Events.gameStarted([[2, null], [null, 2]])];
    await store.save('game1', events);
    const loaded = await store.load('game1');
    expect(loaded).toEqual(events);
  });

  it('returns empty array for missing game', async () => {
    const store = new LocalStorageEventStore();
    const loaded = await store.load('missing');
    expect(loaded).toEqual([]);
  });
});
