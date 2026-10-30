# Folha mensal: antes e depois (spec 015)

Loja de teste: o quadro de hoje da Porto Feliz (GE 216): 2 farmacêuticos, 4 atendentes e 3 de apoio, com o salário médio de cada função (Farmacêutico R$ 4.722, Atendimento R$ 2.129, Apoio R$ 1.963). Soma dos salários: **R$ 23.849,00**.

Antes, o encargo era o percentual digitado na loja (66% nas lojas do grupo 216). Agora é o total do regime tributário da loja, calculado pelos componentes. O fator é `1 + encargos`.

| Cenário | Encargos | Folha mensal | Diferença para o antes | Parcial de farmacêutico de 14 h (Cenário 1, regra de 42 h) |
|---|---|---|---|---|
| Antes: 66% digitado (qualquer regime) | 66,0% | R$ 39.589,34 | — | R$ 2.612,84 |
| Simples Nacional | 29,0% | R$ 30.765,21 | R$ -8.824,13 | R$ 2.030,46 |
| Lucro Presumido | 62,2% | R$ 38.683,08 | R$ -906,26 | R$ 2.553,03 |
| Lucro Real | 62,2% | R$ 38.683,08 | R$ -906,26 | R$ 2.553,03 |
| Simples + rescisão | 33,0% | R$ 31.719,17 | R$ -7.870,17 | R$ 2.093,42 |
| Presumido/Real + rescisão | 67,2% | R$ 39.875,53 | R$ 286,19 | R$ 2.631,73 |

## Como o total é calculado

`diretos = INSS + RAT × FAP + terceiros + FGTS` · `provisões = 13º (8,33%) + férias + 1/3 (11,11%)` · `sobre provisões = provisões × diretos` · `total = diretos + provisões + sobre provisões + rescisão (se ligada)`.

- **Simples:** diretos 8% (só o FGTS; a contribuição patronal já está no DAS) → 8 + 19,44 + 1,5552 = **28,9952 ≈ 29,0%**.
- **Presumido e Real:** diretos 20 + 2 × 1,0 + 5,8 + 8 = 35,8% → 35,8 + 19,44 + 6,95952 = **62,19952 ≈ 62,2%**.
- **Rescisão ligada:** soma 4% (Simples) ou 5% (Presumido e Real).

## O que muda na prática

- As 37 lojas do grupo 216 (todas no Lucro Real) caem de 66% para 62,2%: a folha mostrada fica cerca de 2,3% menor.
- Uma loja do Simples com o mesmo quadro mostraria uma folha cerca de 22% menor que a do antes.
- Loja sem regime cadastrado usa o Lucro Presumido e mostra o alerta; ao escolher o regime, a folha recalcula na hora.

Percentuais de referência. Confirme com seu contador.
