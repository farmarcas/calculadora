---
description: "Tarefas: editar o horário de cada pessoa com minutos exatos na Simulação"
---

# Tasks: Editar o horário de cada pessoa com minutos exatos na Simulação

**Input**: `/specs/062-editar-horario-minutos-exatos/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: incluídos (regras puras com testes ao lado; um teste de integração do servidor).

**Organization**: por história. US1, US2 e US3 são P1 e entregam juntas o essencial; US4 (celular) é P2. Tudo na branch atual `feat/folgas-evitar-segunda-e-livres`, sem PR novo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem depender de tarefa incompleta)
- Caminhos relativos à raiz. Comandos rodam nos containers (`docker compose exec -T api|web ...`).

---

## Phase 1: Setup

- [x] T001 Linha de base: ambiente de pé e testes passando antes de mexer (`docker compose exec -T web npx vitest run`, `docker compose exec -T api npm test`); anotar os totais (esperado: 462 na tela e 847 no servidor).

---

## Phase 2: Foundational (bloqueia as histórias)

- [x] T002 Criar `frontend/react/src/features/simulacao/escala/horario-exato-regras.js` (puro) com: `lerHorario(texto)` ("H:mm"/"HH:mm" → horas decimais, minutos 00–59, hora 00–23 e "24:00"; vazio/ilegível → `null`), `horarioTexto(horas)` (→ "HH:mm") e `valoresDoTurno(turno)` (→ os quatro textos da janela, intervalo vazio quando não há).
- [x] T003 [P] Em `frontend/react/src/features/simulacao/escala/escala-regras.js`: corrigir o comentário de `turnosParaGravar` (o servidor aceita minutos inteiros, spec 047; `emQuarto` arredonda ao minuto) e acrescentar `horasCobertas(turno)` com a mesma regra de `presente` (hora cheia; intervalo de até 2 h não tira), devolvendo o texto "08h a 16h" (ou "—" se não cobre nenhuma hora cheia).

---

## Phase 3: User Story 1 - Digitar o horário exato (Priority: P1) 🎯 MVP

**Goal**: lápis ao fim da barra abre a janela, e salvar grava o horário exato pelo caminho do arrastar.

**Independent Test**: numa simulação editável, lápis → 07:32, 12:17–13:17, 16:24 → salvar: a barra mostra 07h32–16h24 e permanece ao recarregar.

- [x] T004 [P] [US1] Testes em `frontend/react/src/features/simulacao/escala/horario-exato-regras.test.js` para `lerHorario`/`horarioTexto`/`valoresDoTurno` (07:32 ↔ 7,5333…; 00:00; 24:00; "25:70", "7:5", "", "ab" → inválido; ida e volta sem perder o minuto; intervalo ausente → campos vazios) e para `horasCobertas` (07:32–16:24 com intervalo de 1 h → "08h a 16h"; intervalo de mais de 2 h remove as horas dele; turno de menos de 1 hora cheia → "—").
- [x] T005 [P] [US1] Teste de integração em `backend/node/src/modules/simulacoes/simulacoes.routes.integration.test.ts`: `PUT /simulacoes/:id` com um turno 07:32 (7+32/60), intervalo 12:17–13:17 e saída 16:24 é aceito, volta igual na resposta e permanece ao ler de novo; fração de minuto continua recusada.
- [x] T006 [US1] Criar `frontend/react/src/features/simulacao/escala/ModalHorarioDoTurno.jsx` seguindo `ModalSalvarCenario.jsx` (componentes `Modal`, `Campo`, `entrada`, `Botao` de `components/ui`): título "Horário de {Nome}", subtítulo com o dia e o funcionamento, quatro campos `type="time"` (Entrada, Início do intervalo, Fim do intervalo, Saída) preenchidos com o horário atual, linha "Cobre as horas de …", Cancelar/Salvar, foco inicial na Entrada, Esc e Cancelar fecham sem gravar, `devolverFocoPara` recebe o lápis. Salvar chama `onSalvar(novoTurno)`; sem mudança, só fecha.
- [x] T007 [US1] Em `frontend/react/src/features/simulacao/escala/LinhaDaPessoa.jsx`: lápis (botão com ícone, `aria-label="Editar horário de {Nome} na {dia}"`, área de toque de 44 × 44 px) ao fim da barra, só com `editavel` e turno no dia, também para a contratação simulada; chama `onEditarHorario(elementoDoLapis)`; a barra continua arrastável.
- [x] T008 [US1] Em `frontend/react/src/features/simulacao/escala/EscalaPorHora.jsx`: guardar a pessoa, o turno e o elemento do lápis para a janela; passar `onEditarHorario` à `LinhaDaPessoa`; ao salvar, chamar `mudarTurno(matricula, { ...turno, ...valores, antes: undefined }, true)`; mostrar a `ModalHorarioDoTurno` com a janela do dia (`abre`/`fecha`). Fechar a janela se a pessoa deixar de ter turno no dia.

**Checkpoint**: US1 verificável pela tela (T004/T005 passando).

---

## Phase 4: User Story 2 - A janela avisa o que está errado (Priority: P1)

**Goal**: nenhum horário inválido é gravado; mensagens em linguagem simples ao lado do campo.

**Independent Test**: saída às 06:00 com entrada às 07:32 mostra "A saída precisa ser depois da entrada." e não grava.

- [x] T009 [P] [US2] Testes de `validarHorario` em `horario-exato-regras.test.js`: cada mensagem do contrato (obrigatório vazio/ilegível; saída ≤ entrada; fora do funcionamento do dia, nos dois extremos; só um campo do intervalo; intervalo fora do turno; início ≥ fim); caso válido com e sem intervalo; ordem de prioridade dos erros; mensagem com o horário de funcionamento do dia ("07:00 às 22:00").
- [x] T010 [US2] Implementar `validarHorario(valores, { abre, fecha })` em `horario-exato-regras.js` (um erro por campo, na ordem do contrato) e `turnoDeValores(turno, valores)` (monta o turno com as horas decimais e o intervalo `null` quando vazio).
- [x] T011 [US2] Em `ModalHorarioDoTurno.jsx`: validar ao tentar salvar e ao corrigir, mostrar cada erro ao lado do campo (`role="alert"`, `aria-invalid`, `aria-describedby`), não gravar com erro e levar o foco ao primeiro campo com erro; Enter salva.

**Checkpoint**: US2 verificável; nenhum caminho grava horário inválido.

---

## Phase 5: User Story 3 - O horário exato aparece em todo lugar (Priority: P1)

**Goal**: barra, nome acessível, textos, Escala da semana e total de horas mostram os minutos exatos.

**Independent Test**: gravar 07:32–16:24 com intervalo 12:17–13:17 e conferir o mesmo horário exato na barra, na Escala da semana e no total da semana.

- [x] T012 [P] [US3] Testes em `frontend/react/src/features/simulacao/escala/escala-regras.test.js` (e `semana-regras.test.js`): `textoDoTurno` → "07h32–16h24"; `textoDoIntervalo` → "12h17–13h17"; `totalDaSemana` soma minutos reais; `turnosParaGravar` preserva os minutos (07:32 volta como 7+32/60 e não vira quarto de hora).
- [x] T013 [US3] Conferir e, se preciso, ajustar a barra de `LinhaDaPessoa.jsx` (texto, `title`, `aria-label` com o horário e o intervalo exatos) e a célula da `LinhaDaSemana.jsx`; sem mudar a conta da cobertura. Registrar no `research.md` qualquer exceção encontrada.

**Checkpoint**: US3 verificável; horário idêntico em todas as telas do computador.

---

## Phase 6: User Story 4 - O lápis no celular (Priority: P2)

**Goal**: a mesma edição na lista do celular, com toque confortável.

**Independent Test**: com a tela estreita, tocar no lápis de uma pessoa com turno, editar e salvar.

- [x] T014 [US4] Em `frontend/react/src/features/simulacao/escala/EscalaMobile.jsx`: lápis (44 × 44 px, `aria-label` igual ao do computador) à direita do horário de cada pessoa com turno, só em simulação editável; chama o mesmo `onEditarHorario` recebido de `EscalaPorHora.jsx` (T008 repassa a prop); o horário exato já aparece pelo `textoDoTurno`.

**Checkpoint**: US4 verificável com a janela estreita.

---

## Phase 7: Polish & Cross-Cutting

- [x] T015 `sh scripts/sync-templates.sh` e `sh scripts/check-repo.sh` (a cópia do teste de integração em `templates/backend/node` entra no commit).
- [x] T016 Rodar tudo: `prettier --write` nos arquivos do servidor mexidos, `npm test`, `npm run test:integration`, `npx vitest run` e `vite build` (tela); sem queda no total do T001.
- [x] T017 Conferir na tela, seguindo `quickstart.md`, numa loja real local (Cosmópolis): digitar o horário, provocar cada erro, cancelar com Esc (foco volta ao lápis), conferir a Escala da semana, a janela estreita (celular) e a simulação gravada sem lápis; reiniciar a API antes (`docker compose restart api`).
- [x] T018 Marcar as tarefas como feitas, commitar na branch atual (sem enviar até a pessoa pedir) e atualizar `local/ver-tudo`.

---

## Dependencies & Execution Order

- **T001** antes de tudo; **T002 → T003** (T003 [P] pode ir junto) bloqueiam as histórias.
- **US1**: T004 ∥ T005 (testes, devem falhar antes) → T006 → T007 → T008.
- **US2** depende de T002 e T006 (T009 ∥ T010 → T011).
- **US3** depende de T007 (T012 [P]; T013 depois).
- **US4** depende de T008 (a prop `onEditarHorario`) e de T006.
- **Polish** só depois de todas.

### Parallel Opportunities

- T003 ∥ T002; T004 ∥ T005; T009 ∥ T012.

## Implementation Strategy

- **MVP**: US1 + US2 (janela que valida e grava); US3 confirma a exibição; US4 leva ao celular.
- Aprovação da pessoa ao fim de cada etapa do Spec Kit; commit só na branch atual, sem PR novo.
