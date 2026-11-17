# Tarefas: Cenários em linhas, sem valores em reais

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node/src/modules`, tela em `frontend/react/src`. Cada fatia termina com os testes passando e um commit. Sem migration e sem apagar dado. O cálculo dos cenários, o `comparativo` atual, o Personalizar, os cenários salvos e a Simulação não mudam. A tela não tem biblioteca de teste de componente: as regras vão em funções puras testadas, e o visual é conferido no navegador.

## Fatia 1 — Servidor: as linhas (Histórias 1, 3, 5 e 6, P1/P2)
- [x] T001 [US3] `escala/linhas-cenarios.ts` (novo, puro): `statusDaLinha(coluna)` escolhe o primeiro que se aplica entre `inviavel`, `nao_resolve`, `nao_recomendado`, `vende_mais` (ganho estimado maior que zero e nenhuma perda), `perde_venda`, `equipe_menor` (falta por função ou sem farmacêutico, sem perda) e `cobre`; nulo quando o cenário está indisponível
- [x] T002 [US3] Em `linhas-cenarios.ts`: `causaDaLinha(coluna)` devolve uma só frase, na ordem: "Faltam X h de farmacêutico." (não resolve sozinho), "Sem farmacêutico no quadro." (inviável), "Só cabe fechando um dos 3 melhores dias." (não recomendado), "<Função>: N pessoa(s) a menos que hoje." (equipe menor), "Sem venda por hora: perda não estimada.", "Venda das horas novas é estimada."; nulo sem consequência
- [x] T003 [US5] Em `linhas-cenarios.ts`: variações em % com uma casa decimal e sinal: venda = (ganho estimado − perda) ÷ faturamento mensal real (venda real mesmo quando a medida é a margem), custo de pessoal = custo adicional ÷ folha atual; estados `ok`, `nao_estimada` (sem venda por hora), `sem_calculo`, `sem_salarios`
- [x] T004 [US1] Em `linhas-cenarios.ts`: `montarLinhas(...)` devolve os três itens na ordem Equilíbrio, Manter horários, Sem contratações com `igualA`, `status`, `causa`, `indisponivel` (motivo), `contratar`, `horasSemana`, `horasDiferenca`, `horarioSemana`, `vendaPct/vendaEstado`, `custoPct/custoEstado` e, para o Personalizar, `contratacoes`, `ajustes` e `diasFechar`; nenhum campo em reais nem salário
- [x] T005 [P] [US3] `escala/linhas-cenarios.test.ts`: cada status e a prioridade entre eles; cada causa; % à mão (venda, custo, zero, negativo); estados sem venda por hora e sem salários; Equilíbrio igual a Manter horários e a Sem contratações; indisponível por custos e por vendas; nenhuma chave com reais na saída
- [x] T006 [US6] `escala/diagnostico.ts`: montar `linhas` para qualquer perfil (para gestor e consulta, o cálculo das linhas usa os custos da loja e só as porcentagens saem) em `cenarios.r42.linhas` e `cenarios.r40.linhas`; o restante da resposta fica igual
- [x] T007 [US6] Teste de integração em `escala/escala.routes.integration.test.ts`: dono, gestor e consulta recebem `linhas` idênticas; nenhuma linha tem valor em reais nem salário; sem custos informados o Equilíbrio vem indisponível para todos; `comparativo` e o selo de sugerido continuam como antes (só o dono)
- [x] T008 Rodar os testes do servidor (unidade e integração) e commitar a fatia

## Fatia 2 — Regras puras da linha na tela (Histórias 2, 3 e 5, P1/P2)
- [x] T009 [US5] `features/diagnostico/cartao/linha-regras.js` (novo, puro): `textoDaVariacao(pct, estado, { tipo })` com seta e sinal (▲ +1,7%, ▼ −9,7%, ● 0%), "−" tipográfico, "—" e "Não estimada"; cor da variação (venda para cima verde e para baixo vermelha; custo para cima neutro e para baixo verde)
- [x] T010 [US2] Em `linha-regras.js`: `faixaDosDias(novos, antes)` devolve os sete dias com as horas abertas, nunca traço: sem mudança (`Seg 14h`), aumento (`Sáb 19h` e `+5h`), redução (`Sáb 9h` e `−5h`), fechado (`Fechado` e `−14h`), com o tom de cada um; `textoDoTotal(horasSemana, diferenca)` ("94h por semana", "(+9h)", "(−9h)", "sem mudança")
- [x] T011 [US1] Em `linha-regras.js`: `textoContratar(contratar)` ("1 farmacêutico · parcial", "1 atendente · parcial", "Nenhuma contratação"); `rotuloDoStatus(status)` com texto de até 3 palavras, tom e ícone (Inviável, Não resolve sozinho, Não recomendado, Vende mais, Perde venda, Equipe menor que hoje, Cobre o horário); `estadoVisual(linha, { dono, sugerido })` (sugerida, alternativa, rebaixada, indisponível); `textoIndisponivel(motivo, { dono })` ("Informe as vendas por dia ou por hora e os salários para calcular este cenário." para o dono e "O dono ainda não informou os custos." para os demais)
- [x] T012 [P] [US5] `linha-regras.test.js`: variações (zero, positivo, negativo, "—", "Não estimada", sinal "−" U+2212); faixa dos dias (cada tipo, dia fechado, horas sempre presentes); totais; contratar; cada pill com no máximo 3 palavras; estado visual por perfil; textos de indisponível
- [x] T013 Rodar os testes da tela e commitar a fatia

## Fatia 3 — A tela: linhas no lugar dos cartões (Histórias 1 a 6)
- [x] T014 [US4] `styles/alquimia.css` e `index.css`: tokens que faltarem (texto de sucesso, rosa de redução) usando o mais próximo do Design System; remover as classes `cenarios-*` dos cartões; estilos da tabela de linhas, com empilhamento em tela estreita
- [x] T015 [US3] `cartao/PillDeStatus.jsx` (novo): pill compacta (11 px, 18 px de altura, `padding: 1px 8px`, sem quebra de linha) com ícone e texto, nas cores de cada status
- [x] T016 [US2] `cartao/FaixaDosDias.jsx` (novo): os sete dias com as horas abertas e as cores de cada tipo; rótulo acessível por dia
- [x] T017 [US1] `cartao/LinhaDeCenario.jsx` (novo): selo, nome, subtítulo "Igual a …", pill; Contratar; Horário (total, mudança em horas e faixa dos dias); Venda e Custo de pessoal em %; faixa amarela de causa; botão (preenchido no sugerido, contorno azul na alternativa, neutro no rebaixado, desabilitado com o texto do que falta no indisponível); a linha de custo "—" mostra "Informe os salários para ver a variação do custo." quando faltam salários
- [x] T018 [US1] `Comparativo.jsx`: cabeçalho da tabela (CENÁRIO, CONTRATAR, HORÁRIO, VENDA, CUSTO DE PESSOAL) e uma linha por item de `linhas`; selo "CENÁRIO SUGERIDO" só no dono (`comparativo.sugerido`); Personalizar e a mensagem "A equipe atual cobre todos os dias" como hoje; Salvar como cenário intacto
- [x] T019 [US6] Garantir na tela que gestor e consulta nunca recebem o selo de sugerido e veem o Equilíbrio indisponível com o texto certo; consulta sem o botão Personalizar
- [x] T020 Conferir no navegador (dono, gestor e consulta; Arariba e lojas de teste em cada estado; celular de 375 px) e rodar os testes da tela; commitar a fatia

## Fatia 4 — Limpeza e fechamento
- [x] T021 Remover `cartao/CartaoCenario.jsx`, `FaixaDeResultado.jsx`, `BlocoHorario.jsx`, `BlocoContratacoes.jsx`, `PainelDias.jsx` e as funções de `cartao-regras.js` e `comparativo-regras.js` que ficam sem uso (com os testes delas); manter o que a ordem e o número do cenário ainda usam
- [x] T022 Rodar `tsc`, lint, todos os testes (unidade, integração e tela) e `vite build`; atualizar o `local/ver-tudo`; enviar a branch `feat/cenarios-em-linhas`
- [x] T023 Atualizar a documentação dos cenários em `docs/` onde falar dos cartões e de valores em reais

## Dependências
- Fatia 1 antes da 3 (a tela lê `linhas`). Fatia 2 antes da 3 (a tela usa as regras puras). Fatias 1 e 2 são independentes entre si.
- A limpeza (fatia 4) só depois de a tela nova estar funcionando.

## Ordem sugerida
Fatia 1, fatia 2, fatia 3 e fatia 4. Nenhuma toca em dados: tudo é código e tela.

## Observações da implementação
- A pill "Equipe menor que hoje" tem 4 palavras: o quadro a define assim e a regra de "até 3 palavras" do pedido foi aplicada às demais; ela cabe em uma linha.
- Equipe menor que hoje: a frase usa pessoas quando a falta é de uma jornada inteira (44 h) ou mais, e horas por semana quando é menor.
- Linha indisponível: coberta por testes de unidade (loja real sem custos fica "pendente" e nem chega às linhas).
