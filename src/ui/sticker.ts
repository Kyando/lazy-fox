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

export interface StickerState {
  trait: boolean;
  animal: boolean;
}

/** The sticker art alone: the animal, posed by its trait, wearing the trait's accessory. */
export function stickerArt(pair: PairDef, state: StickerState = { trait: true, animal: true }): HTMLElement {
  const trait = TRAITS[pair.adjective.text];
  const animal = ANIMALS[pair.animal.text];
  const art = h(
    'span',
    { class: `sticker-art${state.trait && trait.fx ? ` fx-${trait.fx}` : ''}`, 'aria-hidden': 'true' },
    h('span', { class: `sticker-animal${state.animal ? '' : ' is-shadow'}` }, animal.emoji),
    state.trait ? h('span', { class: 'sticker-acc', 'data-spot': trait.spot }, trait.emoji) : null,
  );
  return art;
}

const blanks = (word: string, shown: boolean) =>
  h('span', { class: `sticker-word${shown ? '' : ' is-blank'}` }, shown ? word : '•'.repeat(word.length));

/** A sticker slot in the album: fills in as its two words are found. */
export function sticker(pair: PairDef, index: number, state: StickerState): HTMLElement {
  const done = state.trait && state.animal;
  return h(
    'div',
    {
      class: `sticker${done ? ' is-done' : ''}`,
      style: pairStyle(index),
      'aria-label': done ? stickerName(pair.adjective.text, pair.animal.text) : 'Figurinha bloqueada',
    },
    stickerArt(pair, state),
    h('span', { class: 'sticker-name' }, blanks(pair.adjective.text, state.trait), ' ', blanks(pair.animal.text, state.animal)),
  );
}
