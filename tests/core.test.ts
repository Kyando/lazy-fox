import { describe, expect, it } from 'vitest';
import { generateLevel, specPairs } from '../src/core/generate.ts';
import { adjacent, findPaths, isPath } from '../src/core/grid.ts';
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

  it.each(levels.map((l) => [l.id, l] as const))('%s chains each trait into its animal', (_, def) => {
    for (const { adjective, animal } of def.pairs) {
      expect(adjacent(adjective.path.at(-1)!, animal.path[0], def.cols)).toBe(true);
    }
  });

  it.each(levels.map((l) => [l.id, l] as const))('%s matches its spec', (_, def) => {
    const spec = SPECS.find((s) => s.id === def.id)!;
    expect([def.rows, def.cols]).toEqual([spec.rows, spec.cols]);
    expect(def.pairs.map((p) => [p.adjective.text, p.animal.text])).toEqual(specPairs(spec));
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
    const puzzle = buildPuzzle(levels[1]);
    const session = new Session(puzzle, emptyProgress(), () => {});
    const [trait, animal] = puzzle.words;

    expect(session.submit([...animal.path].reverse())).toMatchObject({ kind: 'found', stickerDone: false });
    expect(session.ownerAt(animal.path[0])).toBe(animal.index);
    expect(session.submit(animal.path)).toEqual({ kind: 'miss' });
    expect(session.submit(trait.path)).toMatchObject({ kind: 'found', stickerDone: true, solved: false });
    expect(session.progress.misses).toBe(1);
  });

  it('rejects a trace that is not exactly a word', () => {
    const puzzle = buildPuzzle(levels[1]);
    expect(matchTrace(puzzle, puzzle.words[0].path.slice(1))).toEqual([]);
  });

  it('takes a whole pair traced in one go (LAZYFOX), either way', () => {
    const puzzle = buildPuzzle(levels[1]);
    const [trait, animal] = puzzle.words;
    const chain = [...trait.path, ...animal.path];
    expect(matchTrace(puzzle, [...chain].reverse())).toEqual([0, 1]);

    const session = new Session(puzzle, emptyProgress(), () => {});
    expect(session.submit(chain)).toMatchObject({ kind: 'found', words: [trait, animal], stickerDone: true });
    expect(session.progress.found).toEqual([trait.text, animal.text]);
  });

  it('does not chain a pair once one of its words is found', () => {
    const puzzle = buildPuzzle(levels[1]);
    const [trait, animal] = puzzle.words;
    const session = new Session(puzzle, emptyProgress(), () => {});
    session.submit(trait.path);
    expect(session.submit([...trait.path, ...animal.path])).toEqual({ kind: 'miss' });
  });
});

describe('sentence level', () => {
  // No shipped level uses a sentence right now, so lay one out here.
  const def = generateLevel(
    { id: 'pangram', title: 'Pangram', rows: 6, cols: 5, sentence: ['THE', 'QUICK', 'DOG', 'JUMPS', 'OVER', 'THE', 'LAZY', 'FOX'] },
    7,
  )!;
  const puzzle = buildPuzzle(def);

  it('lays the whole sentence as one snake', () => {
    expect(def.sentence).toEqual(['THE', 'QUICK', 'DOG', 'JUMPS', 'OVER', 'THE', 'LAZY', 'FOX']);
    expect(def.pairs.map((p) => `${p.adjective.text} ${p.animal.text}`)).toEqual(['QUICK DOG', 'LAZY FOX']);
    // Each word in the sentence runs straight into the next one.
    const inOrder = def.sentence!.map((text, i) => puzzle.words.filter((w) => w.text === text)[def.sentence!.slice(0, i).filter((t) => t === text).length]);
    inOrder.slice(1).forEach((w, i) => expect(adjacent(inOrder[i].path.at(-1)!, w.path[0], def.cols)).toBe(true));
  });

  it('keeps the two THEs apart, saved under their own keys', () => {
    const thes = puzzle.words.filter((w) => w.text === 'THE');
    expect(thes.map((w) => [w.key, w.role])).toEqual([
      ['THE', 'extra'],
      ['THE#2', 'extra'],
    ]);
    const progress = emptyProgress();
    const session = new Session(puzzle, progress, () => {});
    expect(session.submit(thes[1].path)).toMatchObject({ kind: 'found', stickerDone: false });
    expect(progress.found).toEqual(['THE#2']);

    const reloaded = new Session(puzzle, progress, () => {});
    expect(reloaded.isFound(thes[1].index)).toBe(true);
    expect(reloaded.isFound(thes[0].index)).toBe(false);
  });

  it('needs the filler words too before the level is solved', () => {
    const session = new Session(puzzle, emptyProgress(), () => {});
    def.pairs.forEach((p) => session.submit([...p.adjective.path, ...p.animal.path]));
    expect(session.stickersDone).toBe(2);
    expect(session.solved).toBe(false);
    const extras = puzzle.words.filter((w) => w.role === 'extra');
    extras.slice(0, -1).forEach((w) => session.submit(w.path));
    expect(session.submit(extras.at(-1)!.path)).toMatchObject({ kind: 'found', solved: true });
  });
});

describe('first level', () => {
  it('opens with LAZY FOX and QUICK DOG filling a 3×5', () => {
    const def = levels[0];
    expect([def.rows, def.cols]).toEqual([3, 5]);
    expect(def.pairs.map((p) => `${p.adjective.text} ${p.animal.text}`)).toEqual(['LAZY FOX', 'QUICK DOG']);
    expect(def.extras).toBeUndefined();
  });
});

describe('holes', () => {
  // A 2×4 with its bottom-left corner cut off: 7 cells for LAZY FOX.
  const def = generateLevel({ id: 'holes', title: 'Holes', rows: 2, cols: 4, holes: [4], pairs: [['LAZY', 'FOX']] }, 3)!;

  it('lays words around an empty cell', () => {
    expect(validateLevel(def)).toEqual([]);
    expect(def.grid[1][0]).toBe('.');
  });

  it('rejects a level that leaves a letter cell without a word', () => {
    const broken = structuredClone(def);
    broken.grid[1] = 'Q' + broken.grid[1].slice(1); // the hole now holds a stray letter
    expect(validateLevel(broken)).toContain('every letter must belong to exactly one word');
  });
});
