# Implementation Plan: Cenários "Estender horário" e "Reduzir equipe"

**Branch**: `feat/escala-cenarios-extras` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

## Summary

Dois cenários novos no Diagnóstico, abaixo dos três atuais, calculados no servidor junto com o diagnóstico para 42h e 40h: **estender horário** (usa a ociosidade da equipe do Cenário 1 para abrir mais onde a venda de referência compensa) e **reduzir equipe** (quantas pessoas por cargo excedem o necessário, com a economia de folha). Reaproveita a verificação de capacidade, o custo, o horário por dia e as vendas por dia e hora. Sem tabela nova.

## For the reader

Chosen: calcular os dois cenários no servidor, no mesmo lugar dos outros três, com as mesmas contas de cobertura e custo.

Why: os números batem com o quadro central e com o Cenário 1, e o custo continua saindo só para o dono.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite + Tailwind (tela), como já está
**Primary Dependencies**: nenhuma nova
**Storage**: nenhuma mudança (sem migration); só leitura
**Testing**: Vitest (conta manual dos dois algoritmos) + Supertest (rota do diagnóstico, permissões)
**Target Platform**: Docker Compose local
**Project Type**: web (api + front)
**Performance Goals**: cenários 4 e 5 das duas regras em < 200 ms; o diagnóstico continua abrindo em < 2 s
**Constraints**: custo, economia e margem em reais só para `TENANT_ADMIN`; cenários não alteram cadastro nem funcionário; sem número parcial quando falta dado
**Scale/Scope**: até 168 horas-slot por loja, poucas funções, dezenas de pessoas

## Constitution Check

| Princípio | Situação |
|---|---|
| I Spec Kit | OK — spec aprovada, plano em curso |
| II Docker | OK |
| III Stack | OK — nada acrescentado |
| IV Migrations | OK — sem mudança de banco |
| V Dados locais | OK — só leitura |
| VII Começar pequeno | OK — duas fatias independentes |
| VIII Técnico é do agente | OK |

Reavaliado após o desenho: sem violações.

## Project Structure

```text
backend/node/src/modules/escala/
├── cenarios-extras.ts       # estender horário e reduzir equipe (funções puras)
├── cenarios-extras.test.ts
├── cenarios.ts              # só exporta mais alguns auxiliares já existentes
└── diagnostico.ts           # junta os extras ao `cenarios` de cada regra
frontend/react/src/features/diagnostico/
└── Cenarios.jsx             # dois cartões novos abaixo do Cenário 3
```

**Structure Decision**: arquivo novo para não inflar `cenarios.ts` (já grande) e evitar importação circular: `cenarios-extras.ts` importa de `cenarios.ts`; o diagnóstico chama os dois e junta o resultado.

## Fatias de entrega

1. **US1 Cenário 4 — estender:** equipe do Cenário 1 como base, candidatos nas pontas e dia fechado, escolha por margem de referência, limite de 2 h por ponta; cartão na tela.
2. **US2 Cenário 5 — reduzir:** excedente por cargo (remove a pessoa de menor carga enquanto a função continuar cobrindo), economia de folha; cartão na tela.
3. **US3 Encaixe:** permissões, avisos de dado faltando, fora do selo, direcionamento e README.
