import { GameEvent } from '../core/types.js';

export interface EventStore {
  load(gameId: string): Promise<GameEvent[]>;
  save(gameId: string, events: GameEvent[]): Promise<void>;
}

const STORAGE_KEY = '2048_events';

export class LocalStorageEventStore implements EventStore {
  async load(gameId: string): Promise<GameEvent[]> {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${gameId}`);
      if (!raw) return [];
      return JSON.parse(raw) as GameEvent[];
    } catch {
      return [];
    }
  }

  async save(gameId: string, events: GameEvent[]): Promise<void> {
    localStorage.setItem(`${STORAGE_KEY}_${gameId}`, JSON.stringify(events));
  }
}

export class MemoryEventStore implements EventStore {
  private data = new Map<string, GameEvent[]>();

  async load(gameId: string): Promise<GameEvent[]> {
    return this.data.get(gameId) ?? [];
  }

  async save(gameId: string, events: GameEvent[]): Promise<void> {
    this.data.set(gameId, events);
  }
}
