# Contrato — situação do cadastro (campos novos)

Só se acrescentam campos opcionais; `status` e `motivo` continuam iguais (o motivo é o texto da primeira pendência).

| Onde | Campo | Tipo |
|---|---|---|
| `GET /lojas` (cada loja) | `situacao.quantidade` | número de pendências |
| `GET/PUT /lojas/:id/painel` | `situacao.pendencias` | lista de pendências (ver modelo) |
| `GET/PUT /lojas/:id/painel` | `situacao.quantidade` | número |
| `GET/PUT /lojas/:id/painel` | `equipe` | `{ farmaceuticos, funcoesNaEquipe[] }` |

Nenhum valor em R$ nem salário em nenhum desses campos, para nenhum perfil.
