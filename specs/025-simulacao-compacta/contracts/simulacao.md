# Contrato da Simulação compacta

**Resposta** (acréscimos opcionais em `resultado`): `vendaEstimada` (dono), `vendaPorHora.novas` (todos), `vendaPorHora.estimada` (dono). Nenhum campo existente muda de nome; `saldoMensal` muda de regra (contra a folha atual).

**Tela**: `PassoHorario` (lista de 400 px + gráfico `flex: 1`) e `PainelResultado` (360 px, fixo). Linhas do Resultado, nesta ordem: Folha extra · Hora extra · Venda que deixa de entrar · Venda estimada · Economia de folha · Horas abertas.

**Campo de horário**: 104 × 40 px; texto "HH:mm" à esquerda e, à direita, uma coluna de 32 px com + em cima e − embaixo (20 px cada); setas ↑ e ↓ mudam 30 min; valor inválido volta ao último válido; dia alterado com borda `--system-500` e valor em negrito.

**Barras do gráfico**: aberta (`--system-100`), pico (`--system-500`, rótulo em negrito), fechada na simulação (listrada em cinza, rótulo secundário), hora nova (verde claro, borda tracejada `--text-success-strong`, rótulo "+0,3" e hora em verde).

**Textos**: só Folha extra, Hora extra, Venda que deixa de entrar, Venda estimada, Economia de folha, Horas abertas e Saldo por mês; sinal tipográfico "−".
