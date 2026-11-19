# Data Model: Hora extra antes de contratar

Sem mudança de banco. A hora extra é **calculada**, nunca gravada.

- **Regra** (`HORA_EXTRA`): `maxPorDiaH = 2`, `maxPorSemanaH = 10`, `adicionalPct = 50`, `semanasNaFolha = 5`.
- **`LinhaFuncao`** (já existente) ganha: `horaExtraH` (horas por semana cobertas por hora extra), `horaExtraCustoMensal` (R$; nulo sem salário), `faltaAposHoraExtraH` (o que a contratação ainda precisa cobrir). `gapH`/`faltaH`/`falta` seguem como a falta bruta.
- **Cenário** (`CenarioManter` e linhas): `horaExtra: { funcao, horasSemana, custoMensal? }[]` (só dono recebe `custoMensal`); `custoAdicionalMensal` = vagas + hora extra; `contratacoes` = só o que sobra; `semContratar` quando há hora extra e nenhuma contratação.
- **Resultado da Simulação** (já existente): `horaExtra` (R$) passa a vir da mesma conta; `emHoras.horaExtraH` = horas cobertas por hora extra; nova informação de falta restante.
- **Alertas**: texto curto, com os dois custos só para o dono.
