# Data Model: Simulação compacta

Sem mudança no banco. Campos opcionais novos na resposta da simulação (`resultado`):

- `vendaEstimada` (só dono): venda estimada das horas novas, por mês; `0` quando nenhum horário aumenta; nulo sem base comercial.
- `vendaPorHora.novas` (todos): matriz 7 × 24 de booleanos, `true` na hora que a simulação abre e o Cadastro não abre.
- `vendaPorHora.estimada` (só dono): matriz 7 × 24 com a venda média estimada de cada hora nova (zero nas outras); nula sem base.
- `saldoMensal` e `saldoAnual`: passam a seguir a nova função (`−folha extra − hora extra + venda estimada − venda que deixa de entrar`); `pesoNoFaturamentoPct` acompanha.

Já existentes e mantidos: `folhaExtra`, `horaExtra`, `economiaFolha` (informativa), `vendaQueSai` (valor da venda que deixa de entrar), `vendaPorHora.venda`, `.clientes`, `.fechadas`, `.ticketMedio`, `horario.dias` e `horario.cadastro`, `horasAbertas`, `horasAbertasAntes`.

**Regras puras**
- Passo de horário = 1 hora (o cálculo trabalha em horas inteiras); abertura em 00:00 a 23:00 e fechamento em 01:00 a 24:00; abertura sempre pelo menos 1 hora antes do fechamento; valor digitado só vale se for hora cheia ("HH:00") dentro dos limites; o horário quebrado que já veio do Cadastro continua válido e anda de hora em hora a partir dele.
- Horas do dia = fechamento − abertura (dia fechado = 0).
- Hora nova = aberta na simulação e fechada no Cadastro; hora fechada na simulação = aberta no Cadastro e fechada na simulação.
- Venda estimada de uma hora nova = a registrada, se maior que zero; senão 50% da venda da hora vizinha (a mais próxima aberta no Cadastro no mesmo dia); sem vizinha, 0.
