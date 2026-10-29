# Tasks: Cenário 1 em turnos e comparativo de cenários

**Input**: `specs/010-cenario1-turnos-comparativo/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos (contas à mão da regra de contratação, etapas, custo anual e percentual, status e destaque do comparativo, premissas, permissões).
Formato: `[ID] [P] [US] descrição com caminho`. Caminhos do backend relativos a `backend/node/`, do front a `frontend/react/`.
Segurança do banco: sem migration nesta spec; nada de `down -v` nem `prisma migrate reset`.

## Ordem de execução entre as duas specs

1. **010 fatias 1 e 2** (regra de contratação do documento e etapas do Cenário 1)
2. **009 fatias 1 a 4** (venda por dia e cenários 2, 3 e 4 por dia; já usam a regra nova)
3. **010 fatias 3 e 4** (comparativo e premissas)
4. **009 fatia 5** (remover o código por hora e fechar)

## Phase 1: Setup

- [ ] T001 Conferir o branch `feat/cenario1-comparativo`, o ambiente de pé (`docker compose ps` saudável) e os testes atuais verdes (`npm test`, `npm run test:integration`), anotando as contagens de partida

## Phase 2: Fatia 1 — US1: regra de contratação do documento (P1) 🎯 MVP

**Teste independente**: 7 turnos faltantes e 5 dias dão 1 inteira + 1 parcial de 2 turnos; 9 dão 2 inteiras; 10 dão 2 inteiras; resto 4 vira inteira.

- [ ] T002 [US1] Teste + `src/modules/regras/capacidade.ts`: turnos faltantes = `max(0, −saldoT)`; inteiras = piso(faltantes ÷ dias da fase); resto de 1 até `limiteParcial` (padrão 3, de 0 a 3) vira 1 parcial de `resto × duração do turno` horas, acima do limite vira +1 inteira; conferência final por horas acrescentando inteira até fechar (`ajustado`); `LinhaFuncao` ganha `contratarInteiras`, `parcialTurnos`, `parcialH`, `ajustado`; `contratar` continua como total de pessoas; opções `{ limiteParcial }`
- [ ] T003 [US1] Revisar, um a um, os testes antigos que conferem `contratar` e `parcialH` (`regras/capacidade.test.ts` e outros): refazer a conta à mão, atualizar só a expectativa que mudou pela regra e anotar o porquê
- [ ] T004 [US1] Teste + `src/modules/escala/cenarios.ts`: `Contratacao` com `inteiras` e `parcial { turnos, horas }`; `contratacoesDe`, `ociosidadeTotal` e `custoDasVagas` tratam inteiras e parcial; textos do Cenário 1 dizem "N inteira(s) + 1 parcial de X turnos (Y h)"
- [ ] T005 [P] [US1] Teste + `src/modules/simulacoes/vagas.ts`: `vagasSugeridas` com a mesma regra (inteiras com a jornada cheia e 1 parcial com as horas do resto)
- [ ] T006 [US1] `src/modules/escala/diagnostico.ts` e `features/diagnostico/QuadroCentral.jsx` e `Cenarios.jsx`: "contratações para passar" e o cartão do Cenário 1 mostram inteiras e parcial
- [ ] T007 [US1] Teste de integração: a mesma loja e fase mostram o mesmo número de contratações no quadro central, no Cenário 1 e nas vagas sugeridas da simulação, em `src/modules/escala/escala.routes.integration.test.ts` e `simulacoes/simulacoes.routes.integration.test.ts`
- [ ] T008 Rodar tudo (`npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit`, build do `web`) e commitar a fatia

**Checkpoint**: uma só regra de contratação em todo o sistema.

## Phase 3: Fatia 2 — US2: etapas, custo anual e percentual (P1)

**Teste independente**: etapa 1 e adicional corretos entre as duas fases; custo anual = mensal × 12; percentual confere com a conta à mão.

- [ ] T009 [US2] Teste + `src/modules/escala/etapas.ts`: etapa da fase de 42h, da fase de 40h e adicional por cargo (inteiras e horas parciais, nunca negativo)
- [ ] T010 [US2] Teste + `src/modules/escala/cenarios.ts` e `diagnostico.ts`: faturamento mensal de referência (informado, ou soma dos dias × 52 ÷ 12, ou total da base por dia da semana × 52 ÷ 12), `custoAnual` e `impactoPctFaturamento` no Cenário 1, só para o dono
- [ ] T011 [US2] Teste de integração: o Diagnóstico devolve `etapas` e os valores novos ao dono; gestor e consulta recebem etapas e contratações, sem nenhum campo em reais, em `escala.routes.integration.test.ts`
- [ ] T012 [P] [US2] Cenário 1 na tela com as duas etapas, custo mensal e anual e percentual do faturamento, em `features/diagnostico/Cenarios.jsx`
- [ ] T013 Rodar tudo e commitar a fatia

**Checkpoint**: o Cenário 1 está completo conforme o documento. Segue a spec 009 (fatias 1 a 4).

## Phase 4: Fatia 3 — US3: comparativo em tabela (P1) — só depois da spec 009, fatia 4

**Teste independente**: três colunas lado a lado, status de cada uma, destaque no de maior resultado; gestor e consulta sem linhas em reais.

- [ ] T014 [US3] Teste + `src/modules/escala/comparativo.ts`: colunas dos cenários 1, 2 e 3 com contratações, horas abertas, status (`viavel`, `nao_recomendado`, `inviavel`, nulo sem dados), alertas e, para o dono, custo de folha mensal, margem, resultado líquido em relação a hoje e percentual do faturamento; destaque igual ao do selo
- [ ] T015 [US3] Teste + `diagnostico.ts`: `cenarios.r42.comparativo` e `cenarios.r40.comparativo`; teste de integração dos status (viável, não recomendado, inviável, sem dados) e das permissões
- [ ] T016 [P] [US3] `features/diagnostico/Comparativo.jsx`: tabela lado a lado com o destaque, ligada em `Diagnostico.jsx` acima dos cartões; célula que diz o que falta quando não há dado

**Checkpoint**: dá para escolher entre os caminhos numa tabela só.

## Phase 5: Fatia 4 — US4 e fechamento: premissas para simular (P2)

**Teste independente**: mudar a margem e recalcular; recarregar e ver os valores originais; valores fora da faixa são recusados.

- [ ] T017 [US4] Teste + `src/modules/escala/premissas.ts`: validar `recaptura` (0–30), `margemPct` (0–100), `fatorDiaNovo` (0–100), `diasProtegidos` (0–6), `limiteParcial` (0–3), com mensagens em português
- [ ] T018 [US4] `escala.routes.ts` e `escala.schemas.ts`: query de premissas no Diagnóstico; a entrada dos cenários e a regra de contratação usam as premissas; a resposta devolve as premissas em uso (a margem só ao dono); teste de integração: nada é gravado, 400 fora da faixa, dono × demais
- [ ] T019 [P] [US4] `features/diagnostico/Premissas.jsx` (campos e "Recalcular") e `EscalaPage.jsx` guardando as premissas e recarregando o Diagnóstico
- [ ] T020 Permissões ponta a ponta com dono, gestor e consulta (comparativo, premissas, custos) conferidas na tela
- [ ] T021 Conferir a loja 001 (os números mudam; registrar os novos e explicar a diferença) e o README com as regras novas; `quickstart.md` conferido
- [ ] T022 Rodar tudo: `npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit`, build do `web`, `scripts/sync-templates.sh --check`, `scripts/check-repo.sh`

## Dependências

- T001 antes de tudo; Fatia 1 antes da Fatia 2.
- Fatia 3 só depois da spec 009 fatia 4 (precisa dos cenários 2 e 3 por dia e do status "não recomendado").
- Fatia 4 usa a recaptura da spec 009 (entra pelas premissas).
