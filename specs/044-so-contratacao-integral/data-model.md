# Data Model: Só contratação integral

Nenhuma tabela nova nem migration.

- **Sugestão de contratação** (`Sugestao`): `tipo` passa a ser só `'integral'`; `parcialH` é sempre `null`; `inteiras ≥ 1` quando há falta; `variante` e `extrasH` ficam zerados.
- **`LinhaFuncao`**: `contratar = contratarInteiras`; `parcialH = null`; `parcialTurnos = 0`.
- **Vaga simulada**: vagas novas têm `cargaH` = jornada cheia da regra; vagas antigas mantêm a carga que tinham.
- **Resultado da simulação**: `contratacoes[].tipo` continua aceitando `'parcial'` para vagas salvas antes.
