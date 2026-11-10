# Modelo de dados: Margem nos cenários e na Simulação

Não há mudança no banco: nenhuma tabela, coluna ou migration. A margem já existe em `vendas_hora.margem` (importada hora a hora desde a base comercial) e passa a ser lida.

## Régua da loja
| Campo | Significado |
|---|---|
| `tipo` | `margem` ou `venda`: o que mede a perda e o ganho de horários |
| `motivo` | só quando `tipo` é `venda`: `sem_margem`, `margem_parcial` ou `margem_incoerente` |
| `cobertura` | proporção das linhas com venda que têm margem positiva (para o motivo) |

Calculada a cada pedido, a partir da base comercial ativa da loja. Não é guardada.

## Regras
- `tipo = margem` só se: soma da margem > 0, cobertura ≥ 90% e nenhuma linha com margem > venda.
- Margem negativa isolada conta como está.
- Sem base hora a hora, não há régua (nada muda, como hoje).

## O que muda nas respostas
- Cenários (`GET` do diagnóstico), detalhe da Simulação, lista e comparação trazem `regua: { tipo, motivo? }`.
- Os campos de perda e ganho de venda carregam margem quando `tipo` é `margem` (ver contrato).
- Margem em reais só para o dono; `regua` (sem valores) vai para todos.
