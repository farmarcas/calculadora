# Implementation Plan: Planilha do Cadastro pelo CNPJ e encargos só pelo regime

**Branch**: `feat/planilha-cadastro-por-cnpj` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/028-planilha-cadastro-por-cnpj/spec.md`

## Summary

A importação do Cadastro passa a reconhecer a loja pelo CNPJ (nas duas abas), o modelo para baixar perde o código da loja, o código de lotação e o cargo em texto livre, e ganha a coluna "Cargo" como lista fechada no Excel. Planilhas antigas continuam valendo (código e colunas antigas ficam como colunas "legadas": reconhecidas e tratadas como antes). Em paralelo, o RAT, o FAP e a provisão de rescisão por loja saem da planilha, da tela de Regras e do cálculo: o custo usa só o total de encargos do regime. O que já está guardado nas lojas não é apagado. Sem migration.

## For the reader

Chosen: a planilha passa a encontrar cada loja pelo CNPJ, o cargo vira uma lista para escolher, e os encargos usam só o regime tributário.

Why: assim qualquer pessoa preenche a planilha sem conhecer códigos internos, o cargo não é mais digitado errado, e o custo de folha fica simples de explicar.

## Technical Context

**Language/Version**: TypeScript (Node 22) na API; React 18 + Vite na tela

**Primary Dependencies**: Express, Zod, Prisma, ExcelJS (já usado para gerar o modelo e ler planilhas), Vitest; nada novo

**Storage**: PostgreSQL 16; **sem migration** (CNPJ e custos já existem; RAT/FAP/rescisão ficam guardados em `custos.encargos`, só deixam de ser lidos)

**Testing**: Vitest unitário (leitura das linhas, mapeamento de colunas, encargos) e integração HTTP (`npm run test:integration`) para importação por CNPJ, planilha antiga e custos

**Target Platform**: Docker Compose local (postgres, api, web)

**Project Type**: aplicação web (backend + frontend)

**Performance Goals**: sem mudança; a busca por CNPJ usa o índice único que já existe

**Constraints**: planilha antiga com código, função de escala, cargo e colunas de RAT/FAP/rescisão continua importando sem erro; o código da loja nunca é alterado pela importação; permissões iguais às de hoje (operadora cria e atualiza lojas; dono atualiza as existentes; gestor só equipe)

**Scale/Scope**: ~12 arquivos de backend, 3 de front, testes; nenhuma tela nova

## Constitution Check

- Spec Kit seguido (specify → plan; tasks e implement com aprovação): OK.
- Tudo no Docker, stack padrão, sem tecnologia nova: OK.
- Banco só muda por migration: **sem mudança de estrutura**; nada é apagado: OK.
- Dados pessoais (CPF, CNPJ) seguem tratados como hoje; o CNPJ já é único e validado: OK.

Sem violações a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/028-planilha-cadastro-por-cnpj/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── importacao-cadastro.md
└── tasks.md   # criado depois, em /speckit-tasks
```

### Source Code (repository root)

```text
backend/node/src/modules/
├── planilhas/
│   ├── campos.ts        # código e cargo viram "legado"; novos campos "CNPJ da loja" e "Cargo"; RAT/FAP/rescisão viram "legado"
│   ├── modelo.ts        # modelo sem código/lotação/cargo, com lista no Cargo e ajuda nova
│   └── inferencia.ts    # (só se o mapeamento de colunas repetidas pedir ajuste)
├── cadastros/
│   ├── processar.ts     # identifica linha por CNPJ (ou código antigo); funcionário por "CNPJ da loja" (ou código antigo)
│   ├── documentos.ts    # normalização do CNPJ lido do Excel (zeros à esquerda)
│   ├── cadastros.service.ts / cadastros.repository.ts  # buscarLojaPorCnpj; importação sem exigir código
│   └── configuracao.ts  # deixa de ler RAT, FAP e rescisão
├── custos/
│   ├── custos.schemas.ts, custos.repository.ts, encargos-loja.ts  # gravação preserva os ajustes antigos; cálculo ignora
└── regras/encargos.ts   # cálculo do total só pelo regime

frontend/react/src/features/cadastro-loja/
├── AbaRegras.jsx, dicasDeEncargos.js   # sem campos de RAT/FAP/rescisão; mostra o total do regime
```

**Structure Decision**: aplicação web existente; só alterações nos módulos acima, sem pasta nova.

## Complexity Tracking

Sem desvios da constituição.
