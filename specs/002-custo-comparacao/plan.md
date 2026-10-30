# Implementation Plan: Vagas simuladas e custo na comparação

**Branch**: `feat/escala-ponto-custo` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

## Summary

Duas peças ligadas: (1) o rascunho de simulação passa a aceitar vagas simuladas e desligamentos simulados; (2) o dono informa salário médio por função e encargos por loja, e a comparação mostra custo mensal, anual e a diferença frente à em uso. Constrói em cima de `specs/001-escala`, sem tabela nova de simulação.

## For the reader

Chosen: guardar as vagas dentro da própria simulação (junto com o quadro) e calcular o custo na hora, com a conta explicada na tela.

Why: assim a simulação gravada continua congelada por inteiro e não há duas fontes de verdade; o custo só aparece para o dono.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite + Tailwind (tela), como já está
**Primary Dependencies**: nenhuma nova
**Storage**: PostgreSQL; uma coluna nova em `lojas` (`custos`, JSON); vagas e desligamentos ficam no JSON de quadro da simulação (sem migration de simulação)
**Testing**: Vitest (conta do custo e avaliação com vagas, unitário) + Supertest (rotas e permissão, integração)
**Target Platform**: Docker Compose local
**Project Type**: web (api + front)
**Performance Goals**: recálculo ao adicionar vaga < 1 s, como a grade hoje
**Constraints**: só o dono vê custo (API e tela); dados fictícios; vaga nunca vai ao cadastro
**Scale/Scope**: poucas dezenas de pessoas por simulação

## Constitution Check

| Princípio | Situação |
|---|---|
| I Spec Kit | OK — spec aprovada, plano em curso |
| II Docker | OK — sem dependência fora do Compose |
| III Stack | OK — nada acrescentado |
| IV Migrations | OK — 1 migration (coluna `custos` em `lojas`), via Prisma Migrate |
| V Dados locais | OK — sem ação destrutiva |
| VII Começar pequeno | OK — 3 fatias independentes |
| VIII Técnico é do agente | OK — nenhuma pergunta técnica |

Reavaliado após o desenho: sem violações.

## Project Structure

```text
backend/node/src/modules/
├── simulacoes/   # avaliar.ts (ignora desligados), vagas no service, comparar.ts (custo), sintese
├── custos/       # custo.ts (conta pura), rotas GET/PUT /lojas/:id/custos, repository
└── escala/       # diagnóstico: criar rascunho com as contratações sugeridas
backend/node/prisma/migrations/   # coluna lojas.custos
frontend/react/src/features/
├── grade/        # painel de vagas e desligamentos na simulação; vagas na grade
├── diagnostico/  # card "Custos" na Configuração (só dono); botão "simular esta contratação"
└── grade/Comparar.jsx  # linhas de custo
```

**Structure Decision**: mesmo desenho por módulo da 001; a conta de custo é função pura para testar sem banco.

## Fatias de entrega

1. **US1 Vagas e desligamentos simulados** (sem custo ainda): quadro com vaga/desligado, rotas, avaliação, grade, congelar ao gravar, atalho do diagnóstico.
2. **US2 Custos da loja**: coluna, rotas só do dono, tela na Configuração.
3. **US3 Custo na comparação**: conta, diferença frente à em uso, síntese, linhas na tela, omissão para quem não é dono.
