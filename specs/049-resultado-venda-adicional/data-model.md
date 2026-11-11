# Data Model: Resultado da venda adicional (com CMV)

Sem tabela nova.

`resultado.horarioEstendido?` (só dono, só com horas novas):
- `vendaAdicionalMensal`, `cmvMensal`, `cmvPct`, `lucroBrutoMensal`, `aumentoFolhaMensal` (R$/mês)
- `resultadoMensal` (R$/mês), `recomendado` (boolean)
- `origemCmv`: `'hora' | 'media' | null`
- `estado`: `'ok' | 'sem_cmv' | 'sem_salarios' | 'sem_venda'`
- `horasNovasSemana`: quantas horas a mais por semana (para a conta aberta)
