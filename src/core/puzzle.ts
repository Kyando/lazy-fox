import { adjacent, findPaths, isPath } from './grid.ts';
import type { LevelDef } from './types.ts';
import { ANIMALS, TRAITS } from './words.ts';

/** Filler words (THE, JUMPS…) are 'extra': they fill the grid but belong to no sticker. */
export type Role = 'adjective' | 'animal' | 'extra';

export interface Word {
  index: number;
  text: string;
  /** Unique within the level: the text, plus "#2", "#3"… for repeats (the second THE). Saved in progress. */
  key: string;
  path: number[];
  /** Sticker pair, or -1 for extras. */
  pair: number;
  role: Role;
}

/** An empty cell in the grid: not part of the board at all. */
export const HOLE_LETTER = '.';

export interface Puzzle {
  def: LevelDef;
  rows: number;
  cols: number;
  /** All letters, row by row. */
  letters: string;
  /** Pairs first (adjective, animal, adjective, animal…), so word index = pair * 2 + 0|1; extras after. */
  words: Word[];
}

export function wordsOf(def: LevelDef): Word[] {
  const raw = [
    ...def.pairs.flatMap((pair, p) => [
      { ...pair.adjective, pair: p, role: 'adjective' as const },
      { ...pair.animal, pair: p, role: 'animal' as const },
    ]),
    ...(def.extras ?? []).map((w) => ({ ...w, pair: -1, role: 'extra' as const })),
  ];
  const seen = new Map<string, number>();
  return raw.map((w, index) => {
    const n = (seen.get(w.text) ?? 0) + 1;
    seen.set(w.text, n);
    return { index, text: w.text, key: n === 1 ? w.text : `${w.text}#${n}`, path: w.path, pair: w.pair, role: w.role };
  });
}

/**
 * Everything a level must satisfy: every cell in exactly one word, words spelled along orthogonal
 * paths, each trait running into its animal, and each word traceable in exactly one place (so a found word is never ambiguous).
 */
export function validateLevel(def: LevelDef): string[] {
  const errors: string[] = [];
  const { rows, cols } = def;
  const letters = def.grid.join('');
  if (def.grid.length !== rows || def.grid.some((r) => r.length !== cols)) errors.push('grid size does not match rows/cols');
  if (!/^[A-Z.]*$/.test(letters)) errors.push('grid must be uppercase A-Z (or . for an empty cell)');

  const words = wordsOf(def);
  const seen = new Set<string>();
  const owner = new Array<number>(rows * cols).fill(-1);
  for (const w of words) {
    // Sticker words are one of a kind; only filler words (THE) may repeat.
    if (seen.has(w.text) && (w.role !== 'extra' || words.some((o) => o.text === w.text && o.role !== 'extra'))) {
      errors.push(`${w.text} appears twice`);
    }
    seen.add(w.text);
    if (w.role === 'extra' && !/^[A-Z]{2,}$/.test(w.text)) errors.push(`${w.text} is not a valid word`);
    if (w.role === 'animal' && !ANIMALS[w.text]) errors.push(`${w.text} is not in the animal bank`);
    if (w.role === 'adjective' && !TRAITS[w.text]) errors.push(`${w.text} is not in the trait bank`);
    if (w.path.length !== w.text.length || !isPath(w.path, rows, cols)) {
      errors.push(`${w.text} has an invalid path`);
      continue;
    }
    w.path.forEach((cell, i) => {
      if (owner[cell] >= 0) errors.push(`${w.text} overlaps ${words[owner[cell]].text}`);
      owner[cell] = w.index;
      if (letters[cell] !== w.text[i]) errors.push(`${w.text} is misspelled on the grid`);
    });
  }
  if (owner.some((o, cell) => (o < 0) !== (letters[cell] === HOLE_LETTER))) errors.push('every letter must belong to exactly one word');
  if (errors.length) return errors;

  // The trait leads straight into its animal: lazY sits next to Fox.
  def.pairs.forEach(({ adjective, animal }) => {
    if (!adjacent(adjective.path[adjective.path.length - 1], animal.path[0], cols)) {
      errors.push(`${adjective.text} does not run into ${animal.text}`);
    }
  });
  // A word repeated n times must be traceable in exactly n places: its own.
  for (const text of new Set(words.map((w) => w.text))) {
    const copies = words.filter((w) => w.text === text).length;
    const n = findPaths(letters, rows, cols, text).length;
    if (n !== copies) errors.push(`${text} can be traced in ${n} places`);
  }
  if (def.sentence && [...def.sentence].sort().join() !== words.map((w) => w.text).sort().join()) {
    errors.push('sentence does not list the level words');
  }
  return errors;
}

export function buildPuzzle(def: LevelDef): Puzzle {
  const errors = validateLevel(def);
  if (errors.length) throw new Error(`${def.id}: ${errors.join('; ')}`);
  return { def, rows: def.rows, cols: def.cols, letters: def.grid.join(''), words: wordsOf(def) };
}

/**
 * The words a trace spells, in either reading direction: one word whose path is exactly `trace`,
 * or a whole pair traced in one go (LAZYFOX), since each trait runs straight into its animal.
 * Empty if it's neither.
 */
export function matchTrace(puzzle: Puzzle, trace: number[]): number[] {
  const same = (path: number[]) =>
    path.length === trace.length && (path.every((c, i) => c === trace[i]) || path.every((c, i) => c === trace[trace.length - 1 - i]));
  const word = puzzle.words.findIndex((w) => same(w.path));
  if (word >= 0) return [word];
  const pair = puzzle.def.pairs.findIndex((p) => same([...p.adjective.path, ...p.animal.path]));
  return pair >= 0 ? [pair * 2, pair * 2 + 1] : [];
}
