import { NnExpectimaxStrategy } from '../ai/nn_expectimax.js';
import { ImprovedExpectimaxStrategy } from '../ai/improved_expectimax.js';
import { move, spawnTile, getEmptyCells } from '../core/board.js';
import type { Board, Direction, GameState } from '../core/types.js';

function makeState(board: Board): GameState {
  return {
    board,
    score: 0,
    highScore: 0,
    status: 'playing',
    history: [],
  };
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function randomBoard(emptyWeight: number, maxTile: number): Board {
  const board: Board = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => null)
  );
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (Math.random() < emptyWeight) {
        board[r][c] = null;
      } else {
        const power = 1 + randomInt(Math.log2(maxTile));
        board[r][c] = 1 << power;
      }
    }
  }
  return board;
}

function simulateMove(board: Board, direction: Direction): Board {
  const result = move(board, direction);
  if (!result.changed) return board;
  const empties = getEmptyCells(result.board);
  if (empties.length === 0) return result.board;
  const pos = empties[randomInt(empties.length)];
  return spawnTile(result.board, Math.random() < 0.9 ? 2 : 4, pos);
}

function evaluateBoardQuality(board: Board): number {
  let sum = 0;
  let empty = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = board[r][c];
      if (val === null) {
        empty++;
      } else {
        sum += val;
      }
    }
  }
  return sum + empty * 100;
}

function runBenchmark(): void {
  const nnStrategy = new NnExpectimaxStrategy();
  const improvedStrategy = new ImprovedExpectimaxStrategy(6, 100);

  const testBoards: { name: string; board: Board }[] = [
    { name: 'early-sparse', board: randomBoard(0.7, 16) },
    { name: 'early-sparse-2', board: randomBoard(0.6, 32) },
    { name: 'mid-mixed', board: randomBoard(0.4, 128) },
    { name: 'mid-mixed-2', board: randomBoard(0.35, 256) },
    { name: 'late-full', board: randomBoard(0.15, 512) },
    { name: 'late-full-2', board: randomBoard(0.1, 1024) },
    {
      name: 'snake-pattern',
      board: [
        [128, 64, 32, 16],
        [64, 32, 16, 8],
        [32, 16, 8, 4],
        [16, 8, 4, 2],
      ],
    },
    {
      name: 'critical-2-2',
      board: [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    },
    {
      name: 'critical-merge',
      board: [
        [4, 4, 8, 8],
        [2, 2, 4, 4],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    },
    {
      name: 'almost-full',
      board: [
        [2, 4, 8, 16],
        [4, 8, 16, 32],
        [8, 16, 32, 64],
        [16, 32, 64, 128],
      ],
    },
  ];

  console.log('\n=== AI Strategy Comparison ===\n');

  let totalAgree = 0;
  let nnWins = 0;
  let improvedWins = 0;
  let nnTotalTime = 0;
  let improvedTotalTime = 0;

  for (const { name, board } of testBoards) {
    const state = makeState(board);

    // Warm up
    nnStrategy.scoreMoves(state);
    improvedStrategy.scoreMoves(state);

    // Time nn
    const nnStart = performance.now();
    const nnScores = nnStrategy.scoreMoves(state);
    const nnTime = performance.now() - nnStart;

    // Time improved
    const improvedStart = performance.now();
    const improvedScores = improvedStrategy.scoreMoves(state);
    const improvedTime = performance.now() - improvedStart;

    const nnMove = (
      Object.entries(nnScores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'left'
    ) as Direction;
    const improvedMove = (
      Object.entries(improvedScores).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      'left'
    ) as Direction;
    const agree = nnMove === improvedMove;

    // Simulate 3 moves forward to compare quality
    let nnBoard = board;
    let improvedBoard = board;
    for (let i = 0; i < 3; i++) {
      nnBoard = simulateMove(nnBoard, nnMove);
      improvedBoard = simulateMove(improvedBoard, improvedMove);
    }
    const nnQuality = evaluateBoardQuality(nnBoard);
    const improvedQuality = evaluateBoardQuality(improvedBoard);

    if (agree) {
      totalAgree++;
    } else if (nnQuality > improvedQuality) {
      nnWins++;
    } else {
      improvedWins++;
    }

    nnTotalTime += nnTime;
    improvedTotalTime += improvedTime;

    const outcome = agree
      ? '✓ agree'
      : nnQuality > improvedQuality
        ? '→ nn wins'
        : '→ improved wins';
    console.log(
      `${name.padEnd(18)} | nn: ${nnMove.padStart(5)} ${nnTime.toFixed(1).padStart(6)}ms | improved: ${improvedMove.padStart(5)} ${improvedTime.toFixed(1).padStart(6)}ms | ${outcome}`
    );
  }

  console.log('\n=== Summary ===');
  console.log(
    `Agreement:        ${totalAgree}/${testBoards.length} (${((totalAgree / testBoards.length) * 100).toFixed(0)}%)`
  );
  console.log(`NN wins (disagree):       ${nnWins}`);
  console.log(`Improved wins (disagree): ${improvedWins}`);
  console.log(`Avg NN time:      ${(nnTotalTime / testBoards.length).toFixed(1)}ms`);
  console.log(
    `Avg Improved time: ${(improvedTotalTime / testBoards.length).toFixed(1)}ms`
  );
  const speedup = nnTotalTime < improvedTotalTime ? improvedTotalTime / nnTotalTime : nnTotalTime / improvedTotalTime;
  const faster = nnTotalTime < improvedTotalTime ? 'nn' : 'improved';
  console.log(`Speedup:          ${speedup.toFixed(2)}x (${faster} faster)`);
  console.log('');
}

runBenchmark();
