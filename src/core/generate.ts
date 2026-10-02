import { findPaths, neighbors, turns } from './grid.ts';
import { HOLE_LETTER, validateLevel } from './puzzle.ts';
import type { LevelDef, PairDef, WordDef } from './types.ts';
import { ANIMALS, TRAITS } from './words.ts';

export interface LevelSpec {
  id: string;
  title: string;
  subtitle?: string;
  rows: number;
  cols: number;
  /** [trait, animal] pairs; their letters must add up to rows * cols. */
  pairs?: [string, string][];
  /**
   * Or a whole sentence laid as one snake through the grid. Each trait followed by an animal
   * becomes a sticker pair; every other word is filler.
   */
  sentence?: string[];
  /** Cells left empty, for boards that aren't a full rectangle (a 2×4 with a corner cut off). */
  holes?: number[];
  /**
   * Harder boards: prefer layouts full of false starts (BEA… that isn't BEAR), above all right after
   * each trait, where a neighbour starts some other animal.
   */
  tricky?: boolean;
}

/** The words of a spec, grouped into chains that are laid as one continuous path each. */
function chainsOf(spec: LevelSpec): string[][] {
  return spec.sentence ? [spec.sentence] : (spec.pairs ?? []);
}

/** The sticker pairs a spec yields, in order. */
export function specPairs(spec: LevelSpec): [string, string][] {
  if (!spec.sentence) return spec.pairs ?? [];
  const words = spec.sentence;
  const out: [string, string][] = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (TRAITS[words[i]] && ANIMALS[words[i + 1]]) out.push([words[i], words[++i]]);
  }
  return out;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Random self-avoiding walks of `length` empty cells starting at `start`. */
function randomPaths(start: number, length: number, owner: Int16Array, rows: number, cols: number, rng: () => number, max: number): number[][] {
  const out: number[][] = [];
  const path = [start];
  const used = new Set(path);
  // Long snakes (a whole sentence) follow Warnsdorff's rule: visit the neighbour with the fewest
  // free neighbours first, so the walk doesn't wall itself off.
  const long = length > 12;
  let budget = long ? length * 400 : 400;
  const freeAround = (cell: number) => neighbors(cell, rows, cols).filter((x) => owner[x] < 0 && !used.has(x)).length;
  const order = (cell: number) => {
    const next = shuffle(neighbors(cell, rows, cols), rng);
    return long ? next.map((x) => [x, freeAround(x) + rng() * 0.5] as const).sort((a, b) => a[1] - b[1]).map(([x]) => x) : next;
  };
  const walk = () => {
    if (out.length >= max || --budget < 0) return;
    if (path.length === length) {
      out.push([...path]);
      return;
    }
    for (const next of order(path[path.length - 1])) {
      if (owner[next] >= 0 || used.has(next)) continue;
      path.push(next);
      used.add(next);
      walk();
      path.pop();
      used.delete(next);
    }
  };
  walk();
  return out;
}

/** Marks a hole as taken, so no word is laid through it. */
const HOLE = 0x7fff;

/** Can `size` be written as a sum of some of `lengths`? */
function subsetSum(lengths: number[], size: number): boolean {
  const ok = new Array<boolean>(size + 1).fill(false);
  ok[0] = true;
  for (const len of lengths) for (let s = size; s >= len; s--) ok[s] ||= ok[s - len];
  return ok[size];
}

/**
 * Tiles the grid with one chain per pair (the trait's letters, then the animal's), so the trait's last
 * letter always touches the animal's first. Only shapes here; letters come later.
 * Fills the first empty cell each step, so dead ends show up early.
 */
function tile(lengths: number[], rows: number, cols: number, holes: number[], rng: () => number): number[][] | null {
  const n = rows * cols;
  const owner = new Int16Array(n).fill(-1);
  for (const h of holes) owner[h] = HOLE;
  const paths: (number[] | null)[] = lengths.map(() => null);
  let budget = 4000;

  // Every empty region must be fillable by some of the remaining chains.
  const feasible = (): boolean => {
    const remaining = lengths.filter((_, i) => !paths[i]);
    const seen = new Uint8Array(n);
    for (let start = 0; start < n; start++) {
      if (owner[start] >= 0 || seen[start]) continue;
      let size = 0;
      const stack = [start];
      seen[start] = 1;
      while (stack.length) {
        const c = stack.pop()!;
        size++;
        for (const x of neighbors(c, rows, cols)) {
          if (owner[x] < 0 && !seen[x]) {
            seen[x] = 1;
            stack.push(x);
          }
        }
      }
      if (!subsetSum(remaining, size)) return false;
    }
    return true;
  };

  const place = (): boolean => {
    if (--budget < 0) return false;
    const start = owner.indexOf(-1);
    if (start < 0) return true;
    for (const i of shuffle(lengths.map((_, k) => k).filter((k) => !paths[k]), rng)) {
      for (const cells of randomPaths(start, lengths[i], owner, rows, cols, rng, 6)) {
        cells.forEach((c) => (owner[c] = i));
        // The walk starts on the top-left-most empty cell; reading it backwards doubles the shapes.
        paths[i] = rng() < 0.5 ? cells : [...cells].reverse();
        if (feasible() && place()) return true;
        cells.forEach((c) => (owner[c] = -1));
        paths[i] = null;
        if (budget < 0) return false;
      }
    }
    return false;
  };

  return place() ? (paths as number[][]) : null;
}

/** Bendier boards feel more like Tetris: reward turns, and a little variety in shapes. */
function score(def: LevelDef): number {
  const paths = [...def.pairs.flatMap((p) => [p.adjective.path, p.animal.path]), ...(def.extras ?? []).map((w) => w.path)];
  const bent = paths.filter((p) => turns(p) > 0).length;
  return paths.reduce((sum, p) => sum + Math.min(turns(p), 3), 0) + bent * 2;
}

/** Longest prefix of `word` traceable from `cell` without stepping on `taken`. */
function reach(letters: string, rows: number, cols: number, cell: number, word: string, taken: Set<number>): number {
  let best = 0;
  const used = new Set(taken);
  const walk = (at: number, k: number) => {
    if (letters[at] !== word[k]) return;
    best = Math.max(best, k + 1);
    if (k + 1 === word.length) return;
    used.add(at);
    for (const next of neighbors(at, rows, cols)) if (!used.has(next)) walk(next, k + 1);
    used.delete(at);
  };
  if (!taken.has(cell)) walk(cell, 0);
  return best;
}

/**
 * How much a board misleads. Every false start of a word counts (a prefix traced somewhere it doesn't
 * lead), longer ones more; wrong turns right after a trait (a neighbour that begins some animal of
 * the level) count most, since that's where the player looks for the animal.
 */
export function decoys(def: LevelDef): number {
  const { rows, cols } = def;
  const letters = def.grid.join('');
  const words = [...def.pairs.flatMap((p) => [p.adjective, p.animal]), ...(def.extras ?? [])];
  const animals = def.pairs.map((p) => p.animal.text);
  let total = 0;
  for (const w of words) {
    for (let k = 2; k < w.text.length; k++) {
      const real = w.path.slice(0, k).join();
      const wrong = findPaths(letters, rows, cols, w.text.slice(0, k)).filter((p) => p.join() !== real).length;
      total += wrong * (k - 1);
    }
  }
  for (const { adjective, animal } of def.pairs) {
    const taken = new Set(adjective.path);
    for (const next of neighbors(adjective.path[adjective.path.length - 1], rows, cols)) {
      if (next === animal.path[0]) continue;
      total += 10 * Math.max(0, ...animals.map((a) => reach(letters, rows, cols, next, a, taken)));
    }
  }
  return total;
}

/**
 * Best of `attempts` random valid layouts, or null if none passed validation. Tricky levels get many
 * more tries: words sharing letters rarely leave each one traceable in a single place.
 */
export function generateLevel(spec: LevelSpec, seed: number, attempts = spec.tricky ? 3000 : 200): LevelDef | null {
  const { rows, cols } = spec;
  const chains = chainsOf(spec);
  const texts = chains.flat();
  const total = texts.reduce((s, t) => s + t.length, 0);
  const holes = spec.holes ?? [];
  if (total !== rows * cols - holes.length) throw new Error(`${spec.id}: words have ${total} letters for ${rows * cols - holes.length} cells`);
  const pairCount = specPairs(spec).length;

  const rng = mulberry32(seed);
  let best: LevelDef | null = null;
  let bestScore = -Infinity;
  for (let i = 0; i < attempts; i++) {
    const chainPaths = tile(chains.map((c) => c.join('').length), rows, cols, holes, rng);
    if (!chainPaths) continue;
    // Cut each chain's path back into its words.
    const words: WordDef[] = chains.flatMap((chain, c) => {
      let at = 0;
      return chain.map((text) => ({ text, path: chainPaths[c].slice(at, (at += text.length)) }));
    });
    const letters = new Array<string>(rows * cols).fill(HOLE_LETTER);
    words.forEach((w) => w.path.forEach((cell, k) => (letters[cell] = w.text[k])));

    const pairs: PairDef[] = [];
    const extras: WordDef[] = [];
    for (let k = 0; k < words.length; k++) {
      const pairable = spec.sentence ? TRAITS[words[k].text] && ANIMALS[words[k + 1]?.text] : true;
      if (pairable && k + 1 < words.length) pairs.push({ adjective: words[k], animal: words[++k] });
      else extras.push(words[k]);
    }
    if (pairs.length !== pairCount) throw new Error(`${spec.id}: expected ${pairCount} pairs`);

    const def: LevelDef = {
      id: spec.id,
      title: spec.title,
      ...(spec.subtitle ? { subtitle: spec.subtitle } : {}),
      rows,
      cols,
      grid: Array.from({ length: rows }, (_, r) => letters.slice(r * cols, (r + 1) * cols).join('')),
      pairs,
      ...(extras.length ? { extras } : {}),
      ...(spec.sentence ? { sentence: spec.sentence } : {}),
    };
    if (validateLevel(def).length) continue;
    const s = score(def) + (spec.tricky ? decoys(def) : 0) + rng();
    if (s > bestScore) {
      best = def;
      bestScore = s;
    }
  }
  return best;
}
