# Data Model — Medição

Sem tabelas novas. Os dados vivem no Mixpanel.

## Pessoa medida (perfil no Mixpanel)
| Campo | Origem |
|---|---|
| ID (identificador) | `usuario.id` da sessão (novo; vem de `radarUsuarioId`) |
| `$name` | `usuario.nome` |
| `$email` | `usuario.email` |
| `perfil` | perfil atual da pessoa (ex.: `PLATFORM_OPERATOR`, `TENANT_ADMIN`, `SCHEDULE_VIEWER`) |

Nada além disso. Sem grupo, CNPJ, loja ou bandeira.

## Evento
- `nome`: um dos nomes do [catálogo](contracts/catalogo-eventos.md).
- `propriedades`: só as listadas para aquele evento + `ambiente` (automática).
- Momento e pessoa: preenchidos pelo Mixpanel.

## Mudança na sessão (API)
`GET /session` (modo SSO): `usuario` passa de `{ nome, email }` para `{ id, nome, email }`.
