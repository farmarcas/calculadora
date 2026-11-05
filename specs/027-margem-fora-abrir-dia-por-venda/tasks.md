# Tarefas: Margem fora do dia a dia e "abrir um dia" por venda

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node/src/modules`, tela em `frontend/react/src/features`. Cada fatia termina com os testes passando e um commit. Sem migration e sem apagar dado do banco.

## Fatia 1 — Preservar a margem salva e ignorá-la nas planilhas (História 3, P1)
- [x] T001 [US3] `cadastros/faturamento.ts`: `margemPct` vira opcional no `faturamentoSchema` (`.nullable().optional()`); novo helper `manterMargem(novo, atual)` que devolve o faturamento novo com o `margemPct` do `atual` (ignora o que vier no pedido; sem valor salvo, fica sem a chave); `faturamentoDaLinha` deixa de ler a coluna `margem_pct` (a coluna antiga é ignorada, sem erro de valor inválido nem de "margem acima de 100%")
- [x] T002 [US3] `cadastros/painel.ts` e `cadastros/cadastros.repository.ts` (`atualizarLoja`, usado pelo PUT da loja e pela importação): ao gravar `faturamento` (objeto), ler o faturamento atual da loja e aplicar `manterMargem`; `null` continua limpando só quando a pessoa pede explicitamente; loja nova nasce sem margem
- [x] T003 [P] [US3] `planilhas/campos.ts`: sai o campo `margem_pct` ("Margem bruta média (%)") do modelo e do mapeamento de Lojas; **fica** o campo `margem` da base comercial (continua gravado); `planilhas/modelo.ts`: o texto de ajuda do dono deixa de citar "margem"
- [x] T004 [US3] Testes: `faturamento.test.ts` (planilha com a coluna de margem, inclusive 150, importa sem erro e sem `margemPct`; `manterMargem` com e sem valor salvo); `cadastros.routes.integration.test.ts`, `painel.routes.integration.test.ts` e `lojas-ge.integration.test.ts` (salvar o faturamento sem margem mantém 30; enviar margem diferente não altera; planilha antiga com a coluna importa e não mexe na margem; o modelo baixado não tem a coluna); ajustar os testes que esperavam `margemPct`
- [x] T005 Rodar os testes do servidor (unidade e integração) e commitar a fatia

## Fatia 2 — Contas sem margem e "abrir um dia" por venda (Histórias 1 e 2, P1)
- [ ] T006 [US1] `escala/cenarios-dias.ts`: `DiaVenda`/`vendasPorDia` sem `margem` e `margemMes`; sai `melhorCombinacao` (só os testes a chamam) e o que for usado só por ele
- [ ] T007 [US1] `escala/ajustes-fim-de-semana.ts`: `ganhoDasHorasNovas` devolve só venda (sai `margemMes`); `melhorEstado` perde o parâmetro `margemMes` e o desvio sem `tabela` (`perdaPonderada`), que nunca roda porque o cenário principal exige venda por hora; ajustar o chamador em `cenarios.ts`
- [ ] T008 [US1] `escala/cenarios-extras.ts` (`montarEstender`): `estimativa` só de venda (histórico do dia, senão `fatorDiaNovo` × média dos dias abertos); candidatos ordenados por `vendaMes`, só os que a equipe cobre sem nova contratação e com venda estimada > 0; resposta com `diasAbrir[].vendaMes`, `vendaRefMes` e `saldoMensal = vendaRefMes − custoAdicionalMensal` (dono; `null` sem venda ou sem custo); saem `margemMes`, `margemRefMes` e `impactoMensal`; textos (`resumo`, `direcionamento`, `aviso`) falam de venda estimada ("não é lucro: não desconta o custo da mercadoria") e da estimativa de 50%, sem citar margem; mensagem de dia sem venda positiva sem "margem"
- [ ] T009 [US1] `escala/vendas-cadastro.ts`: a venda do Cadastro vira linhas sem margem (`margem: 0`), sai `comMargem`; `escala/diagnostico.ts`: o aviso "venda estimada pelo faturamento…" deixa de ter a variante que pede margem (texto único, sem pedir margem); a lista de campos só do dono tira os de margem que deixaram de existir
- [ ] T010 [US1] Testes: `cenarios-extras.test.ts` (dia novo = 50% da média; dia com histórico vale o vendido; saldo = venda − custo; funciona sem margem; não abre dia de venda zero; não-dono sem reais; 7 dias abertos continua "todos abertos"), `cenarios-dias.test.ts`, `ajustes-fim-de-semana.test.ts`, `vendas-cadastro.test.ts`, `diagnostico.test.ts`, `cenarios.test.ts`, `comparativo.test.ts`, `premissas.test.ts`, `escala.routes.integration.test.ts` (ajustar o que citava margem); **os resultados dos três cartões e da Simulação seguem idênticos** (os testes existentes de comparação não mudam de valor)
- [ ] T011 Rodar os testes do servidor e commitar a fatia

## Fatia 3 — Tela do Cadastro sem o campo de margem (História 2, P1)
- [ ] T012 [US2] `cadastro-loja/ResumoMensal.jsx`: sai o campo "Margem bruta média" e a dica; o resumo mensal ajusta a grade; comentário do cabeçalho sem "margem"
- [ ] T013 [US2] `cadastro-loja/AbaDados.jsx` e `calculos.js`: o estado e o corpo enviado ao servidor não têm mais `margemPct`; a regra "faturamento vazio" não olha mais a margem; sai a validação "A margem bruta deve ficar entre 0 e 100"
- [ ] T014 [US2] `cadastro-loja/pendencias.js`: sai o comentário sobre margem; `pendencias.test.js` e `calculos.test.js` ajustados (sem margem; salvar o faturamento não envia `margemPct`)
- [ ] T015 Rodar os testes da tela (`npx vitest run`) e commitar a fatia

## Fatia 4 — Fechamento
- [ ] T016 Percorrer o `quickstart.md` no ambiente local (Cadastro de Cosmópolis sem campo de margem, margem 30 preservada no banco, planilha antiga importa, diagnóstico com `saldoMensal`); conferir que nenhuma tela de Cadastro, Diagnóstico ou Simulação traz "margem" (busca no código da tela)
- [ ] T017 Reiniciar a API local (`docker compose restart api`), rodar tudo (servidor, integração e tela), lint e o type-check; commitar e subir a branch `feat/margem-fora-abrir-dia-por-venda`

## Dependências e ordem
- Fatia 1 → 2 → 3 → 4. A Fatia 1 vem primeiro para que, quando a tela deixar de enviar a margem (Fatia 3), o servidor já a preserve.
- T003 pode andar junto de T001/T002 (arquivos diferentes).
- Dentro da Fatia 2: T006 e T007 antes de T008 (o "abrir dia" usa `vendasPorDia`); T009 pode andar junto de T008.

## Estratégia
Entregar em fatias pequenas com testes verdes a cada uma. Cada fatia é segura sozinha: a 1 não muda nenhuma tela, a 2 só muda um cálculo que nenhuma tela mostra, e a 3 é a mudança visível.
