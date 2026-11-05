# Implementation Plan: Retirar "Marcar como em uso" da Simulação

**Branch**: `feat/retirar-simulacao-em-uso` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/030-retirar-simulacao-em-uso/spec.md`

## Summary

Remove a função de aprovar/marcar como em uso por inteiro: botão e janela na tela, a rota de aprovar, a checagem de "desatualizada", a referência automática e a linha de diferença na comparação, e a proteção contra descartar a simulação em uso. Uma **migration só de dados** converte as simulações "em uso" e "substituídas" em "gravadas", sem apagar nada; as colunas de aprovação (quem, quando, vigência, substituída em) continuam guardadas. Os valores "em uso" e "substituída" continuam existindo no tipo do banco (sem mudança de estrutura), mas o sistema nunca mais os grava.

## For the reader

Chosen: a função de marcar como em uso some da tela e do servidor, e as simulações que já estavam marcadas viram simulações gravadas comuns.

Why: a função nunca mudou a loja, só confundia; assim ninguém perde nenhuma simulação nem os registros antigos.

## Technical Context

**Language/Version**: TypeScript (Node 22) na API; React 18 + Vite na tela

**Primary Dependencies**: Express, Zod, Prisma, Vitest; nada novo

**Storage**: PostgreSQL 16; uma migration SQL de **dados** (`UPDATE` de estado); sem mudança de estrutura

**Testing**: Vitest unitário (síntese da comparação) e integração HTTP (`npm run test:integration`): criar, gravar, clonar, descartar e comparar; a rota de aprovar não existe mais; simulações antigas em uso e substituídas viram gravadas e podem ser descartadas

**Target Platform**: Docker Compose local (postgres, api, web)

**Project Type**: aplicação web (backend + frontend)

**Performance Goals**: sem mudança; a comparação passa a buscar uma simulação a menos

**Constraints**: nenhuma simulação é apagada; os dados guardados (nome, horários, quadro, premissas, resultado e registros de aprovação) não mudam; Cadastro, Diagnóstico e folha idênticos

**Scale/Scope**: ~5 arquivos de backend e 5 de tela, uma migration de dados, testes; nenhuma tela nova

## Constitution Check

- Spec Kit seguido (specify → plan; tasks e implement com aprovação): OK.
- Tudo no Docker, stack padrão, sem tecnologia nova: OK.
- Banco só muda por migration: a mudança de dados é uma **migration versionada** (`prisma migrate`), sem tocar na estrutura: OK.
- Cuidado com dados: nada é apagado; é só trocar o estado, e as colunas de histórico ficam: OK.

Sem violações a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/030-retirar-simulacao-em-uso/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-simulacoes.md
└── tasks.md   # criado depois, em /speckit-tasks
```

### Source Code (repository root)

```text
backend/node/
├── prisma/migrations/<data>_simulacoes_sem_em_uso/migration.sql   # UPDATE: em_uso e substituida → gravada
└── src/modules/simulacoes/
    ├── simulacoes.routes.ts      # sai POST /simulacoes/:id/aprovar
    ├── simulacoes.schemas.ts     # sai aprovarReq
    ├── simulacoes.service.ts     # sai aprovar, desatualizacao, guarda de descartar; comparar sem referência
    ├── simulacoes.repository.ts  # sai aprovar e emUso; tipo de estado sem em_uso/substituida
    └── comparar.ts               # síntese sem "frente à em uso" nem "aprovada"

frontend/react/src/features/
├── simulacao/SimulacaoPage.jsx, PainelResultado.jsx   # sem botão, janela, aviso e textos de "em uso"
└── grade/Aprovar.jsx (apagado), Comparar.jsx, GradeTab.jsx   # sem referência, sem diferença, sem estados extintos
```

**Structure Decision**: aplicação web existente; só alterações nos módulos acima, sem pasta nova.

## Complexity Tracking

Sem desvios da constituição.
