# Modelo de dados: Custos e Turnos com faturamento por hora

Não há mudança no banco: nenhuma tabela, coluna ou migration. A série é calculada a cada leitura do painel, a partir da base comercial ativa da loja.

## Série de faturamento por hora (nova, na resposta do painel)
| Campo | Significado |
|---|---|
| `temBase` | há base comercial ativa com vendas por hora |
| `periodo` | `{ inicio, fim, dias, semanas }` da base ativa |
| `poucosDias` | menos de 4 semanas de vendas |
| `tipos.uteis`, `tipos.sabado`, `tipos.domingo` | lista de `{ hora, participacao, valor? }`, ou nulo se não há venda nesse tipo de dia |

- `valor`: média por dia daquele tipo naquela hora, em reais. **Só para o dono**; para os demais o campo não existe.
- `participacao`: parte da venda do dia (0 a 1) que cai naquela hora; vai para todos os perfis.

## O que a tela deriva (não é guardado)
Faturamento do turno (soma das horas), % do dia, média por hora, pico, e a sugestão de turnos.
