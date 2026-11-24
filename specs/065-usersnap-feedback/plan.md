# Implementation Plan: Usersnap instalado no Radar Escala

**Branch**: `feat/usersnap-feedback` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/065-usersnap-feedback/spec.md`

## Summary

Um serviço central novo (`frontend/react/src/feedback/servico.js`) carrega o Usersnap com a chave do projeto **só depois do login do Radar** e identifica a pessoa (nome, e-mail, perfil, loja). Ao sair, o Usersnap é desmontado. A chave vem por configuração; sem chave, nada é carregado. O que aparece na tela é cadastrado no painel do Usersnap. O app não cria botão próprio.

## For the reader

Chosen: carregar o Usersnap por um serviço central, só depois do login, e identificar quem envia o feedback.

Why: assim o time recebe cada relato com a captura e a pessoa certa, e quem ainda não entrou (ou está na demonstração) não é coletado.

## Technical Context

**Language/Version**: JavaScript (React 18 + Vite 5), o que o front já usa

**Primary Dependencies**: `@usersnap/browser` 1.0.2 (pacote oficial do Usersnap, nova dependência pequena); `loadSpace(chave)` carrega o Usersnap sob demanda

**Storage**: N/A (feedbacks ficam no Usersnap)

**Testing**: Vitest com o pacote simulado (sem chave nada carrega; só carrega após identificar; identificação com os campos certos; `destroy` ao sair; falha do carregamento não lança erro)

**Target Platform**: navegador atrás do Radar (`/escala/`) e Docker local

**Project Type**: web (só front + configuração de build)

**Performance Goals**: carregamento assíncrono, nunca bloqueia tela nem clique

**Constraints**: nada carregado sem pessoa logada; funcionar sem chave e sem rede; nenhuma tela importa o pacote do Usersnap

**Scale/Scope**: poucas pessoas

## Constitution Check

- I. Spec Kit: spec → plan → tasks → implement com aprovação. OK.
- II. Docker: variável nova `USERSNAP_SPACE_KEY` entra no Compose, no Dockerfile e no workflow de deploy, como o token do Mixpanel. OK.
- III. Stack: uma dependência nova, oficial e do próprio serviço contratado; sem alternativa na stack padrão. Justificada em `research.md`. OK.
- IV/V: sem banco, nada destrutivo. OK.
- VI/VIII: linguagem simples, decisão técnica do agente. OK.
- VII. MVP: carregar, identificar e desmontar; sem botão próprio, sem integrações. OK.
- Segredos: a chave de espaço do Usersnap é pública por natureza (vai no navegador) mas, por padrão do projeto, entra por configuração e não no git. OK.

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/065-usersnap-feedback/
├── plan.md
├── research.md
├── quickstart.md
└── tasks.md   # próxima etapa
```

### Source Code (repository root)

```text
frontend/react/src/feedback/
├── servico.js        # iniciar, identificar, limpar (único que importa @usersnap/browser)
└── servico.test.js
frontend/react/src/App.jsx                 # identifica ao entrar e ao trocar de loja
frontend/react/src/.../PortaoDeLogin.jsx   # limpa ao sair e ao perder a sessão
frontend/react/package.json / package-lock.json   # @usersnap/browser
frontend/react/Dockerfile                  # ARG VITE_USERSNAP_SPACE_KEY
docker-compose.yml / docker-compose.prod.yml
.github/workflows/deploy.yml               # chave só no build de produção
.env.example / .env.production.example
frontend/FRONTEND.MD                       # o que o Usersnap recebe e como configurar (FR-010)
```

**Structure Decision**: pasta própria `feedback/` ao lado de `analytics/`, no mesmo padrão: um serviço que é o único a importar o pacote externo, tudo dentro de `try/catch`.

## Design

**Chave**: `VITE_USERSNAP_SPACE_KEY`. Vazia = Usersnap desligado. Em produção vem do segredo/variável `USERSNAP_SPACE_KEY` do repositório, como o token do Mixpanel; em homologação e local fica vazia, para não misturar feedback de teste com o real.

**Quando liga**: em `identificar`, a primeira vez que há pessoa, `loadSpace(chave)` e depois `api.init({ user, custom })`.

**O que envia**: `user: { userId, email, nome, perfil, papel_radar }` e `custom: { loja }`. Nada de grupo, CNPJ, valores ou outros dados. A tela vai pelo endereço da página, que o Usersnap já captura (o app usa `?tela=`).

**Troca de loja**: o serviço refaz `destroy` e `init` com a loja nova, só quando a loja muda.

**Ao sair**: `limpar` chama `destroy` e esquece a pessoa; o próximo login começa do zero.

**Erros**: tudo em `seguro()`; falha de rede ou bloqueio não aparece para a pessoa.
