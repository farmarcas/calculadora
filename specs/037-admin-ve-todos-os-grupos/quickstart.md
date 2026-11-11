# Quickstart: Admin do Radar vê todos os grupos

## Calculadora, sem o Radar

```sh
docker compose exec api npm test
docker compose exec api npm run test:integration
```

O Radar de mentira dos testes devolve `economicGroups` com `fullAccess` para simular o Admin.

## API de autenticação

```sh
dotnet test Farmarcas.Authentication.Test
```

As consultas são conferidas num MySQL descartável com `economic_group`, `economic_group_store`, `store` e `store_users`.

## Conferência em dev

1. Entrar com uma conta Admin com a permissão "Gestão de Escala" e sem lojas vinculadas: o filtro de Grupo lista todos os grupos.
2. Escolher um grupo com lojas na calculadora: todas aparecem.
3. Entrar com um associado: só os grupos dele, como antes.

## Publicação

Qualquer ordem. A API de autenticação primeiro libera o comportamento novo assim que a calculadora for publicada.
