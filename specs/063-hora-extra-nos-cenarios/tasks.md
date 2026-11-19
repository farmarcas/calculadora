---
description: "Tarefas: hora extra antes de contratar, nos Cenários, no Diagnóstico e na Simulação"
---

# Tasks: Hora extra antes de contratar, nos Cenários, no Diagnóstico e na Simulação

**Input**: `/specs/063-hora-extra-nos-cenarios/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: incluídos (a regra e a igualdade Cenário × Simulação precisam de prova).

**Organization**: por história. A regra e o custo (Foundational) bloqueiam tudo. US1 → US2 → US3 mexem na mesma cadeia do servidor; US4/US5/US6 dependem de US1 e US2. Branch `feat/hora-extra-nos-cenarios`; commit só na branch, sem PR até a pessoa pedir.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem depender de tarefa incompleta)
- Caminhos relativos à raiz. Comandos rodam nos containers (`docker compose exec -T api|web ...`).

---

## Phase 1: Setup

- [x] T001 Linha de base e riscos: ambiente de pé; `docker compose exec -T api npm test` / `npm run test:integration` e `docker compose exec -T web npx vitest run` passando (anotar totais). Verificar em `backend/node/src/modules/simulacoes/simulacoes.service.ts` o que uma simulação **gravada** congela (resultado guardado ou calculado na leitura) e registrar no `research.md`; se for calculado na leitura, ajustar o caso de borda "gravadas não são recalculadas" da spec antes de seguir. Listar os 10 pontos que chamam `verificarRegra` (cenarios.ts ×5, diagnostico.ts, resultado.ts ×3, vagas.ts) e decidir quais ligam a hora extra (Cenários e Simulação) e quais não (diagnóstico bruto, sugestão de vagas).

---

## Phase 2: Foundational (bloqueia as histórias)

- [x] T002 [P] Criar `backend/node/src/modules/regras/hora-extra.ts` (puro): `HORA_EXTRA = { maxPorDiaH: 2, maxPorSemanaH: 10, adicionalPct: 50, semanasNaFolha: 5 }`; `coberturaComHoraExtra({ faltaH, faltaPorDiaH?, pessoasPorDia?, pessoas })` → `{ horaExtraH, restanteH }` com `min(falta, Σ dia min(faltaDoDia, pessoasNoDia × 2), pessoas × 10)` (sem `faltaPorDiaH`, só o teto semanal; sem pessoas, zero); `custoMensalDaHoraExtra({ horasSemana, salarioMedio, divisor, encargosPct })` = `horasSemana × 5 × (salário ÷ divisor) × 1,5 × (1 + encargos)`, nulo sem salário (nunca parcial), arredondado como em `resultado.ts` hoje.
- [x] T003 [P] Testes em `backend/node/src/modules/regras/hora-extra.test.ts`: falta pequena cabe toda; falta acima do teto (2 pessoas → 20 h); teto diário (falta concentrada num dia); função sem ninguém; sem salário → custo nulo; e o custo **igual ao de hoje** para um caso conhecido de `resultado.ts` (compare com a conta antiga em linha, antes de removê-la).
- [x] T004 Em `backend/node/src/modules/regras/capacidade.ts` (`verificarRegra`): opção nova `horaExtra?: boolean` (padrão `false`, para o diagnóstico bruto e a sugestão de vagas não mudarem); quando ligada, abater `horaExtraH` de `gapH` antes de `sugerirContratacao` (a falta por dia vem de `coberturaDaFuncao` sobre os turnos da semana real), e preencher em `LinhaFuncao` os campos novos `horaExtraH`, `horaExtraCustoMensal` (só com `custos`) e `faltaAposHoraExtraH`; `gapH`/`faltaH`/`falta` continuam a falta bruta; `contratar*`/`sugestao` cobrem só o que sobra; `memoria` ganha a frase da hora extra.
- [x] T005 [P] Testes em `backend/node/src/modules/regras/capacidade.test.ts` (ou arquivo vizinho): com a opção desligada nada muda (regressão dos testes de hoje); ligada, 3 casos: fecha só com hora extra, fecha em parte, continua contratando (função sem ninguém); farmacêutico incluído.

**Checkpoint**: a regra e o custo existem em um lugar só, ligados ao motor, sem mudar nada para quem não liga.

---

## Phase 3: User Story 1 - O cenário cobre a falta com hora extra antes de contratar (Priority: P1) 🎯 MVP

**Goal**: "Manter" (e os cenários que hoje contratam) cobrem com hora extra primeiro e contratam só o resto.

**Independent Test**: loja com 2 farmacêuticos e 2 h/semana sem cobertura de farmacêutico: o cenário diz "Sem contratar: cobre com 2 h de hora extra por semana" e não contrata ninguém.

- [x] T006 [P] [US1] Testes em `backend/node/src/modules/escala/cenarios.test.ts`: cenário que fecha só com hora extra (sem contratação), que fecha em parte (hora extra + contratação do resto) e que continua precisando contratar (ninguém na função); `resultado` e `direcionamento` com a frase certa.
- [x] T007 [US1] Em `backend/node/src/modules/escala/cenarios.ts`: as chamadas de `verificarRegra` do "Manter" e dos cenários que contratam passam `horaExtra: true`; `contratacoesDe`/`montarManter` usam a contratação que sobra (e `horasUsadas` da falta que sobra); `CenarioManter` ganha `horaExtra[]` (`funcao`, `horasSemana`, e `custoMensal` só para o dono), `semContratar`, `resultado` "Sem contratar: cobre com N h de hora extra por semana" e `direcionamento` com a hora extra.

---

## Phase 4: User Story 2 - O custo da hora extra entra no custo e no peso da folha (Priority: P1)

**Goal**: o custo adicional do cenário soma vagas + hora extra e o peso da folha reflete.

**Independent Test**: o mesmo cenário com e sem hora extra tem pesos diferentes e a diferença é o custo mensal da hora extra ÷ faturamento.

- [x] T008 [P] [US2] Testes em `backend/node/src/modules/escala/peso-folha.test.ts` e `comparativo.test.ts`: peso com e sem hora extra (diferença = custo ÷ faturamento com 1 casa); sem salário informado, custo adicional nulo e peso nulo; gestor/consulta não recebem custo nem peso.
- [x] T009 [US2] Em `cenarios.ts` (`montarManter` e afins, só `e.dono`): `custoAdicionalMensal` = `custoDasVagas` + custo da hora extra (nulo se faltar salário de quem tem hora extra); `acrescimoPct`, `impactoPctFaturamento` e `custoAnual` seguem dele. Em `comparativo.ts`: usar o custo novo nas colunas e no peso da folha (sem mudar a fórmula de `peso-folha.ts`).

---

## Phase 5: User Story 3 - Cartão e Simulação mostram o mesmo número (Priority: P1)

**Goal**: a Simulação usa a mesma regra e a mesma conta; o cartão e a Simulação aberta por Personalizar coincidem.

**Independent Test**: para um cenário que cobre só com hora extra, horas, custo e peso da folha do cartão e da Simulação aberta por Personalizar são idênticos.

- [x] T010 [P] [US3] Teste de igualdade em `backend/node/src/modules/escala/cenarios.test.ts` ou `simulacoes/resultado.test.ts`: o mesmo cenário (só hora extra; em parte) calculado como cartão e como Simulação aberta por Personalizar dá a mesma hora extra (h), o mesmo custo e o mesmo peso da folha; mais um teste de integração em `simulacoes.routes.integration.test.ts` com o caminho Personalizar.
- [x] T011 [US3] Em `backend/node/src/modules/simulacoes/resultado.ts`: remover a conta própria da hora extra (`ADICIONAL_HORA_EXTRA`, `SEMANAS_DA_FOLHA`) e usar `custoMensalDaHoraExtra`; as chamadas de `verificarRegra` de `depois` e `linhasManter` passam `horaExtra: true`; a hora extra passa a respeitar o teto, e a falta acima dele vira "falta a cobrir" no resultado (`faltaAposHoraExtraH`). Em `resultado-em-horas.ts`: `horaExtraH` = horas cobertas por hora extra e a falta restante. Conferir que simulações com hora extra pequena têm o mesmo `horaExtra` em R$ de antes.

---

## Phase 6: User Story 4 - As telas mostram a hora extra com texto claro (Priority: P1)

**Goal**: coluna "Contratar", texto, chip, peso da folha e o rótulo "Cobre sem contratar".

**Independent Test**: cenário só com hora extra mostra "Hora extra: 2 h por semana de farmacêutico" na coluna "Contratar" e o rótulo "Cobre sem contratar"; gestor/consulta veem as horas e nenhum R$.

- [x] T012 [P] [US4] Testes em `backend/node/src/modules/escala/linhas-cenarios.test.ts` e `frontend/react/src/features/diagnostico/cartao/linha-regras.test.js`: `horaExtra` e `semContratar` na linha; textos ("Sem contratar: cobre com N h…"); `textoContratar` com hora extra e contratação; rótulo "Cobre sem contratar"; gestor/consulta sem R$.
- [x] T013 [US4] Em `backend/node/src/modules/escala/linhas-cenarios.ts`: passar `horaExtra[]` e `semContratar` para a linha, sem custo quando não for dono; `causa`/textos ("é preciso contratar" só quando ainda há contratação).
- [x] T014 [US4] Em `frontend/react/src/features/diagnostico/cartao/linha-regras.js`, `LinhaDeCenario.jsx` e `CelulaFolha.jsx`: `textoContratar` com "Hora extra: N h por semana de {cargo}"; rótulo "Cobre sem contratar" quando `semContratar`; chip e peso já refletem o custo novo vindo do servidor.

---

## Phase 7: User Story 5 - Alerta quando a hora extra é demais (Priority: P2)

**Goal**: avisar quando contratar sair mais barato ou o teto for atingido.

**Independent Test**: com 18 h/semana de hora extra mais caras que uma contratação integral, aparece o alerta com os dois custos (dono) e a recomendação de considerar contratar.

- [x] T015 [P] [US5] Testes (servidor): alerta "contratar sairia mais barato" (com valores só para o dono), alerta de teto atingido, nenhum alerta quando a hora extra é barata; mesma regra na Simulação.
- [x] T016 [US5] Implementar as frases e a comparação (hora extra mensal da função × custo mensal da contratação integral que cobriria a mesma falta) em `regras/hora-extra.ts` (função pura) e ligá-las a `cenarios.ts`/`linhas-cenarios.ts` (`alertasHoraExtra[]`) e ao resultado da Simulação; mostrar os alertas no cartão e na Simulação com o estilo de aviso que já existe.

---

## Phase 8: User Story 6 - Parecer e PDF falam em hora extra (Priority: P2)

- [x] T017 [P] [US6] Testes em `backend/node/src/modules/simulacoes/parecer.test.ts` (e `parecer-pdf`, se houver): "Sem contratar ninguém, cobrindo com N h de hora extra por semana," e "…com N h de hora extra e contratando …"; custo só para quem vê valores.
- [x] T018 [US6] Em `parecer.ts` (`frasesDeContratacao` e o resumo) e `parecer-pdf.ts`: incluir a hora extra; conferir também `exportar.ts` e o texto do Diagnóstico em PDF; sem valores para gestor/consulta.

---

## Phase 9: Polish & Cross-Cutting

- [x] T019 `sh scripts/sync-templates.sh` e `sh scripts/check-repo.sh` (a cópia de `templates/backend/node` entra no commit).
- [x] T020 Rodar tudo: `prettier --write` nos arquivos do servidor mexidos, `npm test`, `npm run test:integration`, `npx vitest run` e `vite build`; sem queda nos totais do T001.
- [x] T021 Conferir na tela (`quickstart.md`) numa loja real local (Cosmópolis): cartão do cenário, Personalizar com os mesmos números, gestor/consulta sem R$, alerta, parecer; reiniciar a API antes.
- [x] T022 Marcar as tarefas como feitas, commitar na branch (sem enviar até a pessoa pedir) e atualizar `local/ver-tudo`.

---

## Dependencies & Execution Order

- **T001** antes de tudo; **T002 ∥ T003 → T004 → T005** (Foundational bloqueia as histórias).
- **US1 → US2 → US3** (mesma cadeia: `cenarios.ts`, `comparativo.ts`, `resultado.ts`); testes T006/T008/T010 [P] podem ser escritos antes e devem falhar.
- **US4** depende de US1 e US2 (campos novos); **US5** depende de US2 (custos); **US6** depende de T011.
- **Polish** só depois de todas.

### Parallel Opportunities

- T002 ∥ T003; T006 ∥ T008 ∥ T010; T012 ∥ T015 ∥ T017.

## Implementation Strategy

- **MVP**: Foundational + US1 + US2 (regra, custo e cenários), depois US3 (igualdade com a Simulação).
- Em seguida US4 (telas), US5 (alerta) e US6 (parecer).
- Aprovação ao fim de cada etapa do Spec Kit; commit só na branch, sem PR até a pessoa pedir.
