import type { LevelSpec } from '../src/core/generate.ts';

/** What each level contains. `npm run levels:generate` lays them out; the order here is the play order. */
export const SPECS: LevelSpec[] = [
  {
    id: 'primeiros-amigos',
    title: 'Primeiros amigos',
    subtitle: 'A mania vem colada no bicho: lazY → Fox.',
    rows: 4,
    cols: 4,
    pairs: [
      ['LAZY', 'FOX'],
      ['CLEVER', 'CAT'],
    ],
  },
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
];
