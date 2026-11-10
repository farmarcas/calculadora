# Modelo de dados: Resultado da simulação em horas e porcentagem

Não há mudança no banco. O resultado da simulação (`resultado`) ganha o bloco `emHoras`, igual para todos os perfis; ele é recalculado a cada abertura, como o resto do resultado.

## `resultado.emHoras`
| Campo | Significado |
|---|---|
| `status` | `inviavel`, `vende_mais`, `perde_venda`, `equipe_menor` ou `cobre` |
| `causa` | frase da faixa amarela, ou nulo |
| `vendaPct` / `vendaEstado` | variação da venda em % (uma casa, com sinal) e `ok`, `nao_estimada` ou `sem_calculo` |
| `custoPct` / `custoEstado` | variação do custo de pessoal em % e `ok`, `sem_salarios` ou `sem_calculo` |
| `pessoas` | `{ hoje, simulacao }` |
| `horasContratadas` | `{ hoje, simulacao }`, horas semanais |
| `horasAbertas` | `{ hoje, simulacao }`, horas por semana (os campos de hoje já existem: `horasAbertasAntes` e `horasAbertas`) |
| `horaExtraH` | horas por semana que ainda faltam cobrir com hora extra |
| `contratar` | lista de `{ funcao, inteiras, parciaisHoras: number[] }` |

## Regras
- Nenhum valor em reais e nenhum salário em `emHoras`.
- Venda em %: (venda real estimada das horas novas − venda real que deixa de entrar) ÷ faturamento mensal real.
- Custo em %: (folha das vagas + hora extra) ÷ folha do quadro de hoje.
- Os campos em reais existentes (`saldoMensal`, `folhaExtra`, `horaExtra`, `vendaQueSai`, `vendaEstimada`, `economiaFolha`) continuam só para o dono.
