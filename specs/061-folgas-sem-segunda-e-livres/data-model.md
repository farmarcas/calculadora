# Data Model: Folgas sem segunda-feira, equipe espalhada e folga livre

Sem mudança de banco nem de contrato.

- **Folga** = dia aberto da loja em que a pessoa **não tem turno** na simulação (ausência de linha em `simulacao_turnos`). Dar folga remove o turno do dia; escalar cria um turno.
- **Turno** (já existente): `{ matricula, dia (0 = segunda … 6 = domingo), entrada, saida, iniIntervalo, fimIntervalo, antes? }`.
- **Aviso de folga**: texto na lista `avisos` já devolvida pela sugestão e mostrada na Escala da semana. Dois formatos novos (ver `research.md`, D4).
- **Entrada da sugestão** (já existente): quadro, turnos, cobertura, dias abertos e regra. A contagem de "colegas do mesmo cargo que não trabalham no dia" é derivada dos turnos, sem campo novo.
