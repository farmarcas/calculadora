# Implementation Plan: Card "Resultado da simulação" com o peso da folha (B1)

**Branch**: `feat/coluna-folha-no-faturamento` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

## Summary

O servidor passa a mandar, para o dono, o peso da folha (hoje, depois, diferença, reais) e a folha por mês (antes e depois), pela **mesma função** que a coluna Folha dos Cenários usa; para todos os perfis manda só o sentido do custo (aumenta, igual, diminui). A tela troca o miolo do card: blocos Venda e Folha lado a lado, lista "O que muda" no lugar da tabela, linha Contratar, e o horário a mais reorganizado no quadro cinza. Sem banco e sem rota nova.

## For the reader

Chosen: a conta do peso sai de `linhas-cenarios.ts` para uma função pura única (`pesoDaFolha`), usada pelos Cenários e pela Simulação.

Why: o board pede que os dois lugares mostrem o mesmo número; com uma só função eles não podem divergir.

Chosen: o faturamento da simulação passa a ser o de referência da loja (Cadastro mensal, depois a soma dos dias, depois a base), o mesmo dos Cenários; hoje o card usava só a base.

Why: com bases diferentes, "8,0% hoje" apareceria diferente em cada tela.

Chosen: os valores em reais e os pesos vão num campo novo só do dono (`custoDoDono`), e o sentido do custo vai para todos em `emHoras`.

Why: gestor e consulta nunca recebem custo; o campo simplesmente não existe na resposta deles, como já é o `horarioEstendido`.

Chosen: o estado do chip (aumenta, igual, diminui) vem do custo em reais, e o valor do chip é a diferença dos pesos já arredondados.

Why: mesma regra da spec 050; um custo pequeno que arredonda para 0,0 ainda é "aumenta".

## Technical Context

- **Servidor**
  - Nova função pura `pesoDaFolha({ folhaHoje, custoAdicional, faturamento, vendaPct })` em `backend/node/src/modules/escala/peso-folha.ts` (extraída de `linhas-cenarios.ts`, que passa a usá-la).
  - `resultado-em-horas.ts`: `EmHoras` ganha `custoSentido` (todos); `custoPct` deixa de ir para a tela.
  - `resultado.ts`: campo dono-only `custoDoDono = { pesoHoje, pesoDepois, variacao, reais, folhaHoje, folhaDepois, estado }`, calculado com o faturamento de referência da loja (`faturamentoMensalDe`, o mesmo de `diagnostico.ts`).
  - `simulacoes.service.ts`: manda o faturamento de referência ao cálculo e remove `custoDoDono` e `horarioEstendido` para quem não é dono (como hoje).
- **Tela**
  - `resultado-regras.js`: `textoDoPesoDaSimulacao`, `listaOQueMuda` (substitui `tabelaDoResultado`), cores (âmbar, verde, neutro, cinza) e textos de falta de dados; reaproveita o chip da spec 050 (`CelulaFolha`/`textoDaFolha`).
  - `ResultadoEmHoras.jsx`: blocos Venda | Folha (1 : 1,6), faixa de causa, Horário, lista "O que muda", Contratar.
  - `BlocoHorarioEstendido.jsx`: quadro cinza "Horário a mais: sábado até 23h", selo Recomendado (verde) / Não recomendado (vermelho), "Custo da mercadoria", link "Como calculamos".
- **Testes**: Vitest (API e tela), integração (gestor sem campos de custo) e conferência no navegador em Cosmópolis e Paulínia (coluna a 300 px).

## Constitution Check

Sem conflito: linguagem simples; reais só para o dono; nenhuma dependência nova; sem mudança de banco; uma só conta para o mesmo número.

## Project Structure

```text
specs/052-card-resultado-simulacao/  spec · plan · research · quickstart · tasks
backend/node/src/modules/escala/peso-folha.ts (+ .test.ts)        # conta única
backend/node/src/modules/escala/linhas-cenarios.ts                # passa a usar pesoDaFolha
backend/node/src/modules/simulacoes/resultado-em-horas.ts         # custoSentido
backend/node/src/modules/simulacoes/resultado.ts                  # custoDoDono (dono)
backend/node/src/modules/simulacoes/simulacoes.service.ts         # perfil + faturamento de referência
frontend/react/src/features/simulacao/ResultadoEmHoras.jsx · BlocoHorarioEstendido.jsx · resultado-regras.js (+ testes)
README.md
```

## Complexity Tracking

Nenhuma violação a justificar.
