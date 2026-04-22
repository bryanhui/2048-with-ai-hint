export const CONFIG = {
  /** Enable the strategy selector dropdown */
  ENABLE_STRATEGY_SELECTOR: false,

  /** Enable the AI hint button */
  ENABLE_AI_HINT: true,

  /** Enable the undo button */
  ENABLE_UNDO: false,

  /** Default AI strategy used for hints */
  DEFAULT_STRATEGY: 'expectimax',

  /** Expectimax search depth (higher = stronger but slower) */
  EXPECTIMAX_DEPTH: 4,
} as const;
