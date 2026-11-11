# Tasks: Folgas sugeridas na Simulação

**Input**: `/specs/042-folgas-sugeridas/` (spec, plan, research, data-model, quickstart)

Pasta base da tela: `frontend/react/src/features/simulacao`.

## Phase 1: Fundação (bloqueia as histórias)

- [ ] T001 [P] Criar `escala/folgas-regras.js` com `pessoasParaFolgar({ quadro, turnos, limiteDias })`: quem tem mais dias de turno que `limiteDias` (sem vagas), com quantas folgas faltam.
- [ ] T002 Em `escala/folgas-regras.js`, `sugerirFolgas({ quadro, turnos, cobertura, abas, regra })` (devolve `{ turnos, retirados, avisos, domingoSugerido }`): para cada função, retira turnos escolhendo o dia de maior sobra de cobertura (recalculada com `recalcularCobertura` a cada retirada), empate pelo dia mais cedo; pessoas da mesma função evitam o mesmo dia de folga; limitado aos dias abertos.
- [ ] T003 Em `escala/folgas-regras.js`, rodízio de domingo: se o domingo está em `abas`, `ceil(pessoas/3)` pessoas por função recebem o domingo como folga (as de mais sobra no domingo), se a cobertura mínima permitir; função com 1 pessoa não força e gera aviso.
- [ ] T004 Em `escala/folgas-regras.js`, `avisosDaSugestao(...)`: horas que ficam abaixo do mínimo depois das folgas viram texto curto por dia e função; e `textoDoRodizio()` com a frase do card (rodízio de 3 semanas, regra de referência, jurídico confirma).
- [ ] T005 Testes em `escala/folgas-regras.test.js`: 44h tira 1 dia e 42h/40h tiram 2; quem já está no limite não muda; vaga não entra; mesma função não folga junto; cobertura preservada quando possível; aviso quando inevitável; domingo `ceil(n/3)`; domingo fechado não conta; função com 1 pessoa; turnos que sobram mantêm horário e intervalo.

## Phase 2: História 1 — Sugerir folgas (P1)

**Teste independente**: Sumaré, regra de 44h: clicar em "Sugerir folgas" e ver 6 dias e 1 folga por pessoa.

- [ ] T006 [US1] Em `SimulacaoPage.jsx`, função `sugerirFolgas` que chama `folgas-regras.js` com `sim.quadro`, `sim.turnos`, `sim.avaliacao.cobertura`, `diasDasAbas(sim.diasAbertos)` e `sim.regraInfo`, guarda `antesDeSugerir` e grava com `salvar({ turnos: turnosParaGravar(...) })`.
- [ ] T007 [US1] Em `escala/EscalaDaSemana.jsx`, botão "Sugerir folgas" no cabeçalho (só com `editavel` e quando `pessoasParaFolgar` não é vazio), com estado de carregamento enquanto grava.
- [ ] T008 [US1] Conferir que o card e a Escala por hora mostram as folgas e os totais novos (mesma escala) e que os avisos de "dias a mais" somem.

## Phase 3: História 2 — Preservar a cobertura (P1)

- [ ] T009 [US2] Em `escala/EscalaDaSemana.jsx`, mostrar os avisos da sugestão ("Sexta: falta 1 farmacêutico às 14h") logo abaixo do cabeçalho, em faixa de atenção do DS.

## Phase 4: História 3 — Domingo (P2)

- [ ] T010 [US3] Em `escala/EscalaDaSemana.jsx`, a frase do rodízio de domingo, mostrada depois de sugerir, quando a loja abre domingo.

## Phase 5: História 4 — Desfazer e ajustar (P2)

- [ ] T011 [US4] Em `SimulacaoPage.jsx` e `escala/EscalaDaSemana.jsx`, "Desfazer sugestão" (aparece depois de sugerir): regrava `antesDeSugerir`; some depois de usar ou quando a simulação muda de outra forma (ajuste de turno, troca de regra).
- [ ] T012 [US4] Conferir que "Folga" vira turno e "Tirar do dia" vira folga na Escala por hora depois de sugerir, e que o card acompanha.

## Phase 6: Fechamento

- [ ] T013 Conferir no navegador (dono, gestor, visualizador) todos os passos do `quickstart.md`; visualizador sem botão; Cadastro sem mudança.
- [ ] T014 Rodar `npm test` e o build do web.
- [ ] T015 Atualizar o `README.md` (parágrafo da Escala da semana) com as folgas sugeridas e a pendência do jurídico (art. 386, regras de farmácia).

## Dependências e ordem

T001 → T002 → T003 → T004 → T005; depois US1 (T006→T008), US2 (T009), US3 (T010), US4 (T011→T012), e por fim T013–T015.

MVP: Fundação + US1 + US2 (T001–T009): o botão sugere folgas e avisa onde fica descoberto.
