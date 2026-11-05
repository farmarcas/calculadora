# Tarefas: Retirar "Marcar como em uso" da Simulação

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node`, tela em `frontend/react/src/features`. Cada fatia termina com os testes passando e um commit. **Nada é apagado do banco**; a migration só troca o estado.

## Fatia 1 — Servidor sem aprovar, sem "em uso" e com comparação simples (Histórias 1, 2 e 3, P1)
- [x] T001 [US3] `prisma/migrations/<data>_simulacoes_sem_em_uso/migration.sql`: `UPDATE simulacoes SET status = 'gravada' WHERE status IN ('em_uso', 'substituida')`, só dados, sem mudar a estrutura; aplicar no banco local e conferir antes e depois (contagem por estado e total de simulações)
- [x] T002 [US1] `simulacoes/simulacoes.repository.ts`: o tipo `SimulacaoStatus` passa a `'rascunho' | 'gravada' | 'descartada'`; o mapeamento do banco trata `em_uso` e `substituida` (se aparecerem) como `gravada`; sai `aprovar` e `emUso`; as colunas de aprovação deixam de ser lidas e escritas
- [x] T003 [US1] `simulacoes/simulacoes.service.ts`, `simulacoes.routes.ts` e `simulacoes.schemas.ts`: saem `aprovar` e a rota `POST /simulacoes/:id/aprovar` (e `aprovarReq`), a checagem `desatualizacao` e os campos `desatualizada` e `motivosDesatualizada` das respostas, e a guarda `SIMULACAO_EM_USO` de descartar; qualquer simulação não descartada pode ser descartada
- [x] T004 [US2] `simulacoes/simulacoes.service.ts` (`comparar`) e `simulacoes/comparar.ts`: a comparação usa só as simulações escolhidas (sem incluir a "em uso"); saem `referenciaId`, `referencia`, `podeAprovar` e `custo.diferencaMensalFrenteEmUso`; `sintese` descreve só a própria simulação (cobertura, horas, vagas, o que falta) e, com erro, diz "tem N erro(s) nas regras", sem "aprovar" nem "frente à em uso"
- [x] T005 Testes: `simulacoes.routes.integration.test.ts` e os testes de comparação (a rota de aprovar responde 404; descartar uma simulação funciona em qualquer estado; comparar devolve só as escolhidas, sem referência e sem diferença; síntese sem os termos extintos; criar, gravar, clonar, descartar e exportar seguem iguais); teste de integração da migration (uma simulação em `em_uso` e outra em `substituida` inseridas direto viram `gravada` com os mesmos dados); ajustar `isolamento.integration.test.ts` e os demais que citavam o estado
- [x] T006 Rodar os testes do servidor (unidade e integração) e commitar a fatia

## Fatia 2 — Tela sem "em uso" (Histórias 1, 2 e 3)
- [x] T007 [US1] `simulacao/SimulacaoPage.jsx`: sai o botão "Marcar como em uso", o estado `aprovando`, a janela `Aprovar` e o aviso "Simulação em uso desatualizada"; apagar `grade/Aprovar.jsx`; `simulacao/PainelResultado.jsx`: sem a frase "Simulação em uso" (para simulação gravada, texto neutro)
- [x] T008 [US1] `grade/GradeTab.jsx`: o mapa de estados fica com Rascunho, Gravada e Descartada; sai a linha de vigência da lista e o que dependia de `em_uso`
- [x] T009 [US2] `grade/Comparar.jsx`: sai a referência (sem coluna ou marca de "referência"), a linha "Diferença mensal frente à em uso" e os textos sobre "em uso"; o subtítulo explica só que compara as simulações escolhidas; o mapa de estados sem os extintos
- [x] T010 Testes da tela (lógica pura de estados e textos, se houver) e uma busca no código da tela que confirma que não restam "Marcar como em uso", "Aprovar", "Em uso", "Substituída" nem "desatualizada" ligados à Simulação; rodar os testes da tela e commitar a fatia

## Fatia 3 — Validação e entrega
- [x] T011 Percorrer o `quickstart.md` no ambiente local (contagem de simulações e estados antes e depois, tela da simulação, lista, comparação de duas simulações, rota de aprovar em 404, Diagnóstico e Cadastro com os mesmos números)
- [x] T012 Reiniciar a API (aplica a migration), rodar tudo (servidor, integração e tela), type-check; commitar e subir a branch `feat/retirar-simulacao-em-uso`

## Dependências e ordem
- A Fatia 1 vem antes da 2: a tela deixa de chamar a rota de aprovar só depois de ela sair, e a API já devolve os estados novos.
- T001 pode andar junto de T002–T004; T005 depois de T001–T004.
- T008 e T009 são independentes entre si (arquivos diferentes).

## Estratégia
Primeiro o servidor e os dados (com a migration), depois a tela. A migration só troca estado, então é segura e reversível; nenhuma coluna de aprovação é apagada.
