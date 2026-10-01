# Petris

Um caça-palavras que vira Tetris. Toda letra do grid pertence a **exatamente uma palavra**; as palavras nunca cruzam nem vão na diagonal, mas podem dobrar (L, Z, O…). No fim, o grid parece um tabuleiro de Tetris colorido.

A lista mostra todas as palavras do nível (em ordem alfabética, sem revelar os pares). Cada palavra é um bicho (`FOX`) ou uma característica (`LAZY`). A característica termina colada no começo do bicho (o Y de LAZY encosta no F de FOX) e os dois compartilham a cor (bicho no tom forte, característica no tom claro). Achar os dois libera a figurinha **Lazy Fox**; liberar todas completa o nível. As figurinhas ficam guardadas no álbum.

Fork visual do Inklink (`../entrelinhas-like`).

## Rodando

```bash
npm install
npm run dev
```

## Níveis

Os níveis são descritos em `scripts/level-specs.ts` (título, tamanho do grid e pares) e montados pelo gerador:

```bash
npm run levels:generate            # todos
npm run levels:generate -- 3 --seed 7   # refaz só o nível 3 com outro layout
```

O gerador sorteia layouts, encadeia cada característica direto no seu bicho e só aceita grids onde cada palavra pode ser traçada em **um único lugar**. `npm test` valida todos os níveis. Novos bichos/características vão em `src/core/words.ts` (emoji, posição do acessório e pose da figurinha).

## Scripts

- `npm test` — testes do núcleo e validação dos níveis
- `npm run build` — build estático em `dist/`
- `npm run deploy` — publica no GitHub Pages (branch `gh-pages`)
