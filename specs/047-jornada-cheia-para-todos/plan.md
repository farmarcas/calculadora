# Implementation Plan: Jornada cheia para todos

**Branch**: `feat/jornada-cheia-para-todos` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/047-jornada-cheia-para-todos/spec.md`

## Summary

Duas mudanças que andam juntas. (1) O passo de esticar da spec 046 ganha uma **segunda fase**: depois de cobrir as faltas, cada pessoa é completada até a **jornada cheia da regra** em cada dia que trabalha (8h24 com a convenção; 8h sem ela; 7h20 na regra de 44h), no fim do turno e, se não couber, no começo. (2) A Simulação passa a **guardar minutos inteiros**: o servidor deixa de exigir quartos de hora e a tela deixa de arredondar para quarto, para a jornada poder ser exatamente 8h24 e o horário do Cadastro (14h38) ser mantido. O servidor e a tela usam a mesma regra, e o banco não muda (as colunas já são decimais).

## For the reader

Chosen: a jornada por dia é `min(máximo por dia da regra, teto da semana ÷ dias da regra)`, e a pessoa é limitada à carga contratada.

Why: dá 8h24 (convenção), 8h (sem convenção) e 7h20 (44h em 6 dias) sem número novo.

Chosen: a fase 2 completa só os dias que a pessoa já trabalha; não cria dias.

Why: quais dias a pessoa trabalha é decisão das folgas (spec 042) e do Cadastro.

Chosen: a Simulação aceita minutos inteiros (`hora × 60` inteiro) e continua recusando fração de minuto; arrastar continua de 15 em 15 minutos.

Why: é o que o dono pediu e mantém a barra de arrastar simples.

Chosen: os horários do Cadastro deixam de ser arredondados para quarto de hora; ficam como estão (em minutos).

Why: o arredondamento era um remendo do limite de 15 minutos; sem o limite, não há motivo.

## Technical Context

**Language/Version**: Node 22 + TypeScript (servidor); React 18 (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma migration; as horas dos turnos já são decimais

**Testing**: Vitest (unidade e integração), conferência no navegador

**Target Platform**: web + API

**Project Type**: web (backend + frontend)

**Performance Goals**: a conta dos cenários continua em menos de 1 segundo

**Constraints**: Cadastro intacto; dia nunca passa do máximo da regra nem a semana do teto; horário fixo e vagas fora; a jornada cheia nunca aumenta contratação; fração de minuto continua recusada

**Scale/Scope**: até ~20 pessoas por loja, 7 dias

## Constitution Check

- Spec Kit seguido: sim.
- Sem migration, segredo ou autenticação: sim.
- Regra de negócio com teste unitário: sim; as funções são puras.
- Contrato HTTP preservado: sim; muda só o conjunto de horas aceitas (de quartos para minutos).

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/047-jornada-cheia-para-todos/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/horas-em-minutos.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/node/src/modules/
├── escala/semana-com-folgas.ts          # esticarTurnos: fase 2 (completar a jornada), em minutos
├── simulacoes/simulacoes.schemas.ts     # hora: minutos inteiros (no lugar de quartos)
├── simulacoes/vagas.ts                  # emQuartosDeHora → emMinutosDeHora (sem distorcer o Cadastro)
frontend/react/src/features/simulacao/escala/
├── folgas-regras.js                     # esticarTurnos: fase 2, mesmos casos
├── escala-regras.js                     # turnosParaGravar: minutos; dica do esticamento
└── movimento-regras.js                  # mover mantém a duração (sem arredondar a saída)
```

**Structure Decision**: a fase 2 mora na mesma função da fase 1; a tela repete a função com os mesmos casos de teste.

## Complexity Tracking

Nenhuma violação a justificar.
