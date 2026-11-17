# Implementation Plan: Folgas sugeridas na Simulação

**Branch**: `feat/folgas-sugeridas` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/042-folgas-sugeridas/spec.md`

## Summary

Um botão "Sugerir folgas" no card "Escala da semana" tira turnos de quem passa do limite de dias da regra, escolhendo os dias de menor necessidade e espalhando o domingo (ao menos 1 em 3 pessoas por função). É uma função pura na tela, que devolve os turnos que ficam; a gravação usa a mesma chamada de turnos da Escala por hora. O servidor e o banco não mudam.

## For the reader

Chosen: a sugestão é calculada na tela, numa função pura que recebe o quadro, os turnos e a cobertura por hora.

Why: a tela já tem a cobertura e o mínimo de cada hora; não precisa de regra nova no servidor e fica fácil de testar.

Chosen: as folgas são gravadas nos turnos da Simulação (os mesmos que a Escala por hora grava), e "Desfazer sugestão" regrava os turnos de antes.

Why: assim o card, a grade e os avisos de regra usam uma só escala, e o Cadastro nunca muda.

Chosen: o domingo vira rodízio numa semana típica (ao menos 1 em cada 3 pessoas da função folga), explicado em uma frase no card.

Why: a lei fala em 1 domingo a cada 3 semanas; a tela mostra uma semana, então o rodízio fica explicado, não desenhado em 3 semanas.

## Technical Context

**Language/Version**: React 18 + Vite + Tailwind; servidor sem mudança

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança (turnos da Simulação, já gravados por `PUT /simulacoes/:id { turnos }`)

**Testing**: Vitest nas funções puras; conferência no navegador (dono, gestor, visualizador)

**Target Platform**: web

**Project Type**: web (só tela)

**Performance Goals**: a sugestão e a cobertura respondem em menos de 1 segundo

**Constraints**: nada no Cadastro; avisos de regra não impedem salvar; sem R$

**Scale/Scope**: até ~15 pessoas por função, 7 dias

## Constitution Check

- Spec Kit seguido: sim.
- Só tela, tokens do Alquimia, pt-BR simples: sim.
- Sem mudança de banco, API ou segredo: sim.
- Sem R$: sim.

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/042-folgas-sugeridas/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
frontend/react/src/features/simulacao/
├── SimulacaoPage.jsx                    # sugerir/desfazer: grava os turnos pela chamada que já existe
└── escala/
    ├── folgas-regras.js                 # novo: sugerirFolgas, resumo dos avisos, texto do rodízio (função pura)
    ├── folgas-regras.test.js            # novo
    └── EscalaDaSemana.jsx               # botão "Sugerir folgas" / "Desfazer sugestão", avisos e frase do rodízio
```

**Structure Decision**: a conta fica em arquivo puro novo ao lado de `escala-regras.js`, reaproveitando `recalcularCobertura`, `diasDasAbas` e `turnosParaGravar`.

## Complexity Tracking

Nenhuma violação a justificar.
