import type React from 'react';
import { BOARD_SIZE } from '../../core/board.js';

interface TileProps {
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerged: boolean;
}

const TILE_SIZE_PERCENT = 100 / BOARD_SIZE;
const GAP_PERCENT = 2;

export function Tile({ value, row, col, isNew, isMerged }: TileProps): React.ReactElement {
  return (
    <div
      className={`tile${isNew ? ' tile-spawn' : ''}${isMerged ? ' tile-merge' : ''}`}
      data-value={value}
      data-row={row}
      data-col={col}
      style={{
        left: `calc(${col * TILE_SIZE_PERCENT}% + ${GAP_PERCENT}px)`,
        top: `calc(${row * TILE_SIZE_PERCENT}% + ${GAP_PERCENT}px)`,
      }}
    >
      {value}
    </div>
  );
}
