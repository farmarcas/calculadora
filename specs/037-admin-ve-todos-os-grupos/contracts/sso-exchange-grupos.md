# Contrato: `POST Sso/Exchange` com grupos econômicos

Rota e corpo da chamada não mudam. A resposta ganha `economicGroups`.

## Resposta 200

```json
{
  "accessToken": "<jwt do Radar>",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "payload": {},
  "economicGroups": [
    { "id": 250, "name": "DIOGO POFFO", "fullAccess": true },
    { "id": 251, "name": "EDUARDO LOBATO", "fullAccess": true }
  ]
}
```

| Campo | Tipo | Regra |
| --- | --- | --- |
| `economicGroups` | lista, nunca nula | vazia quando a pessoa não tem grupo |
| `id` | número | `economic_group.Id` |
| `name` | texto | `economic_group.Name` |
| `fullAccess` | booleano | `true` só para o papel Admin |

Ordem: por `name`. Cada `id` aparece uma vez.

## Quem recebe o quê

| Papel | Grupos | `fullAccess` |
| --- | --- | --- |
| Admin | todos os de `economic_group` + os das lojas vinculadas | `true` |
| Angel, User e demais | os das lojas vinculadas em `store_users` | `false` |
| Partner | nenhum | — |

## Compatibilidade

- Prisma e versões antigas da calculadora ignoram o campo.
- A calculadora aceita a resposta sem o campo e segue a regra da spec 031.
