# Implementation Plan: Admin do Radar vê todos os grupos

**Branch**: `feat/sso-radar` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/037-admin-ve-todos-os-grupos/spec.md`

## Summary

O `Sso/Exchange` da API de autenticação passa a devolver, além do token, a lista final de grupos econômicos da pessoa (`economicGroups`): para o papel Admin, todos os grupos do Radar com acesso ao grupo inteiro, somados aos grupos das lojas vinculadas; para os demais papéis, só os grupos das lojas vinculadas. A calculadora já chama o `Sso/Exchange` no login: ela passa a ler esse campo e dá acesso total aos grupos marcados como inteiros, criando os que faltam só com número e nome. O resto do login não muda.

## For the reader

Chosen: o Radar monta a lista no passo que valida o código do link (`Sso/Exchange`).

Why: é o passo feito de servidor para servidor que a calculadora já usa, então a lista não pode ser alterada no navegador e a calculadora não ganha chamada nem configuração nova.

Chosen: os grupos do Admin ficam guardados na sessão como "acesso ao grupo inteiro".

Why: a proteção por grupo e por loja que já existe passa a valer para o Admin sem nenhuma regra nova; só muda o que entra na sessão.

## Technical Context

**Language/Version**: C# (.NET 5) na API de autenticação; TypeScript (Node 22) na API da calculadora

**Primary Dependencies**: Dapper e xUnit na API de autenticação; Express, Zod, Prisma e Vitest na calculadora. Nenhuma dependência nova.

**Storage**: MySQL do Radar (só leitura: `economic_group`, `economic_group_store`, `store`, `store_users`); PostgreSQL da calculadora sem mudança de estrutura

**Testing**: xUnit para a regra de montagem da lista e consulta validada num MySQL descartável; Vitest unitário para a regra de grupos e integração HTTP com o Radar de mentira

**Target Platform**: Kubernetes para a API de autenticação; Coolify para a calculadora

**Project Type**: serviço de autenticação + aplicação web

**Performance Goals**: login do Admin em até 5 s com até 2.000 grupos (SC-003): uma consulta a mais no Radar e duas operações em lote no Postgres

**Constraints**: lista montada só no servidor do Radar; campo novo opcional para o Prisma e para a calculadora sem a mudança

**Scale/Scope**: até alguns milhares de grupos no Admin; dezenas para os demais

## Constitution Check

- I. Spec Kit: spec aprovada; plano aguardando aprovação. OK.
- II. Docker: nada novo no `.env` nem no Compose. OK.
- III. Stack: nenhuma dependência nova. OK.
- IV. Banco: sem migration na calculadora; no Radar, só leitura. OK.
- V. Dados locais: nada é apagado. OK.
- VI e VIII: decisões técnicas do agente; a escolha de onde montar a lista foi do negócio (Clarifications). OK.
- VII. Começar pequeno: 2 fatias, cada uma publicável sozinha. OK.

## Project Structure

### Documentation (this feature)

```text
specs/037-admin-ve-todos-os-grupos/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sso-exchange-grupos.md
├── checklists/requirements.md
└── tasks.md            # próxima etapa
```

### Source Code

```text
api-authentication-dotnet/
├── Farmarcas.Authentication.Application/Authentication/Commands/SsoExchange/
│   ├── SsoExchangeCommand.cs          # busca os grupos e preenche EconomicGroups
│   ├── SsoExchangeResponse.cs         # + EconomicGroups
│   ├── SsoEconomicGroupDto.cs         # novo: Id, Name, FullAccess
│   └── SsoEconomicGroups.cs           # novo: regra pura de montagem (Admin x demais, junção)
└── Farmarcas.Authentication.Test/Authentication/SsoEconomicGroupsTest.cs   # novo

calculadora/backend/node/src/modules/auth/
├── radar.client.ts                    # trocarCodigo devolve token + economicGroups
├── acesso.ts                          # gruposInteiros + montarGrupos com acesso total
├── auth.service.ts                    # passa os grupos inteiros para o repositório
├── auth.repository.ts                 # cria grupos que faltam e junta na sessão
├── acesso.test.ts
└── auth.routes.integration.test.ts
```

Tela: sem mudança. O filtro já lista os grupos da sessão em ordem alfabética.

## Fatias

1. **API de autenticação**: `economicGroups` no `Sso/Exchange`, com teste da regra e consulta conferida em MySQL descartável. Publicável sozinha: Prisma e calculadora atual ignoram o campo.
2. **API da calculadora**: leitura do campo, criação dos grupos e acesso total. Publicável sozinha: sem o campo, segue a regra de hoje.

Os commits da fatia 1 vão para as duas branches da API de autenticação (`feat/sso-calculadora` e `feat/sso-calculadora-main`), como da última vez.

## Risks

- **Tamanho da sessão do Admin**: com 2.000 grupos, a sessão guardada no Postgres passa de cerca de 200 KB, lida a cada pedido. Aceitável para o volume esperado; se pesar, a troca é guardar "acesso a todos" em vez da lista (research §4).
- **Papel identificado pelo nome**: o Admin é reconhecido por `roles.Name = 'Admin'`, como já fazem os `[Authorize(Roles = "Admin, Angel")]` do Radar. Renomear o papel quebraria a regra.
- **Teste de ponta a ponta real**: depende da fatia 1 publicada em dev; aqui só o Radar de mentira e o MySQL descartável.

## Complexity Tracking

Sem violações da constituição.
