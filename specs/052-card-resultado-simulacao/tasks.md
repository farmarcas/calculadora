# Tasks: Card "Resultado da simulação" com o peso da folha (B1)

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

## Phase 1: Conta única (servidor)

- [ ] T001 Criar `backend/node/src/modules/escala/peso-folha.ts` com `pesoDaFolha({ folhaHoje, custoAdicional, faturamento, vendaPct })` que devolve `{ hoje, depois, variacao, reais }` (pesos com uma casa; `variacao` = `arred1(depois) − arred1(hoje)`, sem zero negativo; `reais` = custo adicional arredondado) e `null` sem folha ou sem faturamento. Copiar a regra hoje em `linhas-cenarios.ts` (peso depois = (folha + adicional) ÷ (faturamento × (1 + venda%))).
- [ ] T002 Fazer `linhas-cenarios.ts` usar `pesoDaFolha` (sem mudar nenhum número). Teste `peso-folha.test.ts`: Cosmópolis 8,0 → 9,7, +1,7, R$ 7.659; Paulínia 10,3 → 14,7, +4,4; 8,04 → 9,66 mostra +1,7; folha igual; folha que cai; sem folha; sem faturamento. Os testes de `linhas-cenarios.test.ts` seguem passando.

## Phase 2: Dados do card (servidor) — US1, US3, US4

- [ ] T003 [US3] Em `simulacoes/resultado-em-horas.ts`, adicionar `custoSentido: 'aumenta' | 'igual' | 'diminui' | null` ao `EmHoras` (todos os perfis), decidido pelo custo adicional em R$, e tirar `custoPct` do tipo enviado (a tela não o usa mais). Atualizar `resultado-em-horas.test.ts`.
- [ ] T004 [US1] Em `simulacoes/resultado.ts`, calcular `custoDoDono` (só dono): `{ pesoHoje, pesoDepois, variacao, reais, folhaHoje, folhaDepois, estado }` com `estado` em `ok | sem_salarios | sem_faturamento`, usando `pesoDaFolha` e o faturamento de referência da loja (`faturamentoMensalDe`, o mesmo de `escala/diagnostico.ts`: Cadastro mensal, depois soma dos dias ×52/12, depois base ×52/12).
- [ ] T005 [US3] Em `simulacoes.service.ts`, passar o faturamento de referência ao cálculo e remover `custoDoDono` e `horarioEstendido` da resposta de gestor e consulta.
- [ ] T006 [P] Testes de `resultado.test.ts`: Cosmópolis Manter horários (9,7%, +1,7, R$ 7.659; folha R$ 36.020 → R$ 43.679), sem contratação (igual), reduz equipe (−R$ 2.340), sem salários, sem faturamento.
- [ ] T007 [P] [US3] Teste de integração em `simulacoes.routes.integration.test.ts`: dono recebe `custoDoDono`; gestor e consulta recebem `emHoras.custoSentido` e **não** têm `custoDoDono`, `horarioEstendido`, folha, faturamento nem percentual de custo.

## Phase 3: Tela — US1, US2, US4

- [ ] T008 [US1] Em `frontend/react/src/features/simulacao/resultado-regras.js`: `textoDoPesoDaSimulacao(r, dono)` (peso depois, chip, "hoje X,X%", reais ou "Sobe só porque a venda cai.", frases de dados que faltam, rótulo para leitor de tela), reaproveitando `textoDaFolha`/`CelulaFolha` da spec 050 sempre que possível; "Custo de pessoal" com chip para gestor e consulta.
- [ ] T009 [US2] Em `resultado-regras.js`: `listaOQueMuda(r, dono)` com os itens Folha por mês (só dono, "R$ 36.020 → R$ 43.679", variação âmbar, verde ou "igual" cinza), Pessoas, Horas contratadas e Hora extra (item só se maior que zero; senão linha cinza "Sem hora extra."); verde para alta de pessoas e horas, cor neutra para queda, cinza para "igual". Remover `tabelaDoResultado`, `linhaDaTabela` e a linha "Horas abertas".
- [ ] T010 [US1] Em `ResultadoEmHoras.jsx`: pill, blocos Venda | Folha (1 : 1,6, peso depois em 22 px negrito), faixa de causa, Horário (±Xh e sete dias), lista "O QUE MUDA", Contratar; remover a tabela e o "+X% sobre a folha". Sem texto escondido a 300 px.
- [ ] T011 [P] Testes em `resultado-regras.test.js`: os seis estados (aumenta, igual, reduz, hora extra > 0, gestor, sem salários e sem faturamento); nenhum "p.p.", "pontos" nem "CMV".

## Phase 4: Horário a mais — US5

- [ ] T012 [US5] Em `BlocoHorarioEstendido.jsx` e `resultado-regras.js`: quadro cinza depois de Contratar, título "Horário a mais: sábado até 23h" (dia e horário simulados), selo Recomendado (verde) ou Não recomendado (vermelho), rótulo "Custo da mercadoria (56,4%)", Resultado em negrito e vermelho quando negativo, link "Como calculamos" com modal (Esc fecha). Só dono. Teste com venda R$ 2.214, custo R$ 1.249, lucro R$ 965, folha R$ 4.924, resultado −R$ 3.958.

## Phase 5: Fechamento

- [ ] T013 Rodar `tsc`, `eslint`, testes de unidade e de integração da API (sozinho) e testes e build da tela.
- [ ] T014 Conferir no navegador (dono em Cosmópolis e Paulínia; gestor e consulta; coluna estreita; horário a mais) e buscar na tela por "p.p.", "pontos", "CMV" e "sobre a folha".
- [ ] T015 Atualizar o `README.md` e marcar as tarefas; commit na branch atual, push e atualizar `local/ver-tudo`. Sem PR novo.

## Dependências

T001 → T002 → T003 → T004 → T005 → T006/T007; T008 e T009 dependem de T004; T010 depende de T008 e T009; T012 depende de T010; T013–T015 por último.
