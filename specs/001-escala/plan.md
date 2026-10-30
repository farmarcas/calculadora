# Implementation Plan: Escala (módulo M4)

**Branch**: `001-escala` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

## Summary

Cadastro de lojas e funcionários por planilha (modelo para baixar + leitura de planilhas fora do modelo com confirmação), diagnóstico da escala atual (EC 141, 42h/40h), grade semanal editável, simulações gravadas, comparação e aprovação da "em uso". O pilar Gerenciar (ponto/AFD) não entra.

## For the reader

Chosen: guardar tudo no mesmo banco do projeto, ler as planilhas e calcular as regras dentro da API, e mostrar a tela em React seguindo o protótipo.

Why: é o padrão do projeto, não depende de serviço externo e mantém os dados dos funcionários dentro do seu computador.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite (tela)
**Primary Dependencies**: Express, Zod, Prisma (já no projeto); `exceljs` (ler/gerar .xlsx), `multer` (upload); Tailwind na tela (ainda não configurado no front)
**Storage**: PostgreSQL 16 via Prisma Migrate
**Testing**: Vitest (regras e leitura de planilha, unitário) + Supertest (HTTP, integração)
**Target Platform**: Docker Compose local (postgres, api, web)
**Project Type**: web (api + front)
**Performance Goals**: diagnóstico < 1 min por loja; recálculo ao mover turno < 1 s; importação de 100 lojas < 5 min
**Constraints**: só dados fictícios (LGPD); layout fluido 100%; sem exportar para ponto
**Scale/Scope**: um grupo, dezenas a centenas de lojas, ~10 colaboradores por loja

## Constitution Check

| Princípio | Situação |
|---|---|
| I Spec Kit | OK — spec aprovada, plano em curso |
| II Docker | OK — nada instalado fora do Compose; dependências novas entram no `package.json` dos serviços |
| III Stack | OK — stack padrão; únicas adições: `exceljs`, `multer`, Tailwind (justificadas em research.md) |
| IV Migrations | OK — todo schema via Prisma Migrate |
| V Dados locais | OK — nenhuma ação destrutiva prevista |
| VII Começar pequeno | OK — entrega em fatias independentes (US1 → US4) |
| VIII Técnico é do agente | OK — nenhuma pergunta técnica feita |

Reavaliado após o desenho: sem violações.

## Project Structure

### Documentation
```text
specs/001-escala/
├── plan.md  research.md  data-model.md  quickstart.md
├── contracts/api.md
└── tasks.md   (próxima etapa)
```

### Source Code
```text
backend/node/
├── prisma/schema.prisma + migrations/
└── src/modules/
    ├── cadastros/     # lojas, funcionários, importação (rotas, service, repository, schemas)
    ├── planilhas/     # modelo .xlsx, leitura, inferência de colunas (puro, testável)
    ├── escala/        # cargas de escala, base comercial, diagnóstico
    ├── regras/        # motor de regras 42h/40h (puro, testável)
    └── simulacoes/    # grade, gravar, clonar, comparar, aprovar, auditoria
frontend/react/src/
├── features/{cadastros,diagnostico,grade,simulacoes}/
├── components/ui/     # primitivos Tailwind (Alquimia DS)
└── App.jsx            # shell: rail + topbar + seletor de perfil
```

**Structure Decision**: módulos por assunto na API, seguindo `backend/node/skills/api-development` e `frontend/react/skills`; regras como funções puras para testar sem banco.

## Fatias de entrega

1. **US1 Cadastros**: schema Loja/Funcionário/Importação, modelo .xlsx, leitura e inferência, tela de importação com confirmação.
2. **US2 Diagnóstico**: cargas de escala e base comercial, motor de regras, tela da loja (quadro, cobertura, déficit, contratações).
3. **US3 Grade**: grade semanal arrastável, recálculo, gravar/clonar/descartar.
4. **US4 Comparar e aprovar**: comparação 2–3, aprovação com vigência, perfis, auditoria, exportação Excel/impressão.
