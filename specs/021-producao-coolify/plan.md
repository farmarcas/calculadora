# Implementation Plan: Ambiente de produção no Coolify

**Branch**: `feat/producao-coolify` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/021-producao-coolify/spec.md`

## Summary

Criar um conjunto de produção separado do local: um Compose `docker-compose.prod.yml` com três serviços (`postgres`, `api`, `web`), imagens de produção para API e tela, aplicação automática das migrations na subida da API e comentários no arquivo de variáveis (sem guia separado). O ambiente local (`docker-compose.yml`) não muda.

## For the reader

Chosen: a versão de produção usa as mesmas três peças do ambiente local (banco, API e tela), mas em modo otimizado, e o Coolify publica tudo a partir do `docker-compose.prod.yml`.

Why: reaproveita o que já funciona no projeto e deixa a publicação num único lugar, sem passos manuais no servidor.

## Technical Context

**Language/Version**: Node 22 (alpine) para API e build da tela; nginx 1.27 (alpine) para servir a tela

**Primary Dependencies**: Docker Compose, Prisma Migrate (já nas dependências de produção da API), Coolify (publicação via Docker Compose)

**Storage**: PostgreSQL 16 em volume nomeado persistente

**Testing**: validação ponta a ponta local com o Compose de produção (projeto separado, sem publicar portas), mais `docker compose config` para conferir variáveis obrigatórias

**Target Platform**: servidor Linux com Coolify

**Project Type**: web (frontend + backend + banco)

**Performance Goals**: sem meta nova; atualização com indisponibilidade de poucos minutos

**Constraints**: banco nunca exposto; segredos só por variável; ambiente local intocado

**Scale/Scope**: uso interno de uma empresa, uma produção

## Constitution Check

- I Spec Kit: spec aprovada, plano em curso. OK.
- II Tudo no Docker / portas só em 127.0.0.1: vale para o local. Em produção as portas não são publicadas; quem expõe é o Coolify (proxy com HTTPS). Sem conflito.
- III Stack padrão: Postgres 16, Node 22, React+Vite. **Acréscimo justificado**: nginx para servir os arquivos da tela (o Vite dev não serve produção). Registrado em `research.md`.
- IV Banco só muda por migration: aplicadas com `prisma migrate deploy` a cada subida. OK.
- V Dados protegidos: nenhum comando destrutivo; volume persistente; testes locais usam projeto Compose separado.
- VI/VII/VIII: linguagem simples, menor pedaço que funciona, decisões técnicas do agente. OK.

Pós-design: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/021-producao-coolify/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── variaveis-de-ambiente.md
└── tasks.md   # /speckit-tasks
```

### Source Code (repository root)

```text
docker-compose.prod.yml                  # novo: postgres + api + web de produção
.env.production.example                  # novo: modelo das variáveis (sem segredos)
.gitignore                               # libera .env.production.example
backend/node/
├── Dockerfile                           # runtime passa a usar o entrypoint de produção
└── docker/prod-entrypoint.sh            # novo: migrate deploy + iniciar API
frontend/react/
├── Dockerfile                           # novos estágios build + runtime (nginx); `dev` intacto
├── .dockerignore                        # conferir/ajustar
└── docker/nginx.conf.template           # novo: arquivos estáticos + proxy /api e /health
templates/                               # re-sincronizar via scripts/sync-templates.sh
```

**Structure Decision**: mexer só nos Dockerfiles existentes (novos estágios, mantendo `dev`) e acrescentar arquivos de produção na raiz, sem nova pasta de código.

## Notas de risco

- **Coolify com Compose não faz troca sem interrupção**: ao publicar, os contêineres são recriados. Se a versão nova falhar, a publicação é marcada como falha e a pessoa volta publicando o commit anterior. A spec foi ajustada para refletir isso.
- **Senha do banco com caracteres especiais** quebra a URL de conexão; o arquivo de exemplo pede senha só com letras e números.
- **Produção aberta na internet sem login** é decisão da pessoa (spec). O arquivo de exemplo registra o aviso.
