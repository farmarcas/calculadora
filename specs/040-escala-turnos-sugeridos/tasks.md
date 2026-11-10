# Tarefas: Escala por hora com turnos sugeridos e arrastar mais fácil

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Tudo na tela, em `frontend/react/src/features`. Cada fatia termina com os testes passando e um commit. Sem servidor, sem migration e sem gravar nada no Cadastro. As permissões e os outros passos da Simulação não mudam. A tela não tem biblioteca de teste de componente: as regras vão em funções puras testadas, e o visual é conferido no navegador. Esta entrega usa a Escala por hora (spec 039), que já está no `main`.

## Fatia 1 — Regras puras (Histórias 1, 2 e 3)
- [x] T001 [US1] `simulacao/escala/escala-regras.js`: `turnosParaVaga({ cargaH, coberturaPorDia, abas, regra })` escolhe o número de dias (parcial: o menor com até 6 h por dia; integral: o da regra, com 1 h de intervalo acima de 6 h), a janela que cobre mais horas sem cobertura da função e os dias que mais ganham com ela, e devolve os turnos com as horas por dia arredondadas para cima de 15 em 15 minutos; sem falta alguma, usa a abertura do primeiro dia
- [x] T002 [US1] Em `escala-regras.js`: `sugerirTurnosDasVagas({ quadro, turnos, cobertura, abas, regra })` percorre as vagas sem turno em ordem, recalcula a cobertura da função com os turnos já postos e devolve os turnos novos de todas (com a matrícula de cada vaga); `vagaSemTurnos(quadro, turnos)` lista as vagas sem turno
- [x] T003 [US3] Em `escala-regras.js`: `turnoHabitual(turnos, matricula, dia)` devolve o turno mais frequente da pessoa em outros dias (entrada, saída e intervalo); `novoTurnoNaFolga({ turnos, matricula, dia, aba, regra })` cria o turno com o habitual ou, sem histórico, a abertura do dia com a jornada diária da regra; `semTurnoNoDia(turnos, matricula, dia)` devolve os turnos sem o do dia
- [x] T004 [US3] Em `escala-regras.js`: `avisosDaPessoa(avaliacao, matricula)` devolve os avisos de regra (jornada, intervalo, folga) da pessoa, sem os de cobertura
- [x] T005 [P] [US1] `escala-regras.test.js`: turnos de vaga parcial e integral (dias, janela, horas); vaga que não cabe nos dias abertos; sem falta; duas vagas da mesma função (a segunda cobre o que sobrou); turno habitual (mais frequente, sem histórico); turno novo na folga; tirar o dia; avisos da pessoa
- [x] T006 Rodar os testes da tela e commitar a fatia

## Fatia 2 — Personalizar já com turnos (História 1)
- [x] T007 [US1] `diagnostico/Comparativo.jsx`: depois de gravar as vagas e o horário do cenário, calcular os turnos das vagas sobre a simulação devolvida (`sugerirTurnosDasVagas`) e gravá-los numa segunda chamada com `turnos`; sem turnos a colocar, não faz a segunda chamada; falha na segunda não impede abrir a simulação
- [x] T008 Conferir no navegador com um cenário que contrata (a falta fecha e a faixa amarela mostra só o que sobrou) e commitar a fatia

## Fatia 3 — Sugerir turno, folga, tirar do dia, erro e avisos (Histórias 1, 3, 4 e 5)
- [x] T009 [US1] `escala/LinhaDaPessoa.jsx` e `EscalaPorHora.jsx`: botão "Sugerir turno" na contratação simulada sem turno (só `editavel`); calcula com a cobertura de agora e grava os turnos
- [x] T010 [US3] `LinhaDaPessoa.jsx` e `EscalaPorHora.jsx`: "Folga" vira botão (só `editavel`) que cria o turno do dia (`novoTurnoNaFolga`); "Tirar do dia" na faixa de contexto remove o turno selecionado e limpa a seleção
- [x] T011 [US4] `EscalaPorHora.jsx` e `SimulacaoPage.jsx`: a seção recebe o erro da simulação e o mostra no topo dela depois de uma gravação de turno que falhou; a faixa de contexto do turno selecionado mostra o horário, o total da semana e os avisos da pessoa (`avisosDaPessoa`)
- [x] T012 [US5] Garantir que visualizador, gestor e simulação gravada não ganham "Sugerir turno", "Folga" clicável nem "Tirar do dia"; o gestor segue sem venda e custo
- [x] T013 Conferir no navegador (dono, gestor e visualizador) e rodar os testes; commitar a fatia

## Fatia 4 — Prévia do turno e arrastar mais fácil (Histórias 2 e 3)
- [x] T014 [US2] `EscalaPorHora.jsx`: o estado do formulário (`funcao`, `tipo`, `dias`, `entra`, `sai`) sobe para a seção, que o inicia com a sugestão ao abrir "+ Contratar" e o apaga ao adicionar ou cancelar; `FormularioContratar.jsx` passa a ser controlado (`valor` e `onMudar`), com a mesma sugestão, o mesmo efeito e a mesma prévia de custo
- [x] T015 [US2] A grade mostra a linha "Turno sugerido" da função (barra tracejada nos dias escolhidos, "Folga" nos outros) e marca como reforçadas as horas que ela cobre; arrastar e redimensionar a barra muda Entra e Sai do formulário (de 15 em 15 minutos), sem gravar nada
- [x] T016 [US3] `LinhaDaPessoa.jsx`: alças das bordas de 12 px com marca visível e cursor próprio; o horário novo da barra em destaque durante o gesto; a mesma barra serve à prévia e aos turnos reais
- [x] T017 Conferir no navegador (abrir "+ Contratar", arrastar a barra, cancelar, adicionar) e rodar os testes; commitar a fatia

## Fatia 5 — Fechamento
- [ ] T018 Rodar todos os testes e `vite build`; conferir no navegador (computador e celular: a lista mostra os turnos sugeridos em texto); atualizar o README onde descreve a Escala por hora; atualizar o `local/ver-tudo`; enviar a branch `feat/escala-turnos-sugeridos`

## Dependências
- Fatia 1 antes de todas. Fatias 2 e 3 dependem da 1 e são independentes entre si.
- Fatia 4 depois da 3 (usa a mesma seção e a mesma linha de pessoa).

## Ordem sugerida
Fatias 1 a 5, na ordem. Nenhuma toca em dados: tudo é código de tela.
