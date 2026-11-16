# Catálogo de eventos

Nomes em `snake_case`, em português. Toda chamada passa por `registrar(nome, props)` do serviço. Propriedade fora desta lista é descartada. Todo evento recebe também `ambiente`.

| Evento | Quando | Propriedades |
|---|---|---|
| `login_concluido` | volta do login do Radar com sucesso | — |
| `tela_vista` | a pessoa abre uma tela/aba do menu | `tela` (`cadastros`/`escala`/`grupos`), `secao` (`lojas`/`parametros`/`diagnostico`/`simulacoes`/…) |
| `loja_trocada` | troca a loja no filtro | — |
| `simulacao_criada` | cria/roda uma simulação | `regra_horas` (40/42/44), `origem` (`escala_atual`/`vazia`/…) |
| `cenario_salvo` | grava ou clona um cenário | — |
| `importacao_concluida` | termina uma importação | `tipo` (`cadastro`/`base`), `resultado` (`sucesso`/`erro`) |
| `parametros_salvos` | salva parâmetros legais/encargos | `tipo` (`encargos`/`regime`) |
| `exportacao_feita` | baixa planilha ou arquivo | `tipo` (`modelo` = planilha modelo, `erros` = lista de erros da importação, `parecer` = PDF do cenário) |

Fora do catálogo: qualquer valor em dinheiro, nome de loja, CNPJ, texto digitado pela pessoa.

## Interface do serviço (`src/analytics/servico.js`)
- `iniciar()` — lê o token; sem token, vira inativo.
- `identificar({ id, nome, email, perfil })` — liga eventos à pessoa; atualiza o perfil.
- `registrar(evento, props?)` — valida contra o catálogo e envia; nunca lança erro.
- `limpar()` — na saída; desfaz a identidade.
