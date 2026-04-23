import { describe, it, expect } from 'vitest';
import {
  pickBestMove,
  measureMove,
  ImprovedExpectimaxStrategy,
} from './index.js';

describe('ai index re-exports', () => {
  it('exports all strategy classes', () => {
    expect(ImprovedExpectimaxStrategy).toBeDefined();
  });

  it('exports utility functions', () => {
    expect(pickBestMove).toBeDefined();
    expect(measureMove).toBeDefined();
  });
});
