# Implementation Plan: Cenários que já contam as folgas

**Branch**: `feat/cenarios-com-folgas` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/043-cenarios-com-folgas/spec.md`

## Summary

Hoje o motor dos cenários conta por **horas** (cada pessoa até o limite da regra) e a Simulação abre com os turnos do Cadastro (7 dias). O plano cria no servidor um módulo puro, **a semana com folgas**, que pega a equipe e os horários do Cadastro, aplica as folgas e o rodízio de domingo (as mesmas regras da spec 042), mede **a cobertura real por hora** e daí tira o que falta contratar e em quais turnos. O motor dos cenários passa a usar essa falta real, e "Personalizar" cria a Simulação já com as folgas e os turnos das contratações. O banco não muda.

## For the reader

Chosen: um módulo novo no servidor (`semana-com-folgas.ts`) calcula folgas, cobertura real e turnos das contratações, e é a fonte única do cenário e da Simulação.

Why: o cenário já nasce no servidor; se a conta ficasse só na tela, o cartão e a Simulação voltariam a divergir.

Chosen: a falta do cenário passa a ser "horas exigidas que a equipe, com folgas, não cobre hora a hora", no lugar de "horas exigidas menos horas de capacidade".

Why: só a cobertura hora a hora enxerga o que as folgas descobrem; a conta por horas achava que as folgas não custavam nada.

Chosen: a contratação sugerida é posicionada em turnos e conferida; se ainda sobrar falta, o motor aumenta a contratação em passos de 1 turno até fechar (com um teto), e se não fechar o cenário diz "Não resolve sozinho".

Why: garante que o número do cartão é o que a Simulação confirma, sem prometer o que não fecha.

Chosen: a tela mantém "Sugerir folgas" (spec 042) com as mesmas regras, conferidas por testes com os mesmos casos nos dois lados.

Why: o botão continua útil depois de ajustes, e os testes iguais impedem que as duas contas divirjam.

## Technical Context

**Language/Version**: Node 22 + TypeScript (servidor); React 18 (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança de banco; Simulações já guardam `turnos` e `vagas` com turnos

**Testing**: Vitest (unitário do módulo e do motor), testes de integração das rotas de cenários e de simulações, conferência no navegador

**Target Platform**: web + API

**Project Type**: web (backend + frontend)

**Performance Goals**: calcular os cenários de uma loja em menos de 1 segundo

**Constraints**: Cadastro intacto; farmacêutico obrigatório em todas as horas e mínimos de cobertura inalterados; mesmos textos sem R$ para quem não pode

**Scale/Scope**: até ~20 pessoas por loja, 3 regras, 7 dias

## Constitution Check

- Spec Kit seguido: sim.
- Sem mudança de banco, segredo ou autenticação: sim.
- Regra de negócio com teste unitário (Vitest, TDD): sim; o módulo é puro.
- Contrato HTTP preservado (`/api/v1`, erro padrão): sim; só ganham campos e os valores mudam.

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/043-cenarios-com-folgas/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/cenarios-com-folgas.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/node/src/modules/
├── escala/
│   ├── semana-com-folgas.ts             # novo: folgas, rodízio, cobertura real e turnos das contratações (puro)
│   ├── semana-com-folgas.test.ts        # novo
│   ├── cenarios.ts                      # o motor usa a falta real quando há horários da equipe
│   └── escala.service.ts                # passa os horários do Cadastro (turnosDoCadastro) ao motor
├── regras/capacidade.ts                 # verificarRegra aceita a cobertura real (opcional) no lugar da capacidade por horas
└── simulacoes/
    ├── vagas.ts                         # vagasSugeridas usa o módulo novo (vagas com turnos)
    └── simulacoes.service.ts            # criar com comVagasSugeridas já aplica folgas e turnos
frontend/react/src/features/diagnostico/Comparativo.jsx   # Personalizar deixa de remontar turnos na tela
frontend/react/src/features/simulacao/escala/folgas-regras.js   # mesmas regras, testes com os mesmos casos
```

**Structure Decision**: o módulo novo fica em `escala/` ao lado do motor; `verificarRegra` ganha um parâmetro opcional, então chamadas sem horários (testes, cenários antigos) seguem iguais.

## Complexity Tracking

Nenhuma violação a justificar.
