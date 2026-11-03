# Implementation Plan: Cenário 3 com horário estendido

**Branch**: `feat/cenario-3-estender-horario` | **Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

## Summary

A busca do Cenário 3 (`estadosPermitidos` / `melhorEstado`) passa a testar, para sábado e domingo, também horários **mais longos** (abrir mais cedo e/ou fechar mais tarde, até 3 h por dia). Cada horário é avaliado como hoje: a contratação necessária entra no custo; a venda das horas novas é estimada e vira margem ganha, que abate o impacto. Sem extensão que compense, nada muda para as lojas de hoje. O cartão mostra a extensão, o aviso de estimativa e, quando o impacto é positivo, o selo "Melhor resultado".

## For the reader

Chosen: acrescentar "estender" às opções que o Cenário 3 já compara, usando a mesma conta de contratação e margem que ele usa para cortar.

Why: assim o Cenário 3 continua sendo "a melhor combinação", sem criar um cenário novo, e as lojas em que estender não compensa ficam exatamente como estão.

## Technical Context

**Language/Version**: TypeScript (Node 20) no servidor; React 18 + Vite + Tailwind na tela
**Primary Dependencies**: as já usadas (Vitest; sem biblioteca nova)
**Storage**: N/A (sem migration, sem tabela nova)
**Testing**: Vitest (`ajustes-fim-de-semana.test.ts`, `cenarios.test.ts`, `comparativo.test.ts`, testes do front)
**Target Platform**: Docker Compose local
**Project Type**: web (backend + frontend)
**Performance Goals**: a busca passa de ~150 para ~500 horários por loja; precisa seguir abaixo de 1 s por diagnóstico
**Constraints**: valores em R$ só para o dono; contrato HTTP só ganha campos opcionais; lojas sem extensão vantajosa mantêm o resultado de hoje
**Scale/Scope**: 1 cenário, 1 tela

## Constitution Check

- I. Spec Kit: cumprido (spec 020 → plano → tarefas → implementação).
- II. Docker: testes e conferência no ambiente local.
- III. Stack: a existente.
- IV. Banco só por migration: nenhuma mudança de banco.
- V. Dados locais protegidos: nada destrutivo; dados reais fora do git.
- VI/VIII. Linguagem simples e decisões técnicas do agente: cumprido.
- VII. Começar pequeno: só sábado e domingo; segunda a sexta ficam para a fase 2.

Resultado: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/020-cenario-3-estender-horario/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cenarios.md
└── tasks.md   # /speckit-tasks
```

### Source Code

```text
backend/node/src/modules/escala/
├── ajustes-fim-de-semana.ts   # estados com horário estendido, passo "estender", venda das horas novas
├── cenarios.ts                # Cenário 3: ganho das horas novas, resultado, avisos, robustez
├── comparativo.ts             # selo "Melhor resultado", sugerido com teste de robustez
└── *.test.ts
frontend/react/src/features/diagnostico/
├── Comparativo.jsx            # composição "folha − margem ganha", selo, aviso de estimativa
└── comparativo-regras.js
```

**Structure Decision**: web app existente; só se alteram os arquivos acima.

## Complexity Tracking

Sem violações a justificar.
