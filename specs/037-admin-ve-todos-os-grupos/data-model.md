# Data Model: Admin do Radar vê todos os grupos

## Sem mudança de estrutura

- Calculadora: nenhuma migration. `grupos_economicos` recebe linhas novas no login do Admin (só `identificacao` e `nome`), como já acontece no login dos associados.
- Radar: só leitura.

## Sessão (`sessoes.grupos`)

Cada item continua com o mesmo formato:

| Campo | Admin (grupo inteiro) | Demais |
| --- | --- | --- |
| `geId` | id do grupo na calculadora | idem |
| `perfil` | `TENANT_ADMIN` | `TENANT_ADMIN` |
| `lojaIds` | `[]` | lojas vinculadas no grupo |
| `acessoTotal` | `true` | `true` só se tiver todas as lojas ativas do grupo |

## Fluxo de um login

1. Calculadora chama `Sso/Exchange` e recebe `accessToken` e `economicGroups`.
2. Calculadora lê `SessionInfo` e confere a permissão "Gestão de Escala".
3. Na mesma transação: cria lojas e grupos das lojas vinculadas (como hoje) e os grupos inteiros que faltam.
4. Junta os dois: grupos inteiros ativos com acesso total, e os grupos das lojas vinculadas que não estão entre eles.
5. Sem nenhum grupo: sem acesso. Com grupos: abre a sessão.
