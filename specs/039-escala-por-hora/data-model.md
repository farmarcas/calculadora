# Modelo de dados: Escala por hora

Não há mudança no banco: turnos e vagas já ficam na simulação (`turnos` e `quadro`).

## Mudanças nas respostas e nos pedidos
| Onde | Mudança |
|---|---|
| `avaliacao.cobertura[dia][função].porHora[]` | cada célula ganha `exigido` (pessoas exigidas naquela hora) |
| `PUT /simulacoes/:id` (`vagas[]`) | cada vaga nova aceita `turnos: [{ dia, entrada, saida, iniIntervalo?, fimIntervalo? }]`; o servidor dá a matrícula da vaga aos turnos |
| `POST /simulacoes/:id/efeito-contratacao` | novo: prévia do custo de pessoal em % de uma contratação, sem gravar; só o dono recebe o número |

## Visões da tela (não guardadas)
| Visão | Conteúdo |
|---|---|
| Dia | dias abertos da simulação (abas) |
| Faixa de horas | horas abertas do dia, uma coluna cada |
| Venda e clientes por hora | `resultado.vendaPorHora.venda` (só dono) e `.clientes`, por dia e hora, com quatro tons por quartil do dia |
| Linha de função | pessoas por hora, mínimo (`mín. N`, com `+ reforço` quando varia no dia) e as pessoas da função |
| Pessoa | turno do dia, total da semana ("40h · 5 dias"), folga |
| Contratação simulada | vaga `VAGA-n` com turnos; linha azul com "Remover" |

## Regras
- Valor em reais (venda por hora, custo) só para o dono; gestor e visualizador nunca o recebem.
- Contratação e turnos valem só para a simulação em rascunho; nada vai ao Cadastro.
- Vaga: 4 a 44 horas inteiras por semana; parcial até 30 horas.
