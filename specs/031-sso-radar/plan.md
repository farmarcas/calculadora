# Implementation Plan: Entrar pelo Radar (SSO) com grupos e lojas da pessoa

**Branch**: `feat/sso-radar` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/031-sso-radar/spec.md`

## Summary

A calculadora passa a exigir sessão. A entrada é um item no menu Aplicações do Radar, igual ao do Prisma: o Radar chama `Sso/Start` com o slug `Calculadora` e a sessão de quem está logado, e abre o `RedirectUrl` em outra aba. Na volta, a API da calculadora troca o código em `Sso/Exchange`, lê grupos, lojas e papel em `SessionInfo`, cria o que falta, grava a sessão e emite um JWT em cookie httpOnly. Sem sessão, a tela mostra "Ir para o Radar". A partir daí, papel e acesso vêm só da sessão, conferidos por grupo e por loja em toda rota; "Sair" encerra a sessão na hora.

## For the reader

Chosen: a calculadora entra por um link no menu do Radar, como o Prisma, usando as rotas de SSO que já existem, sem rota nova na API de autenticação.

Why: o `Sso/Start` só atende quem já está logado no Radar, então a entrada precisa partir de lá.

Chosen: o que a pessoa pode ver fica guardado no servidor, e o navegador recebe só um crachá lacrado (o JWT) que não pode ser lido por scripts da página.

Why: um dono com muitas lojas não caberia no crachá, e assim "Sair" vale na hora.

## Technical Context

**Language/Version**: TypeScript (Node 22) na API; React 18 + Vite na tela; C# (.NET) na API de autenticação; Angular 16 no Radar

**Primary Dependencies**: Express, Zod, Prisma, Vitest; novas na API: `jose` e `cookie-parser` (research §5)

**Storage**: PostgreSQL 16; uma migration: tabela `sessoes` e duas colunas em `auditoria`

**Testing**: Vitest unitário (regra de papel, plano de criação, guarda de lojas) e integração HTTP com Radar de mentira

**Target Platform**: Docker Compose local; Coolify em produção; Kubernetes para a API de autenticação

**Project Type**: aplicação web; na API de autenticação, só o slug e a configuração dele

**Performance Goals**: login em até 5 s (SC-001); chamadas ao Radar com limite de 10 s (SC-005); uma leitura a mais por chave primária em cada pedido

**Constraints**: nenhum dado sem sessão; produção nunca sobe com o login desligado; token e credenciais do Radar nunca chegam ao navegador

**Scale/Scope**: dezenas de grupos, centenas de lojas por conta no pior caso

## Constitution Check

- I. Spec Kit: spec aprovada; plano aguardando aprovação. OK.
- II. Docker: variáveis novas no `.env`; o ambiente local sobe sem o Radar. OK.
- III. Stack: `jose` e `cookie-parser` justificados em research §5. OK.
- IV. Banco: uma migration nova, sem editar as antigas. OK.
- V. Dados locais: a migration só acrescenta. OK.
- VI e VIII: decisões técnicas tomadas pelo agente; duas perguntas de negócio na spec. OK.
- VII. Começar pequeno: entregue em 3 fatias que se verificam sozinhas. OK.
- Lacuna: autenticação não tem skill no Golden Path; registrada em research §14.

## Project Structure

### Documentation (this feature)

```text
specs/031-sso-radar/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api-auth.md
└── tasks.md
```

### Source Code

```text
api-authentication-dotnet/                        # branch feat/sso-calculadora, a partir de develop
├── Farmarcas.Authentication.Domain/SsoSlugType.cs
├── Farmarcas.Authentication.API/                  # appsettings
└── application/, application-dev/                 # Sso__Calculadora__*

calculadora/
├── backend/node/
│   ├── prisma/                                    # Sessao, auditoria, migration
│   └── src/
│       ├── config/env.ts
│       ├── app.ts
│       ├── modules/auth/                          # novo: routes, service, repository, schemas, radar.client, papel, acesso
│       ├── modules/ge/                            # lista por sessão
│       ├── modules/cadastros/                     # listagens filtradas por loja
│       └── shared/
│           ├── middlewares/sessao.ts              # novo
│           ├── middlewares/guarda-de-lojas.ts     # novo
│           ├── middlewares/ge.ts, perfil.ts
│           └── auditoria/auditoria.ts
├── frontend/react/src/
│   ├── main.jsx, App.jsx
│   ├── api/client.js
│   ├── auth/                                      # novo: PortaoDeLogin e telas de saída, erro e sem acesso
│   └── shell/                                     # FaixaDeContexto, MenuDaConta, menu.js
├── docker-compose.yml, docker-compose.prod.yml
├── .env.example, .env.production.example
└── README.md, backend/node/.env.example
```

**Structure Decision**: módulo novo `auth` no padrão do backend. O portão de login envolve o `App` em `main.jsx`, para nenhuma tela existente rodar sem sessão.

## Fatias

1. **API de autenticação**: slug, configuração e deploy.
2. **API da calculadora**: migration, rotas de login, sessão, grupo, papel e guarda de lojas, auditoria e variáveis. Com o login desligado, nada muda.
3. **Tela**: portão de login, filtros, menu da conta e telas de saída, erro e sem acesso.

O teste de ponta a ponta precisa da fatia 1 publicada em dev.

## Risks

- **Número do grupo diferente do Radar**: os relatórios do Radar indicam que `identificacao` é o `economic_group.Id`, mas isso não foi conferido em dados reais. A busca por CNPJ vem primeiro (research §8), e a publicação tem um passo de conferência.
- **Prisma sem `Sso__Prisma__*` no `deploy.yaml`**: o `deploy.yaml` só lista o Gestão 360, e a última alteração é anterior ao slug do Prisma. A calculadora terá suas entradas, mas é preciso confirmar como os segredos chegam ao pod.
- **API de autenticação de dev só na rede interna**: o teste real depende de VPN. A de produção é pública.
- **Sem o `state`**: como no Prisma, um código válido enviado por outra pessoa em até 60 segundos abriria a sessão da conta dela. O código é de uso único, e o risco foi aceito para seguir o mesmo fluxo.
- **Dois logins no código**: a `main` trouxe o `AUTH_MODE=radar` (token do Radar no `localStorage`, publicado em `/escala`), e esta branch traz o `SSO_HABILITADO` (cookie próprio). Os dois convivem, um por vez: a API recusa subir com os dois ligados, e em produção exige um deles. O link do menu do Radar só funciona com `SSO_HABILITADO=true`. Com `AUTH_MODE=radar` não há acesso parcial por loja nem autor na auditoria.
- **Teste de ponta a ponta real**: depende de publicação em dev; aqui só o Radar de mentira.

## Complexity Tracking

Sem violações da constituição.
