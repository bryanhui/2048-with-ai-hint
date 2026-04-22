import type React from 'react';
import { Board as BoardType, Position, GameEvent } from '../../core/types.js';
import { BOARD_SIZE } from '../../core/board.js';
import { Tile } from './Tile.js';

interface BoardProps {
  board: BoardType;
  spawnPosition?: Position;
  mergedPositions?: Set<string>;
}

export function findMergedPositions(
  before: BoardType,
  after: BoardType,
  spawnPosition?: Position
): Set<string> {
  const merged = new Set<string>();
  for (let r = 0; r < before.length; r++) {
    for (let c = 0; c < before[r].length; c++) {
      const afterVal = after[r][c];
      const beforeVal = before[r][c];
      if (
        afterVal !== null &&
        afterVal > (beforeVal ?? 0) &&
        !(spawnPosition && spawnPosition.row === r && spawnPosition.col === c)
      ) {
        merged.add(`${r}-${c}`);
      }
    }
  }
  return merged;
}

export function getSpawnAndMerged(history: GameEvent[]): {
  spawnPosition?: Position;
  mergedPositions: Set<string>;
} {
  let spawnPosition: Position | undefined;
  for (let i = history.length - 1; i >= 0; i--) {
    const e = history[i];
    if (e.type === 'TileSpawned') {
      spawnPosition = e.position;
    } else if (e.type === 'BoardMoved') {
      return {
        spawnPosition,
        mergedPositions: findMergedPositions(e.before, e.after, spawnPosition),
      };
    }
  }
  return { spawnPosition, mergedPositions: new Set() };
}

export function Board({ board, spawnPosition, mergedPositions }: BoardProps): React.ReactElement {
  const tiles: React.ReactElement[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const value = board[row][col];
      if (value === null) continue;

      const isNew =
        spawnPosition !== undefined &&
        spawnPosition.row === row &&
        spawnPosition.col === col;

      const isMerged = mergedPositions?.has(`${row}-${col}`) ?? false;

      tiles.push(
        <Tile
          key={`${row}-${col}`}
          value={value}
          row={row}
          col={col}
          isNew={isNew}
          isMerged={isMerged}
        />
      );
    }
  }

  return <div className="tiles">{tiles}</div>;
}
