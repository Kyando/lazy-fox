import { matchTrace, type Puzzle, type Word } from '../core/puzzle.ts';
import type { LevelProgress } from './save.ts';

export type TraceResult =
  /** `words` holds one word, or both words of a pair traced as one chain. */
  | { kind: 'found'; words: Word[]; stickerDone: boolean; solved: boolean }
  | { kind: 'miss' };

/** Game state for one level: which words were found, and which cells they lock. */
export class Session {
  readonly puzzle: Puzzle;
  readonly progress: LevelProgress;
  private readonly persist: () => void;
  private readonly found: boolean[];
  /** cell -> found word index, or -1 */
  private readonly owner: Int16Array;

  constructor(puzzle: Puzzle, progress: LevelProgress, persist: () => void) {
    this.puzzle = puzzle;
    this.progress = progress;
    this.persist = persist;
    this.found = puzzle.words.map((w) => progress.found.includes(w.key));
    this.owner = new Int16Array(puzzle.rows * puzzle.cols).fill(-1);
    puzzle.words.forEach((w) => this.found[w.index] && this.lock(w));
  }

  get foundCount(): number {
    return this.found.filter(Boolean).length;
  }

  get solved(): boolean {
    return this.found.every(Boolean);
  }

  isFound(word: number): boolean {
    return this.found[word];
  }

  ownerAt(cell: number): number {
    return this.owner[cell];
  }

  stickerDone(pair: number): boolean {
    return this.found[pair * 2] && this.found[pair * 2 + 1];
  }

  get stickersDone(): number {
    return this.puzzle.def.pairs.filter((_, p) => this.stickerDone(p)).length;
  }

  /** Checks a finished trace against the hidden words: a single word, or a trait + animal pair in one go. */
  submit(trace: number[]): TraceResult {
    const indices = matchTrace(this.puzzle, trace);
    if (!indices.length || indices.some((i) => this.found[i])) {
      this.progress.misses++;
      this.persist();
      return { kind: 'miss' };
    }
    const words = indices.map((i) => this.puzzle.words[i]);
    for (const word of words) {
      this.found[word.index] = true;
      this.lock(word);
      this.progress.found.push(word.key);
    }
    this.progress.done ||= this.solved;
    this.persist();
    const pair = words[0].pair;
    return { kind: 'found', words, stickerDone: pair >= 0 && this.stickerDone(pair), solved: this.solved };
  }

  /** Clears the board to play the level again (stickers already in the album stay there). */
  reset(): void {
    this.found.fill(false);
    this.owner.fill(-1);
    this.progress.found = [];
    this.progress.misses = 0;
    this.persist();
  }

  private lock(word: Word): void {
    word.path.forEach((cell) => (this.owner[cell] = word.index));
  }
}
