# Implementation Plan: Cenário 1 em turnos e comparativo de cenários

**Branch**: `feat/cenario1-comparativo` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

## Summary

Duas mudanças que se apoiam na spec 009: (1) a **regra de contratação do documento** (inteiras = turnos faltantes ÷ dias; resto de até 3 turnos vira contrato parcial; conferência final) passa a viver no cálculo de capacidade e, por isso, vale igual no Cenário 1, no Cenário 3, no quadro central e nas vagas sugeridas das simulações; o Cenário 1 ganha etapas por fase, custo anual e % do faturamento; (2) um **comparativo em tabela** monta os cenários 1, 2 e 3 lado a lado, com status, destaque do maior resultado e premissas editáveis só para simular. Sem tabela nova, sem migration. Encargos ficam para depois.

## For the reader

Chosen: colocar a regra de contratação **no cálculo de capacidade**, não dentro do Cenário 1.

Why: o quadro central, o Cenário 1, o Cenário 3 e as simulações precisam dizer o mesmo número de contratações; uma regra só, em um lugar, garante isso e mantém todos os testes comparáveis.

Chosen: o comparativo é montado **no servidor**, com os números dos cenários que já existem, e a tela só desenha a tabela.

Why: o status (viável, não recomendado, inviável) e a regra de quem vê valores em reais ficam em um lugar só.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite + Tailwind (tela), como já está
**Primary Dependencies**: nenhuma nova
**Storage**: nenhuma mudança (sem migration)
**Testing**: Vitest (regra de contratação com contas à mão: 7, 9 e 10 turnos faltantes, limites do parcial, conferência final; etapas; custo anual e %; status e destaque do comparativo) e Supertest (Diagnóstico, premissas, permissões)
**Target Platform**: Docker Compose local
**Project Type**: web (api + front)
**Performance Goals**: premissas recalculam o Diagnóstico em < 2 s
**Constraints**: valores em reais só para `TENANT_ADMIN` (campos ausentes, não nulos); premissas nunca são gravadas; parcial de no máximo 3 turnos (24 h); os testes de cálculo fora da regra de contratação não mudam
**Scale/Scope**: 5 cargos, 3 fases, 3 colunas de comparativo

## Constitution Check

| Princípio | Situação |
|---|---|
| I Spec Kit | OK — spec e plano; tarefas dependem de aprovação |
| II Docker | OK |
| III Stack | OK — nada acrescentado |
| IV Migrations | OK — sem mudança de banco |
| V Dados locais | OK — só leitura |
| VII Começar pequeno | OK — quatro fatias que terminam verdes |
| VIII Técnico é do agente | OK |

Sem violações.

## Project Structure

```text
backend/node/src/modules/regras/
└── capacidade.ts (+test)       # contratação por turnos: inteiras, parcial (até o limite), conferência final; opções { limiteParcial }
backend/node/src/modules/escala/
├── cenarios.ts                 # contratacoesDe/custoDasVagas passam a tratar inteiras + 1 parcial; Cenário 1 com custo anual, % do faturamento
├── etapas.ts (+test)           # etapa da fase de 42h e adicional da fase de 40h, por cargo
├── comparativo.ts (+test)      # tabela dos cenários 1, 2 e 3: linhas, status, alertas, destaque
├── premissas.ts (+test)        # leitura e validação de ?recaptura, ?margemPct, ?fatorDiaNovo, ?diasProtegidos, ?limiteParcial
├── diagnostico.ts              # junta etapas, comparativo e premissas; faturamento mensal de referência
└── escala.routes.ts / escala.schemas.ts   # query de premissas
backend/node/src/modules/simulacoes/
└── vagas.ts                    # vagas sugeridas com a mesma regra
frontend/react/src/features/diagnostico/
├── Comparativo.jsx             # tabela lado a lado e destaque
├── Premissas.jsx               # campos editáveis e "Recalcular", sem gravar
├── Cenarios.jsx                # Cenário 1 com etapas, custo anual e %; cartões seguem abaixo da tabela
└── EscalaPage.jsx              # guarda as premissas e recarrega o Diagnóstico
```

**Structure Decision**: etapas e comparativo em arquivos próprios e puros para não inflar `cenarios.ts` e poder testar cada um com números à mão.

## Fatias de entrega

1. **US1 — Regra de contratação do documento:** em `capacidade.ts`, com custo e vagas ajustados; atualiza onde o número aparece (quadro central, Cenário 1, simulações). Testes antigos de `contratar` têm a expectativa conferida à mão e atualizada.
2. **US2 — Etapas, custo anual e % do faturamento** no Cenário 1, com a tela.
3. **US3 — Comparativo em tabela** dos cenários 1, 2 e 3 (depende dos cenários por dia da spec 009).
4. **US4 + fechamento — Premissas editáveis** (inclui a recaptura da spec 009), permissões, README, conferência da loja 001.

## Ordem entre as duas specs

1. Spec 010 fatia 1 e 2 (regra de contratação e etapas do Cenário 1).
2. Spec 009 fatias 1 a 4 (base por dia e cenários 2, 3 e 4), que já usam a regra nova.
3. Spec 010 fatia 3 (comparativo) e fatia 4 (premissas). A recaptura da spec 009 entra pelas premissas; a fatia 5 da spec 009 fica só com remoção do código por hora e fechamento.
