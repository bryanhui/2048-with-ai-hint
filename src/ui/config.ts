export const CONFIG = {
  /** @deprecated Not implemented — strategy selector UI does not exist */
  ENABLE_STRATEGY_SELECTOR: false,

  /** Enable the AI hint button */
  ENABLE_AI_HINT: true,

  /** Enable the undo button */
  ENABLE_UNDO: false,

  /** Default AI strategy used for hints */
  DEFAULT_STRATEGY: 'improved_expectimax',

  /** Expectimax search depth (higher = stronger but slower) */
  EXPECTIMAX_DEPTH: 6,

  /** Enable YOLO auto-play mode */
  ENABLE_YOLO: true,

  /** Delay between YOLO auto-play moves in milliseconds */
  YOLO_DELAY_MS: 400,
} as const;
