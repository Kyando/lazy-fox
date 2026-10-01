import type { PairDef } from '../core/types.ts';
import { ANIMALS, stickerName, TRAITS } from '../core/words.ts';
import { h } from './dom.ts';

export const PALETTES = 6;

/** CSS variables for a pair's colours: the animal gets the strong tone, its trait the light one. */
export const pairStyle = (pair: number): string => {
  const p = pair % PALETTES;
  return `--tone-animal: var(--p${p}-a); --tone-trait: var(--p${p}-b); --tone-line: var(--p${p}-line)`;
};

export function setPairTones(el: HTMLElement, pair: number): void {
  const p = pair % PALETTES;
  el.style.setProperty('--tone-animal', `var(--p${p}-a)`);
  el.style.setProperty('--tone-trait', `var(--p${p}-b)`);
  el.style.setProperty('--tone-line', `var(--p${p}-line)`);
}

/** The sticker art alone: the animal, posed by its trait, wearing the trait's accessory. */
export function stickerArt(pair: PairDef): HTMLElement {
  const trait = TRAITS[pair.adjective.text];
  return h(
    'span',
    { class: `sticker-art${trait.fx ? ` fx-${trait.fx}` : ''}`, 'aria-hidden': 'true' },
    h('span', { class: 'sticker-animal' }, ANIMALS[pair.animal.text].emoji),
    h('span', { class: 'sticker-acc', 'data-spot': trait.spot }, trait.emoji),
  );
}

/**
 * A sticker slot in the album. It stays a plain question mark until both words are found,
 * so it never gives away which trait goes with which animal.
 */
export function sticker(pair: PairDef, index: number, done: boolean): HTMLElement {
  if (!done) {
    return h(
      'div',
      { class: 'sticker is-locked', 'aria-label': 'Figurinha bloqueada' },
      h('span', { class: 'sticker-art', 'aria-hidden': 'true' }, h('span', { class: 'sticker-mystery' }, '?')),
      h('span', { class: 'sticker-name' }, '???'),
    );
  }
  const name = stickerName(pair.adjective.text, pair.animal.text);
  return h(
    'div',
    { class: 'sticker is-done', style: pairStyle(index), 'aria-label': name },
    stickerArt(pair),
    h('span', { class: 'sticker-name' }, name),
  );
}
