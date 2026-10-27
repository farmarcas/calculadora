# Implementation Plan: Gerenciar a escala com o ponto (AFD)

**Branch**: `feat/escala-ponto-custo` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

## Summary

Pilar Gerenciar do módulo Escala: importar arquivos de ponto (AFD), casar loja e pessoas, tratar pendências, comparar planejado × realizado (pessoa por dia e loja por período) e mostrar um painel com alertas de "simulação desatualizada". Constrói sobre a simulação em uso da `specs/001-escala`.

## For the reader

Chosen: ler o AFD dentro da API, guardar cada batida uma única vez e calcular a apuração na hora a partir do que está guardado.

Why: assim reenviar um arquivo nunca duplica nada, uma pendência resolvida reflete na apuração sem reprocessar, e os dados de ponto ficam só no banco local.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite + Tailwind (tela)
**Primary Dependencies**: nenhuma nova (o AFD é texto em largura fixa; lê com o que o Node já traz)
**Storage**: PostgreSQL; tabelas novas: importações de ponto, batidas; limites de alerta na loja
**Testing**: Vitest (leitor de AFD, apuração, aderência, unitário) + Supertest (rotas, permissões, idempotência, integração); arquivos de AFD **fictícios** gerados por um criador de teste
**Target Platform**: Docker Compose local
**Project Type**: web (api + front)
**Performance Goals**: importar 1 mês de batidas de 10 pessoas em < 30 s; apuração de um mês em < 1 s
**Constraints**: só dado fictício (LGPD, parecer D6 pendente); CPF nunca devolvido por inteiro pela API (mascarado); operador da plataforma sem acesso; sem espelho de ponto, sem folha, sem exportação para ponto
**Scale/Scope**: dezenas de lojas, ~10 pessoas por loja, ~100 batidas por pessoa por mês

## Constitution Check

| Princípio | Situação |
|---|---|
| I Spec Kit | OK |
| II Docker | OK |
| III Stack | OK — sem biblioteca nova |
| IV Migrations | OK — migrations via Prisma Migrate |
| V Dados locais | OK |
| VII Começar pequeno | OK — 4 fatias independentes |
| VIII Técnico é do agente | OK |

Reavaliado após o desenho: sem violações.

## Project Structure

```text
backend/node/src/modules/
├── ponto/
│   ├── afd.ts              # leitor do layout da Portaria 671 (puro)
│   ├── afd.fake.ts         # criador de AFD fictício para testes e seed
│   ├── importacao.*        # rotas, service, repository (idempotência, pendências)
│   └── pendencias.*        # fila: vincular, ignorar, cadastrar CPF
├── apuracao/
│   ├── calendario.ts       # calendário planejado a partir da simulação em uso (puro)
│   ├── dia.ts              # planejado × batidas de um dia (puro)
│   ├── periodo.ts          # aderência, hora extra, faltas, cobertura realizada (puro)
│   └── apuracao.*          # rotas e service, painel e alertas
└── simulacoes/             # desatualizada passa a considerar hora extra e aderência
frontend/react/src/features/gerenciar/   # aba Gerenciar: Painel, Importar, Pendências, Apuração
```

**Structure Decision**: leitura do arquivo e cálculo da apuração são funções puras (testadas sem banco); o banco guarda só batidas e o que a pessoa decidiu (vínculo, motivo de ignorar).

## Fatias de entrega

1. **US1 Importar AFD**: migration, leitor, importação idempotente, log, recusa de CNPJ de fora, tela de envio. Primeira tarefa: **confirmar o layout** (campos, posições, verificador) com o texto oficial da Portaria MTP 671/2021 e fechar o criador de AFD de teste.
2. **US2 Pendências**: fila, vincular, ignorar com motivo, cadastrar CPF e resolver em lote.
3. **US3 Apuração**: calendário planejado, apuração do dia e do período, tela por pessoa e por loja, rótulo gerencial.
4. **US4 Painel e alertas**: painel por loja, tendência, limites editáveis, desatualizada por hora extra e aderência.
