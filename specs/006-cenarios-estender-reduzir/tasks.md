# Tasks: Cenários "Estender horário" e "Reduzir equipe"

**Input**: `specs/006-cenarios-estender-reduzir/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos (os dois algoritmos conferidos com conta manual, permissões de custo, rota do diagnóstico).
Formato: `[ID] [P] [US] descrição com caminho`. Caminhos do backend relativos a `backend/node/`, do front a `frontend/react/`.

## Phase 1: Setup

- [ ] T001 Conferir o branch `feat/escala-cenarios-extras`, o ambiente de pé (`docker compose ps` saudável) e os testes atuais verdes (`npm test`, `npm run test:integration`)

## Phase 2: Fundação (bloqueia as histórias)

- [ ] T002 Exportar de `src/modules/escala/cenarios.ts` os auxiliares que os extras reutilizam (`contratacoesDe`, `custoDasVagas`, `folhaAtual`, `horarioDaSemana`, `horasDaSemana`, `hhmm`, tipos) e criar `src/modules/escala/cenarios-extras.ts` com os tipos da resposta (`CenarioEstender`, `CenarioReduzir`) e `montarExtras(entrada, cenarios)`
- [ ] T003 Diagnóstico junta os extras ao `cenarios` de cada regra (`r42` e `r40`), em `src/modules/escala/diagnostico.ts`

## Phase 3: US1 — Cenário 4, estender horário (P1) 🎯 MVP

**Teste independente**: com contratação ociosa no Cenário 1, as horas estendidas cabem na sobra (a cobertura passa sem nova contratação), uma hora a mais já falta, e a margem de referência confere com a conta manual.

- [ ] T004 [US1] Teste + equipe de partida (quadro atual mais as vagas do Cenário 1, cada uma com `parcialH` ou a jornada cheia) e candidatos de extensão (1 hora antes da abertura e 1 depois do fechamento, limite de 2 horas por ponta, dia fechado reabre inteiro com o horário do dia aberto mais curto), em `src/modules/escala/cenarios-extras.ts` e `cenarios-extras.test.ts`
- [ ] T005 [US1] Teste + escolha gulosa: entre os viáveis (`verificarRegra` sem falta em horas e turnos), o de maior margem de referência por hora (empate: fim do dia antes do começo, depois dia mais tardio); só estende hora com margem de referência > 0 quando há base; para quando não há viável, em `src/modules/escala/cenarios-extras.ts`
- [ ] T006 [US1] Teste + referência de venda (hora vizinha aberta; dia fechado usa o dia aberto mais curto), horas e novo horário, venda e margem de referência por semana e por mês, aviso de referência e de poucos dias, em `src/modules/escala/cenarios-extras.ts`
- [ ] T007 [US1] Teste + resultado do dono: custo (o do Cenário 1) e `impactoMensal` = custo − margem de referência (nulo sem custo); quem não é dono não recebe nenhum valor de custo, em `src/modules/escala/cenarios-extras.ts`
- [ ] T008 [US1] Casos de borda com testes: sem sobra de capacidade (indisponível com motivo), sem base comercial (horas possíveis, sem valor, com aviso), loja 24 horas (só dia fechado poderia abrir), dia hoje fechado reaberto, farmacêutico coberto, em `src/modules/escala/cenarios-extras.test.ts`
- [ ] T009 [US1] Teste de integração: a rota devolve `estender` nas duas regras, com e sem base, e dono/gestor/consulta recebem o que cabe a cada um, em `src/modules/escala/escala.routes.integration.test.ts`
- [ ] T010 [P] [US1] Cartão do Cenário 4 (horas a estender, novo horário, extensões, venda e margem de referência rotuladas, avisos, custo e impacto só para o dono) em `src/features/diagnostico/Cenarios.jsx`

**Checkpoint**: o quarto cenário já responde "e se eu abrir mais com o que já vou pagar?".

## Phase 4: US2 — Cenário 5, reduzir equipe (P2)

**Teste independente**: com mais gente do que o horário pede, tirar o excedente indicado mantém a cobertura e tirar mais uma pessoa de qualquer cargo a quebra.

- [ ] T011 [US2] Teste + excedente por cargo: só funções com mínimo > 0 que hoje passam; remove a pessoa de menor carga enquanto a linha da função continuar sem falta; cargo em falta ou justo não tem excedente, em `src/modules/escala/cenarios-extras.ts` e `cenarios-extras.test.ts`
- [ ] T012 [US2] Teste + economia por cargo e total (excedente × salário médio × (1 + encargos)) e % sobre a folha atual; cargo sem salário deixa o total nulo (sem número parcial); sem custos só as pessoas; só o dono recebe valores, em `src/modules/escala/cenarios-extras.ts`
- [ ] T013 [US2] Casos de borda com testes: função obrigatória com uma só pessoa nunca sobra, nenhum excedente, regra de 42h × 40h mudando o excedente, cargos sem mínimo ficam de fora, falta em um cargo e sobra em outro (aviso), em `src/modules/escala/cenarios-extras.test.ts`
- [ ] T014 [US2] Teste de integração: a rota devolve `reduzir` nas duas regras e os perfis sem permissão não recebem economia, em `src/modules/escala/escala.routes.integration.test.ts`
- [ ] T015 [P] [US2] Cartão do Cenário 5 (excedente por cargo, economia só para o dono, aviso de capacidade excedente e de validação trabalhista) em `src/features/diagnostico/Cenarios.jsx`

## Phase 5: US3 — Encaixe (P3)

- [ ] T016 [US3] Frases de direcionamento dos dois cenários (montadas com os números), e garantir que o `destaque` segue só entre `manter`, `economia` e `equilibrio` (teste), em `src/modules/escala/cenarios-extras.ts` e `cenarios.test.ts`
- [ ] T017 [P] [US3] Tela: os dois cartões abaixo do Cenário 3, avisos de dado faltando e troca 42h/40h sem recarregar, em `src/features/diagnostico/Cenarios.jsx`

## Phase 6: Fechamento

- [ ] T018 [P] Conferir na tela: loja com sobra de capacidade, loja justa, loja sem vendas e os três perfis; ajustar o que precisar
- [ ] T019 Rodar `quickstart.md` de ponta a ponta com o ambiente de pé; `npm test`, `npm run test:integration`, `npm run lint` (conferindo o código de saída), builds da API e da tela
- [ ] T020 [P] Sincronizar `templates/`, atualizar o README e a lista de pendências conhecidas (levar o cenário para uma simulação, folguista, rede de lojas)
- [ ] T021 Marcar as tarefas concluídas e commitar

## Dependências

Setup → Fundação (T002, depois T003) → US1 → US2 → US3 → Fechamento. T010, T015 e T017 (telas) podem andar em paralelo com os testes de integração da própria fatia. US1 sozinha já entrega valor; US2 não depende de US1.
