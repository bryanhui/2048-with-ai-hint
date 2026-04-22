# 2048 with AI Hint

A 2048 clone built with TypeScript, React, and Vite. Event-sourced state management with an Expectimax-powered hint system.

**Live demo:** https://2048-nine-peach.vercel.app

## What's here

- **Core game logic** in `src/core/` — event-sourced state management, board operations, win/loss detection
- **AI** in `src/ai/` — Expectimax strategy for hints
- **Web UI** in `src/ui/` — keyboard + touch controls, AI hint arrows with score breakdowns

## Running it

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (vitest)
npm run e2e        # browser tests (playwright)
```

## AI Hint

Click **AI Hint** to see an arrow pointing to the recommended move. The toast shows:
- **Best** — the score of the top-ranked direction
- **2nd** — the score of the runner-up direction
- A brief explanation of how Expectimax works

### How Expectimax works

Expectimax is a game-tree search algorithm that handles the randomness in 2048 (tile spawns). It alternates between:

1. **Player nodes** — try all 4 directions and pick the one with the highest expected score
2. **Chance nodes** — average the score over possible tile spawns (2 or 4 at each empty cell)

The search is depth-limited and uses a heuristic that rewards:
- **Monotonicity** — tiles ordered in decreasing rows/columns (bidirectional: left→right or right→left)
- **Smoothness** — adjacent tiles with equal values (merge opportunities)
- **Open cells** — more empty spaces for future moves
- **Max tile in corner** — keeping the highest tile anchored in a corner
- **Max tile value** — higher top tile is better

Chance-node sampling is adaptive: up to **8 spawn positions** are evaluated at the top level of the tree, and **2** at deeper levels. This keeps the search fast while still considering the most important random outcomes.

## Configuration

Feature flags live in `src/ui/config.ts`:

| Flag | Default | Description |
|---|---|---|
| `ENABLE_STRATEGY_SELECTOR` | `false` | Dropdown to pick AI strategies |
| `ENABLE_AI_HINT` | `true` | Hint button with Expectimax recommendations |
| `ENABLE_UNDO` | `false` | Undo last move button |
| `DEFAULT_STRATEGY` | `'expectimax'` | Strategy used when selector is hidden |
| `EXPECTIMAX_DEPTH` | `4` | Search depth — higher is stronger but slower |

Board dimension is controlled by `BOARD_SIZE` in `src/core/board.ts`. Change it there and everything (grid, tiles, AI heuristics) adapts automatically.

Toggle the flags and rebuild to change the UI.

## Architecture notes

The board logic is pure — no side effects, no DOM. Game state is built by reducing an event stream (`GameStarted`, `BoardMoved`, `TileSpawned`, etc.). This makes undo trivial: just truncate the history and rehydrate.

Storage is pluggable. The browser uses `localStorage`.

## Assumptions

- **Win condition:** The game ends when a tile with value 2048 is reached
- **Tile spawn distribution:** 90% chance of 2, 10% chance of 4
- **AI strategy:** Expectimax (depth configurable in `src/ui/config.ts`)
- **Post-win behavior:** After winning, clicking "Resume" dismisses the overlay but the board stays frozen — only "New Game" allows further play
- **Persistence:** One saved game per browser (`localStorage` key `2048_events_default`)
