# Tasks: Cenários que já contam as folgas

**Input**: `/specs/043-cenarios-com-folgas/` (spec, plan, research, data-model, contracts, quickstart)

Servidor: `backend/node/src/modules`. Tela: `frontend/react/src/features`.

## Phase 1: Fundação — módulo da semana com folgas (bloqueia as histórias)

- [ ] T001 [P] Criar `escala/semana-com-folgas.ts` com os tipos (`HorarioPessoa`, `SemanaComFolgas`) e `coberturaPorDia({ turnos, pessoas, dias, minimos })`: por dia aberto, função e hora, `pessoas` presentes (intervalo fora), `exigido` (de `requisitos(minimos).emHora`) e `coberto = min(pessoas, exigido)`; farmacêutico exige ao menos 1.
- [ ] T002 [P] Em `escala/semana-com-folgas.ts`, `aplicarFolgas({ pessoas, turnos, cobertura, dias, regra })`: porte de `sugerirFolgas` da tela (limite de dias da regra, dia de maior sobra, espalhar entre pessoas da função, domingo `ceil(n/3)` por função, cobertura vence o rodízio, avisos). Vaga e desligado não entram.
- [ ] T003 Em `escala/semana-com-folgas.ts`, `posicionarContratacoes({ funcao, gapPorDia, regra, dias })`: turnos das contratações nas horas e dias sem cobertura (parcial até 6 h por dia; integral na jornada da regra; 1 h de intervalo acima de 6 h), porte de `turnosParaVaga`.
- [ ] T004 Em `escala/semana-com-folgas.ts`, `semanaComFolgas({ regra, dias, minimos, pessoas, horarios })`: aplica folgas, mede a cobertura, posiciona contratações e, se ainda falta, soma 1 turno por vez até fechar (teto de 20 vagas); devolve `{ turnos, vagas, gapPorFuncao, coberturaCobreH, resolve, avisos, domingoSugerido }`.
- [ ] T005 Testes em `escala/semana-com-folgas.test.ts` (mesmos casos de `folgas-regras.test.js`, mais os de cobertura real): 44h tira 1 dia e 42h/40h tiram 2; quem está no limite não muda; vaga não entra; mesma função não folga junta quando dá; domingo `ceil(n/3)`; loja fechada no domingo; função com 1 pessoa não força o domingo; falta inevitável vira aviso; cobertura real desconta intervalo; farmacêutico coberto em todas as horas após contratar; teto de vagas gera `resolve: false`.

## Phase 2: História 2 — O número do cenário conta as folgas (P1)

**Teste independente**: Sumaré, 42h: as horas de contratação do cartão fecham a cobertura com as folgas.

- [ ] T006 [US2] Em `regras/capacidade.ts`, `verificarRegra` aceita `opcoes.coberturaReal?: Record<funcao, { coberturaH, necessidadeH }>`; com ela, `capacidadeH` = horas exigidas cobertas e `gapH` sai da diferença; `memoria` ganha "Com as folgas, a equipe cobre Xh das Yh exigidas"; sem ela, tudo igual a hoje (testes atuais continuam passando).
- [ ] T007 [US2] Em `escala/cenarios.ts`, `EntradaCenarios` ganha `horarios?: HorarioPessoa[]`; `opcoesDoMotor` calcula `semanaComFolgas` por regra e passa `coberturaReal` a `verificarRegra` (e a `contratacoesDe`/`vagasDe`).
- [ ] T008 [US2] Em `escala/escala.service.ts`, passar `repo.turnosDoCadastro(lojaId)` como `horarios` ao montar a entrada dos cenários (diagnóstico e comparativo).
- [ ] T009 [US2] Testes em `escala/cenarios.test.ts` (ou arquivo novo): com `horarios`, `contratar` e `parcialH` mudam como esperado (folgas pedem mais horas na função de 2 pessoas); sem `horarios`, os números antigos não mudam; status "Não resolve sozinho" quando `resolve: false`.

## Phase 3: História 1 — Personalizar abre com folgas e contratações que fecham (P1)

**Teste independente**: Personalizar em Sumaré, 42h: 5 dias por pessoa, contratações com turnos, sem aviso de regra.

- [ ] T010 [US1] Em `simulacoes/vagas.ts`, `vagasSugeridas` passa a usar `semanaComFolgas` (vagas com `turnos` posicionados) quando há horários; sem horários, comportamento atual.
- [ ] T011 [US1] Em `simulacoes/simulacoes.service.ts`, `criar` com `comVagasSugeridas`: usa `semanaComFolgas` para (a) trocar os turnos da equipe pelos já com folgas e (b) criar as vagas com os turnos; o resultado abre sem erros de regra.
- [ ] T012 [US1] Em `frontend/react/src/features/diagnostico/Comparativo.jsx`, Personalizar deixa de remontar turnos na tela (PUT de vagas/horários e de turnos) quando o servidor já devolve os turnos; mantém o caminho antigo se vierem vazios.
- [ ] T013 [US1] Teste de integração em `simulacoes/simulacoes.routes.integration.test.ts`: criar com `comVagasSugeridas` numa loja com equipe de 7 dias devolve `turnos` com no máximo `regra.dias` dias por pessoa, vagas com turnos, `avaliacao.erros` sem regra de dias/jornada/intervalo/interjornada, e (quando `resolve`) cobertura sem hora abaixo do mínimo.

## Phase 4: História 3 — Quando não fecha, a mesma frase (P2)

- [ ] T014 [US3] Em `escala/linhas-cenarios.ts` e no status do cenário, usar `resolve: false` e `avisos` para "Não resolve sozinho" com a frase curta do que falta e os dias; a Simulação mostra a mesma frase (faixa de aviso e avisos das folgas).
- [ ] T015 [US3] Teste: loja com 1 farmacêutico aberta todos os dias; o cenário e a Simulação concordam sobre o domingo.

## Phase 5: História 4 — Botões da Simulação (P3)

- [ ] T016 [US4] Conferir que "Sugerir folgas" não aparece quando a simulação abriu com folgas e volta a aparecer depois de um ajuste; testes do front (`folgas-regras.test.js`) usam os mesmos casos do módulo do servidor.

## Phase 6: Fechamento

- [ ] T017 Teste de integração do contrato: para o mesmo cenário, `contratar` e as horas do cartão são iguais às das vagas da simulação criada por Personalizar (SC-002), nas três regras.
- [ ] T018 Rodar toda a suíte do servidor (`npm test`, `npm run test:integration`), `tsc`, `eslint` e a do front (`npm test`, build); corrigir testes antigos cujos números mudaram de propósito, listando cada mudança.
- [ ] T019 Conferir no navegador (dono, gestor, visualizador) os passos do `quickstart.md`; sem R$ para quem não pode; Cadastro intacto.
- [ ] T020 Atualizar o `README.md` (cenários e Personalizar) e `database/`/docs só se citarem os números antigos.

## Dependências e ordem

T001 → T002 → T003 → T004 → T005; depois US2 (T006→T009), US1 (T010→T013), US3 (T014→T015), US4 (T016), por fim T017–T020.

MVP: Fundação + US2 + US1 (T001–T013): o cenário conta as folgas e Personalizar abre já certo.

Risco: T006–T009 mexem no motor dos cenários; cada passo roda a suíte inteira antes do seguinte.
