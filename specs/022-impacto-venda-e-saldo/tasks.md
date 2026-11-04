# Tarefas: Impacto em venda e saldo contra a folha

## Fatia 1 — Venda hora a hora no motor dos cortes (servidor)
- [x] T001 `ajustes-fim-de-semana.ts`: `vendaPerdidaMes(hoje, final, tabela)` com a soma da venda das horas abertas hoje e fechadas no final, por dia, × 52 ÷ 12, e o valor por dia alterado; `ganhoDasHorasNovas` passa a devolver só venda (margem sai) e a receber o percentual (`fatorHoraNova`) em vez da constante
- [x] T002 `ajustes-fim-de-semana.ts`/`cenarios-dias.ts`: as travas (perda máxima de 10% e piso de horas) e a escolha dos cortes usam a venda hora a hora (com a divisão igual só quando não há tabela); `melhorEstado` passa a maximizar o saldo (`economia de folha − venda perdida + venda adicional − custo adicional`) com os empates de hoje
- [x] T003 Testes (`ajustes-fim-de-semana.test.ts`): corte de fim de dia perde menos que a divisão igual; dia fechado perde as 24 h registradas; hora sem venda conta zero; nenhuma mudança → 0; empates e travas intactos; extensão com percentual diferente de 50%
- [x] T004 Rodar os testes do servidor e commitar a fatia

## Fatia 2 — Cenários e comparativo: venda perdida, economia de folha e saldo (servidor)
- [x] T005 `premissas.ts`: `fatorHoraNova` (0 a 100, padrão 50) entra, `margemPct` sai; `escala.service.ts`/`diagnostico.ts` levam o valor até os cenários
- [x] T006 `cenarios.ts`: `vendaCortadaPorDia`, `vendaGanhaMes`, `impactoRobusto` (metade da venda ganha); `semVendaHoraria` quando a origem da venda não é a base comercial; os campos de margem dos cenários saem
- [x] T007 `comparativo.ts`: por coluna `vendaPerdidaMensal`, `vendaPerdidaPorDia`, `economiaFolhaMensal` (custo do "manter horário" − custo do cenário), `vendaAdicionalMensal`, `saldoMensal`, `saldoAnual`, `pesoNoFaturamentoPct`, `semVendaHoraria`; o Cenário 1 com venda perdida 0, saldo 0 e custo adicional contra a folha atual; sem venda hora a hora os valores vêm nulos (nunca zero); selo de melhor cenário e "Cenário sugerido" pelo saldo, mantida a regra da metade da venda estimada; sai a margem e o "ganho frente a manter"
- [x] T008 Testes (`cenarios.test.ts`, `comparativo.test.ts`): 10.000 − 8.000 = −2.000; sem mudança de horário venda perdida 0; loja sem venda hora a hora → aviso e valores nulos; saldo positivo e negativo; anual = mensal × 12; peso no faturamento (e nulo sem faturamento); selo e sugerido pelo saldo; gerente sem R$; ajustar os testes antigos de margem
- [x] T009 Rodar tudo e commitar a fatia

## Fatia 3 — Simulação, Cadastro e soma do grupo (servidor)
- [x] T010 `simulacoes/resultado.ts`: `economiaFolha` e `saldoMensal` (o "manter horário" é o custo das contratações que cobrem o horário do Cadastro com a equipe atual); `margemPerdida` e `margemInformada` saem; testes com o exemplo de 10.000 − 8.000
- [x] T011 `cadastros/situacao.ts`: a margem deixa de ser pendência (e de impedir Completo); ajustar os testes da spec do painel (unitários e de integração)
- [x] T012 `escala/grupo.ts`: `somarGrupo(lojas)` com totais, peso sobre o faturamento total do grupo e quantas lojas ficaram de fora; testes de soma e de lojas sem dado
- [x] T013 Rodar os testes do servidor e de integração e commitar a fatia

## Fatia 4 — Cartões e painel da Simulação (tela)
- [ ] T014 `Comparativo.jsx`/`comparativo-regras.js`: "Saldo mensal estimado" em verde ("Este cenário compensa") ou vermelho ("Este cenário custa mais do que economiza"), sempre com texto; composição "Economia de folha R$ X − venda perdida R$ Y" (ou "Venda adicional − custo adicional"); a venda perdida por dia ("Sáb até 16h: R$ X por mês") e o total; valor anual e peso no faturamento; o aviso "Sem venda hora a hora, não é possível estimar a venda perdida"; o selo "estimativa" nas horas novas; textos da faixa amarela sem margem
- [ ] T015 Campo discreto do percentual de venda das horas novas perto do título dos cenários, levado na consulta do Diagnóstico (`EscalaPage.jsx`/`Diagnostico.jsx`); o valor volta ao padrão ao recarregar
- [ ] T016 `PainelResultado.jsx` (Simulação): venda que sai, custo adicional, economia de folha, saldo e peso, recalculados a cada alteração; sai "Margem perdida"
- [ ] T017 `pendencias.js`/`ResumoMensal.jsx`: margem sai das pendências do rascunho e o campo fica como detalhe opcional; testes da tela e commitar a fatia

## Fatia 5 — Validação com lojas reais e conferência final
- [ ] T018 Conta aberta fora do repositório com Cosmópolis (sábado fechando às 16h: venda perdida por dia, economia de folha e saldo) e Porto Feliz (estendendo 1 h por dia: custo adicional, venda adicional estimada e saldo), mostrada na resposta final
- [ ] T019 Conferir na tela como dono e gerente, uma loja sem venda hora a hora, 360 e 1920 px, e que nenhum texto de nenhuma tela mostra "margem perdida"
- [ ] T020 README e resumo final; rodar tudo, commitar e enviar a branch para o PR
