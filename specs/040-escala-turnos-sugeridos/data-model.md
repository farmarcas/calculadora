# Modelo de dados: turnos sugeridos

Não há mudança no banco nem nas respostas da API. Tudo usa o que a Simulação já guarda: o quadro (com as vagas), os turnos por pessoa e dia, a cobertura por dia e função e a regra.

## Visões da tela (não guardadas)
| Visão | Conteúdo |
|---|---|
| Rascunho de contratação | `{ funcao, tipo, dias, entra, sai }` do formulário aberto; vira a barra de prévia |
| Turno sugerido de uma vaga | `[{ dia, entrada, saida, iniIntervalo, fimIntervalo }]` calculado para uma vaga sem turnos |
| Turno habitual | o turno mais frequente de uma pessoa em outros dias da semana |
| Aviso da pessoa | os achados da avaliação (`avaliacao.erros` e `avisos`) com a matrícula selecionada |

## Regras
- Parcial: até 6 horas por dia, sem intervalo; integral: a jornada cheia da regra, com 1 hora de intervalo acima de 6 horas.
- Dias e horas por semana fora da regra viram avisos, não bloqueio.
- Nada vai ao Cadastro.
