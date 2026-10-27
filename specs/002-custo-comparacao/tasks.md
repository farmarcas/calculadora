# Tasks: Vagas simuladas e custo na comparação

**Input**: `specs/002-custo-comparacao/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos (conta do custo, avaliação com vagas, rotas e permissões).
Formato: `[ID] [P] [US] descrição com caminho`. [P] = pode ir em paralelo. Caminhos do backend relativos a `backend/node/`, do front a `frontend/react/`.

## Phase 1: Setup

- [ ] T001 Criar o branch de trabalho a partir do estado atual e conferir o ambiente de pé (`docker compose ps` saudável, `npm test` verde)

## Phase 2: Fundação

- [ ] T002 Migration: coluna `custos` (JSON, nula) em `lojas`, em `prisma/schema.prisma` e `prisma/migrations/`
- [ ] T003 [P] Ampliar o tipo de pessoa da simulação (`vaga`, `desligado`) em `src/modules/simulacoes/avaliar.ts` e nos tipos do repositório

## Phase 3: US1 — Vagas e desligamentos simulados (P1) 🎯 MVP

**Teste independente**: adicionar vaga de Atendimento de 24h num rascunho, dar turnos, ver a cobertura mudar e o cadastro intacto.

- [ ] T004 [US1] Teste + avaliação ignorando desligados (e seus turnos), vaga valendo como pessoa com limite = carga da vaga, aviso de vaga sem turnos, em `src/modules/simulacoes/avaliar.ts` e `avaliar.test.ts`
- [ ] T005 [US1] Schema Zod: `vagas` (função, carga 4–44h em passos de 4, máx. 20) e `desligados` em `src/modules/simulacoes/simulacoes.schemas.ts`
- [ ] T006 [US1] Service: montar o quadro com vagas numeradas (`VAGA-n`) e desligados, apagar turnos de vaga removida, só em rascunho, com auditoria, em `src/modules/simulacoes/simulacoes.service.ts`
- [ ] T007 [US1] Teste de integração: adicionar/remover vaga, desligar, cadastro sem alteração, congelar ao gravar, em `src/modules/simulacoes/simulacoes.routes.integration.test.ts`
- [ ] T008 [P] [US1] Painel de vagas e desligamentos na simulação (adicionar, remover, desligar/desfazer) em `src/features/grade/Vagas.jsx` e `Simulacao.jsx`
- [ ] T009 [US1] Grade e tabela da semana mostrando vagas ("Vaga 1 · Atendimento") e desligados esmaecidos em `src/features/grade/Grade.jsx` e `Simulacao.jsx`
- [ ] T010 [US1] Atalho "simular esta contratação": `comVagasSugeridas` na criação (service + schema) e botão no diagnóstico, em `src/modules/simulacoes/` e `src/features/diagnostico/Diagnostico.jsx`

**Checkpoint**: dá para testar "e se eu contratar?" sem custo ainda.

## Phase 4: US2 — Custos da loja (P2)

**Teste independente**: o dono informa os valores e eles ficam salvos; o gestor não vê nem edita.

- [ ] T011 [US2] Schema Zod e rotas `GET/PUT /lojas/:id/custos` só `TENANT_ADMIN`, com auditoria sem valores, em `src/modules/custos/`
- [ ] T012 [US2] Teste de integração: dono salva e lê, gestor e consulta recebem 403, valores inválidos recusados, em `src/modules/custos/custos.routes.integration.test.ts`
- [ ] T013 [P] [US2] Card "Custos" na Configuração, visível só para o dono (salário médio por função, encargos, regime) em `src/features/diagnostico/Configuracao.jsx` e `src/features/diagnostico/Custos.jsx`

## Phase 5: US3 — Custo na comparação (P3)

**Teste independente**: comparar uma simulação sem vaga com outra com vaga de 24h e conferir a diferença com a conta manual.

- [ ] T014 [US3] Teste + conta pura do custo (pessoa do cadastro, vaga proporcional pelo divisor 220/210/200, encargos, funções sem salário) em `src/modules/custos/custo.ts` e `custo.test.ts`
- [ ] T015 [US3] Congelar os custos nas premissas ao gravar e usar o snapshot nas gravadas, em `src/modules/simulacoes/simulacoes.service.ts`
- [ ] T016 [US3] Comparação: bloco `custo` (mensal, anual, por função, diferença frente à em uso, memória) só para `TENANT_ADMIN`, e síntese citando custo e vagas, em `src/modules/simulacoes/comparar.ts` e o service
- [ ] T017 [US3] Teste de integração: valores conferem com a conta manual, bloco ausente para quem não é dono, aviso quando custos não informados, em `src/modules/simulacoes/simulacoes.routes.integration.test.ts`
- [ ] T018 [P] [US3] Linhas de custo e aviso "informe os custos" na tela de comparação, com "como foi calculado" e rótulo de estimativa gerencial, em `src/features/grade/Comparar.jsx`

## Phase 6: Fechamento

- [ ] T019 Rodar `quickstart.md` de ponta a ponta com o ambiente de pé; `npm test`, `npm run test:integration`, `npm run lint`, builds da API e da tela
- [ ] T020 [P] Sincronizar `templates/` (`scripts/sync-templates.sh`), atualizar o README e a seção de pendências conhecidas
- [ ] T021 Marcar as tarefas concluídas, commitar e abrir a pull request

## Dependências

Fundação → US1 → US2 → US3 → Fechamento. US2 pode andar em paralelo com US1 (arquivos diferentes), mas US3 precisa das duas. US1 sozinha já entrega valor.
