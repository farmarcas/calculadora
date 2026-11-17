# Tarefas: Admin do Radar recebe as lojas dos grupos

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Commits só quando pedidos.

## Fatia 1 — API de autenticação
- [x] T001 [US1] `SsoExchange/SsoStoreDto.cs` (novo): `Id`, `Name`, `Cnpj`, `Status`, `EconomicGroup { Id, Name }`; `SsoExchangeResponse.Stores` (lista, nunca nula)
- [x] T002 [US1] `SsoExchange/SsoStores.cs` (novo, puro): `Build(linhas)` tira lojas repetidas (fica o grupo de menor id) e ordena por id
- [x] T003 [US1] `SsoExchangeCommand.cs`: só para Admin, consultar as lojas com `Status = 2` e grupo; demais papéis, lista vazia
- [x] T004 [P] [US1] `SsoStoresTest.cs`: repetidas, ordem, vazio
- [x] T005 [US1] Conferir a consulta num MySQL descartável; `dotnet build` e testes

## Fatia 2 — Calculadora
- [x] T006 [US1] `radar.client.ts`: `stores` opcional no `trocaSchema`, com o `lojaSchema`
- [x] T007 [US1] `auth.service.ts`: juntar `usuario.stores` e as `stores` dos grupos com acesso inteiro (`lojasDosGruposInteiros`, em `acesso.ts`) antes do `separarLojas`; log de ignoradas com total e as 20 primeiras
- [x] T008 [US1] `auth.repository.ts`: prazo maior na transação do login
- [x] T009 [US1] `auth.routes.integration.test.ts`: lojas criadas só com número, nome e CNPJ; existente não muda; excluída não volta; desativada, sem grupo ou sem CNPJ não entra; grupo desativado sem loja; associado não cria loja da rede; 2.000 grupos e 10.000 lojas em até 5 s e segundo login em até 3 s
- [x] T010 Lint, `tsc`, testes no container; `templates/` e `check-repo.sh`; README
