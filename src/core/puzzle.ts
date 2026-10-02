import { adjacent, findPaths, isPath } from './grid.ts';
import type { LevelDef } from './types.ts';
import { ANIMALS, TRAITS } from './words.ts';

export type Role = 'adjective' | 'animal';

export interface Word {
  index: number;
  text: string;
  path: number[];
  pair: number;
  role: Role;
}

export interface Puzzle {
  def: LevelDef;
  rows: number;
  cols: number;
  /** All letters, row by row. */
  letters: string;
  /** Words in pair order: adjective, animal, adjective, animal… */
  words: Word[];
}

export function wordsOf(def: LevelDef): Word[] {
  return def.pairs.flatMap((pair, p) => [
    { index: p * 2, text: pair.adjective.text, path: pair.adjective.path, pair: p, role: 'adjective' as const },
    { index: p * 2 + 1, text: pair.animal.text, path: pair.animal.path, pair: p, role: 'animal' as const },
  ]);
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
  if (!/^[A-Z]*$/.test(letters)) errors.push('grid must be uppercase A-Z');

  const words = wordsOf(def);
  const seen = new Set<string>();
  const owner = new Array<number>(rows * cols).fill(-1);
  for (const w of words) {
    if (seen.has(w.text)) errors.push(`${w.text} appears twice`);
    seen.add(w.text);
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
  if (owner.includes(-1)) errors.push('some cells belong to no word');
  if (errors.length) return errors;

  // The trait leads straight into its animal: lazY sits next to Fox.
  def.pairs.forEach(({ adjective, animal }) => {
    if (!adjacent(adjective.path[adjective.path.length - 1], animal.path[0], cols)) {
      errors.push(`${adjective.text} does not run into ${animal.text}`);
    }
  });
  for (const w of words) {
    const n = findPaths(letters, rows, cols, w.text).length;
    if (n !== 1) errors.push(`${w.text} can be traced in ${n} places`);
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
