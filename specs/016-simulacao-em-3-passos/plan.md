# Implementation Plan: Simulação do cenário em 3 passos

**Branch**: `feat/simulacao-em-3-passos` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

## Summary

A simulação já existe (rascunho com quadro, vagas e turnos). Falta: (1) um **horário simulado** guardado na simulação, (2) um **resultado** calculado pelo servidor com folha extra, hora extra, venda e margem que saem e horas abertas, reaproveitando as contas dos cenários sugeridos, (3) **numeração de cenários** salvos por loja e (4) a **nova tela** em 3 passos com painel fixo. O visual é todo novo; o cálculo é o mesmo motor, alimentado pelo horário editado.

## For the reader

Chosen: o servidor passa a calcular o resultado inteiro da simulação (inclusive com o horário editado), e a tela só mostra.

Why: assim o número do painel é sempre igual ao dos cenários sugeridos e ninguém precisa refazer conta na tela.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React 18 + Vite + Tailwind 3.4 (tela). **Dependencies**: as já usadas (Express 5, Zod 4, Prisma 7). Nenhuma nova.
**Storage**: PostgreSQL 16; uma coluna nova em `simulacoes` (`horarios`, JSON, opcional) por migration.
**Testing**: Vitest (cálculo do resultado, validação do horário) e Supertest (rotas); conferência da tela no navegador em 4 larguras.
**Target Platform**: web (Docker Compose local). **Project Type**: web-service + frontend.
**Performance Goals**: recalcular e responder em até 2 s (SC-002); o cálculo é em memória sobre ~100 linhas de venda por dia.
**Constraints**: valores em reais só para o dono; horário editado nunca grava no Cadastro; layout por largura do conteúdo (container queries), sem rolagem horizontal de 360 a 1920 px.
**Scale/Scope**: uma loja por vez, 7 dias × 24 horas de venda, até 20 vagas simuladas.

## Constitution Check

- I. Spec Kit: especificação feita e aprovada; este plano segue para tarefas. OK.
- II. Docker: tudo roda no Compose; testes dentro do container. OK.
- III. Stack padrão: Node/TS, React/Tailwind, Postgres. Sem stack nova. OK.
- IV. Banco só por migration: coluna nova via migration do Prisma; nada de DDL à mão. OK.
- V. Dados locais protegidos: nenhum comando destrutivo; coluna é opcional, dados atuais intactos. OK.
- VI/VIII. Linguagem simples e decisões técnicas do agente: registradas aqui e em research.md. OK.
- VII. Começar pequeno: entrega em fatias independentes (ver tasks). OK.

Sem violações; nada a justificar.

## Project Structure

### Documentation

```text
specs/016-simulacao-em-3-passos/
├── plan.md, research.md, data-model.md, quickstart.md
├── contracts/simulacoes.md
└── tasks.md   (próximo passo)
```

### Source Code

```text
backend/node/
├── prisma/schema.prisma + migração       # simulacoes.horarios (Json?)
└── src/modules/simulacoes/
    ├── resultado.ts (+ .test.ts)          # NOVO: cálculo do resultado da simulação
    ├── simulacoes.schemas.ts              # horarios no PUT; numeração
    ├── simulacoes.service.ts              # horário simulado, resultado, gravar com número
    └── simulacoes.repository.ts           # coluna horarios, próximo número
frontend/react/src/features/simulacao/     # NOVA tela (substitui grade/Simulacao.jsx no fluxo de "Personalizar")
├── SimulacaoPage.jsx, BarraParametros.jsx
├── PassoHorario.jsx, GraficoVendas.jsx
├── PassoContratacoes.jsx, PassoEscala.jsx
└── PainelResultado.jsx
```

**Structure Decision**: a tela nova mora numa pasta própria e reaproveita `Grade.jsx` (ajuste por hora), `Aprovar.jsx` e `tempo.js` de `features/grade`. A tela antiga continua alcançável por simulações já existentes até a conferência final (ver research).

## Complexity Tracking

Nenhuma violação.
