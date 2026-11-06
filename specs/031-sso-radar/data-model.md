# Data Model: Entrar pelo Radar (SSO)

## Nova tabela `sessoes`

Uma linha por login. Guarda dado pessoal (nome e e-mail): as sessões vencidas há mais de 7 dias são apagadas a cada login.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid v7, PK | vai no JWT como `sid` |
| `radar_usuario_id` | text | id da pessoa no Radar |
| `nome` | text | do Radar |
| `email` | text | do Radar |
| `operador` | boolean | verdadeiro para Admin e Angel: vê todos os grupos |
| `grupos` | jsonb | `[{ geId, perfil, lojaIds, acessoTotal }]`; vazio para o operador |
| `expira_em` | timestamptz(3) | criação + `SESSAO_HORAS` |
| `encerrada_em` | timestamptz(3), nulo | preenchido no "Sair" |
| `created_at` | timestamptz(3) | |

Índice em `expira_em`. Sessão válida: `encerrada_em` nulo e `expira_em` no futuro.

`grupos` é JSON porque é um retrato do login, lido inteiro pela chave primária e nunca consultado por dentro. Depois de um novo login, a sessão anterior segue até vencer ou sair, com o retrato antigo.

```json
[{ "geId": "…", "perfil": "TENANT_ADMIN", "lojaIds": ["…", "…"], "acessoTotal": false }]
```

## Alteração em `auditoria`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `usuario_id` | text, nulo | id no Radar; nulo nos registros antigos e com o login desligado |
| `usuario_nome` | text, nulo | nome no momento da ação |

A coluna `perfil` continua.

## Sem mudança de estrutura

- **`grupos_economicos`**: `identificacao` recebe o número do grupo no Radar. Criados no login: `nome` do Radar, `responsavel` nulo.
- **`lojas`**: criadas no login com `ge_id`, `codigo` (id da loja no Radar), `nome` e `cnpj`; os demais campos ficam nulos e a situação da loja mostra as pendências. `ultima_carga` nula.

## Fluxo de um login

1. Ler `SessionInfo` e aplicar a regra de papel. Sem papel: recusar, sem gravar nada.
2. Operador: abrir a sessão com `operador = true` e `grupos = []`.
3. Usuário de loja: filtrar `status = 2` e CNPJ válido; buscar lojas por CNPJ, inclusive excluídas.
4. Criar grupos e lojas que faltam, numa transação; loja excluída não volta; grupo desativado sai do acesso.
5. Montar `grupos` a partir do `ge_id` real das lojas e marcar `acessoTotal` quando a pessoa tem todas as lojas ativas do grupo.
6. Sem nenhum grupo: recusar com `SEM_ACESSO`. Com grupo: gravar a sessão e emitir o JWT.
