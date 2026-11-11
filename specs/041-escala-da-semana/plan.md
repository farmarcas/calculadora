# Implementation Plan: Escala da semana

**Branch**: `feat/escala-da-semana` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/041-escala-da-semana/spec.md`

## Summary

Um card novo na Simulação, logo abaixo da "Escala por hora", com a semana de cada pessoa (folgas, intervalos, fechada, Contratação simulada e total da semana). É só tela: lê o mesmo `sim` (quadro, turnos, dias abertos) que a Escala por hora já usa, com funções puras testadas. O servidor e o banco não mudam.

## For the reader

Chosen: o card é um componente novo ao lado da Escala por hora, e o dia escolhido sobe para a página da Simulação.

Why: assim o clique numa célula troca o dia da Escala por hora e rola até ela, sem duplicar estado.

Chosen: todos os números (horas, dias, intervalo) vêm das mesmas funções da Escala por hora.

Why: os totais nunca divergem do que a grade mostra.

Chosen: cores das funções com tokens do Alquimia (verde, azul, amarelo dos tokens `func-*`), definidos em `alquimia.css`.

Why: o quadro pede essas três cores e o DS não deve ganhar cor fora dos tokens.

## Technical Context

**Language/Version**: React 18 + Vite + Tailwind; servidor sem mudança

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança

**Testing**: Vitest nas funções puras (montar a semana, totais, destaque de jornada); conferência no navegador nos três perfis

**Target Platform**: web; no celular, rolagem lateral com a coluna da pessoa fixa (desenho do celular fica para depois)

**Project Type**: web (só tela)

**Performance Goals**: o card atualiza junto com a Escala por hora (menos de 1 segundo após um ajuste)

**Constraints**: sem R$; mesma fonte da Escala por hora; nada gravado ao ver ou clicar

**Scale/Scope**: até ~15 pessoas por loja, 7 dias

## Constitution Check

- Spec Kit seguido (especificar → planejar → tarefas → implementar): sim.
- Só tokens e componentes do Alquimia; pt-BR simples: sim.
- Sem mudança de banco, API ou segredo: sim.
- Sem R$ para nenhum perfil: sim (o card não lê venda nem custo).

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/041-escala-da-semana/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
frontend/react/src/
├── features/simulacao/
│   ├── SimulacaoPage.jsx               # guarda o dia escolhido; renderiza o card abaixo da Escala por hora
│   └── escala/
│       ├── EscalaPorHora.jsx           # passa a aceitar dia/onDia vindos da página
│       ├── EscalaDaSemana.jsx          # novo: o card (cabeçalho, grupos, estado vazio)
│       ├── LinhaDaSemana.jsx           # novo: uma pessoa, 7 células, total
│       ├── semana-regras.js            # novo: funções puras (monta a semana, totais, jornada)
│       └── semana-regras.test.js
└── styles/alquimia.css                 # tokens --escala-semana-* só com tokens do DS
```

**Structure Decision**: componentes de tela na pasta `escala/` da Simulação; a conta fica em arquivo puro novo, reaproveitando `totalDaSemana`, `textoDoTurno`, `textoDoIntervalo` e `contratacoesSimuladas` de `escala-regras.js`.

## Complexity Tracking

Nenhuma violação a justificar.
