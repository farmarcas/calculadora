# Data Model: Folgas sugeridas

Nenhum dado novo no banco. Na tela:

- **Entrada de `sugerirFolgas`**: `quadro` (pessoas, sem vagas), `turnos`, `coberturaPorDia`, `abas` (dias abertos), `regraInfo.dias`.
- **Saída**: `{ turnos, retirados: [{ matricula, dia }], avisos: [texto], domingoSugerido: boolean }`.
- **Estado da página**: `antesDeSugerir` (turnos de antes da sugestão, ou `null`), usado por "Desfazer sugestão".

Regras: só entra quem tem mais dias de turno que `regraInfo.dias`; Contratação simulada (`vaga`) não entra; domingo só conta se está em `abas`; os turnos que sobram mantêm horário e intervalo.
