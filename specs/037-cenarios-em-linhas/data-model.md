# Modelo de dados: Cenários em linhas

Não há mudança no banco. A resposta do diagnóstico ganha `cenarios.r42.linhas` e `cenarios.r40.linhas`.

## Linha de cenário (um item de `linhas`, igual para todos os perfis)
| Campo | Significado |
|---|---|
| `id` | `manter`, `economia` ou `equilibrio` |
| `nome` | Manter horários, Sem contratações, Equilíbrio |
| `igualA` | `"Manter horários"`, `"Sem contratações"` ou nulo (Equilíbrio que repete outro) |
| `status` | um de `inviavel`, `nao_resolve`, `nao_recomendado`, `vende_mais`, `perde_venda`, `equipe_menor`, `cobre`; nulo se indisponível |
| `causa` | frase da faixa amarela, ou nulo |
| `indisponivel` | `{ motivo: "custos" \| "vendas", dono: boolean }` ou nulo; o texto é escolhido pela tela pelo perfil |
| `contratar` | lista de `{ funcao, inteiras, parcialHoras }` (a tela escreve "1 atendente · parcial") |
| `horasSemana` | total de horas por semana do cenário |
| `horasDiferenca` | total do cenário menos o horário de hoje |
| `horarioSemana` | sete dias `{ dia, aberto, abre, fecha }` do cenário |
| `vendaPct` | variação da venda em % com sinal (uma casa) ou nulo |
| `vendaEstado` | `ok`, `nao_estimada` (sem venda por hora) ou `sem_calculo` |
| `custoPct` | variação do custo de pessoal em % com sinal ou nulo |
| `custoEstado` | `ok`, `sem_salarios` ou `sem_calculo` |
| `contratacoes`, `ajustes`, `diasFechar` | o que o Personalizar leva para a simulação (sem valores em reais) |

## Regras
- Nenhum campo de valor em reais e nenhum salário na linha.
- `sugerido` continua em `comparativo.sugerido` e só vai para o dono; as linhas não dizem qual é o sugerido.
- Ordem das linhas: Equilíbrio, Manter horários, Sem contratações.
