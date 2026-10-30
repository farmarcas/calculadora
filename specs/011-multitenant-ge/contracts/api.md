# Contrato da API: multiempresário por GE

Cabeçalhos em todas as rotas de `/api/v1` (exceto saúde): `X-Perfil` (agora aceita `PLATFORM_OPERATOR`) e `X-GE` (id do GE). Sem `X-GE`: 400 `GE_OBRIGATORIO` nas rotas do GE. GE inexistente ou desativado: 403 `GE_INDISPONIVEL`. Registro de outro GE: 404 `NOT_FOUND`.

## Grupos econômicos
| Rota | Perfil | O que faz |
|---|---|---|
| `GET /ge` | todos | Lista de GEs ativos (id, nome) para escolher em tela. Provisório até o SSO. |
| `GET /ge/resumo` | operador | Cada GE (inclusive desativados) com `lojas` e `lojasComEquipe` |
| `POST /ge` | operador | Cria GE `{ nome, identificacao }` |
| `PATCH /ge/:id` | operador | Renomeia ou desativa/reativa |

## Carga de lojas (operador; não usa `X-GE`: o arquivo traz os GEs)
| Rota | O que faz |
|---|---|
| `GET /cargas-lojas/modelo` | Baixa o Excel modelo, no formato do relatório da plataforma |
| `POST /cargas-lojas` | Envia o arquivo (`arquivo`); devolve `{ id, arquivo, totalLinhas, ignoradasPorStatus, pendencias{ semRegime, semHorario, horarioAjustado }, totais{ gesNovos, criar, atualizar, semMudanca, conflitos, rejeitadas, foraDoArquivo, saiuDoAtivo }, porGe[], conflitos[{ ge, cnpj, loja, campo, atual, planilha }], rejeitadas[{ linha, cnpj, motivo }], foraDoArquivo[], saiuDoAtivo[] }` (listas com até 500 itens) sem gravar |
| `POST /cargas-lojas/:id/confirmar` | Body `{ substituirConflitos: "nenhum" (padrão) \| "todos" \| ["cnpj", ...] }`; refaz a conferência com o que existe agora, grava tudo numa só transação e devolve `{ gesCriados, lojasCriadas, lojasAtualizadas, conflitosSubstituidos, conflitosMantidos, rejeitadas }` |

## Rotas existentes (agora filtradas pelo GE)
| Rota | Mudança |
|---|---|
| `GET /lojas`, `GET /lojas/:id`, diagnóstico, simulações, custos | só dados do GE; outro GE = 404 |
| `POST /lojas`, `DELETE /lojas/:id`, importação de lojas | **só operador** |
| `PUT /lojas/:id` | dono, gestor e operador; `cnpj` no corpo de dono/gestor é ignorado com aviso de 400 `CNPJ_NAO_EDITAVEL` se diferente |
| funcionários (CRUD e planilha) | `lojaId` precisa ser do GE; senão 404 / linha rejeitada |

## Erros novos
`GE_OBRIGATORIO` 400, `GE_INDISPONIVEL` 403, `CNPJ_INVALIDO` 422, `CNPJ_EM_USO` 409 (sem dizer onde), `CNPJ_NAO_EDITAVEL` 400, `ARQUIVO_FORA_DO_MODELO` 422 (colunas faltando).
