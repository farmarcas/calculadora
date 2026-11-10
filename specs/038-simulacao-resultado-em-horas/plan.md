# Implementation Plan: Resultado da simulação em horas e porcentagem

**Branch**: `feat/simulacao-resultado-em-horas` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/038-simulacao-resultado-em-horas/spec.md`

## Summary

O card "Resultado da simulação" deixa de mostrar reais e passa a mostrar a variação em % da venda e do custo de pessoal, uma tabela Hoje × Simulação × Mudança (horas abertas, pessoas, horas contratadas e hora extra em horas), o horário dos 7 dias, o status, a causa e o que contratar. O servidor devolve um bloco novo `emHoras`, igual para todos os perfis e sem valores em reais; a tela reaproveita os componentes das linhas de cenário.

## For the reader

Chosen: o servidor entrega o resultado já em horas e porcentagem, igual para dono, gestor e consulta.

Why: hoje o gestor não recebe venda nem custo, então não teria as variações; calcular lá e devolver só % resolve sem abrir nenhum valor.

Chosen: os campos em reais continuam existindo, só para o dono, mas o card não os usa.

Why: a lista, a comparação de simulações salvas e o passo de contratações ainda dependem deles.

Chosen: a faixa dos 7 dias, a pill e os textos vêm dos componentes das linhas de cenário.

Why: um só visual para o mesmo conceito, sem duplicar regras.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API); React 18 + Vite + Tailwind (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança

**Testing**: Vitest (unidade e tela) e testes de integração da API (por perfil)

**Target Platform**: web (computador e celular)

**Project Type**: web (API + tela)

**Performance Goals**: sem mudança perceptível; o cálculo extra é uma passada sobre as vendas já lidas

**Constraints**: nenhum valor em reais nem salário no bloco novo; card igual para os três perfis; o cálculo da simulação não muda

**Scale/Scope**: 1 módulo novo no servidor, 1 campo novo no resultado, 1 componente novo no card e remoção das linhas em reais do painel

## Constitution Check

- I (Spec Kit): spec aprovada; plano e tarefas passam pelo seu OK antes de código. ✔
- II, V (Docker, dados protegidos): nada novo; nenhum comando destrutivo. ✔
- III (Stack): sem tecnologia nova. ✔
- IV (Banco só muda por migration): não há mudança de banco. ✔
- VII (Começar pequeno): só apresentação; nenhum cálculo muda. ✔

Gate aprovado; reavaliado depois do desenho, segue aprovado.

## Project Structure

### Documentation (this feature)

```text
specs/038-simulacao-resultado-em-horas/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── resultado-em-horas.md
└── tasks.md   # etapa seguinte
```

### Source Code (repository root)

```text
backend/node/src/modules/simulacoes/
├── resultado-em-horas.ts          # NOVO: status, causa, variações em %, pessoas, horas (puro)
├── resultado-em-horas.test.ts     # NOVO
├── resultado.ts                   # calcula as entradas do bloco (venda real, folha de hoje, hora extra em horas) e o devolve para todos
└── simulacoes.routes.integration.test.ts   # igual nos três perfis, sem reais

frontend/react/src/features/
├── simulacao/PainelResultado.jsx        # troca as linhas em reais pelo card em horas e %
├── simulacao/ResultadoEmHoras.jsx       # NOVO: tiles de %, tabela Hoje × Simulação, faixa dos dias, contratar
├── simulacao/resultado-regras.js(+test) # NOVO: textos, mudança, contratar com as horas do parcial (puro)
└── diagnostico/cartao/linha-regras.js   # (da spec 037) reaproveitado: faixaDosDias, textoDaVariacao, textoDoTotal
```

**Structure Decision**: a decisão fica numa função pura no servidor; a tela recebe o bloco pronto. O resto do resultado (e quem o usa) não muda.

## Design

1. **Entradas do bloco (`resultado.ts`).** Além do que já calcula, passa a calcular, para todos os perfis: a venda real das horas que fecham e a venda real estimada das horas novas (mesma conta, sobre a venda real), o faturamento mensal real, a folha do quadro de hoje, o custo adicional (folha das vagas mais hora extra), as pessoas e as horas contratadas de hoje e da simulação, e a hora extra em horas.
2. **Função pura (`resultado-em-horas.ts`).** Monta o `emHoras`: variações em % (uma casa, com sinal, sem zero negativo), estados "não estimada" e "sem salários", status (Inviável, Vende mais, Perde venda, Equipe menor que hoje, Cobre o horário) e uma causa só ("Sem farmacêutico no quadro.", "Faltam X h de <função>.", "Sem venda por hora: perda não estimada.", "Venda das horas novas é estimada.").
3. **Resposta.** `resultado.emHoras` vai para qualquer perfil; os campos em reais existentes ficam só para o dono, como hoje.
4. **Tela.** O painel mostra: título e ficha do tipo de solução; pill de status; dois números grandes (Venda e Custo de pessoal); total de horas e faixa dos 7 dias; tabela Hoje × Simulação × Mudança; "Contratar" por função com as horas do parcial; faixa amarela de causa; botão e texto de apoio como hoje. Durante o cálculo mostra o carregamento de hoje.
5. **Reuso.** `faixaDosDias`, `textoDaVariacao` e `textoDoTotal` das linhas de cenário; a tela adapta o horário da simulação (que usa `aberta`) ao formato da faixa.
6. **Limpeza.** Sai do painel o bloco em reais (saldo, linhas de folha, hora extra, margem, economia), a fórmula do saldo e a frase da régua; as funções que só eles usavam saem junto.
7. **Fora do card.** O passo de contratações ainda mostra a hora extra em reais para o dono; ele não faz parte desta entrega.

## Complexity Tracking

Nenhuma violação a justificar. Risco: o servidor passa a calcular as % com os custos também para gestor e consulta; mitigado por teste que garante que `emHoras` não tem nenhum campo em reais nem salário.
