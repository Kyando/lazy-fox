import { neighbors, touches, turns } from './grid.ts';
import { validateLevel } from './puzzle.ts';
import type { LevelDef } from './types.ts';

export interface LevelSpec {
  id: string;
  title: string;
  subtitle?: string;
  rows: number;
  cols: number;
  /** [trait, animal] pairs; their letters must add up to rows * cols. */
  pairs: [string, string][];
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
  let budget = 400;
  const walk = () => {
    if (out.length >= max || --budget < 0) return;
    if (path.length === length) {
      out.push([...path]);
      return;
    }
    for (const next of shuffle(neighbors(path[path.length - 1], rows, cols), rng)) {
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

/** Can `size` be written as a sum of some of `lengths`? */
function subsetSum(lengths: number[], size: number): boolean {
  const ok = new Array<boolean>(size + 1).fill(false);
  ok[0] = true;
  for (const len of lengths) for (let s = size; s >= len; s--) ok[s] ||= ok[s - len];
  return ok[size];
}

/**
 * Tiles the grid with the words (sizes only; letters come later), keeping each trait next to its animal.
 * Fills the first empty cell each step, so dead ends show up early.
 */
function tile(texts: string[], rows: number, cols: number, rng: () => number): number[][] | null {
  const n = rows * cols;
  const owner = new Int16Array(n).fill(-1);
  const paths: (number[] | null)[] = texts.map(() => null);
  let budget = 4000;

  const feasible = (): boolean => {
    // Each placed word still waiting for its partner needs an empty cell beside it.
    for (let w = 0; w < texts.length; w++) {
      const path = paths[w];
      if (!path || paths[w ^ 1]) continue;
      if (!path.some((c) => neighbors(c, rows, cols).some((x) => owner[x] < 0))) return false;
    }
    // Every empty region must be fillable by some of the remaining words.
    const remaining = texts.filter((_, w) => !paths[w]).map((t) => t.length);
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
    for (const w of shuffle(texts.map((_, i) => i).filter((i) => !paths[i]), rng)) {
      for (const cells of randomPaths(start, texts[w].length, owner, rows, cols, rng, 6)) {
        const partner = paths[w ^ 1];
        if (partner && !touches(cells, partner, cols)) continue;
        cells.forEach((c) => (owner[c] = w));
        // The walk starts on the top-left-most empty cell; reading it backwards doubles the shapes.
        paths[w] = rng() < 0.5 ? cells : [...cells].reverse();
        if (feasible() && place()) return true;
        cells.forEach((c) => (owner[c] = -1));
        paths[w] = null;
        if (budget < 0) return false;
      }
    }
    return false;
  };

  return place() ? (paths as number[][]) : null;
}

/** Bendier boards feel more like Tetris: reward turns, and a little variety in shapes. */
function score(def: LevelDef): number {
  const paths = def.pairs.flatMap((p) => [p.adjective.path, p.animal.path]);
  const bent = paths.filter((p) => turns(p) > 0).length;
  return paths.reduce((sum, p) => sum + Math.min(turns(p), 3), 0) + bent * 2;
}

/** Best of `attempts` random valid layouts, or null if none passed validation. */
export function generateLevel(spec: LevelSpec, seed: number, attempts = 200): LevelDef | null {
  const { rows, cols } = spec;
  const texts = spec.pairs.flat();
  const total = texts.reduce((s, t) => s + t.length, 0);
  if (total !== rows * cols) throw new Error(`${spec.id}: words have ${total} letters for ${rows * cols} cells`);

  const rng = mulberry32(seed);
  let best: LevelDef | null = null;
  let bestScore = -Infinity;
  for (let i = 0; i < attempts; i++) {
    const paths = tile(texts, rows, cols, rng);
    if (!paths) continue;
    const letters = new Array<string>(rows * cols);
    paths.forEach((path, w) => path.forEach((cell, k) => (letters[cell] = texts[w][k])));
    const def: LevelDef = {
      id: spec.id,
      title: spec.title,
      ...(spec.subtitle ? { subtitle: spec.subtitle } : {}),
      rows,
      cols,
      grid: Array.from({ length: rows }, (_, r) => letters.slice(r * cols, (r + 1) * cols).join('')),
      pairs: spec.pairs.map(([adjective, animal], p) => ({
        adjective: { text: adjective, path: paths[p * 2] },
        animal: { text: animal, path: paths[p * 2 + 1] },
      })),
    };
    if (validateLevel(def).length) continue;
    const s = score(def) + rng();
    if (s > bestScore) {
      best = def;
      bestScore = s;
    }
  }
  return best;
}
