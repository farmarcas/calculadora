# Regras da comparação (tela)

**Base**: a primeira simulação da comparação. "Usar como base" move a coluna escolhida para a primeira posição e recalcula tudo.

**Diferença** de uma métrica numérica: `valor da simulação − valor da base`, arredondado como o valor mostrado. Zero = "igual". Métrica sem valor em um dos lados ("—") = sem diferença.

**Sentido da cor** (efeito no resultado, não o sinal):

| Métrica | Aumento | Queda |
|---|---|---|
| Saldo, Venda estimada | verde | vermelho |
| Folha extra, Venda que deixa de entrar | vermelho | verde |
| Erros nas regras, Avisos, Horas que faltam | vermelho | verde |
| Horas abertas, Horas que sobram, Pessoas, Horas planejadas, Horas contratadas, Folgas, Cobertura | neutro | neutro |

Farmacêutico em todo o horário é uma marca (cobre tudo / falta): mudou ou não, sem número.

**Contagem**: "N de M itens mudaram", com M = 15 métricas (5 + 3 + 3 + 4) e N = as que diferem da base em alguma coluna. Sem valores em reais (não dono), M = 11 (as 4 métricas em reais não existem).

**"Mostrar só o que mudou"**: esconde as métricas iguais em todas as colunas e os grupos que ficarem vazios.

**Formato**: saldo e diferenças em reais com `+` ou `−` (U+2212), `R$ 2.299`; horas `89h`; triângulo `▲`/`▼` junto da diferença; a cor nunca é o único sinal.
