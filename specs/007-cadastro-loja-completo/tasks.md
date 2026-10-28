# Tasks: Cadastro de loja completo (dados, faturamento e equipe)

**Input**: `specs/007-cadastro-loja-completo/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos (validação de CNPJ/CPF, conversão de carga, montagem das vendas do cadastro, permissões, rotas e diagnóstico sem base).
Formato: `[ID] [P] [US] descrição com caminho`. Caminhos do backend relativos a `backend/node/`, do front a `frontend/react/`.
Segurança do banco: nada de `down -v`, `prisma migrate reset` nem apagar volume; só `prisma migrate deploy`/`dev` com migration nova.

## Phase 1: Setup

- [X] T001 Conferir o branch `feat/cadastro-loja-completo`, o ambiente de pé (`docker compose ps` saudável) e os testes atuais verdes (`npm test`, `npm run test:integration`)

## Phase 2: Fundação (bloqueia as histórias)

- [X] T002 Migration única e `prisma/schema.prisma`: `lojas.cidade`, `lojas.regime_tributario`, `lojas.faturamento`; `funcionarios.carga_mensal_h`, `entrada`, `saida`, `dias`; (sem índice único de CPF no banco: dados antigos podem ter repetidos; a regra fica no serviço, T018); copiar o `regimeTributario` de `custos` para a coluna nova (mapeando os três textos conhecidos) e removê-lo de `custos`; gerar o client
- [X] T003 [P] Teste + `src/modules/cadastros/documentos.ts`: validar CNPJ e CPF (dígitos verificadores), lista de UF, mascarar CPF
- [X] T004 [P] Teste + `src/modules/cadastros/carga.ts`: mensal ↔ semanal (÷5, arredondado), horas decimais ↔ "HH:MM", saída ≤ entrada vira o dia

## Phase 3: US1 — Dados da loja (P1) 🎯 MVP

**Teste independente**: criar a loja com todos os campos, reabrir e ver tudo gravado; dado inválido é recusado em português.

- [X] T005 [US1] Teste + `cadastros.schemas.ts`, repositório e serviço: `cidade`, `regimeTributario` (`simples` | `presumido` | `real` | nulo), CNPJ e UF validados; auditoria ao editar
- [X] T006 [US1] `custos.schemas.ts` deixa de aceitar `regimeTributario`; `GET` de custos continua sem ele; ajustar `custos.routes.integration.test.ts`
- [X] T007 [US1] Planilha: colunas opcionais `Cidade` e `Regime_Tributario` (sinônimos em `planilhas/campos.ts`), modelo atualizado, planilha antiga ainda aceita, em `src/modules/cadastros/processar.ts` (+ teste)
- [X] T008 [US1] Teste de integração: criar/editar/listar loja com os campos novos; CNPJ/UF inválidos; loja antiga sem cidade continua abrindo, em `cadastros.routes.integration.test.ts`
- [X] T009 [P] [US1] `src/features/cadastros/FormLoja.jsx`: campos cidade, bandeira (rótulo novo), regime (três opções + não informado) junto do editor de horário atual; `Custos.jsx` perde o seletor de regime e mostra o valor vindo da loja

**Checkpoint**: loja descrita por inteiro, com regime em um só lugar.

## Phase 4: US2 — Faturamento (P1)

**Teste independente**: preencher sete dias, mensal e margem, salvar, reabrir; gestor e consulta nunca recebem o campo.

- [ ] T010 [US2] Teste + schema do `faturamento` (sete valores ≥ 0 ou nulos, mensal ≥ 0, margem 0–100) e gravação só para `TENANT_ADMIN` (gestor enviando recebe 403; leitura sem o campo para os demais), em `cadastros.schemas.ts` e serviço
- [ ] T011 [US2] Planilha: colunas opcionais `Fat_Seg`…`Fat_Dom`, `Fat_Mensal`, `Margem_Pct`; só o dono grava via planilha, em `processar.ts` (+ teste)
- [ ] T012 [US2] Teste de integração: gravar e reler o faturamento como dono; ausência do campo para gestor e consulta, em `cadastros.routes.integration.test.ts`
- [ ] T013 [P] [US2] `src/features/cadastros/FaturamentoLoja.jsx`: sete dias, mensal, margem %, conferência "soma dos dias × 52/12" sem bloquear; só aparece para o dono; ligado ao `FormLoja.jsx`

**Checkpoint**: a loja guarda o faturamento.

## Phase 5: US4 — Diagnóstico sem base comercial (P1)

**Teste independente**: loja sem base e com faturamento: os cenários 2, 3 e 4 aparecem com venda estimada e aviso de origem; enviar a base muda a origem; resultados de quem já tem base não mudam.

- [ ] T014 [US4] Teste + `src/modules/escala/vendas-cadastro.ts`: faturamento → `VendaLinha[]` numa semana de referência (cada dia dividido igualmente entre as horas abertas, usando a mesma função de horas abertas do diagnóstico, 24 horas e virada de dia incluídas); só mensal = mensal × 12 ÷ 52 ÷ dias abertos; margem = venda × %; dia fechado sem linhas
- [ ] T015 [US4] Teste + `diagnostico.ts` e `escala.service.ts`: origem base > cadastro > nenhuma, `origemVendas` na resposta; com origem `cadastro`, `vendas.top` e `maiorVendaDescoberta` nulos e sem o aviso de "horário de maior venda"; gestor/consulta sem valores em reais
- [ ] T016 [US4] Teste de integração: diagnóstico sem base e com faturamento (cenários 2–4 calculados); com base (base vence); sem nenhum dos dois; resultados atuais inalterados, em `escala.routes.integration.test.ts`
- [ ] T017 [P] [US4] Textos e origem na tela: "estimativa a partir do faturamento cadastrado (distribuído igualmente nas horas abertas)", "informe o faturamento da loja no Cadastro" no lugar de "envie a base comercial", base marcada como opcional, em `QuadroCentral.jsx`, `Cenarios.jsx` e `EnviarPlanilhas.jsx`

**Checkpoint**: o Diagnóstico funciona sem subir a base.

## Phase 6: US3 — Equipe dentro da loja (P1)

**Teste independente**: abrir uma loja, adicionar dois funcionários completos, reabrir, remover um e ver que sai da lista e da escala.

- [ ] T018 [US3] Teste + schema/serviço de funcionário: `cargaMensalH` (deriva a semanal; quem só tem semanal mostra mensal = semanal × 5), `entrada`, `saida`, `dias`, CPF validado e único por loja (409 `CPF_DUPLICADO`), saída ≠ entrada (422), em `cadastros.schemas.ts` e serviço
- [ ] T019 [US3] CPF mascarado nas respostas para consulta e fora dos logs, em serviço e rota (+ teste)
- [ ] T020 [US3] Teste + `escala.service.ts`: funcionário sem turno vindo da carga e com entrada, saída e dias vira turno atual do diagnóstico; carga importada vence, divergência vira aviso
- [ ] T021 [US3] Planilha: colunas opcionais `Carga_Mensal`, `Entrada`, `Saida`, `Dias`, em `processar.ts` (+ teste); modelo atualizado
- [ ] T022 [US3] Teste de integração: criar, editar, remover funcionário; CPF repetido e inválido; permissões por perfil; mesmo diagnóstico de antes para quem só tem carga semanal, em `cadastros.routes.integration.test.ts`
- [ ] T023 [P] [US3] `src/features/cadastros/EquipeLoja.jsx` dentro de `FormLoja.jsx`: lista com busca por nome ou cargo, adicionar/editar/remover ali mesmo, carga mensal com a semanal equivalente e aviso se fora de 42h/40h, entrada/saída e dias

**Checkpoint**: loja e equipe cadastradas no mesmo lugar.

## Phase 7: Fechamento

- [ ] T024 Permissões ponta a ponta com dono, gestor e consulta (faturamento ausente, CPF mascarado, regime visível), conferido na tela
- [ ] T025 Conferir que lojas e funcionários já cadastrados continuam com os mesmos resultados no Diagnóstico (comparar loja 001 antes e depois)
- [ ] T026 README (Cadastros, faturamento como fonte de venda, base opcional, regime, limites da estimativa igual por hora) e `specs/007-.../quickstart.md` conferido
- [ ] T027 Rodar tudo: `npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit`, build do `web`, `scripts/sync-templates.sh --check`, `scripts/check-repo.sh`

## Dependências

- T002 antes de tudo; T003 e T004 em paralelo com ele.
- US1 → US2 → US4 (a venda do cadastro precisa do faturamento). US3 só depende da fundação e pode vir depois de US1.
- Entrega em ordem: US1, US2, US4, US3, fechamento (cada fatia termina com os testes verdes).
