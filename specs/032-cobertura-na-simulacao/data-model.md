# Modelo de dados: Cobertura e vendas na Simulação

Não há mudança no banco: nenhuma tabela, coluna ou migration. A cobertura é calculada a cada leitura do detalhe da simulação, a partir do que a simulação e a loja já guardam.

## O que entra na conta (já existe)
| Dado | De onde vem |
|---|---|
| Horário simulado (dias abertos) | simulação (rascunho: o da tela; gravada: o congelado nas premissas) |
| Quadro (pessoas, vagas, desligados) | simulação |
| Turnos por pessoa e dia | simulação |
| Mínimos por função e hora | premissas da simulação (rascunho: da loja ao vivo) |
| Turnos da loja (linha "Turnos" da grade) | loja |
| Vendas por dia e hora | base comercial ativa da loja |
| Perfil de quem pede | requisição (dono ou não) |

## O que sai (novo campo `cobertura` no detalhe)
- **horas**: horas do eixo em que a loja abre em algum dia.
- **funcoes**: por função, o mínimo de pico e, por hora, `{ hora, pessoas, ok, exigido? }` no pior dia; `pessoas` nulo quando a hora está fora do horário.
- **vendas**: por hora, a participação no dia e, só para o dono, a venda média em reais.
- **vagasSemTurnos**: quantas vagas não têm turnos.
- **horarios**: o horário simulado no formato que a tela já entende, para o aviso de vendas fora do horário.
- **turnosDaLoja**: os turnos cadastrados na loja e o modo do mínimo, para a linha "Turnos".

Contrato completo em [contracts/cobertura-no-detalhe.md](contracts/cobertura-no-detalhe.md).

## Regras de validação
- Desligados nunca contam; vaga só conta com turnos; função sem ninguém aparece com 0 pessoas.
- `vendas` é nulo quando a loja não tem base comercial; `turnosDaLoja` é nulo quando a loja usa só o mínimo único.
- Para quem não é dono, nenhum campo em reais existe na resposta.
