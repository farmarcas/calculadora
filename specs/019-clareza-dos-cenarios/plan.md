# Implementation Plan: Clareza dos cenários do Diagnóstico

**Branch**: `feat/clareza-dos-cenarios` | **Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

## Summary

Os três cenários mantêm o nome e ganham premissa fixa + linha de resultado variável. O servidor passa a devolver, por cenário, a falta de cobertura por função (e as horas sem farmacêutico) calculada com os horários daquele cenário; a tela mostra a linha amarela, os selos novos, o recolhimento do Cenário 3 repetido e a frase única quando a loja já cobre tudo.

## For the reader

Chosen: reaproveitar a conta de cobertura que o sistema já faz e só mudar textos, selos e o que aparece em cada card; nenhum dado novo é guardado.

Why: tudo o que a tela precisa já nasce do diagnóstico, então a mudança é pequena e não mexe no banco.

## Technical Context

**Language/Version**: TypeScript (Node 20) no servidor; React 18 + Vite + Tailwind na tela
**Primary Dependencies**: as já usadas (Express, Zod, Vitest; React Testing Library/Vitest no front)
**Storage**: N/A (sem migration, sem tabela nova)
**Testing**: Vitest no servidor (`cenarios.test.ts`, `comparativo.test.ts`) e no front
**Target Platform**: Docker Compose local (api + web)
**Project Type**: web (backend + frontend)
**Performance Goals**: sem mudança; cada cenário recalcula a cobertura uma vez a mais
**Constraints**: valores em R$ só para o dono; nomes dos cenários e contrato HTTP existentes não mudam (só campos novos, opcionais)
**Scale/Scope**: 3 cartões por loja; 1 tela

## Constitution Check

- I. Spec Kit: cumprido (spec 019 → plano → tarefas → implementação).
- II. Docker: testes e conferência rodam no ambiente local.
- III. Stack: a existente.
- IV. Banco só por migration: nenhuma mudança de banco.
- V. Dados locais protegidos: nenhuma operação destrutiva; dados reais seguem fora do git.
- VI/VIII. Linguagem simples e decisões técnicas do agente: cumprido.
- VII. Começar pequeno: sem recurso novo além do pedido.

Resultado: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/019-clareza-dos-cenarios/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cenarios.md
└── tasks.md   # /speckit-tasks
```

### Source Code

```text
backend/node/src/modules/escala/
├── cenarios.ts        # premissa/resultado, cobertura do Cenário 2, "opcional"
├── comparativo.ts     # recolher Cenário 3, selo, preço da economia
└── *.test.ts          # testes dos casos de Sumaré e das regras de aparecimento
frontend/react/src/features/diagnostico/
└── Comparativo.jsx    # premissa, resultado, linha amarela, selos, chip "(opcional)"
```

**Structure Decision**: web app existente (backend Node + frontend React); só se alteram os arquivos acima.
