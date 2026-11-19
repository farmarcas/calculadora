# Contrato: o que as respostas e as telas passam a trazer

Sem endpoint novo. Campos novos nas respostas existentes (`/lojas/:id/cenarios`, comparativo/linhas do Diagnóstico, `/simulacoes/:id`, parecer). Todos aditivos: quem lê os campos antigos não quebra.

## Servidor → tela (linha do cenário)
| Campo | Quem recebe | Conteúdo |
| --- | --- | --- |
| `horaExtra[]` | todos | `{ funcao, horasSemana }` |
| `horaExtra[].custoMensal` | só dono | R$ por mês (nulo sem salário) |
| `contratar[]` | todos | agora só o que sobra depois da hora extra |
| `semContratar` | todos | verdadeiro quando há hora extra e nenhuma contratação |
| `alertasHoraExtra[]` | todos | frases curtas; valores em R$ só para o dono |
| `custoAdicionalMensal`, peso da folha | só dono | soma vagas + hora extra |

## Textos (tela)
- Coluna "Contratar": uma linha por cargo com hora extra ("Hora extra: 2 h por semana de farmacêutico") e, abaixo, as contratações que sobraram.
- Rótulo do cartão quando `semContratar`: "Cobre sem contratar".
- Cenário: "Sem contratar: cobre com N h de hora extra por semana".
- Alertas: "Contratar sairia mais barato: a hora extra custa R$ X por mês e contratar, R$ Y." (dono) / "Contratar sairia mais barato que a hora extra." (gestor/consulta); "A hora extra não basta: o que passa de {teto} h por semana por pessoa vira contratação."
