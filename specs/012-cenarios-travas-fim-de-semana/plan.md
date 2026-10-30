# Implementation Plan: Cenário 2 com travas — fim de semana primeiro

**Branch**: `feat/cenarios-travas-fim-de-semana` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

## Summary

Um módulo novo e puro decide, para o Cenário 2, **quais passos dar no fim de semana e em que ordem** (reduzir o fechamento de sábado e domingo em passos de 1 h até 4 h; fechar o domingo; fechar o sábado), **parando** no primeiro passo em que a equipe atual cobre o horário ou antes de violar uma trava (perda máxima de 10% do faturamento, piso de 85% das horas, 4 h por dia). O Cenário 2 passa a usar esse módulo no lugar de "fechar o dia de menor margem", ganha o status **"Não resolve sozinho"**, descreve os passos em texto e deixa de mostrar R$ 0 quando a margem não foi informada. Na etapa seguinte o Cenário 3 usa os mesmos estados e travas, só no fim de semana. Sem banco, sem migration, sem endpoint novo: o Diagnóstico existente devolve campos a mais.

## For the reader

Chosen: as regras ficam num **módulo único e puro** (`ajustes-fim-de-semana`), com os limites 10%, 85% e 4 h numa constante nomeada.

Why: o Cenário 2 e o 3 precisam obedecer exatamente às mesmas travas; uma regra só, em um lugar, garante isso e é fácil de testar com contas à mão e de ajustar depois.

Chosen: a perda de uma redução de horário é **estimada pela proporção das horas cortadas** sobre as horas do dia.

Why: o sistema não tem a venda hora a hora; o cartão avisa que é estimativa, e o teto de perda usa o faturamento (não a margem), então funciona mesmo sem margem informada.

Chosen: quando uma trava para o cenário, ele mostra **o corte possível dentro dos limites** e o status "Não resolve sozinho", nunca um fechamento maior.

Why: protege a loja de sugestões absurdas e aponta o Cenário 3 como o caminho (contratar e reduzir um pouco).

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite + Tailwind (tela), como já está
**Primary Dependencies**: nenhuma nova
**Storage**: nenhuma mudança (sem migration)
**Testing**: Vitest com contas à mão (ordem dos passos, corte até 4 h, fechar domingo e sábado, proteção dos dias de maior faturamento, travas de 10% e 85%, "faltam X h", margem em branco, casos de borda) e Supertest (Diagnóstico com a loja do caso real, perfis); os testes atuais dos cenários 2 e 3 que esperavam fechar dia útil são refeitos à mão e a mudança de expectativa é anotada
**Target Platform**: Docker Compose local
**Project Type**: web (api + front)
**Performance Goals**: Diagnóstico segue em < 2 s (o Cenário 3 testa até ~150 estados de fim de semana, cada um é uma conta curta)
**Constraints**: dias úteis nunca mudam; valores em reais só para o dono (campos ausentes, não nulos, para os demais); cenários 1, 4 e 5 e as contratações não mudam de resultado; os limites ficam em uma constante
**Scale/Scope**: 2 dias de fim de semana, 3 travas, 1 status novo

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
backend/node/src/modules/escala/
├── ajustes-fim-de-semana.ts (+test)   # TRAVAS; estados do fim de semana (original, reduzido N h, fechado); perda estimada; sequência do Cenário 2
├── cenarios.ts                        # montarEconomia usa a sequência; novos campos; margem em branco = nulo; destaque ignora "não resolve"
├── cenarios-dias.ts                   # escolherDiasAFechar deixa de ser usado pelo Cenário 2; melhorCombinacao recebe só estados permitidos (fatia 4)
├── comparativo.ts (+test)             # status "nao_resolve", ajustes de horário por coluna, alerta de margem
frontend/react/src/features/diagnostico/
├── Comparativo.jsx                    # selo "Não resolve sozinho", "Mudança de horário" com reduções e fechamentos
└── Cenarios.jsx                       # detalhe do Cenário 2: passos aplicados, o que falta, trava que parou, aviso de margem
README.md
specs/012-cenarios-travas-fim-de-semana/
```

**Structure Decision**: a regra nova mora em arquivo próprio (puro, sem banco) para não inflar `cenarios.ts` (586 linhas) e poder testar cada passo com números à mão; o resto só consome o resultado.

## Fatias de entrega

1. **Núcleo das travas (US1 e US2, sem tela):** `ajustes-fim-de-semana.ts` com a ordem dos passos, o piso de 4 h, a proteção dos dias de maior faturamento, a perda estimada e as travas; tudo com testes à mão.
2. **Cenário 2 usa o núcleo (US1, US2 e US3 no servidor):** novos campos e status, textos dos passos, margem em branco como nulo, destaque que ignora "não resolve sozinho", comparativo com status e ajustes; testes de integração com a loja do caso real.
3. **Tela (US3 e US4):** selo "Não resolve sozinho", linha de mudança de horário com reduções, detalhe do Cenário 2 com os passos e o que falta, aviso de margem; conferência no navegador.
4. **Cenário 3 (US5) e fechamento:** estados permitidos e travas no Equilíbrio, README, conferência final.

## Riscos

- **Testes antigos** dos cenários 2 e 3 esperam fechar dias úteis: as expectativas serão refeitas à mão, uma a uma, com o porquê anotado.
- **Estimativa uniforme por hora**: com a venda só por dia, cortar 2 h de um dia de 12 h tira 1/6 da venda dele; é uma suposição avisada no cartão.
- **Cenário 3 depende dos custos e da margem**: sem eles continua "indisponível", como hoje.
