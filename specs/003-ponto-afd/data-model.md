# Modelo de dados — ponto

| Tabela | Campos principais | Observações |
|---|---|---|
| `importacoes_ponto` | id, lojaId, arquivo, hash, cnpj, periodoInicio, periodoFim, batidasAceitas, batidasRepetidas, batidasPendentes, status (`processado`/`com_pendencias`/`rejeitado`), motivoRejeicao, autor, criadoEm | um registro por arquivo enviado, inclusive os rejeitados |
| `batidas` | id, lojaId, importacaoId, cpf, data (date), minuto (0–1439), nsr, situacao (`ok`/`pendente`/`vinculada`/`ignorada`), motivoPendencia, matricula (nula se pendente), resolvidaPor, resolvidaEm, motivoIgnorar | **único** (lojaId, cpf, data, minuto); índice (lojaId, data) |
| `lojas` (coluna nova) | `alertas` JSON | limites de hora extra e aderência; padrão aplicado quando nulo |

**Estados da batida**: `ok` (casada por CPF) · `pendente` (aguarda decisão) → `vinculada` (a uma pessoa) ou `ignorada` (com motivo).
**Regras**: arquivo de CNPJ de fora do grupo = rejeitado e não grava batida; CPF só aparece mascarado nas respostas; resolver por CPF cadastrado atualiza todas as pendentes daquele CPF na loja.
**Auditoria**: `ponto.importado`, `ponto.pendencia-resolvida`, `ponto.pendencia-ignorada`, `apuracao.exportada` (sem CPF no detalhe).
