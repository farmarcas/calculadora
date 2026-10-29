# Data Model: multiempresário por GE

## GrupoEconomico (`grupos_economicos`) — novo
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid v7 | PK |
| nome | texto | obrigatório |
| identificacao | texto | obrigatório, único: o número do "Grupo Econômico" da plataforma |
| responsavel | texto | opcional: nome do responsável pelo GE (vem do Excel); usado como nome inicial |
| ativo | boolean | padrão verdadeiro; GE desativado não entra |
| createdAt / updatedAt | datas | |

GE inicial: id fixo na migration, nome "Grupo inicial", identificação "GE-INICIAL".

## Loja (`lojas`) — muda
- **+ geId** (uuid, NOT NULL, FK) — preenchido com o GE inicial para o que já existe.
- `codigo`: único **dentro do GE** entre ativas (índice parcial `ge_id, codigo`).
- `cnpj`: 14 dígitos, único no sistema entre ativas (índice parcial); vazio permitido só nas lojas antigas ("CNPJ pendente").
- **+ ultimaCarga** (Json, opcional): retrato dos valores do último Excel (para detectar correção do empresário).
- Demais campos iguais.

## Funcionário (`funcionarios`) — sem coluna nova
Pertence ao GE pela loja. Matrícula única dentro do GE: conferência feita no serviço com consulta `loja.geId`, como já é por loja hoje (nenhuma restrição de banco muda).

## ImportacaoCadastro (`importacoes_cadastro`) — muda
- **+ geId** (uuid, FK) — GE inicial no que já existe; vazio só na carga de lojas da plataforma.
- **+ tipo** (`cadastro` | `carga_lojas`), padrão `cadastro`.
- `resumo` (Json) guarda, na carga de lojas, as linhas a criar, atualizar, rejeitar, ignoradas por status e os conflitos, agrupados por GE. A carga de lojas é da plataforma: o `ge_id` fica vazio nela (só nas importações de cadastro de um GE), então a coluna aceita vazio.

## Auditoria (`auditoria`) — muda
- **+ geId** (uuid, opcional): GE da ação (vazio em ações da plataforma sem GE).

## Sem mudança
`parametros_legais` (globais), `users` (exemplo do modelo), `cargas`, `turnos_atuais`, `vendas_hora`, `simulacoes`, `simulacao_turnos` e as tabelas de ponto herdam pela loja.

## Regras
- Loja só muda de GE por ação do operador (fora do escopo desta entrega).
- Desativar GE não apaga nada; só bloqueia o acesso e a escrita.
- O empresário não altera `cnpj` nem `geId`.
