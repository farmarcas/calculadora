# Tasks: Sistema multiempresário por GE

**Input**: `specs/011-multitenant-ge/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos (CNPJ, leitura e comparação do Excel, conflitos, isolamento entre dois GEs em todas as rotas, permissões, migração sem perda).
Formato: `[ID] [P] [US] descrição com caminho`. Caminhos do backend relativos a `backend/node/`, do front a `frontend/react/`.
Segurança do banco: uma migration nova que só acrescenta e preenche; nunca `down -v`, `docker volume rm`, `docker system prune` nem `prisma migrate reset`.

## Phase 1: Setup

- [X] T001 Conferir o branch `feat/multitenant-ge`, o ambiente de pé (`docker compose ps` saudável) e os testes atuais verdes (`npm test`, `npm run test:integration`); anotar as contagens de partida (lojas, funcionários, simulações, importações, auditoria) e o diagnóstico da loja 001 em `specs/011-multitenant-ge/contagens-antes.md`

## Phase 2: Fatia 1 — Banco e GE inicial (base de tudo) 🎯

**Teste independente**: depois da migration, as contagens e o diagnóstico da loja 001 são iguais aos de antes, e tudo está no "Grupo inicial".

- [X] T002 `prisma/schema.prisma`: modelo `GrupoEconomico`; `geId` em `Loja`, `ImportacaoCadastro` e `Auditoria` (esta opcional); `ultimaCarga` (Json) em `Loja`; `tipo` em `ImportacaoCadastro`
- [X] T003 Migration `prisma/migrations/20261029120000_multitenant_ge/migration.sql` escrita à mão: cria `grupos_economicos`, insere o GE inicial com id fixo, adiciona `ge_id` aceitando vazio, preenche com o GE inicial, depois NOT NULL e chave estrangeira; índice único parcial `(ge_id, codigo)` entre lojas ativas; índice único parcial de `cnpj` entre ativas com valor; índice único de `identificacao`; aplicar com `prisma migrate deploy` e `prisma generate`
- [X] T004 Conferir contra T001: mesmas contagens, loja 001 com o mesmo diagnóstico, nada fora do GE inicial; registrar em `contagens-antes.md`
- [X] T005 Preparar os testes de integração: ajudante de teste que cria GEs e manda `X-GE`; `beforeEach` limpa também `grupos_economicos` (exceto o inicial) em `src/shared/testing/ge.ts`
- [X] T006 Rodar tudo e commitar a fatia

**Checkpoint**: o banco já conhece o GE e nada mudou para quem usa.

## Phase 3: Fatia 2 — US1: cada empresário enxerga só o seu GE (P1) 🎯 MVP

**Teste independente**: com dois GEs, nenhuma rota devolve dado do outro, nem por endereço direto.

- [X] T007 [US1] Teste + `src/shared/middlewares/perfil.ts`: perfil `PLATFORM_OPERATOR`; `src/shared/middlewares/ge.ts`: lê `X-GE`, confere se existe e está ativo, põe `geId` em `res.locals`; erros `GE_OBRIGATORIO` (400) e `GE_INDISPONIVEL` (403); o operador sem `X-GE` só passa pelas rotas de GE
- [X] T008 [US1] `src/app.ts`: usar o contexto do GE depois do perfil; rotas de GE ficam de fora da exigência do cabeçalho
- [X] T009 [P] [US1] `src/modules/cadastros/cadastros.repository.ts` e `cadastros.service.ts`: `geId` em toda consulta e escrita de lojas, funcionários e importações; funcionário só liga a loja do GE; matrícula única dentro do GE; código único dentro do GE
- [X] T010 [P] [US1] `src/modules/escala/escala.repository.ts`, `escala.service.ts` e `escala.routes.ts`: `geId` em lojas, funcionários, cargas, diagnóstico e importações
- [X] T011 [P] [US1] `src/modules/simulacoes/simulacoes.repository.ts`, `simulacoes.routes.ts` e `custos/custos.repository.ts`: `geId` pela loja; consulta direta de funcionários da rota de simulações também filtra
- [X] T012 [P] [US1] `src/shared/auditoria/auditoria.ts`: grava o `geId` e o perfil; `parametros` continua global
- [X] T013 [US1] Teste de integração `src/shared/testing/isolamento.integration.test.ts`: dois GEs com lojas, funcionários e simulações; percorre **todas** as rotas com o GE errado e espera 404 (ou lista vazia); mesmo código de loja e mesma matrícula nos dois GEs convivem; totais, comparativos e auditoria só contam o GE de quem olha
- [X] T014 [US1] Ajustar os testes de integração existentes para rodarem dentro de um GE (ajudante da T005) sem mudar nenhuma expectativa de cálculo
- [X] T015 Rodar tudo e commitar a fatia

**Nota da fatia 2**: a matrícula única por GE exigiu uma segunda migration (`20261029130000_funcionarios_ge`, `ge_id` no funcionário). A tela já manda o GE inicial por padrão (`X-GE`) até a Fatia 5.

**Checkpoint**: separação garantida no servidor, provada rota por rota.

## Phase 4: Fatia 3 — CNPJ e permissões da loja (P1)

**Teste independente**: CNPJ inválido ou em uso é recusado; dono edita a loja menos o CNPJ; criar e remover loja só pelo operador.

- [ ] T016 [US3] Teste + `src/modules/ge/cnpj.ts`: normaliza (aceita pontuação), valida os dígitos verificadores, formata para exibir
- [ ] T017 [US3] `src/modules/cadastros/cadastros.schemas.ts` e `cadastros.service.ts`: CNPJ obrigatório e válido para loja nova; `CNPJ_EM_USO` sem revelar o GE; lojas antigas sem CNPJ aparecem como "CNPJ pendente"
- [ ] T018 [US3] `src/modules/cadastros/cadastros.routes.ts`: `POST /lojas`, `DELETE /lojas/:id` e a importação de lojas só para o operador; `PUT /lojas/:id` para dono, gestor e operador, com `CNPJ_NAO_EDITAVEL` quando o empresário tenta mudar o CNPJ; consulta só lê
- [ ] T019 [US3] Teste + `src/modules/cadastros/processar.ts`: planilha de funcionários rejeita linha de loja que não é do GE, com o motivo
- [ ] T020 [US3] Teste de integração em `cadastros.routes.integration.test.ts`: permissões por perfil, CNPJ inválido, repetido (mesmo GE e outro GE), edição de qualquer campo da loja pelo dono, empresário não cria nem remove loja
- [ ] T021 Rodar tudo e commitar a fatia

## Phase 5: Fatia 4 — US2: GE e carga de lojas por Excel (P1)

**Teste independente**: Excel com 5 CNPJs cria 5 lojas; reenviar não duplica; CNPJ inválido ou de outro GE é rejeitado; correção do empresário vira conflito.

- [ ] T022 [US2] `prisma/schema.prisma` e migration: `responsavel` no GE; `ge_id` vazio permitido nas importações de carga de lojas (ajusta T002 e T003); `src/modules/ge/ge.repository.ts`, `ge.service.ts`, `ge.schemas.ts`, `ge.routes.ts`: `GET /ge`, `GET /ge/resumo` (lojas e lojas com equipe), `POST /ge`, `PATCH /ge/:id` (renomear, desativar e reativar); só operador escreve; GE desativado não entra
- [ ] T023 [P] [US2] Teste + `src/modules/cargas-lojas/modelo-lojas.ts`: planilha modelo no formato do relatório da plataforma (aba "lojas", colunas do `research.md` item 7) com instruções; `GET /cargas-lojas/modelo`; arquivo real fica fora do git (`dados-reais/` no `.gitignore`) e os testes usam `src/modules/cargas-lojas/fixtures/` com dados **fictícios** no mesmo formato
- [ ] T024 [US2] Teste + `src/modules/cargas-lojas/comparar.ts` e `horarios-relatorio.ts`: lê o arquivo, valida colunas (`ARQUIVO_FORA_DO_MODELO`), **ignora e conta** Desativado, Montando e Transição, agrupa por "Grupo Econômico" (GE novo = identificação + responsável), converte horários (`07 - 20`; `07 - 00` = meia-noite; `00 - 00` e vazio = fechado; minutos e segundos descartados; incompleto avisa), regime Simples/Presumido/Real (vazio = pendente), e separa criar, atualizar, rejeitar (linha e motivo: CNPJ inválido ou ausente, repetido no arquivo, de outro GE) e conflitos (valor atual diferente do retrato da última carga); lista lojas do GE fora do arquivo; reaproveita a leitura de horário e faturamento do cadastro
- [ ] T025 [US2] `src/modules/cargas-lojas/carga-lojas.repository.ts`, `.service.ts`, `.routes.ts`: `POST /cargas-lojas` (conferir, sem gravar, usando `importacoes_cadastro` com tipo `carga_lojas`) e `POST /cargas-lojas/:id/confirmar` (cria os GEs novos) com `substituirConflitos` (`nenhum` por padrão, `todos` ou lista de CNPJs); grava `ultimaCarga`; auditoria da carga; uma só consulta em lote por CNPJ
- [ ] T026 [US2] Teste de integração `cargas-lojas.integration.test.ts`: 5 CNPJs criam 5 lojas; mesmo arquivo reenviado cria 0 e altera 0; cidade alterada atualiza sem duplicar; empresário corrige a cidade e o reenvio mostra conflito, mantém por padrão e substitui quando pedido; lojas fora do arquivo não são apagadas; cancelar não grava; só operador acessa
- [ ] T027 [P] [US2] Teste de volume com arquivo fictício do mesmo tamanho do real (2.800 linhas, 1.800 ativas, 490 GEs): conferir em até 60 s e gravar em até 2 min; e **conferência local** com o arquivo real, sem commitá-lo, comparando as contagens (1.810 / 879 / 114 / 1)
- [ ] T028 Rodar tudo e commitar a fatia

## Phase 6: Fatia 5 — US3 e US4: telas e fechamento (P1/P2)

**Teste independente**: no navegador, o operador cria o GE, envia o Excel e vê a conferência; o empresário vê só o seu GE, edita a loja e cadastra a equipe.

- [ ] T029 [US4] `frontend/react/src/api/client.js`: envia `X-GE` junto de `X-Perfil`; guarda o GE escolhido
- [ ] T030 [US4] `frontend/react/src/App.jsx`: perfil "Operador da plataforma", seletor de GE (lista de `GET /ge`), nome do GE sempre visível no topo, tudo recarrega ao trocar de GE; aviso de que é seleção de demonstração até o SSO
- [ ] T031 [US2] `frontend/react/src/features/ge/GruposPage.jsx` (+ componentes): lista de GEs com lojas e lojas com equipe, criar GE, desativar, baixar modelo, enviar Excel; tela de conferência com criar, atualizar, rejeitar (linha e motivo), conflitos (valor atual × planilha, com escolha) e lojas fora do arquivo; menu "Grupos" só para o operador
- [ ] T032 [US3] `frontend/react/src/features/cadastros/CadastrosPage.jsx`, `FormLoja.jsx`: sem "Nova loja", "Remover loja" e importação de lojas para quem não é operador; CNPJ só para leitura; "CNPJ pendente" nas lojas antigas; funcionários seguem editáveis; operador vê os botões de loja
- [ ] T033 [US3] `frontend/react/src/features/cadastros/ConfiguracaoLoja.jsx`: mantém a regra dos custos só para o dono; operador não vê valores em reais
- [ ] T034 Conferir no navegador (Browser): operador cria GE, envia Excel de 5 CNPJs, confere e confirma; troca para o GE B e nada do A aparece; dono do A corrige uma loja e cadastra funcionários; reenvio mostra o conflito; telas no celular
- [ ] T035 Documentação: README (como funciona o GE, papéis, carga por Excel, **aviso de que sem login a separação não protege contra quem mexa no navegador; resolver com o SSO antes de dados reais**), `scripts/sync-templates.sh`, `scripts/check-repo.sh`
- [ ] T036 Conferência final: `npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit`, build do `web`, `quickstart.md` do começo ao fim, contagens iguais às da T001; commitar

## Dependências e ordem

- Fatia 1 → 2 → 3 → 4 → 5, nessa ordem; cada uma termina com tudo verde e commit.
- Dentro da Fatia 2, T009 a T012 são independentes entre si (arquivos diferentes) e dependem de T007 e T008.
- A Fatia 4 depende do CNPJ da Fatia 3.
