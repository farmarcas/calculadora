# Data Model: Esticar os turnos até o limite da regra

Sem tabela nova. Os turnos da Simulação ficam na tabela `simulacao_turnos`, que ganhou duas colunas opcionais (migration `20261111120000_turno_esticado_antes`): `antes_entrada` e `antes_saida`.

> Correção feita na implementação: o plano supunha que os turnos eram um campo JSON; na verdade são linhas de `simulacao_turnos`, então o campo `antes` precisou de duas colunas novas (aditivas e opcionais).

- **Turno (`TurnoSim`)**: ganha `antes?: { entrada: number; saida: number }`, o horário do Cadastro de antes do esticamento; ausente quando o turno não foi esticado. Valores de 15 em 15 minutos, como os demais.
- **`HorarioPessoa`** (conta dos cenários): ganha `fixo?: boolean`.
- **Saída de `esticarTurnos`**: `{ turnos, esticados: [{ matricula, dia, de, para }] }`.

Regras: `limite = min(cargaH, teto)`; por dia, até `regra.maxDia` líquidas; nunca fora do horário da loja; 11 h de descanso entre dias; só onde a função tem falta; quem tem horário fixo e as vagas não entram.
