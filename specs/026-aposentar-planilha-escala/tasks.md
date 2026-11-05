# Tarefas: Aposentar a planilha de escala

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node`, tela em `frontend/react/src/features`. Cada fatia termina com os testes passando e um commit.

## Fatia 1 — Intervalo no funcionário (servidor) (História 2, P1)
- [x] T001 [US2] `prisma/schema.prisma` e migration `<data>_intervalo_funcionario`: `Funcionario.iniIntervalo` e `fimIntervalo` (`Float?`, mapeadas para `ini_intervalo` e `fim_intervalo`, sem valor padrão); aplicar a migration no banco local e regenerar o cliente
- [x] T002 [P] [US2] `cadastros/intervalo.ts` (nova, pura): `validarIntervalo({ entrada, saida, ini, fim })` com as regras — os dois juntos ou nenhum; fim depois do início; entrada ≤ início e fim ≤ saída; sem entrada e saída não há intervalo — devolvendo a mensagem em português de cada erro (as do contrato) ou nulo
- [x] T003 [P] [US2] `cadastros/intervalo.test.ts`: válido (12:00–13:00 em 08:00–17:00); só o início; só o fim; fim igual ou antes do início; início antes da entrada; fim depois da saída; sem entrada e saída; ambos vazios = válido
- [x] T004 [US2] `cadastros.schemas.ts`, `cadastros.service.ts`, `cadastros.repository.ts`: `iniIntervalo` e `fimIntervalo` ("HH:MM", opcionais, `null` para limpar) em criar, editar e listar; validação pelo `validarIntervalo` com a entrada e a saída que ficarão no registro; conversão HH:MM ↔ horas decimais como a de entrada e saída
- [x] T005 [US2] `planilhas/campos.ts`: colunas opcionais `inicio_intervalo` e `fim_intervalo` em `CAMPOS_FUNCIONARIO` (com sinônimos como "início do intervalo", "saída para almoço", "volta do almoço"); `cadastros/processar.ts`: ler e validar por linha (só a linha com erro é recusada), planilha sem as colunas continua válida
- [x] T006 [US2] `planilhas/modelo.ts`: o modelo de funcionários traz as colunas de intervalo, com exemplo e uma linha de instrução
- [x] T007 [US2] Testes de integração e de importação (`cadastros.routes.integration.test.ts` e o teste do `processar`): gravar e devolver o intervalo; limpar com `null`; cada erro com a mensagem certa; importação com e sem as colunas; modelo com as colunas
- [x] T008 Rodar os testes do servidor e commitar a fatia

## Fatia 2 — Diagnóstico só do Cadastro (servidor) (História 1, P1)
- [x] T009 [US1] `escala.repository.ts`: `turnosDoCadastro` devolve `iniIntervalo` e `fimIntervalo` (hoje `null`); sem mudar quem entra (função no cálculo, com entrada, saída e dias)
- [x] T010 [US1] `escala.service.ts` (`diagnostico`): usar só `turnosDoCadastro`; sair a busca da escala importada, a mescla das duas fontes e o cálculo de funcionários com horário divergente; a `meta` passa a ser sempre "Cadastro de funcionários" quando há horários
- [x] T011 [US1] `diagnostico.ts`: o estado "sem horário" (texto "Importe a escala atual para ver o diagnóstico.") passa a "Cadastre o horário dos funcionários em Cadastros › Equipe para ver o diagnóstico."; sair a pendência de linhas rejeitadas (o campo `linhasRejeitadas` segue na resposta como 0) e a fonte `escala`; funcionário sem horário aparece na pendência com o motivo "falta o horário"
- [x] T012 [US1] Testes (`diagnostico.test.ts`, `escala.routes.integration.test.ts`, `cobertura` com intervalo): mesmos números com horários do Cadastro; o intervalo do Cadastro desconta o almoço na cobertura por hora; sem horário nenhum, o texto novo; sem pendência de linhas rejeitadas; ajustar os testes que dependiam da escala importada
- [x] T013 Rodar os testes do servidor (unidade e integração da escala) e commitar a fatia

## Fatia 3 — Simulação a partir do Cadastro e aviso corrigido (História 1 e 4, P1/P2)
- [x] T014 [US1] `simulacoes.service.ts`: `doEscalaAtual` vira "equipe do Cadastro": quadro dos funcionários com função no cálculo e carga, turnos dos horários e intervalos deles; sem nenhum funcionário com horário, erro 400 com `code: SEM_HORARIO_NO_CADASTRO` e a mensagem "Cadastre o horário dos funcionários da loja antes de criar a simulação a partir da equipe."; a outra mensagem que cita "escala atual" ("As contratações sugeridas só valem a partir da escala atual.") passa a falar da equipe do Cadastro
- [x] T015 [US4] `diagnostico/Comparativo.jsx`: o caminho alternativo para "do zero" decide pelo código `SEM_HORARIO_NO_CADASTRO` (não pelo texto); **o aviso passa a: "Esta loja ainda não tem funcionários com horário no Cadastro: a simulação parte do quadro do Cadastro, sem horários. Contratações, horários e impacto já funcionam; para ver a cobertura de quem já trabalha, cadastre o horário dos funcionários em Cadastros › Equipe."**; o cliente da API expõe o `code` do erro
- [x] T016 [US4] `grade/GradeTab.jsx` e demais textos da Simulação que falem de "escala atual" ou "sem turnos": ajustar para falar da equipe do Cadastro
- [x] T017 Testes (`simulacoes.routes.integration.test.ts`): criar a partir da equipe do Cadastro (quadro e turnos vindos dos funcionários, com intervalo); sem horário nenhum, 400 com o código e a mensagem; criar "do zero" continua funcionando; ajustar os testes que importavam escala
- [x] T018 Rodar os testes do servidor e da tela e commitar a fatia

## Fatia 4 — Tela: Equipe com intervalo e envio só da Base comercial (Histórias 2 e 4)
- [ ] T019 [US2] `cadastro-loja/equipe.js`, `FormFuncionario.jsx`, `AbaEquipe.jsx`: campos "Início do intervalo" e "Fim do intervalo" junto da entrada e da saída, as mesmas validações e mensagens do servidor (dois juntos, fim depois do início, dentro do turno), e o intervalo na lista da Equipe
- [ ] T020 [P] [US2] Testes de lógica da tela (`equipe.test.js`): validações do intervalo e montagem do corpo da requisição (inclui limpar)
- [ ] T021 [US4] `diagnostico/EnviarPlanilhas.jsx`: sai o bloco "Escala atual" e o modelo dela; o título e o texto explicam que o envio é só da Base comercial
- [ ] T022 [US4] `Diagnostico.jsx`, `QuadroCentral.jsx` e `EscalaPage.jsx`: textos que mandavam enviar a escala ("Sem a escala atual não há quadro por função…", "Da escala atual", pendência de linhas rejeitadas, botão "Enviar planilhas" do estado vazio) passam a orientar o Cadastro de funcionários; o botão do estado vazio leva ao Cadastro
- [ ] T023 Conferir no navegador (editar intervalo na Equipe com os erros; Importar só com Base comercial; Diagnóstico sem pendência de escala; aviso da Simulação) e commitar a fatia

## Fatia 5 — Migração das escalas já importadas (História 3, P1)
- [ ] T024 [US3] `prisma/migrar-escala-para-cadastro.ts` e script `npm run migrar-escala` no `package.json`: ensaio por padrão e `--aplicar` para gravar (uma transação por loja); para cada loja com escala importada ativa e cada turno, achar o funcionário da mesma loja e matrícula e preencher só o que está vazio (dias, entrada, saída, início e fim do intervalo, função de escala, carga semanal); nunca criar funcionário, nunca sobrescrever, nunca apagar; imprimir o relatório por loja (preenchidos, já tinham dados, sem correspondente) e os totais
- [ ] T025 [P] [US3] `migrar-escala.test.ts` (testes do núcleo puro da migração, separado da leitura e da gravação): preenche só os campos vazios; não toca em funcionário com dados; devolve a pessoa sem correspondente; segunda execução não muda nada; matrícula de outra loja não casa
- [ ] T026 [US3] Teste de integração com o banco: loja com escala importada e Cadastro sem horários, aplicar a migração e comparar o Diagnóstico antes e depois (mesmos números)
- [ ] T027 [US3] Ensaio e aplicação no banco local (as 2 lojas com escala): mostrar o relatório, conferir o Diagnóstico dessas lojas antes e depois, rodar de novo e ver que não muda nada; commitar a fatia

## Fatia 6 — Tirar o envio da escala e entregar
- [ ] T028 `escala.routes.ts`, `escala.service.ts`, `planilhas/modelo.ts`, `escala.repository.ts`: sair `POST /cargas/escala`, `GET /planilha-modelo-escala`, o modelo `modelo-escala-atual.xlsx` e a gravação da escala (`substituirEscala`); remover o código e os testes que só serviam a eles; as tabelas e os dados antigos ficam
- [ ] T029 Remover do cliente os usos das rotas retiradas e conferir que nenhuma tela ou aviso cita "importar a escala" (`grep` de "escala importada", "Importe a escala", "escala atual" em textos ao usuário)
- [ ] T030 README (bullet da spec 026: o Cadastro é a única fonte da equipe, o intervalo, o script `migrar-escala` e como rodar o ensaio na produção, e que as tabelas antigas ficam guardadas); rodar tudo (`vitest` servidor e tela, integração das áreas tocadas, `tsc`, `vite build`), atualizar `local/ver-tudo` e enviar a branch para o PR
