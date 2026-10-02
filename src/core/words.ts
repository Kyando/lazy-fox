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
  CHICK: { emoji: '🐤' },
  COW: { emoji: '🐮' },
  CRAB: { emoji: '🦀' },
  DEER: { emoji: '🦌' },
  DOG: { emoji: '🐶' },
  DUCK: { emoji: '🦆' },
  FLAMINGO: { emoji: '🦩' },
  FOX: { emoji: '🦊' },
  FROG: { emoji: '🐸' },
  GOAT: { emoji: '🐐' },
  HEDGEHOG: { emoji: '🦔' },
  HEN: { emoji: '🐔' },
  HIPPO: { emoji: '🦛' },
  HORSE: { emoji: '🐴' },
  KOALA: { emoji: '🐨' },
  LION: { emoji: '🦁' },
  LLAMA: { emoji: '🦙' },
  MONKEY: { emoji: '🐵' },
  MOUSE: { emoji: '🐭' },
  OTTER: { emoji: '🦦' },
  OWL: { emoji: '🦉' },
  PANDA: { emoji: '🐼' },
  PENGUIN: { emoji: '🐧' },
  PIG: { emoji: '🐷' },
  RACCOON: { emoji: '🦝' },
  RAT: { emoji: '🐀' },
  SEAL: { emoji: '🦭' },
  SHARK: { emoji: '🦈' },
  SLOTH: { emoji: '🦥' },
  SNAIL: { emoji: '🐌' },
  SNAKE: { emoji: '🐍' },
  SWAN: { emoji: '🦢' },
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
  CURIOUS: { emoji: '❓', spot: 'corner', fx: 'curious' },
  DIZZY: { emoji: '💫', spot: 'head', fx: 'dizzy' },
  FANCY: { emoji: '🎩', spot: 'head' },
  GENTLE: { emoji: '🌷', spot: 'side' },
  GRUMPY: { emoji: '🌧️', spot: 'head' },
  HUNGRY: { emoji: '🍩', spot: 'side' },
  JOLLY: { emoji: '🎉', spot: 'corner' },
  LAZY: { emoji: '💤', spot: 'corner', fx: 'lazy' },
  LUCKY: { emoji: '🍀', spot: 'corner' },
  MAGICAL: { emoji: '✨', spot: 'corner', fx: 'magical' },
  MESSY: { emoji: '🎨', spot: 'side', fx: 'silly' },
  PROUD: { emoji: '🏅', spot: 'side' },
  QUICK: { emoji: '⏱️', spot: 'side', fx: 'speedy' },
  ROYAL: { emoji: '👑', spot: 'head' },
  SHY: { emoji: '🌸', spot: 'corner', fx: 'shy' },
  SILLY: { emoji: '🎈', spot: 'side', fx: 'silly' },
  SLEEPY: { emoji: '🌙', spot: 'corner', fx: 'sleepy' },
  SLY: { emoji: '🎭', spot: 'corner', fx: 'shy' },
  SNEAKY: { emoji: '🥷', spot: 'corner', fx: 'sneaky' },
  SPEEDY: { emoji: '💨', spot: 'side', fx: 'speedy' },
  SPOOKY: { emoji: '👻', spot: 'corner', fx: 'spooky' },
  SWEET: { emoji: '🍭', spot: 'side' },
  TINY: { emoji: '🔍', spot: 'corner', fx: 'tiny' },
  WISE: { emoji: '🎓', spot: 'head' },
};

const title = (word: string) => word.charAt(0) + word.slice(1).toLowerCase();

export const stickerName = (adjective: string, animal: string): string => `${title(adjective)} ${title(animal)}`;
