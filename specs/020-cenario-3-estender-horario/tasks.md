# Tarefas: Cenário 3 com horário estendido

## Fatia 1 — Horários estendidos e venda das horas novas (motor)
- [x] T001 `ajustes-fim-de-semana.ts`: passo `estender` em `Passo`/`passosDe`; `estadosPermitidos` passa a incluir, para sábado e domingo abertos, extensões de 1 a 3 h (abrir mais cedo e/ou fechar mais tarde), respeitando 06h–24h e no máximo 16 h por dia; um dia ou reduz, ou fecha, ou estende
- [x] T002 `ajustes-fim-de-semana.ts`: `perdaPonderada`/`perdaMensal`/`violacao` passam a tratar horário maior que o de hoje como perda 0 (o ganho é calculado à parte); as travas atuais seguem iguais
- [x] T003 Função pura da venda das horas novas: venda e margem registradas na hora, quando existem; senão 50% da hora de borda do dia; devolve também a origem (`registrada` ou `vizinha`)
- [x] T004 `melhorEstado`: aceitar o ganho de margem das horas novas, `impacto = custo + perdida − ganho`, e um empate novo a favor de estender menos horas
- [x] T005 Testes (`ajustes-fim-de-semana.test.ts`): estados com extensão (e só em sábado e domingo); limites de 06h, 24h e 16 h; piso e travas intactos; venda registrada × vizinha; empate; loja sem estado vantajoso devolve o mesmo estado de hoje
- [x] T006 Rodar os testes do servidor e commitar a fatia

## Fatia 2 — Cenário 3 e comparativo (servidor)
- [ ] T007 `cenarios.ts` (`montarEquilibrio`): usar o ganho nas avaliações; preencher `horasEstendidas`, `margemGanhaMes`, `impactoRobusto` (com metade da margem ganha); `resultado` e `resumo` descrevem a extensão ("Sábado fecha 2 h mais tarde (de 08h–20h para 08h–22h)"); aviso de estimativa de venda; `coincideComManter`/`coincideComEconomia` só quando não há passos
- [ ] T008 `cenarios.ts`/`comparativo.ts`: `fraseDoPasso` e `ajustes` entendem `estender`; `margemMes` do Cenário 3 pode ficar positiva; `estimativaDeVenda` na coluna; `destacar` usa o impacto com o ganho
- [ ] T009 `comparativo.ts`: `sugerido` com teste de robustez (impacto com metade da margem ganha precisa continuar melhor que os outros) e fallback para o melhor dos outros
- [ ] T010 Testes (`cenarios.test.ts`, `comparativo.test.ts`): loja em que estender compensa (impacto melhor que o do Cenário 1 e positivo quando a margem passa da folha); loja em que nada compensa (resultado idêntico ao de hoje); extensão que exige mais contratação entra no custo; sugerido não vai ao 3 quando a metade da margem não sustenta; gerente sem R$; segunda a sexta intactas
- [ ] T011 Rodar tudo e commitar a fatia

## Fatia 3 — Cartão (tela)
- [ ] T012 `Comparativo.jsx`/`comparativo-regras.js`: selo "Melhor resultado" quando o impacto do destaque é positivo, "Menor custo" nos demais casos; composição "Folha adicional R$ X − margem ganha R$ Y" quando há ganho
- [ ] T013 `Comparativo.jsx`: aviso "Venda das horas novas é estimada" (com a origem) quando `estimativaDeVenda`; o resultado do cartão mostra a extensão
- [ ] T014 Testes da tela e commitar a fatia

## Fatia 4 — Conferência final
- [ ] T015 Conferir as 20 lojas do grupo pela API (quais mudam, quais ficam iguais ao de hoje) e abrir na tela uma loja com extensão e uma sem, como dono e como gerente
- [ ] T016 Conferir tempo da busca (abaixo de 1 s por diagnóstico) e que os cenários 1 e 2 não mudaram
- [ ] T017 README (seção dos cenários), resumo final com o que ficou de fora (dias de semana de maior venda); rodar tudo e commitar
