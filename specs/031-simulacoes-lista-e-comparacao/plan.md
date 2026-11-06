# Implementation Plan: Lista de simulações com resultado e comparação com diferença

**Branch**: `feat/simulacoes-lista-e-comparacao` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/031-simulacoes-lista-e-comparacao/spec.md`

## Summary

A lista de simulações passa a trazer, por simulação, o resultado (saldo por mês, horas abertas, folha extra), o tipo do cenário, a situação (incluindo "Desatualizada") e o nome legível de quem criou; a comparação passa a trazer as métricas de resultado de cada simulação. A API calcula esses números com **a mesma função que o painel de resultado já usa**, então o saldo é idêntico nas três telas. As diferenças, as cores, a base, o "Mostrar só o que mudou" e a contagem "N de M itens mudaram" são regras puras no navegador, com testes. Sem migration.

## For the reader

Chosen: a lista e a comparação mostram o saldo de cada simulação calculado pela mesma conta do painel, e a tela calcula as diferenças e as cores a partir dele.

Why: assim o mesmo saldo nunca aparece com dois valores, e trocar a base ou filtrar o que mudou é instantâneo, sem nova ida ao servidor.

## Technical Context

**Language/Version**: TypeScript (Node 22) na API; React 18 + Vite + Tailwind na tela

**Primary Dependencies**: Express, Zod, Prisma, Vitest; nada novo

**Storage**: PostgreSQL 16; **sem migration** (tudo é calculado a partir do que já existe)

**Testing**: Vitest unitário (regras de diferença, cor, contagem, base, formatação) e integração HTTP (`npm run test:integration`): a lista e a comparação trazem os campos novos, o saldo é igual ao do painel, valores em reais só para o dono, "Desatualizada" para gravada com loja mudada

**Target Platform**: Docker Compose local (postgres, api, web)

**Project Type**: aplicação web (backend + frontend)

**Performance Goals**: a lista de uma loja (dezenas de simulações) responde em tempo parecido com o de hoje: a loja, a base comercial, os custos e o quadro atual são lidos **uma vez** e reaproveitados em todas as simulações; trocar a base na comparação é instantâneo (cálculo no navegador)

**Constraints**: o saldo é o de `saldo-simulacao.ts` sem mudança de fórmula; valores em reais só para o dono do grupo; nenhuma referência a "em uso"; 2 a 4 simulações; descartadas não comparam

**Scale/Scope**: 2 endpoints estendidos, ~8 componentes e 3 módulos de regras puras na tela; nenhuma outra tela muda

## Constitution Check

- Spec Kit seguido (specify → plan; tasks e implement com aprovação): OK.
- Tudo no Docker, stack padrão, sem tecnologia nova: OK.
- Banco só muda por migration: **sem mudança de estrutura**: OK.
- Dados financeiros só para o dono: mantido na API (o campo nem existe para os outros perfis): OK.

Sem violações a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/031-simulacoes-lista-e-comparacao/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api-lista-e-comparacao.md
│   └── regras-da-comparacao.md
└── tasks.md   # criado depois, em /speckit-tasks
```

### Source Code (repository root)

```text
backend/node/src/modules/simulacoes/
├── simulacoes.service.ts     # listar com resumo (saldo, horas, folha, tipo, desatualizada, criada por); comparar com métricas de resultado
├── desatualizada.ts          # (novo) regra pura: o que mudou na loja depois de gravar
├── resumo.ts                 # (novo) tipo do cenário e nome legível de quem criou
└── simulacoes.repository.ts  # listar devolve também quadro e premissas quando preciso

frontend/react/src/
├── features/grade/
│   ├── GradeTab.jsx → ListaDeSimulacoes.jsx   # tabela, seleção (2 a 4), barra de comparar
│   ├── BarraDeComparar.jsx
│   ├── Comparar.jsx → ComparacaoDeSimulacoes.jsx  # tabela com diferença, base, toggle, adicionar e remover
│   ├── comparacao.js (+ .test.js)             # métricas, diferença, cor, contagem, base, "só o que mudou"
│   └── formato.js (+ .test.js)                # reais com sinal e "−" (U+2212), horas, tipo do cenário
└── styles/alquimia.css                        # token --text-success-strong
```

**Structure Decision**: aplicação web existente; regras novas em módulos puros (testáveis sem navegador), componentes só de apresentação.

## Complexity Tracking

Sem desvios da constituição.
