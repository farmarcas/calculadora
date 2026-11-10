# Tarefas: Admin do Radar vê todos os grupos

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. API de autenticação em `api-authentication-dotnet`; calculadora em `calculadora/backend/node/src/modules/auth`. Cada fatia termina com os testes passando. Commits só quando pedidos.

## Fatia 1 — API de autenticação: lista de grupos no `Sso/Exchange` (Histórias 1 e 2)
- [x] T001 [US1] `SsoExchange/SsoEconomicGroupDto.cs` (novo): `Id` (ulong), `Name`, `FullAccess`; `SsoExchangeResponse.cs` ganha `EconomicGroups` (lista, nunca nula)
- [x] T002 [US1] `SsoExchange/SsoEconomicGroups.cs` (novo, puro): `IsFullAccessRole(role)` (nome `Admin`, sem diferenciar maiúsculas) e `Merge(todos, vinculados, fullAccess)`: um item por id, `FullAccess` verdadeiro se vier dos grupos inteiros, ordem por nome
- [x] T003 [US1] `SsoExchange/SsoExchangeCommand.cs`: depois de carregar a pessoa, buscar os grupos das lojas vinculadas (`store_users` → `economic_group_store` → `economic_group`); para Admin, buscar também todos de `economic_group`; preencher `EconomicGroups` com `Merge`
- [x] T004 [P] [US1] `Farmarcas.Authentication.Test/Authentication/SsoEconomicGroupsTest.cs`: Admin recebe todos com `FullAccess`; grupo vinculado e geral aparece uma vez com `FullAccess`; User e Angel só os vinculados, sem `FullAccess`; lista vazia; ordem por nome; nome do papel em minúsculas
- [x] T005 [US1] Conferir as duas consultas num MySQL descartável (grupos repetidos por várias lojas, loja sem grupo, pessoa sem lojas)
- [ ] T006 Rodar `dotnet build` e `dotnet test` (feito); aplicar a fatia nas branches `feat/sso-calculadora` e `feat/sso-calculadora-main` (pendente: hoje só na `feat/sso-calculadora-main`, sem commit)

## Fatia 2 — Calculadora: usar a lista no login (Histórias 1 e 2)
- [x] T007 [US1] `radar.client.ts`: `trocaSchema` aceita `economicGroups` opcional (`id`, `name`, `fullAccess`); `trocarCodigo` devolve `{ accessToken, economicGroups }`; `gruposInteirosDe` (em `acesso.ts`) fica só com os de `fullAccess`
- [x] T008 [US1] `acesso.ts`: `juntarGrupos(dasLojas, inteiros, perfil)` (puro): grupo inteiro entra com `acessoTotal: true` e `lojaIds: []`; grupo das lojas que também é inteiro vira inteiro; os demais ficam como estão
- [x] T009 [US1] `auth.repository.ts` (`sincronizarAcesso`): recebe os grupos inteiros; na mesma transação cria os que faltam (`createMany` com `skipDuplicates`, `identificacao` e `nome`), lê os ativos por `identificacao` e devolve `juntarGrupos`
- [x] T010 [US1] `auth.service.ts`: passa `gruposInteiros` ao repositório; a permissão continua obrigatória; sem nenhum grupo continua sem acesso
- [x] T011 [P] [US1] `acesso.test.ts`: casos de `juntarGrupos` (só lojas, só inteiros, os dois no mesmo grupo, nenhum)
- [x] T012 [US1] `auth.routes.integration.test.ts`, novo bloco "Admin com todos os grupos": Admin sem lojas entra e `/ge` lista todos, em ordem alfabética; grupo novo nasce sem lojas e não sobrescreve nome existente; grupo desativado fica fora; Admin com 1 de 3 lojas de um grupo vê as 3; sem a permissão não entra
- [x] T013 [US2] No mesmo arquivo: associado com `economicGroups` sem `fullAccess` continua só com as suas lojas; resposta sem `economicGroups` segue a regra de hoje
- [x] T014 Rodar lint, `tsc`, testes unitários e de integração no container; sincronizar `templates/` e rodar `check-repo.sh`

## Fatia 3 — Fechamento
- [x] T015 Marcar FR-010/FR-012 da spec 031 como alterados pela 037 e atualizar o README da calculadora (quem vê quais grupos)
