# Data Model: Aposentar a planilha de escala

**Migration (nova)**: `funcionarios.ini_intervalo` e `funcionarios.fim_intervalo`, `DOUBLE PRECISION NULL` (horas decimais, 12.5 = 12:30), sem valor padrão. Sem índice. As tabelas `cargas`, `turnos_atuais` ficam como estão.

**Regras do intervalo** (planilha e tela): os dois informados ou nenhum; fim > início; entrada ≤ início e fim ≤ saída; formato "HH:MM"; funcionário sem entrada e saída não pode ter intervalo.

**Cobertura**: `presente(t, h)` já desconta `iniIntervalo < h + 1 && fimIntervalo > h`; o Cadastro passa a preencher esses campos.

**Relatório da migração (saída do script, não vai ao banco)**: por loja `{ loja, preenchidos, jaTinhamDados, semCorrespondente[] }` e os totais.

**API do funcionário**: `iniIntervalo` e `fimIntervalo` ("HH:MM", opcionais, anuláveis) em criar, editar e listar; a planilha de funcionários ganha as colunas `inicio_intervalo` e `fim_intervalo` (com sinônimos).
