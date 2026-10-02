import { adjacent, colOf, rowOf } from '../core/grid.ts';
import { matchTrace, type Word } from '../core/puzzle.ts';
import { ANIMALS, stickerName, TRAITS } from '../core/words.ts';
import type { Session } from '../game/session.ts';
import { h, svg } from './dom.ts';
import { burst, replay } from './fx.ts';
import { ICONS } from './icons.ts';
import { toast } from './overlay.ts';
import type { Sfx } from './sfx.ts';
import { pairStyle, setPairTones, sticker } from './sticker.ts';

export interface LevelViewOptions {
  session: Session;
  number: number;
  total: number;
  sfx: Sfx;
  onSolved(): void;
  /** Absent on the first / last level. */
  onPrev?: () => void;
  onNext?: () => void;
  /** Where "next" leads after the last level. */
  onAlbum(): void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const RADII = ['13px 10px 14px 11px', '10px 14px 11px 13px', '14px 11px 10px 12px', '11px 13px 12px 10px'];
/** Share of a cell, around its centre, that a dragging finger must reach: keeps diagonal slides from skipping. */
const HIT = 0.78;

export class LevelView {
  readonly el: HTMLElement;
  private readonly s: Session;
  private readonly opts: LevelViewOptions;
  private readonly boardWrap: HTMLElement;
  private readonly board: HTMLElement;
  private readonly links: SVGSVGElement;
  private readonly tiles: HTMLElement[] = [];
  private readonly traceEl: HTMLElement;
  private readonly counter: HTMLElement;
  private readonly nextBtn: HTMLButtonElement;
  private readonly album: HTMLElement;
  private readonly albumCount: HTMLElement;
  private readonly wordList: HTMLElement;
  private readonly wordsCount = h('span', { class: 'album-count' });
  /** Word chips by word index. */
  private readonly chips: HTMLElement[] = [];
  private readonly resizeObserver: ResizeObserver;
  private trace: number[] = [];
  private gesture: { moved: boolean; onEnd: boolean } | null = null;
  private cellPx = 0;
  private gapPx = 0;

  constructor(opts: LevelViewOptions) {
    this.opts = opts;
    this.s = opts.session;
    const p = this.s.puzzle;
    const def = p.def;

    // Heading flanked by arrows, so levels are always one tap away.
    this.counter = h('span', { class: 'counter' });
    const arrow = (label: string, glyph: string, go?: () => void) =>
      h('button', { type: 'button', class: 'icon-btn level-arrow', 'aria-label': label, title: label, disabled: !go, onclick: () => go?.() }, svg(glyph));
    const heading = h(
      'header',
      { class: 'chapter' },
      arrow('Nível anterior', ICONS.prev, opts.onPrev),
      h(
        'div',
        { class: 'chapter-text' },
        h('p', { class: 'eyebrow' }, h('span', {}, `Nível ${opts.number} de ${opts.total}`), this.counter),
        h('h1', {}, def.title),
        def.subtitle ? h('p', { class: 'subtitle' }, def.subtitle) : null,
      ),
      arrow('Próximo nível', ICONS.next, opts.onNext),
    );

    // Board: tiles underneath, the word lines in an SVG layer, letters on top.
    this.board = h('div', { class: 'board', role: 'grid', 'aria-label': 'Letras' });
    this.board.style.setProperty('--rows', String(p.rows));
    this.board.style.setProperty('--cols', String(p.cols));
    for (let cell = 0; cell < p.rows * p.cols; cell++) {
      const tile = h(
        'div',
        { class: 'tile', style: `border-radius: ${RADII[(rowOf(cell, p.cols) * 3 + colOf(cell, p.cols)) % RADII.length]}` },
        h('span', { class: 'tile-letter' }, p.letters[cell]),
      );
      this.tiles.push(tile);
      this.board.append(tile);
    }
    this.links = document.createElementNS(SVG_NS, 'svg');
    this.links.classList.add('links');
    this.links.setAttribute('aria-hidden', 'true');
    this.board.append(this.links);
    this.bindPointer();

    this.traceEl = h('div', { class: 'trace', role: 'status', 'aria-live': 'polite' });
    // The bubble sits right above the board, where the eye already is while tracing.
    this.boardWrap = h('div', { class: 'board-wrap' }, this.traceEl, this.board);
    const restartBtn = h(
      'button',
      { type: 'button', class: 'btn btn--tool', onclick: () => this.restart() },
      svg(ICONS.restart),
      h('span', { class: 'btn-label' }, 'Recomeçar'),
    );
    // Shown once the level is complete: closing the win popup never leaves the player stuck.
    this.nextBtn = opts.onNext
      ? h('button', { type: 'button', class: 'btn btn--primary next-btn', onclick: () => opts.onNext!() }, h('span', {}, 'Próximo nível'), svg(ICONS.arrow))
      : h('button', { type: 'button', class: 'btn btn--primary next-btn', onclick: () => opts.onAlbum() }, svg(ICONS.sticker), h('span', {}, 'Ver álbum'));

    // The words to find, in alphabetical order so the list never hints at which trait goes with which animal.
    // A sentence level reads in order instead: the sentence is the point.
    const sorted = def.sentence
      ? def.sentence.map((text, i) => p.words.filter((w) => w.text === text)[def.sentence!.slice(0, i).filter((t) => t === text).length])
      : [...p.words].sort((a, b) => a.text.localeCompare(b.text));
    this.wordList = h(
      'ul',
      { class: 'word-list', 'aria-label': 'Palavras' },
      ...sorted.map((w) => {
        const chip = h('li', { class: 'word-chip' }, w.text);
        this.chips[w.index] = chip;
        return chip;
      }),
    );

    // The sticker album: one slot per animal + trait pair.
    this.albumCount = h('span', { class: 'album-count' });
    this.album = h('div', { class: 'album' });
    const albumPanel = h(
      'section',
      { class: 'album-panel', 'aria-label': 'Palavras e figurinhas' },
      h('header', { class: 'album-head' }, h('span', {}, 'Palavras'), this.wordsCount),
      this.wordList,
      h('header', { class: 'album-head' }, h('span', {}, 'Figurinhas'), this.albumCount),
      h('div', { class: 'album-scroll' }, this.album),
    );

    this.el = h(
      'main',
      { class: 'stage' },
      heading,
      h(
        'div',
        { class: 'play' },
        albumPanel,
        h('div', { class: 'board-area' }, this.boardWrap, h('nav', { class: 'tools' }, restartBtn, this.nextBtn)),
      ),
    );

    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(this.boardWrap);
    this.renderAlbum();
    this.render();
  }

  destroy(): void {
    this.resizeObserver.disconnect();
  }

  // ── tracing ─────────────────────────────────────────────────────────────

  /** Cell under a point. `strict` only counts the middle of the cell, so a drag can't cut corners. */
  private cellAt(x: number, y: number, strict: boolean): number {
    const p = this.s.puzzle;
    // Measured from the tiles' layout (unaffected by their pop animations), so it holds even
    // before the resize observer catches up.
    const rect = this.board.getBoundingClientRect();
    const size = this.tiles[0].offsetWidth;
    const step = this.tiles[1].offsetLeft - this.tiles[0].offsetLeft;
    const lx = x - rect.left;
    const ly = y - rect.top;
    const c = Math.floor(lx / step);
    const r = Math.floor(ly / step);
    if (r < 0 || c < 0 || r >= p.rows || c >= p.cols) return -1;
    if (strict) {
      const margin = (size * (1 - HIT)) / 2;
      const ix = lx - c * step;
      const iy = ly - r * step;
      if (ix < margin || iy < margin || ix > size - margin || iy > size - margin) return -1;
    }
    return r * p.cols + c;
  }

  private free(cell: number): boolean {
    return cell >= 0 && this.s.ownerAt(cell) < 0;
  }

  private bindPointer(): void {
    const b = this.board;
    b.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || this.s.solved) return;
      const cell = this.cellAt(e.clientX, e.clientY, false);
      if (!this.free(cell)) {
        this.setTrace([]);
        return;
      }
      e.preventDefault();
      try {
        b.setPointerCapture(e.pointerId);
      } catch {
        // Synthetic pointers can't be captured; their moves still reach the board.
      }
      const t = this.trace;
      const end = t[t.length - 1];
      const onEnd = cell === end && t.length >= 2;
      if (cell === end) {
        // Keep going from the end of the trace.
      } else if (t.length && adjacent(end, cell, this.s.puzzle.cols) && !t.includes(cell)) {
        this.setTrace([...t, cell]);
      } else if (t.includes(cell)) {
        this.setTrace(t.slice(0, t.indexOf(cell) + 1));
      } else {
        this.setTrace([cell]);
      }
      this.gesture = { moved: false, onEnd };
    });

    b.addEventListener('pointermove', (e) => {
      if (!this.gesture) return;
      const cell = this.cellAt(e.clientX, e.clientY, true);
      const t = this.trace;
      const end = t[t.length - 1];
      if (!this.free(cell) || cell === end) return;
      if (t.length >= 2 && cell === t[t.length - 2]) {
        this.setTrace(t.slice(0, -1));
        this.gesture.moved = true;
      } else if (adjacent(end, cell, this.s.puzzle.cols) && !t.includes(cell)) {
        this.setTrace([...t, cell]);
        this.gesture.moved = true;
      }
    });

    const finish = (cancelled: boolean) => {
      const g = this.gesture;
      this.gesture = null;
      if (!g || cancelled) return;
      // A trace that is a word is taken at once; otherwise a drag (or a tap on the end) submits it.
      if (matchTrace(this.s.puzzle, this.trace).length || (g.moved && this.trace.length > 1) || g.onEnd) this.submit();
    };
    b.addEventListener('pointerup', () => finish(false));
    b.addEventListener('pointercancel', () => finish(true));
  }

  private setTrace(next: number[]): void {
    if (next.length > this.trace.length) this.opts.sfx.tick(next.length);
    this.trace = next;
    this.render();
  }

  private submit(): void {
    const trace = this.trace;
    this.trace = [];
    if (trace.length < 3) {
      this.render();
      return;
    }
    const letters = trace.map((c) => this.s.puzzle.letters[c]).join('');
    const result = this.s.submit(trace);
    if (result.kind === 'miss') {
      this.opts.sfx.nope();
      trace.forEach((c) => replay(this.tiles[c], 'miss'));
      this.showTrace(letters, 'is-miss');
      this.render();
      return;
    }
    const { words } = result;
    const word = words[0];
    this.render();
    words
      .flatMap((w) => w.path)
      .forEach((c, i) => {
        this.tiles[c].style.setProperty('--delay', `${i * 45}ms`);
        replay(this.tiles[c], 'pop');
      });
    // A whole pair in one trace shows both words, half in each tone.
    if (words.length > 1) this.showTrace(words.map((w) => w.text).join(' '), 'is-found', word.pair, 'pair');
    else this.showTrace(word.text, 'is-found', word.pair, word.role);
    words.forEach((w) => replay(this.chips[w.index], 'pop'));
    if (result.stickerDone) this.unlockSticker(word);
    else this.opts.sfx.found();
    if (result.solved) window.setTimeout(() => this.celebrate(), 650);
  }

  private unlockSticker(word: Word): void {
    const pair = this.s.puzzle.def.pairs[word.pair];
    this.opts.sfx.sticker();
    this.renderAlbum();
    const slot = this.album.children[word.pair] as HTMLElement;
    slot.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    replay(slot, 'peel');
    const r = slot.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, [ANIMALS[pair.animal.text].emoji, TRAITS[pair.adjective.text].emoji, '✨'], 12);
    toast(`Figurinha nova: ${stickerName(pair.adjective.text, pair.animal.text)}!`);
  }

  private restart(): void {
    if (!this.s.foundCount) return;
    this.s.reset();
    this.trace = [];
    this.traceEl.replaceChildren();
    this.renderAlbum();
    this.render();
    toast('Tabuleiro limpo. Suas figurinhas continuam no álbum.');
  }

  private celebrate(): void {
    const p = this.s.puzzle;
    this.opts.sfx.win();
    this.tiles.forEach((el, cell) => {
      el.style.setProperty('--delay', `${(rowOf(cell, p.cols) + colOf(cell, p.cols)) * 55}ms`);
      replay(el, 'celebrate');
    });
    const r = this.board.getBoundingClientRect();
    const glyphs = p.def.pairs.flatMap((pair) => [ANIMALS[pair.animal.text].emoji, TRAITS[pair.adjective.text].emoji]);
    burst(r.left + r.width / 2, r.top + r.height / 2, [...glyphs, '✨', '⭐']);
    window.setTimeout(() => this.opts.onSolved(), 1300);
  }

  // ── rendering ───────────────────────────────────────────────────────────

  /** The word being traced (or the last result) above the board. */
  private showTrace(text: string, state = '', pair = -1, role = ''): void {
    const pill = h('span', { class: `trace-pill ${state}`, 'data-role': role, style: pair >= 0 ? pairStyle(pair) : undefined }, text);
    this.traceEl.replaceChildren(pill);
    if (state) replay(pill, 'is-new');
  }

  private render(): void {
    const p = this.s.puzzle;
    const traced = new Set(this.trace);
    const end = this.trace[this.trace.length - 1];
    this.tiles.forEach((tile, cell) => {
      const owner = this.s.ownerAt(cell);
      const word = owner >= 0 ? p.words[owner] : null;
      tile.classList.toggle('is-found', !!word);
      tile.classList.toggle('is-trace', traced.has(cell));
      tile.classList.toggle('is-end', cell === end && this.trace.length > 0);
      if (word) {
        tile.dataset.role = word.role;
        setPairTones(tile, word.pair);
      } else {
        delete tile.dataset.role;
      }
    });
    if (this.trace.length) this.showTrace(this.trace.map((c) => p.letters[c]).join(''));
    this.board.classList.toggle('is-tracing', this.trace.length > 0);
    p.words.forEach((w) => {
      const chip = this.chips[w.index];
      const found = this.s.isFound(w.index);
      chip.classList.toggle('is-found', found);
      if (found) {
        chip.dataset.role = w.role;
        setPairTones(chip, w.pair);
      }
    });
    this.counter.textContent = `${this.s.foundCount}/${p.words.length} palavras`;
    this.nextBtn.hidden = !this.s.solved;
    this.traceEl.classList.toggle('is-solved', this.s.solved);
    this.wordsCount.textContent = `${this.s.foundCount}/${p.words.length}`;
    this.albumCount.textContent = `${this.s.stickersDone}/${p.def.pairs.length}`;
    this.drawLinks();
  }

  private renderAlbum(): void {
    this.album.replaceChildren(...this.s.puzzle.def.pairs.map((pair, i) => sticker(pair, i, this.s.stickerDone(i))));
  }

  /** Lines through each found word (a dot marks its first letter), plus the live trace. */
  private drawLinks(): void {
    const p = this.s.puzzle;
    const step = this.cellPx + this.gapPx;
    const point = (cell: number) => `${colOf(cell, p.cols) * step + this.cellPx / 2},${rowOf(cell, p.cols) * step + this.cellPx / 2}`;
    const line = (cells: number[], cls: string, style = '') => {
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', cls);
      if (style) g.setAttribute('style', style);
      const poly = document.createElementNS(SVG_NS, 'polyline');
      poly.setAttribute('points', cells.map(point).join(' '));
      const [x, y] = point(cells[0]).split(',');
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', y);
      dot.setAttribute('r', String(this.cellPx * 0.11));
      g.append(poly, dot);
      return g;
    };
    // A finished pair is drawn as one chain, trait into animal.
    const groups = p.def.pairs.flatMap((pair, i) => {
      if (this.s.stickerDone(i)) return [line([...pair.adjective.path, ...pair.animal.path], 'link', pairStyle(i))];
      return p.words.filter((w) => w.pair === i && this.s.isFound(w.index)).map((w) => line(w.path, 'link', pairStyle(i)));
    });
    for (const w of p.words) if (w.role === 'extra' && this.s.isFound(w.index)) groups.push(line(w.path, 'link', pairStyle(-1)));
    if (this.trace.length) groups.push(line(this.trace, 'link link--trace'));
    this.links.replaceChildren(...groups);
  }

  /** Sizes cells to the space available. */
  private fit(): void {
    const p = this.s.puzzle;
    const wrap = this.boardWrap.getBoundingClientRect();
    const width = wrap.width;
    const height = wrap.height - this.traceEl.offsetHeight - 6;
    const gap = width < 480 ? 5 : 7;
    const byWidth = (width - gap * (p.cols - 1)) / p.cols;
    const byHeight = (height - gap * (p.rows - 1)) / p.rows;
    const size = Math.max(34, Math.min(92, Math.floor(Math.min(byWidth, byHeight))));
    this.cellPx = size;
    this.gapPx = gap;
    this.el.style.setProperty('--cell', `${size}px`);
    this.el.style.setProperty('--gap', `${gap}px`);
    const w = p.cols * size + (p.cols - 1) * gap;
    const hgt = p.rows * size + (p.rows - 1) * gap;
    this.links.setAttribute('viewBox', `0 0 ${w} ${hgt}`);
    this.links.setAttribute('width', String(w));
    this.links.setAttribute('height', String(hgt));
    this.links.style.setProperty('--stroke-w', `${size * 0.15}px`);
    this.drawLinks();
  }
}
