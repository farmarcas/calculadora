# Implementation Plan: Horário por dia da semana e loja 24 horas

**Branch**: `feat/escala-horario-semana` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

## Summary

A loja passa a ter o horário dos sete dias (aberta ou fechada, abertura e fechamento, ou 24 horas) no formulário, na planilha modelo e na importação. O diagnóstico, as regras, as simulações e o ponto já calculam por dia; só precisam receber o horário completo. O formato antigo (semana, sábado, domingo) continua sendo lido e é convertido na leitura, sem recadastrar nada.

## For the reader

Chosen: guardar o horário dia a dia num formato novo e converter o formato antigo na hora de ler.

Why: assim as lojas que já existem continuam funcionando com o mesmo resultado, e o resto do sistema passa a falar um idioma só.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite + Tailwind (tela), como já está
**Primary Dependencies**: nenhuma nova
**Storage**: PostgreSQL; **sem migration**: o horário já é uma coluna JSON (`lojas.horarios`)
**Testing**: Vitest (conversão, resumo, leitura da planilha, cálculo) + Supertest (rotas e diagnóstico)
**Target Platform**: Docker Compose local
**Project Type**: web (api + front)
**Performance Goals**: sem mudança
**Constraints**: lojas e simulações existentes dão o mesmo resultado; simulação gravada mantém o horário congelado; turnos continuam dentro do dia (00:00 a 24:00)
**Scale/Scope**: dezenas a centenas de lojas

## Constitution Check

| Princípio | Situação |
|---|---|
| I Spec Kit | OK — spec aprovada, plano em curso |
| II Docker | OK |
| III Stack | OK — nada acrescentado |
| IV Migrations | OK — nenhuma mudança de estrutura do banco; o formato novo vive no JSON existente |
| V Dados locais | OK — nada destrutivo; os dados antigos não são reescritos |
| VII Começar pequeno | OK — 3 fatias independentes |
| VIII Técnico é do agente | OK |

Reavaliado após o desenho: sem violações.

## Project Structure

```text
backend/node/src/modules/
├── cadastros/
│   ├── horarios.ts          # formato novo, conversão do antigo, resumo (puro)
│   ├── cadastros.schemas.ts # aceita o formato novo e o antigo
│   ├── cadastros.repository.ts  # normaliza na leitura
│   └── processar.ts         # planilha: colunas por dia, 24h, colunas antigas
├── planilhas/campos.ts, modelo.ts  # colunas por dia + loja 24h; sinônimos
├── escala/diagnostico.ts, escala.repository.ts  # diasAbertos lê o formato novo (ou o antigo)
└── simulacoes/simulacoes.service.ts  # "desatualizada" compara horários já normalizados
frontend/react/src/features/cadastros/
├── horarios.js              # resumo legível ("Seg a sáb 08:00–22:00 · Dom fechada")
├── HorarioSemana.jsx        # os sete dias, 24 horas, copiar para os demais
├── FormLoja.jsx, CadastrosPage.jsx
```

**Structure Decision**: a conversão mora em um arquivo puro (`horarios.ts`), usado por todos os módulos; o resto do código só enxerga o formato novo.

## Fatias de entrega

1. **US1 Cadastro da semana**: formato novo, conversão do antigo, API, formulário e resumo na tabela.
2. **US2 Planilha e importação**: colunas por dia e loja 24h no modelo; importação do modelo novo, de planilhas fora do modelo e do formato antigo.
3. **US3 O horário real em todo o sistema**: diagnóstico, regras, simulações e ponto usando os sete dias e o 24h, com testes de conta manual; "desatualizada" sem falso alarme na conversão.
