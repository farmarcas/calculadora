# Modelo de dados: Base comercial por CNPJ

## Mudança no banco (uma migration)
| Tabela | Coluna | Antes | Depois |
|---|---|---|---|
| `vendas_hora` | `clientes` | inteiro | decimal |
| `vendas_hora` | `unidades` | inteiro | decimal |

Valores existentes não mudam (inteiros viram decimais com o mesmo valor). Não há tabela nova.

## Arquivo de entrada (não é guardado)
| Coluna do arquivo | Uso |
|---|---|
| `cnpj` | acha a loja (14 dígitos, sem pontuação) |
| `dia_semana` | 1 = segunda … 7 = domingo; outro valor rejeita a linha |
| `hora` | 0 a 23; outro valor rejeita a linha |
| `faturamento` | venda líquida do período; vazio, negativo ou texto rejeita a linha |
| `cmv_valor` | CMV em reais do período; vazio fica sem CMV |
| `tickets_vendidos` | vira clientes atendidos |
| `unidades_vendidas` | unidades |
| `dia_semana_nome`, `valor_bruto`, `ticket_medio` | ignoradas |

## Conversão
- Cada valor ÷ número de vezes do dia da semana no período = média de um dia.
- Data de referência do dia da semana = primeira ocorrência dele no período.
- Linhas da mesma loja, dia e hora são somadas antes de converter.

## O que é gravado por loja
- `cargas`: nova carga BASE ativa (arquivo, linhas aceitas e rejeitadas, período declarado); a anterior vira inativa.
- `vendas_hora`: uma linha por dia da semana e hora (venda, CMV, clientes, unidades).
- `lojas.faturamento`: `dias[i]` e `cmvPct` só se estiverem vazios.
  - `dias[i]` = soma das vendas médias das horas daquele dia da semana (arredondado em reais).
  - `cmvPct` = soma do CMV ÷ soma da venda × 100 (uma casa decimal).
