import { ANIMALS, stickerName } from '../core/words.ts';
import { emptyProgress, loadSave, writeSave, type LevelProgress, type ThemeChoice } from '../game/save.ts';
import { Session } from '../game/session.ts';
import { CATALOG } from '../levels/catalog.ts';
import { h, svg } from './dom.ts';
import { ICONS } from './icons.ts';
import { LevelView } from './level-view.ts';
import { openModal, toast } from './overlay.ts';
import { Sfx } from './sfx.ts';
import { PALETTES, sticker, stickerArt } from './sticker.ts';

const GAME_NAME = 'Lazy Fox';
const THEME_LABEL: Record<ThemeChoice, string> = { system: 'do sistema', light: 'claro', dark: 'escuro' };
/** Share squares in the same order as the pair palettes. */
const SHARE_SQUARES = ['🟧', '🟩', '🟦', '🟥', '🟨', '🟪'];

const iconButton = (label: string, glyph: string, onClick: () => void) =>
  h('button', { type: 'button', class: 'icon-btn', 'aria-label': label, title: label, onclick: onClick }, svg(glyph));

export class App {
  private readonly save = loadSave();
  private readonly sfx = new Sfx(this.save.settings.sound);
  private readonly main: HTMLElement;
  private readonly soundBtn: HTMLButtonElement;
  private view: LevelView | null = null;
  private index = 0;

  constructor(root: HTMLElement) {
    this.applyTheme();
    this.soundBtn = iconButton('Som', ICONS.soundOn, () => this.toggleSound());
    this.updateSoundIcon();

    const header = h(
      'header',
      { class: 'topbar' },
      h(
        'div',
        { class: 'topbar-side' },
        iconButton('Níveis', ICONS.book, () => this.openLevels()),
        iconButton('Álbum', ICONS.sticker, () => this.openAlbum()),
      ),
      h('div', { class: 'brand' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, '✦'), GAME_NAME),
      h(
        'div',
        { class: 'topbar-side end' },
        iconButton('Como jogar', ICONS.help, () => this.openHelp()),
        this.soundBtn,
        iconButton('Tema', ICONS.theme, () => this.cycleTheme()),
      ),
    );
    this.main = h('div', { class: 'main' });
    root.append(header, this.main);

    if (!CATALOG.length) {
      this.main.append(h('p', { class: 'empty' }, 'Nenhum nível válido encontrado em src/levels.'));
      return;
    }
    const last = CATALOG.findIndex((l) => l.def.id === this.save.settings.lastLevel);
    const firstOpen = CATALOG.findIndex((l) => !this.save.levels[l.def.id]?.done);
    this.openLevel(last >= 0 ? last : Math.max(0, firstOpen));

    if (!this.save.settings.seenHelp) {
      this.save.settings.seenHelp = true;
      this.persist();
      this.openHelp();
    }
  }

  private persist(): void {
    writeSave(this.save);
  }

  private openLevel(index: number): void {
    this.view?.destroy();
    this.index = index;
    const entry = CATALOG[index];
    const progress: LevelProgress = (this.save.levels[entry.def.id] ??= emptyProgress());
    const session = new Session(entry.puzzle, progress, () => this.persist());
    this.view = new LevelView({
      session,
      number: index + 1,
      total: CATALOG.length,
      sfx: this.sfx,
      onSolved: () => this.showWin(session),
      onPrev: index > 0 ? () => this.openLevel(index - 1) : undefined,
      onNext: index < CATALOG.length - 1 ? () => this.openLevel(index + 1) : undefined,
      onAlbum: () => this.openAlbum(),
    });
    this.main.replaceChildren(this.view.el);
    this.save.settings.lastLevel = entry.def.id;
    this.persist();
  }

  /** Stickers a level has given so far: all of them once it was completed. */
  private unlocked(levelId: string, pair: number): boolean {
    const progress = this.save.levels[levelId];
    if (!progress) return false;
    if (progress.done) return true;
    const pairDef = CATALOG.find((l) => l.def.id === levelId)!.def.pairs[pair];
    return progress.found.includes(pairDef.adjective.text) && progress.found.includes(pairDef.animal.text);
  }

  // ── modals ──────────────────────────────────────────────────────────────

  private openLevels(): void {
    const modal = openModal({
      title: 'Níveis',
      className: 'modal--chapters',
      body: h(
        'ol',
        { class: 'chapters' },
        ...CATALOG.map((entry, i) => {
          const progress = this.save.levels[entry.def.id];
          const classes = ['chapter-card', i === this.index && 'is-current', progress?.done && 'is-done'];
          return h(
            'li',
            {},
            h(
              'button',
              {
                type: 'button',
                class: classes.filter(Boolean).join(' '),
                onclick: () => {
                  modal.close();
                  this.openLevel(i);
                },
              },
              h('span', { class: 'chapter-num' }, progress?.done ? '✓' : String(i + 1)),
              h(
                'span',
                { class: 'chapter-icons', 'aria-hidden': 'true' },
                ...entry.def.pairs.map((p, k) => h('span', { class: this.unlocked(entry.def.id, k) ? '' : 'is-shadow' }, ANIMALS[p.animal.text].emoji)),
              ),
              h('span', { class: 'chapter-title' }, entry.def.title),
              h('span', { class: 'chapter-meta' }, `${entry.puzzle.rows}×${entry.puzzle.cols} · ${entry.def.pairs.length} figurinhas`),
            ),
          );
        }),
      ),
    });
  }

  private openAlbum(): void {
    let owned = 0;
    let total = 0;
    const pages = CATALOG.map((entry, i) =>
      h(
        'section',
        { class: 'album-page' },
        h('h3', {}, `${i + 1}. ${entry.def.title}`),
        h(
          'div',
          { class: 'album' },
          ...entry.def.pairs.map((pair, k) => {
            const has = this.unlocked(entry.def.id, k);
            total++;
            if (has) owned++;
            return sticker(pair, k, has);
          }),
        ),
      ),
    );
    openModal({
      title: `Álbum · ${owned}/${total}`,
      className: 'modal--album',
      body: h('div', { class: 'album-book' }, ...pages),
    });
  }

  private openHelp(): void {
    const word = (text: string, tone: string) => h('span', { class: `ex-block ex-block--${tone}` }, text);
    // The art only reads the words, so the example needs no level.
    const fox = { adjective: { text: 'LAZY', path: [] }, animal: { text: 'FOX', path: [] } };
    openModal({
      title: 'Como jogar',
      className: 'modal--help',
      body: h(
        'div',
        { class: 'help' },
        h('p', {}, 'Toda letra faz parte de ', h('b', {}, 'exatamente uma palavra'), '. Arraste o dedo pelas letras vizinhas para formar cada uma.'),
        h(
          'div',
          { class: 'example', 'aria-label': 'Lazy mais Fox libera a figurinha Lazy Fox' },
          word('LAZY', 'trait'),
          h('span', { class: 'ex-op' }, '+'),
          word('FOX', 'animal'),
          h('span', { class: 'ex-op' }, '='),
          h('span', { class: 'ex-sticker' }, stickerArt(fox)),
        ),
        h(
          'ul',
          {},
          h('li', {}, 'Nada de diagonal, mas as palavras podem ', h('b', {}, 'dobrar'), ': em L, em Z, até em quadrado, como peças de Tetris.'),
          h('li', {}, 'Cada bicho tem uma ', h('b', {}, 'característica'), ' que termina colada no começo dele: o Y de LAZY encosta no F de FOX. Ache os dois para liberar a figurinha.'),
          h('li', {}, 'Achou o par? Dá para arrastar os dois num traço só: ', h('b', {}, 'LAZYFOX'), '.'),
          h('li', {}, 'A lista mostra todas as palavras, mas não diz quem combina com quem.'),
          h('li', {}, 'Dá para ler a palavra nos dois sentidos, e também tocar letra por letra.'),
          h('li', {}, 'Libere todas as figurinhas para completar o nível.'),
        ),
      ),
      actions: [h('button', { type: 'button', class: 'btn btn--primary', onclick: (e: Event) => (e.target as HTMLElement).closest('dialog')?.close() }, 'Vamos lá')],
    });
  }

  private showWin(session: Session): void {
    const { def, words, rows, cols } = session.puzzle;
    const misses = session.progress.misses;
    const number = this.index + 1;
    const hasNext = number < CATALOG.length;
    const stat = (value: number, label: string) => h('div', { class: 'stat' }, h('strong', {}, String(value)), h('span', {}, label));

    const share = () => {
      const owner = new Array<number>(rows * cols);
      words.forEach((w) => w.path.forEach((c) => (owner[c] = w.pair)));
      const board = Array.from({ length: rows }, (_, r) =>
        owner.slice(r * cols, (r + 1) * cols).map((p) => (p < 0 ? '⬜' : SHARE_SQUARES[p % PALETTES])).join(''),
      ).join('\n');
      const verdict = misses === 0 ? '✨ sem erros' : `${misses} ${misses === 1 ? 'erro' : 'erros'}`;
      const text = `${GAME_NAME} · Nível ${number}\n${verdict}\n${board}`;
      navigator.clipboard?.writeText(text).then(
        () => toast('Resultado copiado!'),
        () => toast('Não foi possível copiar'),
      );
    };

    const modal = openModal({
      title: 'Nível completo!',
      className: 'modal--win',
      body: h(
        'div',
        { class: 'win' },
        h('div', { class: 'album win-stickers' }, ...def.pairs.map((pair, k) => sticker(pair, k, true))),
        h('p', {}, `Você completou a página “${def.title}”: ${def.pairs.map((p) => stickerName(p.adjective.text, p.animal.text)).join(', ')}.`),
        h('div', { class: 'stats' }, stat(words.length, 'palavras'), stat(misses, misses === 1 ? 'erro' : 'erros')),
      ),
      actions: [
        h('button', { type: 'button', class: 'btn', onclick: share }, svg(ICONS.share), h('span', {}, 'Compartilhar')),
        hasNext
          ? h('button', { type: 'button', class: 'btn btn--primary', onclick: () => { modal.close(); this.openLevel(this.index + 1); } }, h('span', {}, 'Próximo'), svg(ICONS.arrow))
          : h('button', { type: 'button', class: 'btn btn--primary', onclick: () => { modal.close(); this.openAlbum(); } }, h('span', {}, 'Ver álbum')),
      ],
    });
  }

  // ── settings ────────────────────────────────────────────────────────────

  private applyTheme(): void {
    const theme = this.save.settings.theme;
    if (theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }

  private cycleTheme(): void {
    const order: ThemeChoice[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(this.save.settings.theme) + 1) % order.length];
    this.save.settings.theme = next;
    this.applyTheme();
    this.persist();
    toast(`Tema ${THEME_LABEL[next]}`);
  }

  private toggleSound(): void {
    this.save.settings.sound = !this.save.settings.sound;
    this.sfx.enabled = this.save.settings.sound;
    this.updateSoundIcon();
    this.persist();
    if (this.sfx.enabled) this.sfx.pick();
  }

  private updateSoundIcon(): void {
    this.soundBtn.replaceChildren(svg(this.save.settings.sound ? ICONS.soundOn : ICONS.soundOff));
    this.soundBtn.setAttribute('aria-pressed', String(this.save.settings.sound));
  }
}
