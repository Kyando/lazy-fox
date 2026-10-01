/** The word bank: every animal and trait a level may use, with what its sticker looks like. */

export interface AnimalInfo {
  emoji: string;
}

/** Where the trait's accessory sits on the sticker. */
export type Spot = 'head' | 'corner' | 'face' | 'side';

export interface TraitInfo {
  emoji: string;
  spot: Spot;
  /** Optional pose for the animal (CSS class `fx-<name>`). */
  fx?: string;
}

export const ANIMALS: Record<string, AnimalInfo> = {
  ANT: { emoji: '🐜' },
  BAT: { emoji: '🦇' },
  BEAR: { emoji: '🐻' },
  BEE: { emoji: '🐝' },
  BUNNY: { emoji: '🐰' },
  CAT: { emoji: '🐱' },
  COW: { emoji: '🐮' },
  CRAB: { emoji: '🦀' },
  DOG: { emoji: '🐶' },
  DUCK: { emoji: '🦆' },
  FOX: { emoji: '🦊' },
  FROG: { emoji: '🐸' },
  HIPPO: { emoji: '🦛' },
  KOALA: { emoji: '🐨' },
  LION: { emoji: '🦁' },
  MOUSE: { emoji: '🐭' },
  OTTER: { emoji: '🦦' },
  OWL: { emoji: '🦉' },
  PANDA: { emoji: '🐼' },
  PENGUIN: { emoji: '🐧' },
  PIG: { emoji: '🐷' },
  SLOTH: { emoji: '🦥' },
  SNAIL: { emoji: '🐌' },
  SNAKE: { emoji: '🐍' },
  TIGER: { emoji: '🐯' },
  TURTLE: { emoji: '🐢' },
  UNICORN: { emoji: '🦄' },
  WHALE: { emoji: '🐳' },
  WOLF: { emoji: '🐺' },
};

export const TRAITS: Record<string, TraitInfo> = {
  ANGRY: { emoji: '💢', spot: 'corner', fx: 'angry' },
  BRAVE: { emoji: '🛡️', spot: 'side' },
  BUSY: { emoji: '📋', spot: 'side' },
  CHILLY: { emoji: '❄️', spot: 'corner', fx: 'chilly' },
  CLEVER: { emoji: '💡', spot: 'head' },
  COOL: { emoji: '🕶️', spot: 'face' },
  FANCY: { emoji: '🎩', spot: 'head' },
  GRUMPY: { emoji: '🌧️', spot: 'head' },
  HUNGRY: { emoji: '🍩', spot: 'side' },
  LAZY: { emoji: '💤', spot: 'corner', fx: 'lazy' },
  MAGICAL: { emoji: '✨', spot: 'corner', fx: 'magical' },
  ROYAL: { emoji: '👑', spot: 'head' },
  SHY: { emoji: '🌸', spot: 'corner', fx: 'shy' },
  SILLY: { emoji: '🎈', spot: 'side', fx: 'silly' },
  SLEEPY: { emoji: '🌙', spot: 'corner', fx: 'sleepy' },
  SNEAKY: { emoji: '🥷', spot: 'corner', fx: 'sneaky' },
  SPEEDY: { emoji: '💨', spot: 'side', fx: 'speedy' },
  SPOOKY: { emoji: '👻', spot: 'corner', fx: 'spooky' },
  SWEET: { emoji: '🍭', spot: 'side' },
  TINY: { emoji: '🔍', spot: 'corner', fx: 'tiny' },
  WISE: { emoji: '🎓', spot: 'head' },
};

const title = (word: string) => word.charAt(0) + word.slice(1).toLowerCase();

export const stickerName = (adjective: string, animal: string): string => `${title(adjective)} ${title(animal)}`;
