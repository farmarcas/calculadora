# Implementation Plan: Cartões de cenário B2 e painel "Dias e horários"

**Branch**: `feat/cartoes-de-cenario-b2` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

## Summary

O cartão de cenário (hoje dentro de `Comparativo.jsx`) é refeito em componentes menores, na ordem do desenho: faixa de resultado com saldo em destaque, status e comparação, contratações com barras, horas ociosas e faixa da semana. Um painel novo, "Dias e horários", abre pelo link do cartão. No servidor, o saldo passa a ser calculado por uma única função contra a folha atual (a ordem entre os cenários e o "sugerido" não mudam), e dois campos opcionais novos chegam à tela. O horário de cada dia, que a tela precisa para o painel, já vem no que o servidor devolve hoje.

## For the reader

Chosen: reaproveitar os dados que o servidor já entrega, acrescentar só o saldo contra a folha atual e a venda estimada em percentual, e montar o cartão e o painel em componentes pequenos, com as contas em funções puras testadas.

Why: os cenários e os horários por dia já estão calculados; o que muda é como o resultado é somado e mostrado, então o risco fica na apresentação e nos números do saldo.

## Technical Context

**Language/Version**: TypeScript (Node 20) no servidor; React 18 + Vite + Tailwind na tela
**Primary Dependencies**: as já usadas; sem biblioteca nova (foco preso, painel e barras feitos à mão)
**Storage**: N/A (sem migration)
**Testing**: Vitest no servidor (função do saldo, percentual da venda estimada) e na tela (diferença por dia, totais, linhas de contratação, estados das colunas); painel, foco, teclado e responsivo conferidos no navegador com Cosmópolis e as quatro situações de exemplo
**Target Platform**: Docker Compose local
**Project Type**: web (backend + frontend)
**Performance Goals**: sem efeito mensurável; o cálculo novo é aritmética sobre números que já existem
**Constraints**: valores em R$ só para o dono; campos novos opcionais; o cálculo dos cenários e a regra do "sugerido" não mudam; Alquimia (tokens, sem valores soltos), com um token novo de verde de texto (`--text-success-strong`, #3E7500); 360 a 1440 px sem rolagem horizontal
**Scale/Scope**: 3 cartões, 1 painel, 1 função de saldo, 2 campos opcionais novos

## Constitution Check

- I. Spec Kit: cumprido (spec 024 → plano → tarefas → implementação).
- II. Docker: conferência no ambiente local.
- III. Stack: a existente; nenhuma tecnologia nova.
- IV. Banco: nenhuma mudança.
- V. Dados locais protegidos: nada destrutivo.
- VI/VIII. Linguagem simples e técnico do agente: cumprido.
- VII. Começar pequeno: sem mudar regra de cenário, sem tela de Personalizar nova.

Resultado: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/024-cartoes-de-cenario-b2/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cartoes.md
└── tasks.md   # /speckit-tasks
```

### Source Code

```text
backend/node/src/modules/escala/
├── saldo-operacao.ts      # a função única do saldo + testes (saldo-operacao.test.ts)
└── comparativo.ts         # novos campos opcionais: saldoOperacaoMensal, vendaAdicionalPct

frontend/react/src/
├── styles/alquimia.css                         # token --text-success-strong
└── features/diagnostico/
    ├── Comparativo.jsx                         # monta a linha de três cartões e abre o painel
    ├── cartao/
    │   ├── CartaoCenario.jsx                   # ordem do cartão e alturas fixas
    │   ├── FaixaDeResultado.jsx                # saldo + colunas de folha e venda
    │   ├── BlocoContratacoes.jsx               # linhas com letra, barra e integral/parcial
    │   ├── BlocoHorario.jsx                    # faixa de sete dias, legenda e link
    │   ├── PainelDias.jsx                      # painel lateral / folha inferior
    │   └── cartao-regras.js (+ .test.js)       # diferença por dia, totais, linhas de contratação, estado das colunas, sinais e cores
    └── comparativo-regras.js                   # textos de status que continuam valendo
```

## Design

**Dados**: o cartão recebe a coluna do comparativo (já existe) e o horário por dia do cenário e do "manter" (`cenarios.<id>.horarioSemana`, já enviado). Novos campos opcionais na coluna: `saldoOperacaoMensal` (saldo contra a folha atual) e `vendaAdicionalPct` (venda estimada ÷ faturamento mensal). O saldo antigo (contra o Cenário 1) continua no contrato para quem o usa (selos e "sugerido"); o cartão passa a mostrar o novo.

**Saldo** (`saldo-operacao.ts`): `saldoDaOperacao({ economiaFolha, custoFolha, vendaEstimada, vendaPerdida })` = (economia − custo) + (estimada − perdida), com nulos tratados (sem dado de folha ou de venda, o saldo é nulo). Para os cenários, a economia contra a folha atual é 0 (nenhum cenário reduz a folha de hoje) e o custo é o que o cenário acrescenta; a função aceita os dois para cobrir o desenho.

**Faixa de resultado**: grade de duas colunas de mesmo tamanho, altura fixa; o estado de cada coluna (custo, economia ou zero; perda, estimada ou nenhuma) sai de uma função pura que devolve rótulo, valor, apoio, tom e sinal.

**Contratações**: uma linha por contratação, derivada de `inteiras` (cada uma 42h integral) e `parcial` (horas parciais); barra = horas ÷ 42, máximo 100%; bloco com altura de quatro linhas; só as três funções do cálculo.

**Horário**: a diferença por dia = (fechamento − abertura) novo − antes, em horas, com meia hora aceita; totais = soma dos dias; o painel e a faixa usam a mesma lista de dias.

**Painel**: janela de diálogo (`role="dialog"`, `aria-modal`, `aria-labelledby`); abre pela direita (440 px) ou como folha inferior abaixo de 640 px; Esc, clique fora, X e Fechar; foco preso (Tab e Shift+Tab circulam), devolvido ao link; sem animação com movimento reduzido; "Personalizar horários" chama o mesmo `personalizar` do cartão.

**Acessibilidade**: cor nunca sozinha (sinal ou palavra), verde de texto #3E7500, alvos de 44 px, link com `aria-haspopup="dialog"`.

## Complexity Tracking

Sem violações a justificar.
