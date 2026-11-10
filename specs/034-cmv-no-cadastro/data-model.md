# Modelo de dados: CMV no lugar da margem

## Mudanças no banco (uma migration)
| Onde | Antes | Depois |
|---|---|---|
| `vendas_hora.margem` (FLOAT, não nulo) | margem bruta por hora, em reais | `vendas_hora.cmv` (FLOAT, nulo permitido): CMV por hora, em reais. Todas as linhas ficam nulas depois da limpeza |
| `lojas.faturamento` (JSON) | `{ dias, mensal, margemPct }` | `{ dias, mensal, cmvPct }`. A chave `margemPct` é removida das lojas que a tinham; `cmvPct` nasce ausente |

Não há tabela nova. A limpeza só afeta essas duas colunas/chaves; venda, clientes, unidades, datas, horas, bases (ativas e históricas), simulações, equipe e custos ficam como estão.

## Regras
- `cmvPct`: número de 0 a 100, ou ausente. Só o dono vê e edita.
- `cmv` por hora: número ≥ 0, ou nulo. CMV maior que a venda da hora é dado suspeito (régua cai em venda).
- Lucro bruto da hora = venda − `cmv`; sem `cmv`, venda × (1 − `cmvPct`/100); sem nenhum dos dois, sem lucro bruto (régua de venda).
- A migration é idempotente: rodar de novo não muda nada.
