# Tarefas: CMV no Cadastro e na base comercial, no lugar da margem

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node`, tela em `frontend/react/src`. Cada fatia termina com os testes passando e um commit. A limpeza (migration) só é aplicada no banco local depois de um backup e do seu aval. Numa loja sem CMV, todos os números têm que ficar idênticos aos de uma loja sem margem.

## Fatia 1 — Banco e limpeza (História 3, P1)
- [x] T001 [US3] Backup: gerar um dump do banco local (`pg_dump`) numa pasta fora do repositório e dizer onde ficou; nada é aplicado antes
- [x] T002 [US3] `prisma/schema.prisma`: `VendaHora.margem` vira `cmv Float?` (mapeado para a coluna `cmv`); regenerar o client
- [x] T003 [US3] `prisma/migrations/<data>_cmv_no_lugar_da_margem/migration.sql`: renomear `vendas_hora.margem` para `cmv`, tirar o NOT NULL e gravar NULL em todas as linhas (inclusive de bases inativas); remover a chave `margemPct` do JSON `lojas.faturamento` onde existir; idempotente; nenhuma outra coluna ou tabela tocada
- [x] T004 [P] [US3] Teste de integração da migration: antes (bases com margem e lojas com `margemPct`) e depois (CMV nulo em todas as linhas, `margemPct` ausente), com venda, clientes, unidades, datas, horas, faturamento por dia e mensal, simulações, equipe e custos idênticos; rodar de novo não muda nada
- [x] T005 Rodar os testes do servidor e commitar a fatia (sem aplicar a migration no banco local ainda)

## Fatia 2 — Importação do CMV (Histórias 1 e 2, P1)
- [x] T006 [US2] `planilhas/campos.ts`: base comercial com a coluna "CMV (R$)" (sinônimos: cmv, custo da mercadoria, cmv bruto), opcional; a coluna "Margem bruta (R$)" antiga continua entendida e ignorada
- [x] T007 [P] [US1] `planilhas/campos.ts`: planilhas de lojas e de Cadastro com a coluna "CMV médio (%)" (sinônimos: cmv médio, cmv %, cmv pct) no lugar da margem; a margem antiga entendida e ignorada, sem erro e sem aviso de coluna desconhecida
- [x] T008 [US2] `escala/interpretar.ts`: ler o CMV da base (nulo quando a coluna não vem; soma por hora só quando veio); `escala/escala.repository.ts`: guardar o CMV e entregar a cada linha de venda o lucro bruto (venda − CMV, ou nulo sem CMV); `escala/vendas.ts` e `vendas-cadastro.ts`: a linha passa a ter `margem: number | null`
- [x] T009 [P] [US1] Testes de importação: base com e sem a coluna de CMV; base antiga com margem importa sem erro e a coluna é ignorada; planilha de lojas com "CMV médio (%)" preenche o campo
- [x] T010 Rodar os testes do servidor e commitar a fatia

## Fatia 3 — O cálculo usa o CMV (História 4, P1)
- [x] T011 [US4] `escala/regua.ts`: `reguaDaBase(linhas, cmvMedioPct?)` preenche as horas sem CMV com venda × (1 − CMV médio) antes de decidir; sem CMV médio vale a regra de hoje (soma positiva, 90% de cobertura, nenhuma hora com CMV maior que a venda); aceitar `margem` nula; motivos `sem_margem`, `margem_parcial` e `margem_incoerente` com a mesma lógica
- [x] T012 [US4] `escala/diagnostico.ts` e `simulacoes/resultado.ts`/`simulacoes.service.ts`: passar o CMV médio da loja (do faturamento) à régua; travas, peso no faturamento, venda por hora e clientes seguem em venda real
- [x] T013 [P] [US4] Testes de unidade (`regua.test.ts`, `resultado.test.ts`, `cenarios.test.ts`): CMV da hora, CMV médio como padrão (venda R$ 1.000, CMV 65% = R$ 350), sem CMV nem CMV médio mede em venda, CMV maior que a venda cai em venda, CMV médio 0% e 100%
- [x] T014 [US4] Testes de integração: loja só com CMV médio, loja com CMV por hora, loja sem nada (números iguais aos de antes); o saldo do painel, o da lista e o da comparação iguais; gestor sem nenhum valor de CMV
- [x] T015 Rodar os testes do servidor (unidade e integração), reiniciar a API e commitar a fatia

## Fatia 4 — Campo no Cadastro (História 1, P1)
- [x] T016 [US1] `cadastros/faturamento.ts` e `cadastros.*`: o faturamento guarda `cmvPct` (0 a 100 ou vazio); fora da faixa é recusado em português; só o dono grava e recebe; o que vier de `margemPct` é ignorado; faturamento limpo e `cmvPct` guardado seguem a mesma regra de preservação de hoje
- [ ] T017 [US1] Tela: campo "CMV médio (%)" na aba de faturamento do Cadastro (só dono), com a explicação "Parte da venda líquida que volta ao fornecedor como custo da mercadoria"; validação de 0 a 100 igual ao servidor; nenhuma menção à palavra "margem" no campo
- [ ] T018 [P] [US1] Testes: o dono grava e reabre 65; 120 e −5 recusados; gestor e consulta não recebem o campo; testes da tela
- [ ] T019 Rodar os testes (servidor e tela), conferir no navegador e commitar a fatia

## Fatia 5 — Validação, limpeza no banco local e entrega
- [ ] T020 Mostrar o backup (T001) e pedir o seu aval; aplicar a migration no banco local e conferir que não há margem em lugar nenhum e que vendas e clientes não mudaram (contagens e somas antes e depois)
- [ ] T021 Percorrer o `quickstart.md` no navegador local (CMV médio, base com CMV por hora, planilha antiga, perfis)
- [ ] T022 Reiniciar a API, rodar tudo (servidor, integração, tela, type-check), commitar e subir a branch `feat/cmv-no-cadastro`

## Dependências e ordem
- T002 e T003 antes de T004 e de toda a Fatia 2; T008 antes de T011.
- A Fatia 3 depende das Fatias 1 e 2; a Fatia 4 depende só do servidor da Fatia 2 (campo `cmvPct`) e pode andar junto da Fatia 3.
- T020 só depois de todas as outras fatias e do seu aval.

## Estratégia
Primeiro o banco e a prova de que a limpeza só toca a margem; depois a importação, o cálculo e o campo do Cadastro, sempre provando que numa loja sem CMV os números não mudam. Só no fim a limpeza roda no banco local, com backup e aval.
