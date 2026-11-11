# Data Model: Esticar os turnos até o limite da regra

Nenhuma tabela nova nem migration (os turnos da Simulação são JSON).

- **Turno (`TurnoSim`)**: ganha `antes?: { entrada: number; saida: number }`, o horário do Cadastro de antes do esticamento; ausente quando o turno não foi esticado. Valores de 15 em 15 minutos, como os demais.
- **`HorarioPessoa`** (conta dos cenários): ganha `fixo?: boolean`.
- **Saída de `esticarTurnos`**: `{ turnos, esticados: [{ matricula, dia, de, para }] }`.

Regras: `limite = min(cargaH, teto)`; por dia, até `regra.maxDia` líquidas; nunca fora do horário da loja; 11 h de descanso entre dias; só onde a função tem falta; quem tem horário fixo e as vagas não entram.
