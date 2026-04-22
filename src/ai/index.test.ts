import { describe, it, expect } from 'vitest';
import {
  pickBestMove,
  measureMove,
  ExpectimaxStrategy,
} from './index.js';

describe('ai index re-exports', () => {
  it('exports all strategy classes', () => {
    expect(ExpectimaxStrategy).toBeDefined();
  });

  it('exports utility functions', () => {
    expect(pickBestMove).toBeDefined();
    expect(measureMove).toBeDefined();
  });
});
