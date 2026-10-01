import { describe, expect, it } from 'vitest';
import { generateLevel } from '../src/core/generate.ts';
import { findPaths, isPath } from '../src/core/grid.ts';
import { buildPuzzle, matchTrace, validateLevel } from '../src/core/puzzle.ts';
import type { LevelDef } from '../src/core/types.ts';
import { Session } from '../src/game/session.ts';
import { emptyProgress } from '../src/game/save.ts';
import { SPECS } from '../scripts/level-specs.ts';

const files = import.meta.glob<LevelDef>('../src/levels/*.json', { eager: true, import: 'default' });
const levels = Object.keys(files).sort().map((k) => files[k]);

describe('grid', () => {
  it('only accepts orthogonal, non-repeating paths', () => {
    expect(isPath([0, 1, 5, 4], 4, 4)).toBe(true);
    expect(isPath([0, 5], 4, 4)).toBe(false); // diagonal
    expect(isPath([3, 4], 4, 4)).toBe(false); // wraps a row
    expect(isPath([0, 1, 0], 4, 4)).toBe(false);
  });

  it('finds every bent path spelling a word', () => {
    // C A
    // T X
    expect(findPaths('CATX', 2, 2, 'CAT')).toEqual([]);
    expect(findPaths('CAXT', 2, 2, 'CAT')).toEqual([[0, 1, 3]]);
  });
});

describe('levels', () => {
  it('ship one file per spec, in order', () => {
    expect(levels.map((l) => l.id)).toEqual(SPECS.map((s) => s.id));
  });

  it.each(levels.map((l) => [l.id, l] as const))('%s is valid', (_, def) => {
    expect(validateLevel(def)).toEqual([]);
  });

  it.each(levels.map((l) => [l.id, l] as const))('%s matches its spec', (_, def) => {
    const spec = SPECS.find((s) => s.id === def.id)!;
    expect([def.rows, def.cols]).toEqual([spec.rows, spec.cols]);
    expect(def.pairs.map((p) => [p.adjective.text, p.animal.text])).toEqual(spec.pairs);
  });
});

describe('generator', () => {
  it('lays out a valid level deterministically', () => {
    const a = generateLevel(SPECS[0], 42, 20);
    const b = generateLevel(SPECS[0], 42, 20);
    expect(a).not.toBeNull();
    expect(validateLevel(a!)).toEqual([]);
    expect(a).toEqual(b);
  });
});

describe('session', () => {
  it('accepts a word traced either way and unlocks its sticker', () => {
    const puzzle = buildPuzzle(levels[0]);
    const session = new Session(puzzle, emptyProgress(), () => {});
    const [trait, animal] = puzzle.words;

    expect(session.submit([...animal.path].reverse())).toMatchObject({ kind: 'found', stickerDone: false });
    expect(session.ownerAt(animal.path[0])).toBe(animal.index);
    expect(session.submit(animal.path)).toEqual({ kind: 'miss' });
    expect(session.submit(trait.path)).toMatchObject({ kind: 'found', stickerDone: true, solved: false });
    expect(session.progress.misses).toBe(1);
  });

  it('rejects a trace that is not exactly a word', () => {
    const puzzle = buildPuzzle(levels[0]);
    expect(matchTrace(puzzle, puzzle.words[0].path.slice(1))).toBe(-1);
  });
});
