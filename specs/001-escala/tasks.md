# Tasks: Escala (módulo M4)

**Input**: `specs/001-escala/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos para regras, leitura de planilha e rotas (a constituição e as skills do backend pedem).
Formato: `[ID] [P] [US] descrição com caminho`. [P] = pode ir em paralelo.

## Phase 1: Setup

- [x] T001 Adicionar `exceljs` e `multer` em `backend/node/package.json`
- [x] T002 [P] Configurar Tailwind e tokens do Alquimia DS em `frontend/react/` (tailwind config, `index.css`, `package.json`)
- [x] T003 [P] Criar shell da tela (rail recolhível, topbar, seletor de perfil de demonstração, layout fluido) em `frontend/react/src/App.jsx` e `src/components/ui/`

## Phase 2: Fundação (bloqueia as histórias)

- [x] T004 Middleware de perfil (`X-Perfil`: TENANT_ADMIN, SCHEDULE_MANAGER, SCHEDULE_VIEWER) em `backend/node/src/shared/middlewares/perfil.ts`
- [x] T005 Tabela de auditoria e serviço de registro em `backend/node/prisma/schema.prisma` e `src/shared/auditoria/`
- [x] T006 Middleware de upload de arquivo (limite de tamanho, tipos .xlsx/.csv) em `src/shared/middlewares/upload.ts`
- [x] T007 Cliente de API e tratamento de erro no front em `frontend/react/src/api/client.js`

## Phase 3: US1 — Cadastrar lojas e funcionários por planilha (P1) 🎯 MVP

**Teste independente**: baixar o modelo, preencher, importar; importar outra planilha com colunas renomeadas e confirmar.

- [x] T008 [US1] Schema e migration: lojas, lojas_horarios, funcionarios, importacoes_cadastro, importacoes_linhas em `backend/node/prisma/`
- [x] T009 [P] [US1] Gerador da planilha modelo (abas Lojas e Funcionários, colunas explicadas, exemplo) em `src/modules/planilhas/modelo.ts`
- [x] T010 [P] [US1] Teste + leitor de planilha (abas, linhas, tipos) em `src/modules/planilhas/leitor.ts`
- [x] T011 [P] [US1] Teste + inferência de abas e colunas (sinônimos, similaridade, conteúdo, confiança) em `src/modules/planilhas/inferencia.ts`
- [x] T012 [US1] Módulo cadastros: schemas Zod, repository, service (validar linhas, upsert sem duplicar, soft delete) em `src/modules/cadastros/`
- [x] T013 [US1] Rotas: `GET /planilha-modelo`, `POST /importacoes/cadastro`, `POST /importacoes/cadastro/:id/confirmar`, CRUD de lojas e funcionários + teste de integração em `src/modules/cadastros/*.routes.ts`
- [x] T014 [P] [US1] Tela Cadastros: lista de lojas e funcionários, baixar modelo, formulário de edição em `frontend/react/src/features/cadastros/`
- [x] T015 [US1] Tela de importação: envio, prévia, mapeamento de colunas editável, resumo e confirmação em `frontend/react/src/features/cadastros/ImportarPlanilha.jsx`

**Checkpoint**: lojas e funcionários cadastrados por planilha.

## Phase 4: US2 — Escala atual e diagnóstico (P2)

**Teste independente**: enviar escala e base comercial de exemplo e ver quadro, cobertura, déficit e contratações.

- [x] T016 [US2] Schema e migration: cargas_escala, turnos_atuais, base_comercial, regras_perfis (+ seed dos perfis atual/42h/40h) em `backend/node/prisma/`
- [x] T017 [P] [US2] Teste + motor de regras (horas semanais, folgas, interjornada, intervalo, farmacêutico em todo o horário) em `src/modules/regras/`
- [x] T018 [P] [US2] Teste + cálculo de cobertura por faixa e horários de maior venda em `src/modules/escala/cobertura.ts`
- [x] T019 [P] [US2] Teste + cálculo de déficit de horas/turnos e contratações por função em `src/modules/escala/deficit.ts`
- [x] T020 [US2] Importação da escala atual e da base comercial (modelo, inferência, rejeições, substitui carga anterior com histórico) em `src/modules/escala/`
- [x] T021 [US2] Rota `GET /lojas/:id/diagnostico` + teste de integração em `src/modules/escala/escala.routes.ts`
- [x] T022 [P] [US2] Tela da loja: abas Situação/Configuração, quadro por função, cobertura, verificação por regra, pontos de atenção em `frontend/react/src/features/diagnostico/`
- [x] T023 [US2] Envio das planilhas de escala e base comercial na tela, com lista de linhas rejeitadas em `frontend/react/src/features/diagnostico/Enviar.jsx`

## Phase 5: US3 — Grade da semana e simulações (P3)

**Teste independente**: mover um turno, ver o recálculo, gravar e reabrir.

- [x] T024 [US3] Schema e migration: simulacoes, simulacao_turnos (índice único parcial: uma `em_uso` por loja) em `backend/node/prisma/`
- [x] T025 [US3] Teste + serviço de simulações (criar do zero/da em uso/clonar, avaliar, gravar congelando premissas, descartar) em `src/modules/simulacoes/`
- [x] T026 [US3] Rotas de simulações (`turnos`, `avaliar`, `gravar`, `descartar`, `clonar`) + teste de integração em `src/modules/simulacoes/simulacoes.routes.ts`
- [x] T027 [P] [US3] Componente da grade semanal (arrastar e redimensionar turnos, passo de 15 min) em `frontend/react/src/features/grade/Grade.jsx`
- [x] T028 [US3] Tela Escala por hora com recálculo, bloqueios explicados, gravar/clonar/descartar e histórico em `frontend/react/src/features/grade/`

## Phase 6: US4 — Comparar e aprovar (P4)

**Teste independente**: gravar duas simulações, comparar, aprovar uma; a em uso anterior vira substituída.

- [x] T029 [US4] Teste + regra de aprovação (zero erros, só perfil autorizado, uma em uso, vigência, substituição) em `src/modules/simulacoes/aprovacao.ts`
- [x] T030 [US4] Rotas `aprovar` e `comparar` + exportação `.xlsx` da escala + auditoria + teste de integração em `src/modules/simulacoes/`
- [x] T031 [P] [US4] Tela de comparação lado a lado (2–3 simulações, com a em uso como referência) em `frontend/react/src/features/simulacoes/Comparar.jsx`
- [x] T032 [US4] Botão aprovar por perfil, aviso "simulação desatualizada" e visão de impressão em `frontend/react/src/features/simulacoes/`

## Phase 7: Fechamento

- [x] T033 [P] Dados fictícios de exemplo (seed) em `backend/node/prisma/seed.ts`
- [ ] T034 Rodar `quickstart.md` de ponta a ponta com o ambiente de pé (`docker compose ps` saudável) e rodar `npm test`, `npm run test:integration`, `npm run lint`
- [x] T035 [P] Atualizar `README.md` com a nova funcionalidade

## Dependências

Setup → Fundação → US1 → US2 → US3 → US4 → Fechamento. Dentro de cada fase, tarefas [P] rodam juntas. US1 é o MVP e já entrega valor sozinha.
