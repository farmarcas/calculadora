# Implementation Plan: Três cenários de decisão no Diagnóstico

**Branch**: `feat/escala-cenarios` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

## Summary

Abaixo do quadro central do Diagnóstico, três cenários prontos (manter horários, economia, equilíbrio), calculados no servidor para as regras de 42h e 40h e entregues junto com o diagnóstico, de modo que trocar a regra na tela é instantâneo. Reaproveita o cálculo de capacidade e contratações, o custo das vagas, o horário por dia e a base comercial. Sem tabela nova.

## For the reader

Chosen: calcular os cenários no servidor, junto com o diagnóstico, usando as mesmas contas que a plataforma já faz.

Why: assim os números dos cenários batem com os do quadro central e com o custo das simulações, e o custo só sai para o dono.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite + Tailwind (tela), como já está
**Primary Dependencies**: nenhuma nova
**Storage**: nenhuma mudança (sem migration); lê loja, escala atual, custos e base comercial que já existem
**Testing**: Vitest (algoritmos dos cenários, conta manual) + Supertest (rota do diagnóstico, permissões)
**Target Platform**: Docker Compose local
**Project Type**: web (api + front)
**Performance Goals**: cenários das duas regras calculados em < 200 ms; o diagnóstico continua abrindo em < 2 s
**Constraints**: custo só para `TENANT_ADMIN`; cenários não alteram cadastro nem criam funcionário; sem número parcial quando falta dado
**Scale/Scope**: até 168 horas-slot por loja (24h × 7 dias), poucas funções

## Constitution Check

| Princípio | Situação |
|---|---|
| I Spec Kit | OK — spec aprovada, plano em curso |
| II Docker | OK |
| III Stack | OK — nada acrescentado |
| IV Migrations | OK — sem mudança de banco |
| V Dados locais | OK — só leitura |
| VII Começar pequeno | OK — 4 fatias independentes |
| VIII Técnico é do agente | OK |

Reavaliado após o desenho: sem violações.

## Project Structure

```text
backend/node/src/modules/
├── regras/capacidade.ts       # LinhaFuncao ganha faltaH (horas que faltam), usada na ociosidade
├── escala/
│   ├── vendas.ts              # venda e margem médias por dia da semana e hora
│   ├── cenarios.ts            # os três cenários e o destaque (funções puras)
│   └── diagnostico.ts         # entrega `cenarios` por regra (42h e 40h)
└── custos/custo.ts            # reaproveitado: custo das vagas e folha atual
frontend/react/src/features/diagnostico/
├── Cenarios.jsx               # os três cartões e o destaque, seguindo o seletor 42h/40h
└── Diagnostico.jsx            # encaixa os cenários abaixo do quadro central
```

**Structure Decision**: toda a conta fica em funções puras (testadas sem banco); o diagnóstico só chama e entrega o resultado.

## Fatias de entrega

1. **US1 Cenário 1 — manter horários:** base comum (venda por dia e hora, `faltaH`), contratações por cargo, ociosidade, custo adicional e %, horário semanal; cartão na tela.
2. **US2 Cenário 2 — economia:** corte guloso nas pontas, horas a reduzir, novo horário, venda e margem cortadas.
3. **US3 Cenário 3 — equilíbrio:** corte das horas que não se pagam e contratação do restante.
4. **US4 Direcionamento:** frases, destaque de menor impacto financeiro (só dono) e mensagens de dado faltando.
