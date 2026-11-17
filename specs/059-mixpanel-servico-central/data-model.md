# Data Model — Medição

Sem tabelas novas. Os dados vivem no Mixpanel.

## Pessoa medida (perfil no Mixpanel)
| Campo | Origem |
|---|---|
| ID (identificador) | `usuario.id` da sessão (novo; vem de `radarUsuarioId`) |
| `$name` | `usuario.nome` |
| `$email` | `usuario.email` |
| `perfil` | perfil atual da pessoa (ex.: `PLATFORM_OPERATOR`, `TENANT_ADMIN`, `SCHEDULE_VIEWER`) |
| `papel_radar` | `role.name` do Radar, em minúsculas (ex.: `admin`, `user`) |
| `operador` | sim/não |
| `quantidade_grupos` | quantos grupos econômicos a pessoa tem |
| `quantidade_lojas` | a quantas lojas ativas a pessoa tem acesso (todas as do grupo, se acesso total; senão as liberadas pelo Radar) |
| `acesso_total` | sim/não: vê todas as lojas de todos os seus grupos (operador: sim) |

Nada além disso. Sem nome de grupo, CNPJ, nome de loja ou bandeira.

## Evento
- `nome`: um dos nomes do [catálogo](contracts/catalogo-eventos.md).
- `propriedades`: só as listadas para aquele evento + `ambiente` (automática).
- Momento e pessoa: preenchidos pelo Mixpanel.

## Mudança na sessão (API)
`GET /auth/sessao` e a troca do login (modo SSO): `usuario` = `{ id, nome, email, papelRadar }` e novo campo `totalLojas` (lojas ativas dos grupos da pessoa). Banco: coluna nova `papel_radar` (texto, opcional) em `sessoes`, por migration; sessões antigas ficam sem o papel até a pessoa entrar de novo.
