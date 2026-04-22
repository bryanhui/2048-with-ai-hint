import { describe, it, expect } from 'vitest';
import { findMergedPositions, getSpawnAndMerged } from './Board';
import * as Events from '../../core/events.js';

describe('findMergedPositions', () => {
  it('detects a simple merge at the same position', () => {
    const before = [
      [2, 2, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const after = [
      [4, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const merged = findMergedPositions(before, after, undefined);
    expect(merged.has('0-0')).toBe(true);
  });

  it('does not flag tiles that stayed in place', () => {
    const before = [
      [2, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const after = [
      [2, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const merged = findMergedPositions(before, after, undefined);
    expect(merged.size).toBe(0);
  });

  it('excludes the spawn position from merged', () => {
    const before = [
      [2, 2, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const after = [
      [4, null, 2, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const merged = findMergedPositions(before, after, { row: 0, col: 2 });
    expect(merged.has('0-0')).toBe(true);
    expect(merged.has('0-2')).toBe(false);
  });

  it('detects multiple merges in one move', () => {
    const before = [
      [2, 2, 4, 4],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const after = [
      [4, 8, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const merged = findMergedPositions(before, after, undefined);
    expect(merged.has('0-0')).toBe(true);
    expect(merged.has('0-1')).toBe(true);
  });

  it('flags tiles where value increased at the same position', () => {
    const before = [
      [null, 2, 4, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const after = [
      [2, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const merged = findMergedPositions(before, after, undefined);
    expect(merged.has('0-1')).toBe(true);
  });

  it('returns empty set when no merges occur', () => {
    const before = [
      [2, 4, 8, 16],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const after = [
      [null, 2, 4, 8],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const merged = findMergedPositions(before, after, undefined);
    expect(merged.size).toBe(0);
  });
});

describe('getSpawnAndMerged', () => {
  it('finds spawn and merged from history', () => {
    const history = [
      Events.gameStarted([
        [2, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]),
      Events.boardMoved(
        'left',
        [
          [2, 2, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
        [
          [4, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
        4
      ),
      Events.tileSpawned(2, { row: 0, col: 1 }),
    ];
    const result = getSpawnAndMerged(history);
    expect(result.spawnPosition).toEqual({ row: 0, col: 1 });
    expect(result.mergedPositions.has('0-0')).toBe(true);
  });

  it('returns empty merged when no BoardMoved exists', () => {
    const history = [
      Events.gameStarted([
        [2, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]),
    ];
    const result = getSpawnAndMerged(history);
    expect(result.mergedPositions.size).toBe(0);
  });
});
