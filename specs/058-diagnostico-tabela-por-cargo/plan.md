# Implementation Plan: Diagnóstico da escala com tabela por cargo (A1)

**Branch**: `feat/coluna-folha-no-faturamento` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

## Summary

Troca o miolo do card "Diagnóstico da escala" (`QuadroCentral.jsx`) pelo layout A1: duas colunas (aviso, título, parágrafo e barras à esquerda; contratações sugeridas e tabela por cargo à direita) e um rodapé com folha, faturamento e pendências. O cálculo da cobertura não muda: o servidor já devolve, por regra e por cargo, pessoas, capacidade, necessidade, falta e a sugestão de contratação. A tela só passa a ler esses campos por linha.

## For the reader

Chosen: reaproveitar os números por cargo que o servidor já calcula e refazer só a tela do card, sem mexer na conta nem no banco.

Why: assim o card novo mostra exatamente o mesmo que "Contratações sugeridas" e os cenários mostram hoje, e o risco de números diferentes entre telas fica zero.

## Technical Context

**Language/Version**: React 18 + Vite + Tailwind (tokens Alquimia) no front; Node 22 + TypeScript no servidor (sem mudança de cálculo)

**Primary Dependencies**: nenhuma nova

**Storage**: N/A (nada novo é gravado)

**Testing**: Vitest (regras puras do card em `cardDiagnostico.test.js` e um arquivo novo de regras da tabela) e teste de integração existente da rota de diagnóstico para o perfil gestor/consulta

**Target Platform**: navegador (desktop 1440 px e celular)

**Project Type**: web (front React + API Node)

**Performance Goals**: trocar de aba de regra sem nova chamada ao servidor (as três regras já vêm na mesma resposta)

**Constraints**: sem R$ nem faturamento para gestor/consulta, garantido na resposta do servidor (já é assim hoje); sem "p.p.", "pontos" nem "CMV"

**Scale/Scope**: 1 card, 3 regras, poucos cargos por loja

## Constitution Check

- Spec Kit seguido (specify → plan → tasks → implement com aprovação): sim.
- Decisões técnicas do agente, explicadas em linguagem simples: sim.
- Permissões no servidor: o servidor já só inclui `folhaMensal` e `faturamentoMensal` para o dono; nada novo a abrir.
- Design system: tokens do Alquimia; cores fora dele usam o token mais próximo com comentário.
- Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/058-diagnostico-tabela-por-cargo/
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

### Source Code

```text
frontend/react/src/features/diagnostico/
├── QuadroCentral.jsx          # novo layout A1 (duas colunas + rodapé)
├── cardDiagnostico.js         # + linhasPorCargo(), estado "sem falta" ajustado
├── cardDiagnostico.test.js
└── tabela-cargos/
    ├── TabelaPorCargo.jsx     # tabela semântica
    ├── BarrasDeFalta.jsx      # gráfico com texto alternativo
    ├── RodapeDoCard.jsx       # folha (com "i" por teclado), faturamento, pendências
    ├── EsqueletoDoCard.jsx    # estado de carregamento
    └── tabela-regras.js (+test) # status, formatação "hoje → depois", horas da loja
```

Servidor: sem alteração obrigatória. Um ajuste pequeno só se faltar um campo (ver research).

## Phase 0 / Phase 1

Veja [research.md](research.md), [data-model.md](data-model.md) e [quickstart.md](quickstart.md). Sem contratos novos: a resposta de `GET /lojas/:id/escala/diagnostico` já traz tudo.
