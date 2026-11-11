# Implementation Plan: Admin do Radar recebe as lojas dos grupos

**Branch**: `feat/sso-radar` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

## Summary

O `Sso/Exchange` ganha `stores`: para o Admin, as lojas ativas (`store.Status = 2`) de todos os grupos, no mesmo formato das lojas do `SessionInfo` que a calculadora já lê (`id`, `name`, `cnpj`, `status`, `economicGroup { id, name }`); para os demais, lista vazia. A calculadora junta essas lojas às do `SessionInfo` e as passa pelo `separarLojas` e pelo `sincronizarAcesso` que já existem. Os grupos do Admin continuam com acesso total (spec 037).

## For the reader

Chosen: as lojas usam o mesmo formato e o mesmo caminho de criação das lojas do associado.

Why: as regras (CNPJ, excluída, grupo desativado, sem sobrescrever) já estão prontas e testadas.

## Technical Context

- **API de autenticação**: uma consulta a mais, só para o Admin (`store` → `economic_group_store` → `economic_group`); regra pura `SsoStores.Build` tira repetidos (loja em mais de um grupo fica no de menor id) e ordena por id; xUnit.
- **Calculadora**: `trocaSchema` aceita `stores` com o `lojaSchema` existente; `auth.service` junta as listas; a transação do login ganha prazo maior para a rede inteira; o log de lojas ignoradas passa a registrar o total e só as primeiras.
- **Storage**: sem migration; só linhas novas em `grupos_economicos` e `lojas`.
- **Performance**: SC-002 conferido em teste de integração com 2.000 grupos e 10.000 lojas.

## Constitution Check

Spec aprovada; sem dependência nova; sem migration; nada é apagado; 2 fatias. OK.

## Fatias

1. **API de autenticação**: `SsoStoreDto`, `SsoStores`, consulta e testes; mesmos arquivos nas duas branches.
2. **Calculadora**: leitura, junção, prazo da transação, log e testes; `templates/` sincronizada.

## Risks

- **Tamanho da resposta**: com 10.000 lojas, cerca de 1,5 MB no `Sso/Exchange` do Admin. Aceitável uma vez por login; o Prisma recebe a lista vazia porque só vai cheia para Admin.
- **Primeiro login do Admin cria a rede inteira** com dados pendentes; é o pedido.
