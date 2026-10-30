# Tasks: Farmacêutico como único mínimo e contratação por horas

**Input**: `specs/013-farmaceutico-contratacao-por-horas/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos (contas à mão: gap de 10 h, 30 h, 35 h, 54 h, 70 h e 75 h; variante de 26 h + 6 h; loja 24 horas; loja sem atendente; metas e escala das horas abertas; custo proporcional; Porto Feliz antes e depois).
Formato: `[ID] [P] [US] descrição com caminho`. Caminhos do backend relativos a `backend/node/`, do front a `frontend/react/`.
Segurança do banco: só uma migration que acrescenta uma coluna (fatia 6); nada de `down -v` nem `prisma migrate reset`.

## Phase 1: Setup

- [X] T001 Conferir o branch `feat/farmaceutico-contratacao-por-horas`, o ambiente de pé e os testes verdes (`npm test`, `npm run test:integration`), anotando as contagens; guardar o "antes" da Porto Feliz (regras 42 h e 40 h: gap de farmacêutico, contratação, custo) em `specs/013-farmaceutico-contratacao-por-horas/antes-porto-feliz.md`

## Phase 2: Fatia 1 — Núcleo por horas (US1 a US3, puro) 🎯 MVP

**Teste independente**: gap de 10 h dá parcial de 10 h; 30 h dá parcial de 30 h; 35 h dá integral; 54 h dá 1 integral de 40 h + parcial de 14 h, sem ociosidade.

- [X] T002 [US2] Teste + `src/modules/regras/gap-horas.ts`: meta por cargo (padrão = soma de `min(carga, jornada da regra atual)` das pessoas do cargo; meta do dono = `mínimo × horas abertas`, que substitui o padrão; cargo sem ninguém e sem meta = 0), capacidade (soma de `min(carga, teto efetivo da regra)`) e `gapH = max(0, necessidade − capacidade)`; farmacêutico com necessidade = horas abertas; escala da meta pelas horas abertas do cenário (`horas do cenário ÷ horas de hoje`)
- [X] T003 [US3] Teste + `src/modules/regras/contratacao-horas.ts`: constante `PARCIAL = { maxHorasSemana: 30, variante: { baseH: 26, extrasMaxH: 6 }, extrasAdicionalPct: 50 }`; para gap `g` e jornada integral `J`, testar `n` integrais de `floor(g/J)` a `ceil(g/J)` com resto `r` virando no máximo um parcial se `0 < r ≤ 30`; escolher menos horas ociosas e, em empate, menor custo; gap ≤ 30 h = 1 parcial
- [X] T004 [US3] Teste à mão do núcleo: 10 h → parcial 10 h; 30 h → parcial 30 h; 35 h → 1 integral (ociosidade 5 h); 54 h → 1 integral + parcial 14 h (ociosidade 0); 70 h → 1 integral + parcial 30 h; 75 h → 2 integrais; 80 h → 2 integrais; nunca parcial acima de 30 h
- [X] T005 [US3] Variante secundária: resto entre 30 h e 32 h vira parcial de 26 h + até 6 h extras só quando reduz a ociosidade, marcada `com_hora_extra`; teste à mão (ex.: gap de 32 h)
- [X] T006 [US3] Horas contratadas, usadas, ociosas e `ociosidadePct` por sugestão; custo: parcial `salário × h × 5 ÷ divisor × (1 + encargos)`, integral com a jornada efetiva, hora extra × 1,5; sem salário o custo fica nulo e as horas continuam; teste à mão com o salário de R$ 4.722, encargos de 66% e divisor 210 (parcial de 14 h = R$ 2.612,84; integral de 40 h = R$ 7.465,26; o custo é somado sem arredondar parcelas e arredondado uma vez, como o sistema já faz: 2 integrais = R$ 14.930,51)
- [X] T007 Rodar tudo (`npm test`, `npm run lint`, `npx tsc --noEmit`) e commitar a fatia

**Checkpoint**: as duas regras novas existem, puras e provadas com números à mão.

## Phase 3: Fatia 2 — Motor e diagnóstico (US1, US2, US3) 🎯

**Teste independente**: o Diagnóstico da Porto Feliz mostra gap de farmacêutico de 54 h e a sugestão 1 integral + parcial de 14 h; uma loja sem atendente não acusa falta; as duas fases calculam.

- [x] T008 [US1] `src/modules/regras/capacidade.ts` (`verificarRegra`): usa `gap-horas` e `contratacao-horas`; novos campos `obrigatorio`, `metaH`, `gapH` e `sugestao`; `contratar`, `contratarInteiras`, `parcialH` e `ajustado` passam a vir da sugestão; os turnos do farmacêutico seguem calculados como verificação de cobertura por dia; os demais cargos não geram falta por mínimo
- [x] T009 [US2] `src/modules/regras/perfis.ts` e `requisitos.ts`: `FUNCOES_PADRAO_MINIMO` passa a `{ Farmacêutico: 1, demais: 0 }`; mínimo maior que zero de um cargo que não é farmacêutico vira meta do dono; farmacêutico sempre ao menos 1; valores já gravados nas lojas seguem valendo
- [x] T010 [US2] `passa(linhas)` e o alerta de "falta": só o farmacêutico bloqueia; gaps dos demais cargos viram metas (informativas); adaptar `src/modules/escala/diagnostico.ts`: `numeros` ("turnos em falta" do farmacêutico e horas de gap), `pontosAtencao` (só "faixas sem farmacêutico" e "faixas abaixo da meta do dono") e o resumo por regra
- [x] T011 [US2] `src/modules/escala/cobertura.ts` e `quadro-turnos.ts`: "exigido" e alerta vermelho só para farmacêutico e metas do dono; demais cargos mostram o que a loja tem, sem falta
- [x] T012 [US1] Teste + `capacidade.test.ts`, `requisitos.test.ts`: refazer à mão as expectativas (farmacêutico 94 h × 40 h = gap 54 h; loja de 24 horas = 168 h; loja sem farmacêutico = gap inteiro; loja sem atendente não acusa falta; metas com horas abertas menores); anotar o porquê de cada mudança
- [x] T013 [US3] Teste de integração em `escala.routes.integration.test.ts`: loja de teste com 1 farmacêutico e horário de 94 h; gap e sugestão corretos nas regras de 42 h e 40 h; gestor e consulta sem nenhum campo em reais; `limiteParcial` na consulta continua aceito e é ignorado
- [x] T014 Rodar tudo e commitar a fatia

## Phase 4: Fatia 3 — Cenários, comparativo, simulações e vagas (US6) 🎯

**Teste independente**: os cenários da Porto Feliz abrem com a contratação nova e o custo coerente; o Cenário 2 deixa de ser inviável por falta de Caixa ou Atendimento.

- [x] T015 [US6] `src/modules/escala/cenarios.ts`: `Contratacao` com `parcial: { horas, turnos }` (turnos só para compatibilidade), `horasUsadas`, `horasOciosas` e `motivo` (`obrigatoria` ou `meta`); `contratacoesDe` e `custoDasVagas` usam as sugestões por horas; Cenário 1 inclui a obrigatória (farmacêutico) e as metas, marcadas
- [x] T016 [US6] Cenário 2 cobre só pelo farmacêutico e continua sem contratar; "equipe já cobre" e as travas do fim de semana usam o gap do farmacêutico; o motivo "Não há X no quadro" só vale para o farmacêutico
- [x] T017 [US6] Cenário 3 (equilíbrio) e `cenarios-dias.ts`: cada combinação de dias usa a necessidade do farmacêutico e a meta escalada pelas horas abertas; avaliação e custo pela contratação nova
- [x] T018 [US6] `src/modules/escala/comparativo.ts`, `etapas.ts` e `cenarios-extras.ts`: contratações por horas, `motivo`, ociosidade e custo; Cenário 5 (reduzir equipe) e Cenário 4 (abrir um dia) com a necessidade nova
- [x] T019 [US6] `src/modules/simulacoes/vagas.ts` e `avaliar.ts`: vagas sugeridas pela contratação nova (integral na jornada efetiva, parcial com as horas do gap); simulação em rascunho avalia com a lógica nova
- [x] T020 [US6] Refazer à mão, um a um, os testes antigos de cenários, comparativo, extras, etapas, diagnóstico e simulações (`cenarios*.test.ts`, `comparativo.test.ts`, `etapas.test.ts`, `diagnostico.test.ts`, `simulacoes.*.test.ts`), anotando no teste o porquê de cada mudança
- [x] T021 [US6] Teste de integração: a loja de teste com 94 h mostra os cenários 1, 2 e 3 coerentes; loja sem Caixa nem Atendimento não deixa o Cenário 2 inviável
- [x] T022 Comparar a Porto Feliz antes e depois pela API (regras 42 h e 40 h: turnos em falta, gaps por cargo, contratações sugeridas e custo) e registrar em `specs/013-farmaceutico-contratacao-por-horas/antes-depois-porto-feliz.md`
- [x] T023 Rodar tudo (`npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit`) e commitar a fatia

## Phase 5: Fatia 4 — Tela (US3)

**Teste independente**: no navegador, a Porto Feliz mostra o gap de 54 h, a sugestão "1 integral + 1 parcial de 14 h", horas usadas e ociosas, custo e o aviso do CRF.

- [x] T024 [US3] `features/diagnostico/Diagnostico.jsx`: "Déficit e contratações por função" passa a mostrar, por cargo, necessidade ou meta, capacidade, gap em horas, a sugestão (parcial, integral, integral + parcial), horas contratadas, usadas e ociosas (%), custo (só dono) e a marca "obrigatória" ou "para manter o nível de hoje"
- [x] T025 [US3] `features/diagnostico/QuadroCentral.jsx`: o quadro central fala em horas de gap do farmacêutico, com os turnos como apoio; sem "falta de atendente ou caixa"
- [x] T026 [US2] `features/diagnostico/Configuracao.jsx` e `TurnosLoja.jsx`: o mínimo dos cargos que não são farmacêutico vira "Meta (opcional)", com texto explicando que sem meta vale o nível de hoje; farmacêutico segue ao menos 1
- [x] T027 [US6] `features/diagnostico/Comparativo.jsx` e `Cenarios.jsx`: contratações por horas ("1 farmacêutico integral e 1 parcial de 14 h"), ociosidade, selo "meta" nas contratações que não são obrigatórias; gestor sem valores em reais
- [x] T028 Conferir no navegador (dono e gestor): Porto Feliz nas regras de 42 h e 40 h; loja do GE 216 sem atendente; loja 001; telas largas e estreitas
- [x] T029 Rodar tudo e commitar a fatia

## Phase 6: Fatia 5 — Parcial com dias, horários e aviso do CRF (US4)

**Teste independente**: o parcial de 14 h de farmacêutico mostra os dias e as faixas que cobre e o aviso do CRF; o de outro cargo mostra os dias e as faixas, sem o aviso.

- [x] T030 [US4] Teste + `src/modules/escala/distribuir-parcial.ts`: dado o horário aberto e quem já cobre o cargo em cada hora (escala importada ou horário do cadastro), aloca as horas do parcial em blocos de até 8 h por dia, nos dias de maior descoberto, em até 5 dias; contas à mão (parcial de 14 h sobre dias com 6 h descobertas)
- [x] T031 [US4] `sugestao.parcial.distribuicao` na resposta do Diagnóstico e nos cenários; aviso do CRF só para farmacêutico parcial (texto exato do pedido); sem dado de presença, a distribuição usa os dias de maior descoberto estimado e diz que é uma sugestão
- [x] T032 [US4] Tela: dias e horários do parcial na tabela de contratações e no cartão do Cenário 1; aviso do CRF em destaque
- [x] T033 [US4] Teste de integração e conferência no navegador; rodar tudo e commitar a fatia

## Phase 7: Fatia 6 — Redistribuição, horário fixo e fechamento (US5)

**Teste independente**: um quadro que cabe se for redistribuído não gera contratação; o funcionário de horário fixo é mantido e avisado.

- [x] T034 [US5] Migration `prisma/migrations/<data>_horario_fixo/migration.sql` escrita à mão (coluna `horario_fixo` booleana, padrão falso, em `funcionarios`) + `prisma/schema.prisma`; aplicar com `prisma migrate deploy` e `prisma generate`; conferir as contagens antes e depois
- [x] T035 [US5] `src/modules/cadastros/*`: `horarioFixo` no cadastro de funcionário (API, schema Zod, planilha opcional); `features/cadastros/FormFuncionario.jsx` e `EquipeLoja.jsx`: caixa "Horário fixo (não remanejar)"
- [x] T036 [US5] Teste + `src/modules/escala/redistribuir.ts`: montagem gulosa de escala semanal por cargo, começando pelo farmacêutico (até 5 dias por pessoa, até 8 h por dia ou o permitido pela convenção, folga no domingo revezando); pessoa de horário fixo mantém dias e horários; devolve cobertura por hora e o descoberto por cargo; contas à mão
- [x] T037 [US5] `verificarRegra` e o Diagnóstico usam o descoberto da redistribuição como gap (quando há presença/horários suficientes); sem dados, mantêm a capacidade agregada; `redistribuicao: { cobertura, descoberto[], avisos[] }` na resposta
- [x] T038 [US5] Tela: aviso de horário fixo no diagnóstico e o quadro do que foi redistribuído; folga de domingo por pessoa
- [x] T039 [US5] Testes de integração (quadro que cabe depois de redistribuir; horário fixo mantido; parâmetros de dias, horas por dia e convenção respeitados)
- [x] T040 Documentação: README (nova lógica de mínimo e de contratação, metas, parcial, CRF, horário fixo), `scripts/sync-templates.sh`, `scripts/check-repo.sh`
- [x] T041 Conferência final: `npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit`, build do `web`, `quickstart.md` do começo ao fim, Porto Feliz antes e depois, cenários 1 a 5 abrindo; commitar

## Dependências e ordem

- Fatia 1 → 2 → 3 → 4, nessa ordem; as fatias 5 e 6 dependem da 2 e podem ser feitas em qualquer ordem depois da 4.
- A fatia 6 é a mais pesada e, se crescer, vira spec própria sem atrapalhar as anteriores.
- A fatia 4 da spec 012 (Cenário 3 com as travas) pode ser feita antes ou depois; ela reaproveita `cenarios-dias.ts`.
