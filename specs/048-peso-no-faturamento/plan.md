# Implementation Plan: Peso do custo de pessoal no faturamento

**Branch**: `feat/peso-no-faturamento` (junto da spec 049) | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

## Summary

O servidor já calcula, para o dono, `custoPctFaturamento { hoje, depois }` em cada linha de cenário (branch `feat/custo-pessoal-no-faturamento`). Esta entrega **completa o campo** com o aumento em pontos percentuais (`aumentoPp`) e em reais por mês (`aumentoMensal`), **tira o `custoPct` (% sobre a folha) do cartão** e dá aos outros perfis só o sentido da mudança. A tela troca a coluna "Custo de pessoal". Sem banco.

## For the reader

Chosen: reaproveitar `custoPctFaturamento` e acrescentar `aumentoPp` e `aumentoMensal`, todos só para o dono.

Why: a conta (folha, faturamento de referência, custo adicional) já é a do resumo; só faltava expor a diferença.

Chosen: `custoPct` deixa de ir para a tela; gestor e consulta recebem `custoSentido` (`aumenta`, `igual` ou `diminui`) em vez de número.

Why: o % sobre a folha revelaria a folha e confunde; o sentido basta para quem não vê custo.

Chosen: a visão de grupo fica fora.

Why: não existe tela de grupo com folha e faturamento.

## Technical Context

**Language/Version**: Node 22 + TypeScript (servidor); React 18 (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança

**Testing**: Vitest (unidade e integração), conferência em Cosmópolis e Paulínia

**Constraints**: só o dono recebe custo; nada de R$ para os outros perfis; mesmo faturamento de referência do resumo

## Constitution Check

Spec Kit seguido; sem banco, segredo ou autenticação; regra com teste; contrato HTTP preservado (campos novos opcionais; `custoPct` some do cartão: mudança consciente).

## Project Structure

```text
backend/node/src/modules/escala/linhas-cenarios.ts        # custoPctFaturamento ganha aumentoPp e aumentoMensal; custoSentido para os outros
backend/node/src/modules/escala/linhas-cenarios.test.ts   # casos de Cosmópolis e Paulínia
backend/node/src/modules/escala/diagnostico.ts            # passa dono e custos
frontend/react/src/features/diagnostico/cartao/
├── LinhaDeCenario.jsx                                     # nova coluna "Custo de pessoal"
└── linha-regras.js                                        # textos do peso, p.p., R$ e sentido
```
