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
}
