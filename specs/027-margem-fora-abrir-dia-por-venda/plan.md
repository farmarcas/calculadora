# Implementation Plan: Margem fora do dia a dia e "abrir um dia" por venda

**Branch**: `feat/margem-fora-abrir-dia-por-venda` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/027-margem-fora-abrir-dia-por-venda/spec.md`

## Summary

A margem bruta sai das telas, da planilha de Cadastro e de todas as contas. O único cálculo que ainda a usava, o cenário "abrir um dia hoje fechado", passa a estimar o ganho em **venda** (dia novo = o que já vendeu, ou 50% da média dos dias abertos) e a mostrar o saldo "venda estimada − custo da folha". O valor de margem já salvo na loja continua guardado: a gravação do faturamento passa a **preservar** o que está no banco, e a coluna de margem das planilhas é ignorada. Nenhuma migration: a margem mora dentro do faturamento da loja (campo JSON) e não é removida.

## For the reader

Chosen: o "abrir um dia" passa a contar venda em vez de margem, e o campo de margem some das telas, mas o número já salvo fica guardado.

Why: assim o cenário funciona em todas as lojas (com ou sem margem), fica na mesma régua da Simulação e ninguém perde um dado que pode voltar a ser útil.

## Technical Context

**Language/Version**: TypeScript (Node 22) na API; React 18 + Vite no front

**Primary Dependencies**: Express, Zod, Prisma, ExcelJS (planilhas), Vitest (já no projeto); nada novo

**Storage**: PostgreSQL 16; sem migration (a margem fica dentro do JSON `faturamento` da loja, que não muda de estrutura)

**Testing**: Vitest unitário (motor dos cenários, leitura da planilha, cálculos do Cadastro no front) e integração HTTP (`npm run test:integration`) para a preservação da margem e a importação de planilha antiga

**Target Platform**: Docker Compose local (postgres, api, web)

**Project Type**: aplicação web (backend + frontend)

**Performance Goals**: sem mudança; o "abrir dia" já roda dentro do diagnóstico

**Constraints**: os três cartões de cenário e a Simulação ficam com resultados idênticos; quem não é dono não vê valores em reais; margem salva nunca é apagada nem alterada

**Scale/Scope**: ~10 arquivos de backend, 4 de front, testes; nenhuma tela nova

## Constitution Check

- Spec Kit seguido (specify → plan; tasks e implement com aprovação): OK.
- Tudo no Docker, stack padrão, sem tecnologia nova: OK.
- Banco só muda por migration: **sem mudança de estrutura**, então sem migration; nada é apagado: OK.
- Dados pessoais/financeiros: valores em reais continuam só para o dono: OK.

Sem violações a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/027-margem-fora-abrir-dia-por-venda/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── diagnostico-abrir-dia.md
└── tasks.md   # criado depois, em /speckit-tasks
```

### Source Code (repository root)

```text
backend/node/src/modules/
├── cadastros/
│   ├── faturamento.ts          # margemPct opcional no schema; planilha não lê margem; helper que preserva a margem salva
│   ├── painel.ts               # "Salvar alterações" da tela preserva a margem
│   ├── cadastros.repository.ts # atualizarLoja (PUT e importação) preserva a margem
│   └── situacao.ts             # só comentário
├── planilhas/
│   ├── campos.ts               # sai o campo Margem_Pct do modelo de Lojas (a coluna antiga é ignorada)
│   └── modelo.ts               # texto de ajuda sem "margem"
└── escala/
    ├── cenarios-extras.ts      # "abrir dia" por venda; saldo = venda − folha
    ├── cenarios-dias.ts        # venda por dia sem margem
    ├── ajustes-fim-de-semana.ts# tira margem do ganho e da reserva que nunca roda
    ├── vendas-cadastro.ts      # venda estimada do Cadastro sem margem
    └── diagnostico.ts          # aviso sem pedir margem; lista de campos ocultos enxuta

frontend/react/src/features/cadastro-loja/
├── AbaDados.jsx, ResumoMensal.jsx, calculos.js, pendencias.js   # campo de margem some
```

**Structure Decision**: aplicação web existente; só alterações nos módulos acima, sem pasta nova.

## Complexity Tracking

Sem desvios da constituição.
