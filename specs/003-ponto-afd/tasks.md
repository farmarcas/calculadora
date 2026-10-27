# Tasks: Gerenciar a escala com o ponto (AFD)

**Input**: `specs/003-ponto-afd/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos (leitor de AFD, apuração, rotas, permissões, idempotência). Só arquivos **fictícios**.
Formato: `[ID] [P] [US] descrição com caminho`. Caminhos do backend relativos a `backend/node/`, do front a `frontend/react/`.

## Phase 1: Setup

- [x] T001 **Conferir o layout do AFD** com o texto oficial da Portaria MTP 671/2021 (e, se houver, um arquivo real de um associado): campos, posições, fuso, verificador. Registrar a tabela de campos em `specs/003-ponto-afd/layout-afd.md`
- [ ] T002 [P] Migration: tabelas `importacoes_ponto` e `batidas` (índice único loja + CPF + data + minuto) e coluna `alertas` em `lojas`, em `prisma/schema.prisma` e `prisma/migrations/`
- [ ] T003 [P] Middleware/permissão do Gerenciar (exige simulação em uso; erro `SEM_SIMULACAO_EM_USO`) em `src/modules/ponto/`

## Phase 2: Fundação

- [ ] T004 Tabela única do layout (campos e posições) e criador de AFD fictício (com atraso, hora extra, falta, CPF desconhecido, CNPJ de fora, arquivo truncado) em `src/modules/ponto/afd.layout.ts` e `afd.fake.ts`
- [ ] T005 [P] Utilitários: máscara de CPF, validação de CPF e CNPJ, conversão de data e hora em `src/modules/ponto/util.ts` + testes

## Phase 3: US1 — Importar o ponto (P1) 🎯 MVP

**Teste independente**: importar um AFD fictício duas vezes sem duplicar; recusar CNPJ de fora.

- [ ] T006 [US1] Teste + leitor do AFD (cabeçalho, marcações, verificador, rejeição do arquivo inteiro se inválido, número da linha no erro) em `src/modules/ponto/afd.ts` e `afd.test.ts`
- [ ] T007 [US1] Repositório: gravar importação e batidas em lote com `ON CONFLICT DO NOTHING`, contar aceitas/repetidas/pendentes, em `src/modules/ponto/importacao.repository.ts`
- [ ] T008 [US1] Service: casar CNPJ → loja (recusa fora do grupo), CPF → pessoa, marcar pendências (`cpf_desconhecido`, `sem_lotacao`, `dia_sem_escala`), vários arquivos, log e auditoria, em `src/modules/ponto/importacao.service.ts`
- [ ] T009 [US1] Rotas `POST/GET /lojas/:id/ponto/importacoes` (upload múltiplo, só dono e gestor) em `src/modules/ponto/importacao.routes.ts` e registro no `app.ts`
- [ ] T010 [US1] Teste de integração: idempotência, CNPJ de fora, arquivo inválido, sem simulação em uso, permissões, em `src/modules/ponto/importacao.routes.integration.test.ts`
- [ ] T011 [P] [US1] Aba "Gerenciar" no `EscalaPage` e tela Importar (envio de vários arquivos, resultado por arquivo, log) em `src/features/gerenciar/`

**Checkpoint**: o ponto entra no sistema e fica no histórico.

## Phase 4: US2 — Pendências (P2)

**Teste independente**: um CPF desconhecido vira pendência, é vinculado e entra na apuração.

- [ ] T012 [US2] Service e repositório de pendências: listar (CPF mascarado), vincular, ignorar com motivo obrigatório, confirmar trabalho em folga, cadastrar CPF e resolver em lote, com auditoria, em `src/modules/ponto/pendencias.*`
- [ ] T013 [US2] Rotas de pendências conforme `contracts/api.md` em `src/modules/ponto/pendencias.routes.ts`
- [ ] T014 [US2] Teste de integração: fluxo vincular, ignorar sem motivo recusado, cadastro de CPF em lote, CPF nunca devolvido por inteiro, em `src/modules/ponto/pendencias.routes.integration.test.ts`
- [ ] T015 [P] [US2] Tela Pendências (fila, filtros por motivo, vincular, ignorar, cadastrar CPF) em `src/features/gerenciar/Pendencias.jsx`

## Phase 5: US3 — Apuração planejado × realizado (P3)

**Teste independente**: com um AFD onde uma pessoa chega 30 min atrasada e sai 1h depois, conferir atraso, hora extra e aderência.

- [ ] T016 [P] [US3] Teste + calendário planejado a partir da simulação em uso (vigência, semana cíclica, simulação substituída respeita as datas) em `src/modules/apuracao/calendario.ts`
- [ ] T017 [P] [US3] Teste + apuração do dia (atraso, saída antecipada, falta, intervalo reduzido, hora extra, trabalho em folga, descanso entre jornadas, batidas incompletas, tolerância) em `src/modules/apuracao/dia.ts`
- [ ] T018 [US3] Teste + apuração do período (aderência, hora extra por função e dia, faltas, atrasos, cobertura realizada × necessária, causa provável) em `src/modules/apuracao/periodo.ts`
- [ ] T019 [US3] Service e rotas `apuracao/pessoas`, `apuracao/loja`, `apuracao/exportar.xlsx` (rótulo gerencial em tudo; pessoa e batida só para dono e gestor; exportação na auditoria) em `src/modules/apuracao/`
- [ ] T020 [US3] Teste de integração: valores conferem com o cálculo manual, consulta vê só o agregado, rótulo presente nas respostas e no Excel, em `src/modules/apuracao/apuracao.routes.integration.test.ts`
- [ ] T021 [P] [US3] Telas Apuração por pessoa (dia a dia) e por loja (aderência, hora extra, cobertura), com o rótulo visível, em `src/features/gerenciar/Apuracao.jsx`

## Phase 6: US4 — Painel e alertas (P4)

**Teste independente**: hora extra acima do limite por duas semanas seguidas marca a simulação em uso como desatualizada.

- [ ] T022 [US4] Limites de alerta por loja (padrão 5% de hora extra por 2 semanas seguidas, aderência mínima 90%) com rotas `gerenciar/limites` em `src/modules/apuracao/limites.*`
- [ ] T023 [US4] Painel: simulação em uso e vigência, última importação, pendências abertas, aderência e hora extra do período, tendência por semana, em `src/modules/apuracao/painel.ts` e rota
- [ ] T024 [US4] "Desatualizada" passa a somar hora extra recorrente e aderência baixa, sem alterar nada automaticamente, em `src/modules/simulacoes/simulacoes.service.ts`
- [ ] T025 [US4] Teste de integração do painel e dos alertas em `src/modules/apuracao/painel.routes.integration.test.ts`
- [ ] T026 [P] [US4] Tela Painel (resumo, tendência, alertas, atalho "clonar e resimular", mensagem para loja sem ponto) e edição de limites em `src/features/gerenciar/Painel.jsx`

## Phase 7: Fechamento

- [ ] T027 [P] Comando `npm run afd:exemplo` (gera arquivos AFD fictícios) e dados de exemplo de ponto no seed, em `package.json` e `prisma/seed.ts`
- [ ] T028 Rodar `quickstart.md` de ponta a ponta com o ambiente de pé; `npm test`, `npm run test:integration`, `npm run lint`, builds da API e da tela
- [ ] T029 [P] Sincronizar `templates/`, atualizar o README e a lista de pendências conhecidas (ausências, trocas, vendas reais, layout antigo por PIS)
- [ ] T030 Marcar as tarefas concluídas, commitar e abrir a pull request

## Dependências

T001 primeiro (o layout define o leitor). Setup → Fundação → US1 → US2 → US3 → US4 → Fechamento. T016 e T017 (funções puras) podem andar em paralelo com US1/US2. US1 sozinha já entrega valor (o ponto entra e fica no histórico).
