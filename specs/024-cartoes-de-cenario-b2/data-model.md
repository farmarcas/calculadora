# Data Model: Cartões de cenário B2

Sem mudança no banco. Só campos opcionais novos na resposta do Diagnóstico e estado de tela.

**Coluna do comparativo (acréscimos opcionais, só para o dono)**
- `saldoOperacaoMensal`: `(economiaFolha − custoFolha) + (vendaEstimada − vendaPerdida)` contra a folha atual; nulo sem dado de folha ou sem venda hora a hora.
- `vendaAdicionalPct`: venda adicional estimada ÷ faturamento mensal médio, em %; nulo sem faturamento.

**Já existentes e reutilizados**: `folhaAdicionalMensal` (custo de folha), `faturamentoPerdidoMensal` e `faturamentoPerdidoPct` (venda que deixa de entrar), `vendaAdicionalMensal` (venda estimada), `contratacoes` (inteiras, parcial, horas ociosas), `ociosidadePct`, `horasSemana`, `status`, `alertas`, `semVendaHoraria`, e `cenarios.<id>.horarioSemana` (dia, aberto, abre, fecha).

**Estado de tela**: qual painel está aberto (cenário) e qual elemento tinha o foco, para devolvê-lo ao fechar.

**Regras derivadas (funções puras)**
- Diferença do dia = (fecha − abre) do cenário − (fecha − abre) de antes, em horas (meia hora aceita); dia fechado vale 0 horas.
- Total da semana = soma dos dias; diferença total = total novo − total de antes.
- Contratação integral = 42h; menos que isso = parcial; barra = horas ÷ 42, no máximo 100%.
