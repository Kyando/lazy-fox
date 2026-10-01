import { matchTrace, type Puzzle, type Word } from '../core/puzzle.ts';
import type { LevelProgress } from './save.ts';

export type TraceResult =
  | { kind: 'found'; word: Word; stickerDone: boolean; solved: boolean }
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
    this.found = puzzle.words.map((w) => progress.found.includes(w.text));
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

  /** Checks a finished trace against the hidden words. */
  submit(trace: number[]): TraceResult {
    const index = matchTrace(this.puzzle, trace);
    if (index < 0 || this.found[index]) {
      this.progress.misses++;
      this.persist();
      return { kind: 'miss' };
    }
    const word = this.puzzle.words[index];
    this.found[index] = true;
    this.lock(word);
    this.progress.found.push(word.text);
    this.progress.done ||= this.solved;
    this.persist();
    return { kind: 'found', word, stickerDone: this.stickerDone(word.pair), solved: this.solved };
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
