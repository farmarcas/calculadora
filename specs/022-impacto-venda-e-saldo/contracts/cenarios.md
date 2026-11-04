# Contrato — Diagnóstico e Simulação (mudanças)

Os campos de margem saem das respostas dos cenários e da Simulação; entram os de venda e saldo (ver o modelo de dados). Valores em R$ seguem só para o dono. Quem não é dono continua vendo dias e horas.

| Onde | Mudança |
|---|---|
| `GET /lojas/:id/diagnostico` | colunas do comparativo ganham `vendaPerdidaMensal`, `vendaPerdidaPorDia`, `economiaFolhaMensal`, `vendaAdicionalMensal`, `saldoMensal`, `saldoAnual`, `pesoNoFaturamentoPct`, `semVendaHoraria`; perdem `margemMes`, `resultadoLiquidoMensal`, `ganhoFrenteManterMensal` |
| `GET /lojas/:id/diagnostico?fatorHoraNova=50` | nova premissa (0 a 100); `margemPct` deixa de existir |
| Simulação (resultado) | `economiaFolha` e `saldoMensal` entram; `margemPerdida` e `margemInformada` saem |
| `GET/PUT /lojas/:id/painel` | a margem deixa de aparecer em `situacao.pendencias` |
