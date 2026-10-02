import type { LevelSpec } from '../src/core/generate.ts';

/**
 * What each level contains. `npm run levels:generate` lays them out; the order here is the play order.
 * After the intro, levels come in twos of the same size and pair count, so difficulty climbs in steps.
 */
export const SPECS: LevelSpec[] = [
  // The classic pangram, with the roles swapped: the dog is quick and the fox is lazy.
  {
    id: 'a-frase-famosa',
    title: 'A frase famosa',
    subtitle: 'Leia a frase de ponta a ponta: o bicho e a mania trocaram de lugar.',
    rows: 6,
    cols: 5,
    sentence: ['THE', 'QUICK', 'DOG', 'JUMPS', 'OVER', 'THE', 'LAZY', 'FOX'],
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
];
