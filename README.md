# 2048 with AI Hint

A 2048 clone built with TypeScript, React, and Vite. Event-sourced state management with an Expectimax-powered hint system.

**Live demo:** https://2048-nine-peach.vercel.app

## What's here

- **Core game logic** in `src/core/` — event-sourced state management, board operations, win/loss detection
- **AI** in `src/ai/` — Improved Expectimax strategy for hints (based on [nneonneo's 2048-ai](https://github.com/nneonneo/2048-ai))
- **Web UI** in `src/ui/` — keyboard + touch controls, AI hint arrows with score breakdowns

## Running it

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (vitest)
npm run e2e        # browser tests (playwright)
```

## AI Hint

Click **AI Hint** to see an arrow pointing to the recommended move. The panel shows:
- **Direction scores** — expectimax scores for all 4 directions (↑ ↓ ← →)
- **Best move highlighted** — the top-ranked direction is highlighted with a gold border
- **Expectimax explanation** — shown when no hint is active

Long-press the **AI Hint** button (≥500ms) to toggle **Auto Hint** mode, which automatically regenerates the hint after every move.

### How Expectimax works

Expectimax is a game-tree search algorithm that handles the randomness in 2048 (tile spawns). It alternates between:

1. **Player nodes** — try all 4 directions and pick the one with the highest expected score
2. **Chance nodes** — average the score over possible tile spawns (2 or 4 at each empty cell)

The improved implementation uses:
- **Iterative deepening** — searches depth 1 → max depth, returning the best fully-completed layer within the time budget (default 100ms)
- **Snake-pattern weight matrix** — rewards placing large tiles in a corner and forming a decreasing snake across the board
- **Smoothness penalty** — discourages adjacent tiles with very different values
- **Monotonicity bonus** — rewards rows/columns that are strictly increasing or decreasing
- **Merge potential bonus** — rewards adjacent equal tiles (merge opportunities)
- **Empty-cell bonus** — rewards open space for future moves

Chance-node sampling is adaptive: up to **8 spawn positions** are evaluated at the top level of the tree, and **2** at deeper levels. This keeps the search fast while still considering the most important random outcomes.

### Algorithm credit

The expectimax implementation is based on the algorithm described in [nneonneo's 2048-ai](https://github.com/nneonneo/2048-ai). The original homegrown expectimax is kept as `ExpectimaxStrategy` in `src/ai/expectimax.ts` (now called "expectimax2" for reference).

## Configuration

Feature flags live in `src/ui/config.ts`:

| Flag | Default | Description |
|---|---|---|
| `ENABLE_STRATEGY_SELECTOR` | `false` | Dropdown to pick AI strategies |
| `ENABLE_AI_HINT` | `true` | Hint button with Expectimax recommendations |
| `ENABLE_UNDO` | `false` | Undo last move button |
| `DEFAULT_STRATEGY` | `'improved_expectimax'` | Strategy used when selector is hidden |
| `EXPECTIMAX_DEPTH` | `6` | Search depth — higher is stronger but slower |
| `ENABLE_YOLO` | `true` | YOLO auto-play mode |
| `YOLO_DELAY_MS` | `400` | Delay between YOLO moves |

Board dimension is controlled by `BOARD_SIZE` in `src/core/board.ts`. Change it there and everything (grid, tiles, AI heuristics) adapts automatically.

Toggle the flags and rebuild to change the UI.

## Architecture notes

The board logic is pure — no side effects, no DOM. Game state is built by reducing an event stream (`GameStarted`, `BoardMoved`, `TileSpawned`, etc.). This makes undo trivial: just truncate the history and rehydrate.

Storage is pluggable. The browser uses `localStorage`.

## Assumptions

- **Win condition:** The game ends when a tile with value 2048 is reached
- **Tile spawn distribution:** 90% chance of 2, 10% chance of 4
- **AI strategy:** Improved Expectimax (depth/time configurable in `src/ui/config.ts`)
- **Post-win behavior:** After winning, clicking "Resume" dismisses the overlay but the board stays frozen — only "New Game" allows further play
- **Persistence:** One saved game per browser (`localStorage` key `2048_events_default`)
