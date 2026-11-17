# Implementation Plan: Coluna "Folha no faturamento" dos cenários (layout A3)

**Branch**: `feat/coluna-folha-no-faturamento` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

## Summary

Quase tudo é tela: a conta e os campos já existem (spec 048). O trabalho é (1) uma pequena mudança no servidor, para o chip do dono ser a diferença entre os pesos **já arredondados a uma casa**, e (2) a coluna nova na tela: cabeçalho por perfil, célula A3 do dono em três estados, chip do gestor e consulta, frases de dados que faltam, a grade nova da tabela e o texto de abertura do card. Sem banco.

## For the reader

Chosen: o servidor passa a calcular `aumentoPp` como `round1(depois) − round1(hoje)`, e a tela o escreve em "%".

Why: assim a conta do chip bate com os dois pesos que aparecem na tela (9,7 − 8,0 = 1,7), e o campo continua só para o dono.

Chosen: o estado (aumenta, igual ou diminui) vem de `custoSentido`, que é decidido pelo custo em R$ (e não pela diferença arredondada).

Why: o board pede isso; um custo pequeno que arredonda para 0,0 ainda é "aumenta".

Chosen: um componente novo, `CelulaFolha`, desenha a coluna; `linha-regras.js` guarda o texto e o `aria-label`.

Why: a tela fica pequena e a regra de texto fica testável sem React.

Chosen: as cores do chip entram como tokens `--chip-aumenta-*` e `--chip-diminui-*` em `alquimia.css`.

Why: âmbar e verde do board não existem no DS; os tokens ficam num lugar só.

## Technical Context

**Language/Version**: React 18 + Tailwind (tela); Node 22 + TypeScript (um ajuste no servidor)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança

**Testing**: Vitest (regras de texto e chip; servidor), conferência no navegador em 1236 px e em largura menor

**Constraints**: gestor e consulta não recebem custo; só tokens e componentes do DS (mais os tokens do chip); contraste AA

## Constitution Check

Spec Kit seguido; sem banco, segredo ou autenticação; regra com teste; contrato HTTP preservado (só o valor de `aumentoPp` muda, para o dono).

## Project Structure

```text
backend/node/src/modules/escala/linhas-cenarios.ts        # aumentoPp = round1(depois) − round1(hoje)
backend/node/src/modules/escala/linhas-cenarios.test.ts   # casos de Cosmópolis (+1,7), Paulínia (+4,4), reduz equipe (−0,6)
frontend/react/src/
├── index.css                                              # grade nova: 200px | 1fr | 1.25fr | 84px | 200px | 120px, gap 16px
├── styles/alquimia.css                                    # tokens do chip
└── features/diagnostico/
    ├── Comparativo.jsx                                    # cabeçalho por perfil e texto de abertura
    └── cartao/
        ├── CelulaFolha.jsx                                # novo: a célula A3 e o chip
        ├── LinhaDeCenario.jsx                             # usa CelulaFolha
        └── linha-regras.js                                # textoDaFolha: peso, chip, reais, frases e aria-label
```

**Structure Decision**: sem estrutura nova além de `CelulaFolha.jsx`; os textos ficam em `linha-regras.js`.

## Complexity Tracking

Nenhuma violação a justificar.
