# Implementation Plan: Medição de uso com Mixpanel (serviço central do Radar Escala)

**Branch**: `feat/coluna-folha-no-faturamento` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/059-mixpanel-servico-central/spec.md`

## Summary

Um módulo único no front (`src/analytics/`) é o único que conhece o Mixpanel. Ele inicia com um token por ambiente, identifica a pessoa logada (ID, nome, e-mail, perfil), registra eventos de um catálogo fechado e engole qualquer falha. As telas e ações só chamam `registrar("nome_do_evento", {...})`. Sem token, tudo vira "não faz nada". O servidor ganha uma mudança mínima: devolver o ID do usuário na sessão.

## For the reader

Chosen: criar um serviço único de medição na tela, que manda para o Mixpanel só o que está numa lista oficial de eventos.

Why: assim as telas não dependem do Mixpanel, dá para desligar num lugar só, e nenhum dado financeiro escapa por engano.

## Technical Context

**Language/Version**: JavaScript (React 18 + Vite 5), o que o front já usa; Node 22 no backend

**Primary Dependencies**: `mixpanel-browser` (nova; justificativa em [research.md](research.md))

**Storage**: N/A (o Mixpanel guarda; no navegador, só o identificador anônimo dele)

**Testing**: Vitest (já usado no front) com o Mixpanel simulado; um teste no backend para o campo novo da sessão

**Target Platform**: navegador, atrás do Radar (`/escala/`) e Docker local

**Project Type**: web (front + API)

**Performance Goals**: envio fora do caminho da tela, sem bloquear clique nem navegação

**Constraints**: nunca enviar dinheiro/folha/documentos; funcionar sem token e sem rede; token fora do git

**Scale/Scope**: ~12 eventos, 1 serviço, ~8 pontos de chamada nas telas

## Constitution Check

- I. Spec Kit: spec → plan → tasks → implement, com aprovação. OK.
- II. Docker: variável `MIXPANEL_TOKEN` entra no Compose (dev e prod) e no `.env.example`; nada para instalar na máquina. OK.
- III. Stack: nova dependência `mixpanel-browser` justificada em `research.md`. OK.
- IV. Banco: sem mudança de banco. OK.
- V. Dados locais: nenhuma operação destrutiva. OK.
- VI/VIII: linguagem simples, decisões técnicas do agente. OK.
- VII. MVP: telas + login + ações-chave, sem dashboards nem replay. OK.
- Restrição "segredos fora do git": o token vem de variável de ambiente, nunca no código. OK.

Reavaliado após o desenho: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/059-mixpanel-servico-central/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── catalogo-eventos.md
└── tasks.md   # próxima etapa
```

### Source Code (repository root)

```text
frontend/react/
├── src/analytics/
│   ├── catalogo.js        # nomes de eventos e propriedades permitidas
│   ├── servico.js         # único ponto de contato com o Mixpanel
│   └── servico.test.js
├── src/App.jsx            # identificar/limpar a pessoa; tela vista; trocar de loja
├── src/main.jsx           # iniciar o serviço
├── src/auth/PortaoDeLogin.jsx   # evento de login
├── src/features/...       # chamadas "registrar" nas ações-chave
├── Dockerfile             # ARG VITE_MIXPANEL_TOKEN no build de produção
└── package.json           # mixpanel-browser
backend/node/src/modules/auth/auth.service.ts   # sessão devolve o ID do usuário (+ teste)
docker-compose.yml / docker-compose.prod.yml    # repassa MIXPANEL_TOKEN
.env.example / .env.production.example          # MIXPANEL_TOKEN vazio
```

**Structure Decision**: o serviço mora numa pasta própria do front (`analytics/`), fora de `features/` e `shell/`, porque é transversal. Nenhuma tela importa `mixpanel-browser`.
