# Tasks: Três cenários de decisão no Diagnóstico

**Input**: `specs/005-cenarios-diagnostico/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos (algoritmos conferidos com conta manual, permissões de custo, rota do diagnóstico).
Formato: `[ID] [P] [US] descrição com caminho`. Caminhos do backend relativos a `backend/node/`, do front a `frontend/react/`.

## Phase 1: Setup

- [X] T001 Conferir o branch `feat/escala-cenarios`, o ambiente de pé (`docker compose ps` saudável) e os testes atuais verdes (`npm test`, `npm run test:integration`)

## Phase 2: Fundação (bloqueia as histórias)

- [X] T002 [P] `LinhaFuncao` passa a expor `faltaH` (horas que faltam por função) e `cargaCheiaH` (jornada cheia da regra), com teste, em `src/modules/regras/capacidade.ts` e `capacidade.test.ts`
- [X] T003 [P] Teste + venda e margem médias por dia da semana e hora (divide pelo número de datas daquele dia da semana; hora sem linha vale zero; devolve também o total de dias usados) em `src/modules/escala/vendas.ts` e `vendas.test.ts`
- [X] T004 Estrutura dos cenários: tipos da resposta, entrada comum (dias abertos, quadro, mínimos, regra, vendas, custos, se é dono) e montagem do `cenarios` por regra em `src/modules/escala/cenarios.ts`

## Phase 3: US1 — Cenário 1, manter os horários (P1) 🎯 MVP

**Teste independente**: com a escala da loja de exemplo, listar a contratação por cargo e conferir custo adicional, % e ociosidade contra a conta manual, em 42h e 40h.

- [X] T005 [US1] Teste + Cenário 1: contratações por cargo (parcial quando basta uma pessoa), horas contratadas, ociosidade por função e total, horário semanal, equipe e impactos frente à atual, em `src/modules/escala/cenarios.ts` e `cenarios.test.ts`
- [X] T006 [US1] Custo adicional e % de acréscimo sobre a folha atual (mesma conta das vagas), só quando o chamador é o dono e há custos; sem custos, nulo, em `src/modules/escala/cenarios.ts`
- [X] T007 [US1] O diagnóstico entrega `cenarios` para `r42` e `r40`, recebendo se quem pede é o dono, em `src/modules/escala/diagnostico.ts` e `escala.service.ts`
- [X] T008 [US1] Teste de integração: a rota devolve os cenários das duas regras, quadro que já cobre tudo diz que não há contratação, e dono/gestor/consulta recebem o que cabe a cada um, em `src/modules/escala/escala.routes.integration.test.ts`
- [X] T009 [P] [US1] Cartão do Cenário 1 seguindo o seletor 42h/40h do quadro central (contratação por cargo, ociosidade, horário total, impactos em números grandes) em `src/features/diagnostico/Cenarios.jsx` e `Diagnostico.jsx`

**Checkpoint**: o primeiro cenário já responde "e se eu mantiver os horários?".

## Phase 4: US2 — Cenário 2, foco em economia (P2)

**Teste independente**: reduzir o horário até a equipe atual cobrir tudo e conferir que os cortes são os de menor venda e que o valor cortado confere com a soma das médias.

- [X] T010 [US2] Teste + corte guloso nas pontas de cada dia (menor venda primeiro; empate: fim do dia antes do começo; para quando nenhuma função falta nas horas e nos turnos), com detecção de função obrigatória sem ninguém no quadro, em `src/modules/escala/cenarios.ts` e `cenarios.test.ts`
- [X] T011 [US2] Resultado do Cenário 2: horas a reduzir, novo horário dia a dia (dia fechado quando tudo é cortado), cortes por dia, venda e margem cortadas por semana e por mês (nulas sem base) e o aviso de poucos dias de venda, em `src/modules/escala/cenarios.ts`
- [X] T012 [US2] Casos de borda com testes: loja 24 horas, dia inteiro cortado, quadro que já cobre tudo (nada a reduzir), sem base comercial (corta o fim do dia, sem estimar), sem farmacêutico (sem solução explicada), em `src/modules/escala/cenarios.test.ts`
- [X] T013 [US2] Teste de integração do Cenário 2 pela rota (com base comercial e sem), em `src/modules/escala/escala.routes.integration.test.ts`
- [X] T014 [P] [US2] Cartão do Cenário 2: horas a reduzir, horário semanal resultante, vendas e margem cortadas, avisos, em `src/features/diagnostico/Cenarios.jsx`

## Phase 5: US3 — Cenário 3, equilíbrio (P3)

**Teste independente**: com custos e vendas, só são cortadas as horas cuja margem mensal é menor que o custo mensal de cobri-las; o restante vira contratação.

- [ ] T015 [US3] Teste + custo mensal de cobrir uma hora (soma, por função obrigatória, de mínimo × salário × (1 + encargos) × 5 ÷ divisor) e margem mensal por hora, em `src/modules/escala/cenarios.ts` e `cenarios.test.ts`
- [ ] T016 [US3] Cenário 3: corta as pontas que não se pagam (de menor margem, reavaliando as novas pontas) e contrata para o que ainda falta, com ociosidade, custo adicional, margem perdida e `coincideComManter`, em `src/modules/escala/cenarios.ts`
- [ ] T017 [US3] Indisponibilidade explicada: sem custos de todas as funções obrigatórias ou sem base comercial, devolve o motivo e o texto, sem número parcial, com testes, em `src/modules/escala/cenarios.ts` e `cenarios.test.ts`
- [ ] T018 [US3] Teste de integração do Cenário 3 pela rota (completo, sem custos, sem vendas, perfil sem permissão de custo), em `src/modules/escala/escala.routes.integration.test.ts`
- [ ] T019 [P] [US3] Cartão do Cenário 3 (cortes, contratações, margem perdida, custo para o dono e a mensagem do que falta), em `src/features/diagnostico/Cenarios.jsx`

## Phase 6: US4 — Direcionamento claro (P4)

**Teste independente**: com dados completos, o destaque cai no cenário de menor soma de custo adicional e margem perdida.

- [ ] T020 [US4] Teste + frases de direcionamento e foco por cenário, montadas com os números do cenário, em `src/modules/escala/cenarios.ts` e `cenarios.test.ts`
- [ ] T021 [US4] Teste + destaque do menor impacto financeiro mensal (só dono, só com os três calculáveis; Cenário 2 sem solução fica de fora; empate: o que contrata menos), em `src/modules/escala/cenarios.ts` e `cenarios.test.ts`
- [ ] T022 [US4] Teste de integração do destaque e de que gestor e consulta não recebem destaque nem valores de custo, em `src/modules/escala/escala.routes.integration.test.ts`
- [ ] T023 [P] [US4] Tela: frase de direcionamento, selo "Menor impacto financeiro", avisos de dado faltando e troca 42h/40h sem recarregar, em `src/features/diagnostico/Cenarios.jsx`

## Phase 7: Fechamento

- [ ] T024 [P] Conferir na tela: loja com escala e vendas, loja sem vendas, loja 24 horas e os três perfis; ajustar o que precisar
- [ ] T025 Rodar `quickstart.md` de ponta a ponta com o ambiente de pé; `npm test`, `npm run test:integration`, `npm run lint` (conferindo o código de saída), builds da API e da tela
- [ ] T026 [P] Sincronizar `templates/`, atualizar o README e a lista de pendências conhecidas (levar o cenário para uma simulação, cortes no meio do dia)
- [ ] T027 Marcar as tarefas concluídas, commitar e enviar o branch

## Dependências

Setup → Fundação (T002 e T003 em paralelo, depois T004) → US1 → US2 → US3 → US4 → Fechamento. T009, T014, T019 e T023 (telas) podem andar em paralelo com os testes de integração da própria fatia. US1 sozinha já entrega valor.
