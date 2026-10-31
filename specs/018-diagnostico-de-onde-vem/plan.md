# Implementation Plan: Diagnóstico — "De onde vêm esses números"

**Branch**: `feat/diagnostico-de-onde-vem` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

## Summary

O servidor já devolve tudo o que a seção precisa (cobertura por hora com o mínimo exigido, vendas por hora, resultado por regra, turnos, equipe e totais). O trabalho é **de apresentação**: um montador puro de dados no front, o cartão com 3 abas e seus componentes. Há **um acréscimo** no servidor (aditivo): a estimativa de 8h24 para a regra de 42h. Nenhum cálculo existente muda e nada acima da seção é tocado, a não ser o ponto onde ela é montada.

## For the reader

Chosen: a tela só monta e desenha o que o Diagnóstico já calcula; a única conta nova (8h24) fica no servidor, com a mesma função de capacidade de sempre.

Why: assim a seção nunca discorda do resto da página, e trocar de aba é instantâneo.

## Technical Context

**Language/Version**: React 18 + Vite + Tailwind 3.4 (tela), Node 22 + TypeScript (um campo novo no Diagnóstico). **Dependencies**: nenhuma nova.
**Storage**: nenhum (sem migration).
**Testing**: Vitest no front (montador e contas puras) e no servidor (estimativa de 8h24); conferência da tela em 4 larguras.
**Performance Goals**: trocar de aba sem recalcular (dados memorizados por loja e regra).
**Constraints**: R$ só para o dono; nada acima da seção muda; sem rolagem horizontal da página de 360 a 1920 px.
**Scale/Scope**: uma loja por vez; até ~24 horas no eixo, ~6 turnos, dezenas de pessoas.

## Constitution Check

- I Spec Kit: spec aprovada; plano a seguir para tarefas. OK. II Docker: tudo no Compose. OK. III Stack padrão: sem stack nova. OK.
- IV Banco só por migration: nenhuma mudança de tabela. OK. V Dados locais protegidos: nenhum comando destrutivo. OK.
- VI–VIII: decisões técnicas do agente em research.md; fatias pequenas. OK.

Sem violações.

## Project Structure

```text
specs/018-diagnostico-de-onde-vem/  plan.md, research.md, data-model.md, quickstart.md, contracts/, tasks.md
backend/node/src/modules/escala/diagnostico.ts   # + regras[r42].com8h24 (aditivo) e teste
frontend/react/src/features/diagnostico/onde-vem/
├── OndeVemSecao.jsx          # cartão, abas (URL ?aba=), estados, nota jurídica
├── montar.js (+ montar.test.js)    # view-model puro: eixo, turnos recortados, picos, observação, linhas de equipe
├── AbaCobertura.jsx, GradeCobertura.jsx
├── AbaRegras.jsx (TabelaRegras.jsx, BlocoOito24.jsx)
├── AbaEquipe.jsx, LinhaDoTempo.jsx
└── atalhos.js                # abrir o Cadastro (loja e aba) pelo endereço
frontend/react/src/features/diagnostico/Diagnostico.jsx   # só o ponto de montagem
```

**Structure Decision**: pasta própria `onde-vem/`; `Diagnostico.jsx` troca a pilha de blocos antigos pelo cartão e mantém, abaixo dele, os dois blocos cuja informação só existe ali (ver research 5).

## Complexity Tracking

Nenhuma violação.
