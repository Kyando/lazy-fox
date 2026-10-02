import type { LevelSpec } from '../src/core/generate.ts';

/**
 * What each level contains. `npm run levels:generate` lays them out; the order here is the play order.
 * After the intro, levels come in twos of the same size and pair count, so difficulty climbs in steps.
 */
export const SPECS: LevelSpec[] = [
  // The game's namesake and its classic partner: 15 letters fill a 5×3 exactly (tall, to suit a phone).
  {
    id: 'lazy-fox',
    title: 'Lazy Fox',
    rows: 5,
    cols: 3,
    pairs: [
      ['LAZY', 'FOX'],
      ['QUICK', 'DOG'],
    ],
  },

  // 4×4, 2 pairs
  {
    id: 'primeiros-amigos',
    title: 'Primeiros amigos',
    subtitle: 'A mania vem colada no bicho: busY → Bee.',
    rows: 4,
    cols: 4,
    pairs: [
      ['BUSY', 'BEE'],
      ['CLEVER', 'CAT'],
    ],
  },
  {
    id: 'no-curral',
    title: 'No curral',
    rows: 4,
    cols: 4,
    pairs: [
      ['WISE', 'COW'],
      ['FANCY', 'WOLF'],
    ],
  },

  // 5×5, 3 pairs
  {
    id: 'noite-no-bosque',
    title: 'Noite no bosque',
    rows: 5,
    cols: 5,
    pairs: [
      ['SLEEPY', 'OWL'],
      ['BRAVE', 'MOUSE'],
      ['SHY', 'PIG'],
    ],
  },
  {
    id: 'dia-de-sorte',
    title: 'Dia de sorte',
    rows: 5,
    cols: 5,
    pairs: [
      ['LUCKY', 'GOAT'],
      ['DIZZY', 'DEER'],
      ['TINY', 'RAT'],
    ],
  },

  // 6×5, 3 pairs
  {
    id: 'beira-do-lago',
    title: 'Beira do lago',
    rows: 6,
    cols: 5,
    pairs: [
      ['GRUMPY', 'BEAR'],
      ['FANCY', 'FROG'],
      ['SPEEDY', 'SNAIL'],
    ],
  },
  {
    id: 'quintal-curioso',
    title: 'Quintal curioso',
    rows: 6,
    cols: 5,
    pairs: [
      ['CURIOUS', 'MONKEY'],
      ['JOLLY', 'HEN'],
      ['PROUD', 'SWAN'],
    ],
  },

  // 6×6, 4 pairs
  {
    id: 'rei-da-selva',
    title: 'Rei da selva',
    rows: 6,
    cols: 6,
    pairs: [
      ['ROYAL', 'LION'],
      ['SNEAKY', 'SNAKE'],
      ['TINY', 'WHALE'],
      ['COOL', 'DOG'],
    ],
  },
  {
    id: 'acampamento',
    title: 'Acampamento',
    rows: 6,
    cols: 6,
    pairs: [
      ['GENTLE', 'PANDA'],
      ['MESSY', 'RACCOON'],
      ['SLY', 'WOLF'],
      ['SHY', 'HEN'],
    ],
  },

  // 7×6, 4 pairs
  {
    id: 'zoologico-de-inverno',
    title: 'Zoológico de inverno',
    rows: 7,
    cols: 6,
    pairs: [
      ['SPOOKY', 'BAT'],
      ['CHILLY', 'PENGUIN'],
      ['HUNGRY', 'HIPPO'],
      ['WISE', 'OTTER'],
    ],
  },
  {
    id: 'dia-de-praia',
    title: 'Dia de praia',
    rows: 7,
    cols: 6,
    pairs: [
      ['PROUD', 'FLAMINGO'],
      ['GRUMPY', 'SHARK'],
      ['SLEEPY', 'SEAL'],
      ['LAZY', 'CRAB'],
    ],
  },

  // 7×7, 5 pairs
  {
    id: 'festa-no-parque',
    title: 'Festa no parque',
    rows: 7,
    cols: 7,
    pairs: [
      ['SILLY', 'DUCK'],
      ['MAGICAL', 'UNICORN'],
      ['ANGRY', 'CRAB'],
      ['SWEET', 'BUNNY'],
      ['BUSY', 'ANT'],
    ],
  },
  {
    id: 'feira-no-campo',
    title: 'Feira no campo',
    rows: 7,
    cols: 7,
    pairs: [
      ['CURIOUS', 'HEDGEHOG'],
      ['JOLLY', 'LLAMA'],
      ['BRAVE', 'HORSE'],
      ['SHY', 'CHICK'],
      ['SLY', 'CAT'],
    ],
  },

  // Hard levels: words built from the same letters, so false starts are everywhere, above all
  // right after each trait (a neighbour that begins the wrong animal). 7×7, 5 pairs
  {
    id: 'sussurros',
    title: 'Sussurros',
    rows: 7,
    cols: 7,
    tricky: true,
    pairs: [
      ['SNEAKY', 'SNAIL'],
      ['SASSY', 'SNAKE'],
      ['SLEEPY', 'SLOTH'],
      ['SLY', 'SEAL'],
      ['SPEEDY', 'SWAN'],
    ],
  },
  {
    id: 'hora-do-cha',
    title: 'Hora do chá',
    rows: 7,
    cols: 7,
    tricky: true,
    pairs: [
      ['CHEEKY', 'CHICK'],
      ['CLEVER', 'CRICKET'],
      ['CHUBBY', 'CAT'],
      ['CALM', 'CAMEL'],
      ['CUTE', 'COW'],
    ],
  },

  // 8×7, 6 pairs
  {
    id: 'represa',
    title: 'Represa',
    rows: 8,
    cols: 7,
    tricky: true,
    pairs: [
      ['HAPPY', 'BEAR'],
      ['BUSY', 'BEAVER'],
      ['BRAVE', 'BADGER'],
      ['CHUBBY', 'BUNNY'],
      ['BOLD', 'BISON'],
      ['SHY', 'BAT'],
    ],
  },
  {
    id: 'rima-no-pasto',
    title: 'Rima no pasto',
    rows: 8,
    cols: 7,
    tricky: true,
    pairs: [
      ['SILLY', 'GOOSE'],
      ['MIGHTY', 'MOOSE'],
      ['HUNGRY', 'HORSE'],
      ['NOSY', 'MOUSE'],
      ['GREEDY', 'GOAT'],
      ['SHY', 'OX'],
    ],
  },

  // 8×8, 6 pairs
  {
    id: 'recife',
    title: 'Recife',
    rows: 8,
    cols: 8,
    tricky: true,
    pairs: [
      ['SALTY', 'SHRIMP'],
      ['SOGGY', 'SQUID'],
      ['LONELY', 'LOBSTER'],
      ['FIERCE', 'SHARK'],
      ['CALM', 'OYSTER'],
      ['FUNNY', 'FISH'],
    ],
  },
  {
    id: 'savana',
    title: 'Savana',
    rows: 8,
    cols: 8,
    tricky: true,
    pairs: [
      ['GENTLE', 'GORILLA'],
      ['GRUMPY', 'GIRAFFE'],
      ['LONELY', 'LION'],
      ['LOUD', 'LEOPARD'],
      ['ANGRY', 'RHINO'],
      ['TINY', 'ANT'],
    ],
  },

  // 9×8, 7 pairs
  {
    id: 'galinheiro',
    title: 'Galinheiro',
    rows: 9,
    cols: 8,
    tricky: true,
    pairs: [
      ['PROUD', 'ROOSTER'],
      ['PLUMP', 'TURKEY'],
      ['POLITE', 'PEACOCK'],
      ['PICKY', 'PIG'],
      ['MERRY', 'DONKEY'],
      ['NOISY', 'DUCK'],
      ['CUTE', 'DOVE'],
    ],
  },
  {
    id: 'debaixo-da-pedra',
    title: 'Debaixo da pedra',
    rows: 9,
    cols: 8,
    tricky: true,
    pairs: [
      ['SPOOKY', 'SPIDER'],
      ['SLY', 'SCORPION'],
      ['LUCKY', 'LADYBUG'],
      ['BUSY', 'BEETLE'],
      ['CRAZY', 'CRICKET'],
      ['NOSY', 'ANT'],
      ['CALM', 'WORM'],
    ],
  },

  // 9×8, 8 pairs: short words that share A, T, E, L…
  {
    id: 'tudo-com-a',
    title: 'Tudo com A',
    rows: 9,
    cols: 8,
    tricky: true,
    pairs: [
      ['SASSY', 'CAT'],
      ['NOISY', 'BAT'],
      ['CRAZY', 'RAT'],
      ['MIGHTY', 'ANT'],
      ['HASTY', 'GOAT'],
      ['TIDY', 'TURTLE'],
      ['STRONG', 'TIGER'],
      ['TINY', 'OTTER'],
    ],
  },
  {
    id: 'grande-final',
    title: 'Grande final',
    rows: 9,
    cols: 8,
    tricky: true,
    pairs: [
      ['EAGER', 'EAGLE'],
      ['SLEEPY', 'SHEEP'],
      ['CALM', 'LLAMA'],
      ['CLUMSY', 'CAMEL'],
      ['WILD', 'WOLF'],
      ['WISE', 'SEAL'],
      ['SHY', 'SWAN'],
      ['HAPPY', 'HEN'],
    ],
  },
];
