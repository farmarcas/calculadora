# Contratos: login

## API da calculadora (`/api/v1/auth`, sem sessão)

### `GET /auth/sessao`

- `200` com o login ligado e sessão válida:

```json
{
  "sso": true,
  "usuario": { "nome": "Ana", "email": "ana@exemplo.com" },
  "operador": false,
  "grupos": [{ "id": "…", "nome": "Grupo 250", "identificacao": "250", "perfil": "TENANT_ADMIN", "acessoTotal": true }]
}
```

- `200 { "sso": false }` com o login desligado (modo demonstração).
- `401 NAO_AUTENTICADO` sem sessão válida.

### `POST /auth/sso/exchange`

Corpo: `{ "code": "…" }`. Com sucesso, grava o cookie de sessão.

- `200` com o mesmo corpo de `GET /auth/sessao`
- `400 VALIDATION_ERROR`
- `401 LOGIN_INVALIDO`: código inválido, vencido ou já usado
- `403 SEM_ACESSO`: papel sem acesso, ou nenhuma loja
- `503 RADAR_INDISPONIVEL`

### `POST /auth/sair`

Encerra a sessão e apaga o cookie. `204`, mesmo sem sessão.

## Rotas de dados, com o login ligado

- Sem sessão válida: `401 NAO_AUTENTICADO`. Só `/health`, `/health/ready` e `/api/v1/auth/*` ficam abertas.
- `X-Perfil` é ignorado. O perfil vem da sessão: `PLATFORM_OPERATOR` para o operador; senão o perfil do grupo em `X-GE`; senão `SCHEDULE_VIEWER`.
- `X-GE` fora do acesso: `403 GE_INDISPONIVEL`, a mesma resposta de grupo inexistente.
- Loja, simulação ou funcionário fora do acesso: `404`, a mesma resposta de registro inexistente.
- Rota fora da tabela da guarda, para acesso parcial: `403 SEM_PERMISSAO`.
- `GET /ge`: só os grupos da sessão; todos os ativos para o operador.

## API de autenticação (`api-authentication-dotnet`)

Nenhuma alteração de código além do valor `Calculadora` no enum `SsoSlugType`, sem o qual a rota recusa o slug.

### Existentes, usados como estão

- `GET Sso/Start?slug=Calculadora`: chamado pelo Radar, com a sessão de quem está logado; devolve `{ redirectUrl }`, que aponta para `<CallbackUrl>?code=…`.
- `POST Sso/Exchange`: Basic, corpo `{ code, slug }`, devolve `{ accessToken, tokenType, expiresIn, payload }`.
- `GET SessionInfo`: Bearer, devolve `role`, `occupation` e `stores[]`.

### Configuração por ambiente

`Sso:Calculadora:CallbackUrl`, `ClientId`, `ClientSecret`, `CodeTtlSeconds`; no deploy, `Sso__Calculadora__*`.

## Radar (`webapp-radar`)

Item "Calculadora" no menu Aplicações. `SsoService.openCalculadora()` chama `Sso/Start` e abre o `redirectUrl` em outra aba, como `openPrisma()`.
