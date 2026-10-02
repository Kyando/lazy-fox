/** A word laid on the grid. `path` lists cell indices (row * cols + col) from the first letter to the last. */
export interface WordDef {
  text: string;
  path: number[];
}

/** An animal and its trait: finding both unlocks a sticker ("Lazy Fox"). */
export interface PairDef {
  adjective: WordDef;
  animal: WordDef;
}

export interface LevelDef {
  id: string;
  title: string;
  subtitle?: string;
  rows: number;
  cols: number;
  /** One string per row, for readability; must match the word paths. */
  grid: string[];
  pairs: PairDef[];
  /** Words that fill the grid but give no sticker (THE, JUMPS, OVER…). The same text may repeat. */
  extras?: WordDef[];
  /** For sentence levels: every word in reading order, which the word list then follows. */
  sentence?: string[];
}
