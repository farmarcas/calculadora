# Implementation Plan: Hora extra antes de contratar, nos Cenários, no Diagnóstico e na Simulação

**Branch**: `feat/hora-extra-nos-cenarios` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/063-hora-extra-nos-cenarios/spec.md`

## Summary

Hoje a falta de cobertura de cada função vira **contratação** em um único lugar: `verificarRegra` (`regras/capacidade.ts`) calcula a falta em horas por semana (`gapH`) e chama `sugerirContratacao`. Cenários (`escala/cenarios.ts`) e Simulação (`simulacoes/resultado.ts`) leem esse resultado. A Simulação, à parte, cobra como "hora extra" a falta que sobra depois das contratações (conta em `resultado.ts`), sem teto e sem que os Cenários saibam disso.

O plano põe a decisão nova **nesse ponto único**:

1. Um módulo puro novo, `regras/hora-extra.ts`, com a **regra** (2 h/dia e 10 h/semana por pessoa) e a **conta do custo** (hora normal × 1,5 × encargos × 5 semanas, hoje espalhada em `resultado.ts`). Ninguém mais tem cópia.
2. `verificarRegra` passa a abater da falta a **hora extra possível** antes de sugerir contratação; cada linha por função ganha `horaExtraH`, o custo mensal da hora extra e a falta que sobra. A contratação sugerida cobre só o que sobra.
3. **Cenários**: o "Manter" (e os cenários que hoje contratam) mostram a hora extra e contratam só o resto; o custo da hora extra entra no custo adicional e, sem mudar a fórmula, no peso da folha (`peso-folha.ts`).
4. **Simulação**: o bloco de hora extra do resultado passa a usar a mesma regra e a mesma conta; a falta acima do teto vira "falta a cobrir". Como o cartão e a Simulação aberta por Personalizar passam pelo mesmo `verificarRegra`, os números coincidem.
5. **Telas e textos**: coluna "Contratar", texto do cenário, chip, rótulo "Cobre sem contratar", alertas e parecer.

Sem mudança de banco; sem endpoint novo (campos novos nas respostas que já existem).

## For the reader

Chosen: ensinar à regra que já decide "quanto contratar" a olhar primeiro para a hora extra de quem já trabalha, em um lugar só que Cenários e Simulação compartilham.

Why: assim o cartão e a Simulação não têm como divergir, o custo da hora extra entra sozinho no peso da folha e não há duas contas para manter.

## Technical Context

**Language/Version**: TypeScript (Node 22) no servidor; JavaScript + React 18 na tela

**Primary Dependencies**: as do projeto (Express, Zod, Prisma, React, Vite, Tailwind, Vitest); nenhuma nova

**Storage**: PostgreSQL existente; **sem migration** (a hora extra é calculada, não gravada)

**Testing**: Vitest unitário (regra, custo, cenários, peso da folha, linhas e textos) e integração HTTP existente (`/cenarios`, `/simulacoes`, parecer)

**Target Platform**: Docker Compose local (api :4000, web :3000)

**Project Type**: web (backend + frontend)

**Performance Goals**: sem piora perceptível: a decisão é uma conta por função e por dia sobre dados que o cálculo já tem

**Constraints**: mesma conta de custo de hoje; sem R$ para gestor/consulta (checagem no servidor); simulações gravadas não são recalculadas; `faltaH`/`falta` seguem sendo a falta bruta da cobertura

**Scale/Scope**: 1 módulo novo, 2 pontos de ligação no servidor (capacidade e resultado), cenários/linhas/parecer, 4 arquivos de tela

## Constitution Check

- **I. Spec Kit**: spec aprovada; plano agora; tarefas e implementação depois, com aprovação a cada etapa. ✔
- **II. Docker**: tudo roda e testa nos containers. ✔
- **III. Stack padrão**: nenhuma tecnologia nova. ✔
- **IV. Banco só muda por migration**: sem mudança de banco. ✔
- **V. Dados locais protegidos**: nenhum comando destrutivo. ✔
- **VI/VIII. Linguagem simples e decisões do agente**: decisões em `research.md`, resumo em linguagem simples. ✔
- **VII. Começar pequeno**: a regra e o custo (US1/US2) valem sozinhos; telas, alerta e parecer vêm depois. ✔

Sem violações. Reavaliado depois do desenho: sem mudança.

## Project Structure

### Documentation (this feature)

```text
specs/063-hora-extra-nos-cenarios/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/hora-extra-contrato.md
└── tasks.md              # próxima etapa (/speckit-tasks)
```

### Source Code (repository root)

```text
backend/node/src/modules/
├── regras/
│   ├── hora-extra.ts              # NOVO: a regra (2 h/dia, 10 h/semana por pessoa) e a conta do custo, em um lugar só
│   ├── hora-extra.test.ts         # NOVO
│   └── capacidade.ts              # verificarRegra: abate a hora extra antes de sugerir contratação; campos novos em LinhaFuncao
├── escala/
│   ├── cenarios.ts                # montarManter e afins: hora extra + contratação restante; custo adicional soma os dois
│   ├── comparativo.ts             # custo adicional e alertas com hora extra
│   ├── linhas-cenarios.ts         # textos ("Sem contratar: cobre com N h…"), campo horaExtra, alertas
│   ├── peso-folha.ts              # sem mudança de fórmula; testes com e sem hora extra
│   └── *.test.ts                  # cenário só com hora extra, em parte, que ainda contrata, Cenário × Personalizar
└── simulacoes/
    ├── resultado.ts               # usa hora-extra.ts (a conta sai daqui); falta acima do teto
    ├── resultado-em-horas.ts      # horas de hora extra e falta restante
    ├── parecer.ts / parecer-pdf.ts # frases com hora extra

frontend/react/src/features/diagnostico/
├── cartao/linha-regras.js         # textoContratar com hora extra; rótulo "Cobre sem contratar"
├── cartao/LinhaDeCenario.jsx      # coluna "Contratar"
└── cartao/CelulaFolha.jsx         # chip e peso com o custo novo

templates/backend/node/...         # cópia gerada por scripts/sync-templates.sh (não editar à mão)
```

**Structure Decision**: aplicação web existente; só os arquivos acima mudam.

## Complexity Tracking

Sem violações da constituição; nada a justificar.
