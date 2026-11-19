# Data Model: Editar o horário com minutos exatos

Sem mudança de banco nem de contrato.

- **Turno** (já existente): `{ matricula, dia, entrada, saida, iniIntervalo, fimIntervalo, antes? }` em horas decimais com minutos inteiros (15,4 = 15h24).
- **Valores da janela**: `{ entrada, iniIntervalo, fimIntervalo, saida }` como texto "HH:mm" (intervalo pode ser vazio). `lerHorario` converte para horas decimais; `horarioTexto` faz o caminho de volta.
- **Janela do dia**: `{ abre, fecha }` do dia (já usada pelo arrastar); limita os valores.
- **Regra gravada**: ao salvar, `antes` do turno é descartado (o horário digitado é a escolha da pessoa).
