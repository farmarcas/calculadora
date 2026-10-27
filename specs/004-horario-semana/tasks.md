# Tasks: Horário por dia da semana e loja 24 horas

**Input**: `specs/004-horario-semana/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos (conversão, planilha, cálculo por dia, rotas, "desatualizada").
Formato: `[ID] [P] [US] descrição com caminho`. Caminhos do backend relativos a `backend/node/`, do front a `frontend/react/`.

## Phase 1: Setup

- [x] T001 Conferir o branch `feat/escala-horario-semana`, o ambiente de pé (`docker compose ps` saudável) e os testes atuais verdes (`npm test`, `npm run test:integration`)

## Phase 2: Fundação (bloqueia as histórias)

- [x] T002 Teste + conversor do horário: formato novo (7 dias, aberta/fechada/24h), leitura do formato antigo (semana → segunda a sexta), validação (`abre < fecha`, `24:00`), 24h implica 00:00–24:00, em `src/modules/cadastros/horarios.ts` e `horarios.test.ts`
- [x] T003 [P] `diasAbertos` lê o formato novo (e o antigo, via conversor), inclusive 24 horas (`abre 0`, `fecha 24`), e o tipo `LojaDiag.horarios` passa ao formato novo, em `src/modules/escala/diagnostico.ts` (e `diagnostico.test.ts`)
- [x] T004 Repositórios devolvem sempre o formato novo: normalizar na leitura em `src/modules/cadastros/cadastros.repository.ts` e `src/modules/escala/escala.repository.ts`

## Phase 3: US1 — Cadastrar a semana inteira (P1) 🎯 MVP

**Teste independente**: cadastrar loja aberta de segunda a domingo (domingo mais curto) e uma loja 24h, reabrir e conferir.

- [x] T005 [US1] Schema Zod de `horarios` aceitando o formato novo e o antigo, gravando sempre o novo, com mensagens de erro claras, em `src/modules/cadastros/cadastros.schemas.ts` e service
- [x] T006 [US1] Teste de integração das rotas de loja: criar e editar com os sete dias, dia fechado, 24h, fechamento antes da abertura recusado, loja antiga lida como nova, em `src/modules/cadastros/cadastros.routes.integration.test.ts`
- [x] T007 [P] [US1] Resumo legível do horário (agrupa dias iguais: "Seg a sáb 08:00–22:00 · Dom fechada", "Todos os dias 24h") com teste — feito no servidor (`resumoHorarios` em `src/modules/cadastros/horarios.ts`, a API devolve `horariosResumo`), porque a tela não tem corredor de testes
- [x] T008 [US1] Componente `HorarioSemana`: sete linhas (aberta/fechada, abre, fecha, 24h), atalho "Loja 24 horas" e atalho "copiar para os outros dias", em `src/features/cadastros/HorarioSemana.jsx`
- [x] T009 [US1] Formulário de loja usa `HorarioSemana` (e validação na tela), e a tabela de lojas mostra o resumo, em `src/features/cadastros/FormLoja.jsx` e `CadastrosPage.jsx`

**Checkpoint**: a semana inteira e a loja 24h já podem ser cadastradas à mão.

## Phase 4: US2 — Planilha e importação (P2)

**Teste independente**: importar a planilha nova (domingo fechado e loja 24h) e depois uma com as colunas antigas.

- [ ] T010 [US2] Campos da planilha de lojas: `Seg_Abre … Dom_Fecha` e `Loja_24h`, com sinônimos por dia e conteúdo HH:MM, mantendo os campos antigos como opcionais, em `src/modules/planilhas/campos.ts`
- [ ] T011 [US2] Modelo baixado com as colunas por dia e `Loja_24h` (e a aba de instruções explicando "Fechada" e "24h") em `src/modules/planilhas/modelo.ts`
- [ ] T012 [US2] Teste + processamento das linhas: dia sem horário = fechado, célula "Fechada", "24h" na abertura, `Loja_24h = Sim`, colunas antigas preenchendo segunda a sexta/sábado/domingo, coluna por dia com prioridade, horário inválido rejeitando a linha, em `src/modules/cadastros/processar.ts` e `processar.test.ts`
- [ ] T013 [US2] Teste da inferência: planilha do modelo novo reconhecida por completo e planilha antiga reconhecida como hoje, em `src/modules/planilhas/inferencia.test.ts`
- [ ] T014 [US2] Teste de integração da importação (modelo novo com domingo fechado e loja 24h; modelo antigo; linha inválida), em `src/modules/cadastros/cadastros.routes.integration.test.ts`
- [ ] T015 [P] [US2] Tela de importação: os novos campos aparecem na correspondência de colunas com os rótulos certos (sem mudança de fluxo), conferir em `src/features/cadastros/ImportarPlanilha.jsx`

## Phase 5: US3 — O horário real em todo o sistema (P3)

**Teste independente**: a mesma escala numa loja aberta de segunda a sexta e noutra aberta aos domingos: a segunda exige mais horas e mostra o domingo na grade.

- [ ] T016 [US3] Teste do diagnóstico por dia: necessidade de horas e turnos contando sete dias, domingo fechado sem exigência, loja 24h com cobertura de 00h a 24h e farmacêutico nas 24h, conferido contra a conta manual, em `src/modules/escala/diagnostico.test.ts` e `src/modules/regras/capacidade.test.ts`
- [ ] T017 [US3] Teste de integração do diagnóstico e das simulações: domingo aparece em `diasAbertos` e na avaliação, simulação gravada antes mantém o horário congelado (formato antigo lido), em `src/modules/escala/escala.routes.integration.test.ts` e `src/modules/simulacoes/simulacoes.routes.integration.test.ts`
- [ ] T018 [US3] "Desatualizada" compara horários já convertidos (converter o formato não dispara alarme; mudar o horário dispara), em `src/modules/simulacoes/simulacoes.service.ts` e teste de integração
- [ ] T019 [P] [US3] Apuração do ponto e calendário planejado usando o horário por dia (domingo e 24h) com teste, em `src/modules/apuracao/apuracao.service.ts` e `periodo.test.ts`
- [ ] T020 [P] [US3] Conferir na tela: aba Diagnóstico, grade das simulações (domingo aparece, dias fechados não) e cobertura de 24h legível, ajustando o que precisar, em `src/features/diagnostico/` e `src/features/grade/`

## Phase 6: Fechamento

- [ ] T021 [P] Seed e dados de exemplo no formato novo (sem quebrar o formato antigo) em `prisma/seed.ts` e `src/modules/ponto/ponto.fixtures.ts`
- [ ] T022 Rodar `quickstart.md` de ponta a ponta com o ambiente de pé; `npm test`, `npm run test:integration`, `npm run lint`, builds da API e da tela
- [ ] T023 [P] Sincronizar `templates/`, atualizar o README e a lista de pendências conhecidas (turno que atravessa a meia-noite, feriados e horários por data)
- [ ] T024 Marcar as tarefas concluídas, commitar e enviar o branch

## Dependências

Setup → Fundação (T002 primeiro; T003 e T004 dependem dele) → US1 → US2 → US3 → Fechamento. T007 e T008 (front) podem andar em paralelo com T005/T006. US1 sozinha já entrega valor.
