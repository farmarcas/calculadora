# Tarefas: Margem nos cenários e na Simulação

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node/src/modules`, tela em `frontend/react/src`. Cada fatia termina com os testes passando e um commit. Sem migration e sem apagar dado. Numa base sem margem, todos os números têm que ficar idênticos aos de hoje.

## Fatia 1 — A régua (Histórias 1 e 3, P1)
- [x] T001 [US3] `escala/regua.ts` (novo, puro): `reguaDaBase(linhas)` → `{ tipo: 'margem' | 'venda', motivo? , cobertura }` (margem só se a soma é positiva, cobre pelo menos 90% das linhas com venda e nenhuma linha tem margem maior que a venda; senão venda com o motivo `sem_margem`, `margem_parcial` ou `margem_incoerente`; sem linhas, `null`) e `linhasNaRegua(linhas, tipo)` (devolve as mesmas linhas com `venda` trocado pela margem quando a régua é margem)
- [x] T002 [P] [US3] `escala/regua.test.ts`: base completa vira margem; sem coluna de margem, margem zerada, margem em poucas horas e margem maior que a venda voltam à venda com o motivo certo; margem negativa isolada conta como está; sem base devolve nulo; `linhasNaRegua` não altera as linhas originais; o limite de 90% é testado nos dois lados
- [x] T003 Rodar os testes do servidor e commitar a fatia

## Fatia 2 — Cenários na régua (Histórias 1, 2 e 3, P1)
- [x] T004 [US1] `escala/diagnostico.ts`: escolher a régua uma vez a partir da base ativa e passar aos cenários as linhas na régua para a tabela de perda e ganho; o faturamento de referência continua lendo as linhas originais
- [x] T005 [US1] `escala/cenarios.ts`: a tabela dos Cenários 2 e 3 (perda, ganho das horas novas, impacto, impacto robusto) usa as linhas na régua; os textos dos cartões dizem "margem" ou "venda" conforme a régua; `regua` vai em cada cenário
- [x] T006 [US2] `escala/comparativo.ts` e `escala/saldo-operacao.ts`: saldo, perda e ganho dos três cartões na régua; o cenário sugerido compara impactos na mesma régua, com as mesmas salvaguardas; o Cenário 1 segue sem perda nem ganho; `regua` no resumo do sugerido; percentuais sobre o faturamento seguem em venda real
- [x] T007 [P] [US1] Testes de unidade dos cenários: duas horas de venda parecida e margens diferentes (o Cenário 3 corta a de menor margem), duas horas em que a margem contradiz a venda, ganho das horas novas em 50% da margem da hora vizinha, base sem margem com resultado idêntico ao de antes
- [x] T008 [US2] Testes de integração do diagnóstico: os três cartões e o sugerido na mesma régua; `regua` presente; dono recebe valores e gestor não (o campo nem existe); base sem margem com os mesmos números de antes
- [x] T009 Rodar os testes do servidor (unidade e integração), reiniciar a API e commitar a fatia

## Fatia 3 — Simulação, lista e comparação na régua (História 4 e 5, P1/P2)
- [ ] T010 [US4] `simulacoes/resultado.ts`: venda que deixa de entrar, venda estimada das horas novas e saldo usam as linhas na régua; venda por hora, clientes, ticket médio e peso no faturamento seguem com a venda real; `regua` em `resultado`
- [ ] T011 [US4] `simulacoes/simulacoes.service.ts`: escolher a régua uma vez por loja e passá-la ao resultado do painel, da lista e da comparação; a lista e a comparação levam `regua` junto do saldo
- [ ] T012 [P] [US4] Testes de unidade do resultado (`resultado.test.ts`, `venda-estimada.test.ts`, `saldo-simulacao.test.ts`): saldo em margem, base sem margem idêntica a hoje, folha e hora extra inalteradas
- [ ] T013 [US4] Testes de integração (`simulacoes.routes.integration.test.ts`): o saldo do painel, o da lista e o da comparação são iguais e na mesma régua; simulação gravada antes é recalculada na régua atual; o gestor não recebe nenhum valor em reais; o saldo dos cartões de cenário e da Simulação usam a mesma régua para a mesma loja
- [ ] T014 Rodar os testes do servidor (unidade e integração), reiniciar a API e commitar a fatia

## Fatia 4 — Tela: rótulos por régua (Histórias 1, 2, 3 e 4)
- [ ] T015 [P] [US2] `features/regua.js` (novo, puro): palavra e texto de apoio por régua ("margem" ou "venda", e o aviso do motivo quando cai em venda); `regua.test.js`
- [ ] T016 [US1] `diagnostico/cartao/cartao-regras.js`, `diagnostico/comparativo-regras.js`: rótulos "MARGEM QUE DEIXA DE ENTRAR" / "MARGEM ESTIMADA" ou "VENDA…" conforme a régua; uma frase perto do saldo diz a régua usada (FR-012); o aviso do motivo quando cai em venda; testes existentes ajustados
- [ ] T017 [US4] `simulacao/PainelResultado.jsx`: rótulos, fórmula do saldo e subtítulos por régua; informação de venda real e ticket médio seguem como estão
- [ ] T018 [US4] `grade/comparacao.js`, `grade/ComparacaoDeSimulacoes.jsx`, `grade/ListaDeSimulacoes.jsx`: rótulos das métricas, nota de rodapé e título da coluna de saldo por régua; `comparacao.test.js` ajustado
- [ ] T019 Rodar os testes da tela, conferir no navegador local (dono e gestor; loja com margem, sem margem e com margem incoerente; cenários, Simulação, lista e comparação) e commitar a fatia

## Fatia 5 — Validação e entrega
- [ ] T020 Percorrer o `quickstart.md` no navegador local, conferindo que o saldo é o mesmo nos cartões, no painel, na lista e na comparação, e que numa base sem margem nada mudou
- [ ] T021 Reiniciar a API, rodar tudo (servidor, integração, tela e type-check), commitar e subir a branch `feat/margem-nos-cenarios`

## Dependências e ordem
- T001 antes de T004; T004 antes de T005 e T006; T005 e T006 antes de T007 e T008.
- A Fatia 3 depende da Fatia 1 e pode andar depois da Fatia 2.
- A Fatia 4 depende de `regua` nas respostas (Fatias 2 e 3); T015 pode andar junto da Fatia 1.

## Estratégia
Primeiro a régua pura e testada; depois os cenários, depois a Simulação, sempre provando que numa base sem margem os números não mudam; por último os rótulos na tela. Cada fatia é testável sozinha, e o saldo é conferido igual em todas as telas.
