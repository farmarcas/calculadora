# Implementation Plan: Simulação compacta (Horário e vendas + Resultado)

**Branch**: `feat/simulacao-compacta` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

## Summary

O passo "Horário e vendas" e o painel "Resultado da simulação" são refeitos: campos de abertura e fechamento com + e − (30 minutos), lista de 400 px ao lado de um gráfico que preenche o resto, e o Resultado fixo à direita com a linha nova "Venda estimada". O servidor passa a calcular, para qualquer dia, a venda estimada das horas novas (as que o Cadastro não abre e a simulação abre) e a entregar quais horas são novas; o saldo vira uma função única contra a folha atual, a mesma regra dos cartões dos cenários. O que a Simulação já faz com contratações, hora extra e folha extra não muda.

## For the reader

Chosen: reaproveitar o gráfico, o painel e a lista de horários que já existem, trocando só o que o desenho muda, e fazer o servidor calcular a venda estimada das horas novas com a regra dos cenários.

Why: os dados do gráfico e do resultado já vêm do servidor; calcular a venda estimada lá garante que o cartão do cenário e a Simulação desse cenário mostrem o mesmo saldo.

## Technical Context

**Language/Version**: TypeScript (Node 20) no servidor; React 18 + Vite + Tailwind na tela
**Primary Dependencies**: as já usadas; sem biblioteca nova
**Storage**: N/A (sem migration; o horário simulado já é gravado como hoje)
**Testing**: Vitest no servidor (venda estimada das horas novas, saldo, dono × não dono) e na tela (passo de 30 minutos, limites, digitação, estados das barras, resumos do dia); interação, rolagem do Resultado e alinhamento conferidos no navegador com as simulações reais
**Target Platform**: Docker Compose local
**Project Type**: web (backend + frontend)
**Performance Goals**: o Resultado recalcula em menos de 1 s depois de cada clique (como hoje, com a espera já existente antes de enviar ao servidor)
**Constraints**: valores em reais só para o dono; campos novos opcionais; contratações, hora extra, folha extra e a regra do "sugerido" não mudam; Alquimia (tokens, sem valores soltos), verde de texto `--text-success-strong`; computador (versão para celular fica de fora)
**Scale/Scope**: 1 passo da tela, 1 painel, 1 função de saldo, 1 função de venda estimada, campos opcionais novos na resposta da simulação

## Constitution Check

- I. Spec Kit: cumprido (spec 025 → plano → tarefas → implementação).
- II. Docker: conferência no ambiente local.
- III. Stack: a existente; nenhuma tecnologia nova.
- IV. Banco: nenhuma mudança.
- V. Dados locais protegidos: nada destrutivo (as simulações de teste ficam como estão).
- VI/VIII. Linguagem simples e técnico do agente: cumprido.
- VII. Começar pequeno: sem versão de celular, sem mudar contratações nem hora extra.

Resultado: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/025-simulacao-compacta/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/simulacao.md
└── tasks.md   # /speckit-tasks
```

### Source Code

```text
backend/node/src/modules/simulacoes/
├── venda-estimada.ts     # venda estimada das horas novas de qualquer dia + quais horas são novas (+ venda-estimada.test.ts)
├── saldo-simulacao.ts    # a função única do saldo contra a folha atual (+ saldo-simulacao.test.ts)
└── resultado.ts          # usa as duas funções; novos campos opcionais: vendaEstimada, vendaPorHora.novas, vendaPorHora.estimada

frontend/react/src/features/simulacao/
├── SimulacaoPage.jsx     # linha com o card Horário e vendas (flex) e o Resultado (360 px, fixo)
├── PassoHorario.jsx      # lista de 400 px + coluna do gráfico; cabeçalho, rodapé e dica novos
├── horario/
│   ├── CampoDeHorario.jsx    # campo com + em cima e − embaixo; setas ↑ ↓; digitação com volta ao último válido
│   ├── LinhaDoDia.jsx        # sigla e horas, dois campos, selo Alterado e Fechar dia / Abrir dia
│   └── horario-regras.js (+ .test.js)  # passo de 30 min, limites, validação, horas do dia, estado do dia
├── GraficoVendas.jsx     # estados da barra (aberta, pico, fechada, hora nova), legenda e resumos novos
├── grafico-regras.js (+ .test.js)      # horas mostradas, estado de cada barra, rótulos, resumos do dia
├── PainelResultado.jsx   # linha "Venda estimada", nomes novos e saldo novo
└── formato.js            # textos e cores em comum
```

## Design

**Servidor.** `venda-estimada.ts` calcula, para cada dia, as horas da simulação que o Cadastro não abre e a venda de cada uma: o valor registrado se for maior que zero, senão 50% da venda da hora vizinha (a última hora aberta no Cadastro, do lado em que a hora nova fica); dia fechado no Cadastro sem venda registrada vale 0. A soma por mês usa a mesma conta dos cenários (média de um dia × 52 ÷ 12). `saldo-simulacao.ts` tem `saldoDaSimulacao({ folhaExtra, horaExtra, vendaEstimada, vendaQueSai })` = −folha extra − hora extra + venda estimada − venda que deixa de entrar (nulo se faltar parte). O Resultado devolve, só ao dono, `vendaEstimada` e `vendaPorHora.estimada` (7 × 24), e a todos `vendaPorHora.novas` (7 × 24, booleanos). `economiaFolha` segue como linha informativa.

**Lista de horários.** A linha do dia vira: sigla e horas do dia, campo de abertura, campo de fechamento, e "Alterado" sobre "Fechar dia". O campo guarda o texto enquanto a pessoa digita e só confirma ao sair, no Enter ou ao clicar em + e −; valor inválido volta ao último válido. O passo de 30 minutos, os limites (00:00 a 24:00, abertura antes do fechamento) e as horas do dia ficam em funções puras testadas. As alterações vão ao servidor como hoje (`horarios` completo), com a mesma espera.

**Dia fechado (estado que o quadro não desenha).** *Proposta, para você ver antes de implementar:* o dia fechado pela simulação mostra a sigla, "Fechado nesta simulação" no lugar dos dois campos (cinza, na largura deles) e, na última coluna, o selo "Alterado" sobre o link **Reabrir**, que volta ao horário do Cadastro. O dia fechado no Cadastro mostra "Fechado" no lugar dos campos e o link **Abrir dia**, que abre num horário padrão de 08:00 a 18:00 (o da maioria das lojas; a pessoa ajusta com + e −). Em ambos, o gráfico do dia fica sem barras abertas.

**Gráfico.** As horas mostradas vão de 06h a 21h e se ampliam para cobrir qualquer hora aberta ou com venda (como já faz hoje). Cada barra tem um destes estados: aberta, pico (maior entre as abertas), fechada na simulação (listrada) ou hora nova (verde claro, borda tracejada verde, rótulo "+0,3" e hora em verde). O gráfico cresce até a altura da lista (a coluna é `flex` com o gráfico em `flex: 1`), sem buraco embaixo. Os três resumos do dia seguem a regra das histórias. Tudo isso sai de `grafico-regras.js`, testado.

**Resultado.** Card de 360 px, `position: sticky; top: 16px`, `align-self: start`, sem passar para baixo em computador. Linhas na ordem do pedido, com "Venda estimada" em verde e "+" quando maior que zero, e "R$ 0" quando nenhum horário aumenta.

**Acessibilidade.** Botões + e − com nome por dia e campo; setas ↑ e ↓ no campo; abas de dia com semântica de abas; textura (tracejado verde × listrado cinza) e sinal "+" além da cor.

## Complexity Tracking

Sem violações a justificar.
