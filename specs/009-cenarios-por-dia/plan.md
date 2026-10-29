# Implementation Plan: Cenários de horário decididos por dia da semana

**Branch**: `feat/cenarios-por-dia` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

## Summary

Os cenários 2, 3 e 4 deixam de cortar e estender o horário hora a hora e passam a decidir por **dia da semana inteiro**. Um módulo novo, `cenarios-dias.ts`, calcula a venda e a margem de cada dia (somando as horas que já chegam ao motor, venha a venda da base comercial ou do faturamento do cadastro) e monta os três cenários: **fechar dias** para a equipe atual caber (2), **a melhor combinação de dias abertos e fechados** por enumeração de no máximo 127 casos (3) e **abrir um dia hoje fechado** com a sobra de capacidade (4). Os cenários 1 e 5, o quadro por turno e a exigência por turno não mudam. Sem tabela nova, sem migration.

## For the reader

Chosen: reaproveitar a venda por hora que o motor já recebe e **somá-la por dia da semana**, em vez de criar uma segunda fonte de dados.

Why: a base comercial e o faturamento do cadastro já viram "venda por hora" no mesmo formato; somar por dia dá o valor do dia nos dois casos, sem mexer em importação nem em cadastro.

Chosen: o Cenário 3 testa **todas** as combinações de dias.

Why: são no máximo sete dias (127 combinações), então dá o melhor resultado de verdade, que a regra simples de hoje só aproximava, e o selo de menor impacto passa a ser sempre consistente (o equilíbrio nunca fica pior que o Cenário 1 nem que o Cenário 2).

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite + Tailwind (tela), como já está
**Primary Dependencies**: nenhuma nova
**Storage**: nenhuma mudança (sem migration)
**Testing**: Vitest (cada cenário conferido à mão, enumeração contra conta manual, dias protegidos, origem da venda, recaptura) e Supertest (rota do Diagnóstico, permissões)
**Target Platform**: Docker Compose local
**Project Type**: web (api + front)
**Performance Goals**: até 127 combinações × 3 regras por abertura do Diagnóstico em < 300 ms; o Diagnóstico segue abrindo em < 2 s
**Constraints**: R$ de venda, margem, economia e resultado só para `TENANT_ADMIN` (campos ausentes, não nulos); nenhum cenário propõe corte ou extensão de hora; nunca fechar todos os dias; os 3 dias de maior faturamento não são fechados sem marca "não recomendado"
**Scale/Scope**: 7 dias, 5 cargos, 3 regras

## Constitution Check

| Princípio | Situação |
|---|---|
| I Spec Kit | OK — spec aprovada, plano em curso |
| II Docker | OK |
| III Stack | OK — nada acrescentado |
| IV Migrations | OK — sem mudança de banco |
| V Dados locais | OK — só leitura |
| VII Começar pequeno | OK — cinco fatias que terminam verdes |
| VIII Técnico é do agente | OK |

Sem violações.

## Project Structure

```text
backend/node/src/modules/escala/
├── cenarios-dias.ts (+test)     # venda e margem por dia, dias protegidos, cenários 2, 3 e 4 por dia
├── cenarios.ts                  # sai o código por hora (cortar pontas, custo do trecho); fica Manter, contratações, folha, destaque
├── cenarios-extras.ts           # sai o Estender por hora; fica o Reduzir equipe
├── vendas-cadastro.ts           # devolve também se a venda veio só do mensal
├── diagnostico.ts               # origem da venda por dia, recaptura, sem exibir R$ a quem não é dono
└── escala.routes.ts / escala.schemas.ts   # `?recaptura=` (0 a 30)
frontend/react/src/features/diagnostico/
├── Cenarios.jsx                 # cartões dos cenários 2, 3 e 4 mostram dias; seletor de recaptura; frase-resumo
└── EscalaPage.jsx               # guarda a recaptura e recarrega o Diagnóstico
```

**Structure Decision**: arquivo novo para a lógica por dia, para não inflar `cenarios.ts` e poder apagar de uma vez o código por hora, que deixa de ter uso.

## Fatias de entrega

1. **Base por dia:** venda e margem mensal por dia da semana, origem (base, cadastro por dia, estimativa do mensal), dias protegidos, tipos novos de resposta, e a regra de não mostrar R$ a quem não é dono em qualquer origem.
2. **US1 + US4 — Cenário 2:** fechar dias até a equipe atual caber, com dias protegidos e "não recomendado"; cartão na tela.
3. **US2 — Cenário 3:** enumeração das combinações, desempate, avisos de coincidência, frase-resumo, selo; cartão na tela.
4. **US3 — Cenário 4:** abrir um dia fechado com a sobra do Cenário 1, margem de referência (50% da média dos dias abertos); cartão na tela.
5. **US5 + fechamento:** recaptura (consulta, tela), remoção do código por hora, permissões, README e conferência da loja 001.
