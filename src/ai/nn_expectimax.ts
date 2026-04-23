import { Board, Direction, GameState } from '../core/types.js';
import { Strategy, pickBestMove } from './types.js';

// ---------------------------------------------------------------------------
// Nneonneo 2048-ai expectimax implementation
// Ported from C++: https://github.com/nneonneo/2048-ai
//
// Key techniques:
// - 64-bit bitboard (4×4 cells as 4-bit nibbles)
// - Precomputed move tables (65536 entries × 4 directions)
// - Precomputed heuristic tables (65536 entries)
// - Probability pruning (cprob < 0.0001)
// - Depth-validated transposition table
// ---------------------------------------------------------------------------

const ROW_MASK = BigInt.asUintN(64, 0xffffn);
const COL_MASK = BigInt.asUintN(64, 0x000f000f000f000fn);

// Heuristic scoring constants (exactly as in nneonneo's C++)
const SCORE_LOST_PENALTY = 200000.0;
const SCORE_MONOTONICITY_POWER = 4.0;
const SCORE_MONOTONICITY_WEIGHT = 47.0;
const SCORE_SUM_POWER = 3.5;
const SCORE_SUM_WEIGHT = 11.0;
const SCORE_MERGES_WEIGHT = 700.0;
const SCORE_EMPTY_WEIGHT = 270.0;

const CPROB_THRESH_BASE = 0.0001;
const CACHE_DEPTH_LIMIT = 15;

// Precomputed tables
const rowLeftTable = new Uint32Array(65536);
const rowRightTable = new Uint32Array(65536);
const colUpTable = new BigUint64Array(65536);
const colDownTable = new BigUint64Array(65536);
const heurScoreTable = new Float64Array(65536);
const scoreTable = new Float64Array(65536);

let tablesInitialized = false;

function initTables(): void {
  if (tablesInitialized) return;
  for (let row = 0; row < 65536; ++row) {
    const line = [
      (row >> 0) & 0xf,
      (row >> 4) & 0xf,
      (row >> 8) & 0xf,
      (row >> 12) & 0xf,
    ];

    // Actual game score for this row
    let score = 0.0;
    for (let i = 0; i < 4; ++i) {
      const rank = line[i];
      if (rank >= 2) {
        score += (rank - 1) * (1 << rank);
      }
    }
    scoreTable[row] = score;

    // Heuristic score for this row
    let sum = 0;
    let empty = 0;
    let merges = 0;
    let prev = 0;
    let counter = 0;
    for (let i = 0; i < 4; ++i) {
      const rank = line[i];
      sum += Math.pow(rank, SCORE_SUM_POWER);
      if (rank === 0) {
        empty++;
      } else {
        if (prev === rank) {
          counter++;
        } else if (counter > 0) {
          merges += 1 + counter;
          counter = 0;
        }
        prev = rank;
      }
    }
    if (counter > 0) {
      merges += 1 + counter;
    }

    let monotonicityLeft = 0;
    let monotonicityRight = 0;
    for (let i = 1; i < 4; ++i) {
      if (line[i - 1] > line[i]) {
        monotonicityLeft +=
          Math.pow(line[i - 1], SCORE_MONOTONICITY_POWER) -
          Math.pow(line[i], SCORE_MONOTONICITY_POWER);
      } else {
        monotonicityRight +=
          Math.pow(line[i], SCORE_MONOTONICITY_POWER) -
          Math.pow(line[i - 1], SCORE_MONOTONICITY_POWER);
      }
    }

    heurScoreTable[row] =
      SCORE_LOST_PENALTY +
      SCORE_EMPTY_WEIGHT * empty +
      SCORE_MERGES_WEIGHT * merges -
      SCORE_MONOTONICITY_WEIGHT *
        Math.min(monotonicityLeft, monotonicityRight) -
      SCORE_SUM_WEIGHT * sum;

    // Execute a move to the left
    const moved = [...line];
    for (let i = 0; i < 3; ++i) {
      let j: number;
      for (j = i + 1; j < 4; ++j) {
        if (moved[j] !== 0) break;
      }
      if (j === 4) break;

      if (moved[i] === 0) {
        moved[i] = moved[j];
        moved[j] = 0;
        i--;
      } else if (moved[i] === moved[j]) {
        if (moved[i] !== 0xf) {
          moved[i]++;
        }
        moved[j] = 0;
      }
    }

    const result =
      (moved[0] << 0) |
      (moved[1] << 4) |
      (moved[2] << 8) |
      (moved[3] << 12);

    const revResult = reverseRow(result);
    const revRow = reverseRow(row);

    rowLeftTable[row] = row ^ result;
    rowRightTable[revRow] = revRow ^ revResult;
    colUpTable[row] = BigInt.asUintN(64, unpackCol(row) ^ unpackCol(result));
    colDownTable[revRow] = BigInt.asUintN(
      64,
      unpackCol(revRow) ^ unpackCol(revResult)
    );
  }
  tablesInitialized = true;
}

function reverseRow(row: number): number {
  return (
    (row >> 12) |
    ((row >> 4) & 0x00f0) |
    ((row << 4) & 0x0f00) |
    (row << 12)
  );
}

function unpackCol(row: number): bigint {
  const tmp = BigInt.asUintN(64, BigInt(row));
  return (
    tmp |
    (tmp << 12n) |
    (tmp << 24n) |
    (tmp << 36n) &
      COL_MASK
  );
}

// ---------------------------------------------------------------------------
// Bitboard helpers
// ---------------------------------------------------------------------------

/** Convert our Board type to a 64-bit bitboard.
 *  Each cell is a 4-bit nibble storing log2(value):
 *    0 = empty, 1 = 2, 2 = 4, 3 = 8, ... 15 = 32768
 *  Layout: row-major, (0,0) is the least-significant nibble.
 */
export function boardToBitboard(board: Board): bigint {
  let bb = 0n;
  for (let r = 3; r >= 0; --r) {
    for (let c = 3; c >= 0; --c) {
      bb = bb << 4n;
      const val = board[r][c];
      if (val !== null && val > 0) {
        bb |= BigInt(Math.log2(val));
      }
    }
  }
  return BigInt.asUintN(64, bb);
}

/** Inverse of boardToBitboard. */
export function bitboardToBoard(bb: bigint): Board {
  const board: Board = [];
  for (let r = 0; r < 4; ++r) {
    const row: (number | null)[] = [];
    for (let c = 0; c < 4; ++c) {
      const shift = BigInt(r * 16 + c * 4);
      const rank = Number((bb >> shift) & 0xfn);
      row.push(rank === 0 ? null : 1 << rank);
    }
    board.push(row);
  }
  return board;
}

function transpose(bb: bigint): bigint {
  let a1 = bb & BigInt.asUintN(64, 0xf0f00f0ff0f00f0fn);
  let a2 = bb & BigInt.asUintN(64, 0x0000f0f00000f0f0n);
  let a3 = bb & BigInt.asUintN(64, 0x0f0f00000f0f0000n);
  let a = a1 | (a2 << 12n) | (a3 >> 12n);
  let b1 = a & BigInt.asUintN(64, 0xff00ff0000ff00ffn);
  let b2 = a & BigInt.asUintN(64, 0x00ff00ff00000000n);
  let b3 = a & BigInt.asUintN(64, 0x00000000ff00ff00n);
  return BigInt.asUintN(64, b1 | (b2 >> 24n) | (b3 << 24n));
}

function countEmpty(bb: bigint): number {
  let x = bb;
  x |= (x >> 2n) & BigInt.asUintN(64, 0x3333333333333333n);
  x |= x >> 1n;
  x = ~x & BigInt.asUintN(64, 0x1111111111111111n);
  x += x >> 32n;
  x += x >> 16n;
  x += x >> 8n;
  x += x >> 4n;
  return Number(x & 0xfn);
}

function countDistinctTiles(bb: bigint): number {
  let bitset = 0;
  let tmp = bb;
  while (tmp) {
    bitset |= 1 << Number(tmp & 0xfn);
    tmp >>= 4n;
  }
  bitset >>= 1; // don't count empty tiles
  let count = 0;
  while (bitset) {
    bitset &= bitset - 1;
    count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Move execution
// ---------------------------------------------------------------------------

function executeMove0(board: bigint): bigint {
  // up
  let ret = board;
  const t = transpose(board);
  ret ^=
    colUpTable[Number((t >> 0n) & ROW_MASK)] << 0n;
  ret ^=
    colUpTable[Number((t >> 16n) & ROW_MASK)] << 4n;
  ret ^=
    colUpTable[Number((t >> 32n) & ROW_MASK)] << 8n;
  ret ^=
    colUpTable[Number((t >> 48n) & ROW_MASK)] << 12n;
  return BigInt.asUintN(64, ret);
}

function executeMove1(board: bigint): bigint {
  // down
  let ret = board;
  const t = transpose(board);
  ret ^=
    colDownTable[Number((t >> 0n) & ROW_MASK)] << 0n;
  ret ^=
    colDownTable[Number((t >> 16n) & ROW_MASK)] << 4n;
  ret ^=
    colDownTable[Number((t >> 32n) & ROW_MASK)] << 8n;
  ret ^=
    colDownTable[Number((t >> 48n) & ROW_MASK)] << 12n;
  return BigInt.asUintN(64, ret);
}

function executeMove2(board: bigint): bigint {
  // left
  let ret = board;
  ret ^= BigInt.asUintN(64, BigInt(rowLeftTable[Number((board >> 0n) & ROW_MASK)])) << 0n;
  ret ^= BigInt.asUintN(64, BigInt(rowLeftTable[Number((board >> 16n) & ROW_MASK)])) << 16n;
  ret ^= BigInt.asUintN(64, BigInt(rowLeftTable[Number((board >> 32n) & ROW_MASK)])) << 32n;
  ret ^= BigInt.asUintN(64, BigInt(rowLeftTable[Number((board >> 48n) & ROW_MASK)])) << 48n;
  return BigInt.asUintN(64, ret);
}

function executeMove3(board: bigint): bigint {
  // right
  let ret = board;
  ret ^= BigInt.asUintN(64, BigInt(rowRightTable[Number((board >> 0n) & ROW_MASK)])) << 0n;
  ret ^= BigInt.asUintN(64, BigInt(rowRightTable[Number((board >> 16n) & ROW_MASK)])) << 16n;
  ret ^= BigInt.asUintN(64, BigInt(rowRightTable[Number((board >> 32n) & ROW_MASK)])) << 32n;
  ret ^= BigInt.asUintN(64, BigInt(rowRightTable[Number((board >> 48n) & ROW_MASK)])) << 48n;
  return BigInt.asUintN(64, ret);
}

const executeMoveFns = [executeMove0, executeMove1, executeMove2, executeMove3];
const indexToDir: Direction[] = ['up', 'down', 'left', 'right'];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreHelper(board: bigint, table: Float64Array): number {
  return (
    table[Number((board >> 0n) & ROW_MASK)] +
    table[Number((board >> 16n) & ROW_MASK)] +
    table[Number((board >> 32n) & ROW_MASK)] +
    table[Number((board >> 48n) & ROW_MASK)]
  );
}

function scoreHeurBoard(board: bigint): number {
  return (
    scoreHelper(board, heurScoreTable) +
    scoreHelper(transpose(board), heurScoreTable)
  );
}

// ---------------------------------------------------------------------------
// Transposition table
// ---------------------------------------------------------------------------

interface TtEntry {
  depth: number;
  heuristic: number;
}

interface EvalState {
  transTable: Map<bigint, TtEntry>;
  maxdepth: number;
  curdepth: number;
  cachehits: number;
  movesEvaled: number;
  depthLimit: number;
}

function createEvalState(): EvalState {
  return {
    transTable: new Map(),
    maxdepth: 0,
    curdepth: 0,
    cachehits: 0,
    movesEvaled: 0,
    depthLimit: 0,
  };
}

// ---------------------------------------------------------------------------
// Expectimax core
// ---------------------------------------------------------------------------

function scoreTilechooseNode(
  state: EvalState,
  board: bigint,
  cprob: number
): number {
  if (cprob < CPROB_THRESH_BASE || state.curdepth >= state.depthLimit) {
    state.maxdepth = Math.max(state.curdepth, state.maxdepth);
    return scoreHeurBoard(board);
  }

  if (state.curdepth < CACHE_DEPTH_LIMIT) {
    const entry = state.transTable.get(board);
    if (entry && entry.depth <= state.curdepth) {
      state.cachehits++;
      return entry.heuristic;
    }
  }

  const numOpen = countEmpty(board);
  if (numOpen === 0) {
    state.maxdepth = Math.max(state.curdepth, state.maxdepth);
    return scoreHeurBoard(board);
  }

  const nextCprob = cprob / numOpen;
  let res = 0.0;
  let tmp = board;
  let tile2 = 1n;

  for (let i = 0; i < 16; i++) {
    if ((tmp & 0xfn) === 0n) {
      res +=
        scoreMoveNode(state, board | tile2, nextCprob * 0.9) * 0.9;
      res +=
        scoreMoveNode(state, board | (tile2 << 1n), nextCprob * 0.1) *
        0.1;
    }
    tmp >>= 4n;
    tile2 <<= 4n;
  }
  res = res / numOpen;

  if (state.curdepth < CACHE_DEPTH_LIMIT) {
    state.transTable.set(board, {
      depth: state.curdepth,
      heuristic: res,
    });
  }

  return res;
}

function scoreMoveNode(state: EvalState, board: bigint, cprob: number): number {
  let best = 0.0;
  state.curdepth++;
  for (let move = 0; move < 4; ++move) {
    const newboard = executeMoveFns[move](board);
    state.movesEvaled++;
    if (board !== newboard) {
      best = Math.max(best, scoreTilechooseNode(state, newboard, cprob));
    }
  }
  state.curdepth--;
  return best;
}

function scoreToplevelMove(state: EvalState, board: bigint, move: number): number {
  const newboard = executeMoveFns[move](board);
  if (board === newboard) return 0;
  return scoreTilechooseNode(state, newboard, 1.0) + 1e-6;
}

// ---------------------------------------------------------------------------
// Strategy wrapper
// ---------------------------------------------------------------------------

export class NnExpectimaxStrategy implements Strategy {
  readonly name = 'nn_expectimax';

  constructor() {
    initTables();
  }

  selectMove(state: GameState): Direction {
    return pickBestMove(this.scoreMoves(state));
  }

  scoreMoves(state: GameState): Record<Direction, number> {
    const board = boardToBitboard(state.board);
    const scores: Record<string, number> = {};

    for (let move = 0; move < 4; ++move) {
      const evalState = createEvalState();
      evalState.depthLimit = Math.max(3, countDistinctTiles(board) - 2);
      scores[indexToDir[move]] = scoreToplevelMove(evalState, board, move);
    }

    return scores as Record<Direction, number>;
  }
}
