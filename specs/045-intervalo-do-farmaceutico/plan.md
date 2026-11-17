# Implementation Plan: Intervalo de até 2 horas não precisa de cobertura

**Branch**: `feat/intervalo-farmaceutico-sem-cobertura` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/045-intervalo-do-farmaceutico/spec.md`

## Summary

A conta de "quem está presente em cada hora" aparece repetida em cinco lugares (a avaliação da Simulação, a cobertura do Diagnóstico, a distribuição do parcial/redistribuição, a conta real dos cenários e o recálculo na tela). Todas descontam a pessoa durante o intervalo. A mudança é trocar esse critério: **intervalo de até 2 horas não desconta**; acima disso, desconta como hoje. Vale para todas as funções. O servidor e a tela ficam com o mesmo critério, e a tela passa a explicar na dica. Sem banco e sem API nova.

## For the reader

Chosen: uma constante única, `LIMITE_INTERVALO_SEM_COBERTURA_H = 2`, usada em todos os pontos que medem presença, no servidor e na tela.

Why: o critério fica igual em todo lugar e muda em um só ponto se o jurídico pedir outro limite.

Chosen: a regra não olha a função da pessoa.

Why: o pedido é para as três funções, então não há exceção a manter.

Chosen: a pessoa continua aparecendo "em intervalo" na barra e na dica, mas não abre falta.

Why: o dono continua vendo o horário de almoço; só deixa de aparecer como buraco.

## Technical Context

**Language/Version**: Node 22 + TypeScript (servidor); React 18 (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança

**Testing**: Vitest (unidade e integração), conferência no navegador

**Target Platform**: web + API

**Project Type**: web (backend + frontend)

**Performance Goals**: sem mudança

**Constraints**: Cadastro intacto; regras de jornada, intervalo mínimo e descanso entre turnos intactas; intervalos acima de 2h dão os mesmos números de antes

**Scale/Scope**: cinco pontos de código

## Constitution Check

- Spec Kit seguido: sim.
- Sem mudança de banco, segredo ou autenticação: sim.
- Regra de negócio com teste unitário: sim.
- Contrato HTTP preservado: sim; mudam só os valores de cobertura.

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/045-intervalo-do-farmaceutico/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/node/src/modules/
├── regras/intervalo.ts                    # novo: LIMITE_INTERVALO_SEM_COBERTURA_H e `intervaloDesconta(t)`
├── simulacoes/avaliar.ts                  # presente(): usa o critério
├── escala/cobertura.ts                    # cobre(): usa o critério
├── escala/distribuir-parcial.ts           # cobreCelula(): usa o critério
├── escala/semana-com-folgas.ts            # presente(): usa o critério
frontend/react/src/features/simulacao/escala/
├── escala-regras.js                       # presente(), quemEstaEmIntervalo e textos usam o critério
├── LinhaDaPessoa.jsx                      # dica da barra
└── LinhaDaFuncao.jsx                      # dica da célula
```

**Structure Decision**: um arquivo pequeno e puro no servidor com o critério; a tela repete a constante (não há código compartilhado entre os dois lados) e os testes dos dois lados usam os mesmos casos.

## Complexity Tracking

Nenhuma violação a justificar.
