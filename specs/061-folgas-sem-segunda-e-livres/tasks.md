---
description: "Tarefas: folgas sem segunda-feira, equipe espalhada e folga livre na simulação"
---

# Tasks: Folgas sem segunda-feira, equipe espalhada e folga livre na simulação

**Input**: `/specs/061-folgas-sem-segunda-e-livres/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: incluídos (o projeto trabalha com Vitest e a regra de folga precisa de prova de que continua previsível).

**Organization**: por história de usuário. US1 e US2 mexem nos mesmos dois arquivos de algoritmo, então rodam em sequência (US1 antes de US2). US3 é independente das duas.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- Caminhos relativos à raiz do repositório. Comandos rodam nos containers (`docker compose exec -T api|web ...`).

---

## Phase 1: Setup

- [x] T001 Confirmar a linha de base: ambiente de pé (`docker compose ps` saudável) e testes passando antes de mexer (`docker compose exec -T api npm test`, `docker compose exec -T web npx vitest run`); anotar o total de testes.

---

## Phase 2: Foundational

Nada bloqueante: sem banco, sem endpoint novo. As histórias podem começar depois do T001.

---

## Phase 3: User Story 1 - A sugestão evita a segunda-feira (Priority: P1) 🎯 MVP

**Goal**: folga só cai na segunda quando nenhum outro dia mantém a cobertura, e o aviso diz de quem foi.

**Independent Test**: 5 atendentes na regra de 40h trabalhando 7 dias, 2 folgas cada, com sobra de cobertura: nenhuma folga sugerida cai na segunda.

- [x] T002 [P] [US1] Testes no servidor em `backend/node/src/modules/escala/semana-com-folgas.test.ts`: (a) com sobra, nenhuma folga na segunda; (b) quando só a segunda mantém a cobertura, a folga cai nela e entra o aviso "{nome}: só deu para folgar na segunda sem faltar gente."; (c) loja fechada na segunda: resultado igual ao de hoje; (d) o rodízio de domingo continua valendo; (e) a mesma entrada dá a mesma saída.
- [x] T003 [P] [US1] Os mesmos cinco testes na tela em `frontend/react/src/features/simulacao/escala/folgas-regras.test.js` (para `sugerirFolgas`).
- [x] T004 [US1] Em `backend/node/src/modules/escala/semana-com-folgas.ts` (`aplicarFolgas`): nova chave de ordenação `segunda` (1 só para o dia 0) logo depois de `novaFalta`; o desempate `giro` passa a começar na terça; aviso da folga na segunda. Prettier e `npm test`.
- [x] T005 [US1] Em `frontend/react/src/features/simulacao/escala/folgas-regras.js` (`sugerirFolgas`): a mesma chave, o mesmo `giro` e o mesmo aviso, com a mesma redação do servidor.

**Checkpoint**: US1 verificável sozinha (testes T002/T003 passando).

---

## Phase 4: User Story 2 - Pessoas do mesmo cargo não folgam no mesmo dia (Priority: P1)

**Goal**: dentro de cada cargo, as folgas caem em dias diferentes sempre que a cobertura permitir; as folgas que o colega já tem contam.

**Independent Test**: 3 farmacêuticos e 5 atendentes com 1 ou 2 folgas: nenhum dia recebe duas folgas do mesmo cargo enquanto houver dia livre que mantenha a cobertura; no pior caso a diferença entre dias é 1.

- [x] T006 [P] [US2] Testes no servidor em `backend/node/src/modules/escala/semana-com-folgas.test.ts`: (a) folgas do cargo em dias diferentes; (b) conta as folgas que o colega já tem do Cadastro; (c) mais folgas que dias: diferença máxima de 1; (d) só um dia mantém a cobertura: coincidem e entra o aviso "{cargo}: não deu para folgar em dias diferentes sem faltar gente."; (e) uma pessoa sozinha no cargo: só vale a regra da segunda.
- [x] T007 [P] [US2] Os mesmos testes na tela em `frontend/react/src/features/simulacao/escala/folgas-regras.test.js`, com o **mesmo cenário e o mesmo resultado esperado** do servidor (garante que as duas cópias dão a mesma sugestão).
- [x] T008 [US2] Em `semana-com-folgas.ts`: `junto` passa a contar também os colegas do mesmo cargo que já não trabalham no dia; ordem final `novaFalta` → `segunda` → `junto` → `perto` → `sobra` → `giro` → dia; aviso de cargo. Prettier e `npm test`.
- [x] T009 [US2] Em `folgas-regras.js`: a mesma contagem, a mesma ordem e o mesmo aviso.

**Checkpoint**: US1 e US2 juntas verificáveis; os cenários de equivalência dão o mesmo resultado nos dois lados.

---

## Phase 5: User Story 3 - Dar folga livremente na simulação (Priority: P1)

**Goal**: na Escala da semana de uma simulação editável, dar folga a qualquer pessoa em qualquer dia de trabalho (e escalar quem está de folga) com um clique, sem bloqueios.

**Independent Test**: simulação editável, Escala da semana: botão pequeno no dia de trabalho transforma a célula em "FOLGA", a cobertura e os avisos se atualizam e a folga fica gravada; o botão da folga devolve o turno.

- [x] T010 [P] [US3] Criar `frontend/react/src/features/simulacao/escala/folga-livre-regras.js` com `darFolga(turnos, matricula, dia)` e `escalarNoDia({ turnos, matricula, dia, aba, regra })` (reaproveitam `semTurnoNoDia` e `novoTurnoNaFolga` de `escala-regras.js`) e `folga-livre-regras.test.js` (dar folga, escalar com o turno habitual, não mexe nos outros, vaga simulada, pessoa sem turnos na semana).
- [x] T011 [P] [US3] Teste de integração em `backend/node/src/modules/simulacoes/simulacoes.routes.integration.test.ts`: `PUT /simulacoes/:id` com `turnos` sem os turnos de uma pessoa (um dia, vários, a semana toda) é aceito e a avaliação volta com os avisos de cobertura.
- [x] T012 [US3] Em `frontend/react/src/features/simulacao/escala/LinhaDaSemana.jsx`: em cada célula editável, além do botão grande que abre o dia, um botão pequeno com ícone ("dar folga" no turno, "escalar neste dia" na folga), nome acessível `{Nome}, {dia}: dar folga` / `escalar neste dia` (contrato em `contracts/ui-folga-livre.md`); sem controle na loja fechada, na linha de desligado e fora do modo editável; desabilitado enquanto grava.
- [x] T013 [US3] Em `frontend/react/src/features/simulacao/escala/EscalaDaSemana.jsx`: repassar a ação `onAlternarFolga(matricula, dia, estado)` e o estado `calculando` à linha.
- [x] T014 [US3] Em `frontend/react/src/features/simulacao/SimulacaoPage.jsx`: ligar a ação a `darFolga`/`escalarNoDia` e gravar com `salvar({ turnos: turnosParaGravar(...) })`; conferir que a "Desfazer sugestão" não fica enganada quando há folga feita à mão (comparação por `chaveDosTurnos`).

**Checkpoint**: US3 verificável na tela e pela API.

---

## Phase 6: Polish & Cross-Cutting

- [x] T015 Rodar `sh scripts/sync-templates.sh` e conferir `sh scripts/check-repo.sh` (a cópia em `templates/backend/node` entra no commit).
- [x] T016 Rodar tudo: `prettier --write` nos arquivos mexidos, eslint, `npm test`, `npm run test:integration` (api) e `npx vitest run` e `vite build` (web); sem queda no total de testes do T001.
- [x] T017 Conferir na tela, seguindo `quickstart.md`, numa loja real local (Cosmópolis): "Sugerir folgas" (segunda e mesmo cargo), folga livre e simulação gravada somente leitura; reiniciar a API antes (`docker compose restart api`), porque ela não recarrega sozinha.
- [x] T018 Commitar na branch `feat/folgas-evitar-segunda-e-livres` (sem enviar até a pessoa pedir) e atualizar `local/ver-tudo`.

---

## Dependencies & Execution Order

- **T001** antes de tudo.
- **US1 → US2**: mexem nos mesmos dois arquivos de algoritmo (T004/T005 antes de T008/T009). Os testes T002/T003 e T006/T007 podem ser escritos em paralelo entre si, mas devem falhar antes das implementações.
- **US3** é independente das duas e pode ir em paralelo (T010/T011 [P]; T012 → T013 → T014).
- **Polish** só depois das três histórias.

### Parallel Opportunities

- T002 ∥ T003; T006 ∥ T007; T010 ∥ T011; US3 inteira ∥ US1+US2.

## Implementation Strategy

- **MVP**: US1 (segunda). Entrega valor sozinha e se verifica nos testes.
- Depois US2 (mesmo cargo) e US3 (folga livre), cada uma verificável sozinha.
- Aprovação da pessoa ao final de cada etapa do Spec Kit; commit só na branch, sem PR até ela pedir.
