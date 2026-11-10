# Tarefas: Escala por hora, com venda e contratação por função

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node/src/modules/simulacoes`, tela em `frontend/react/src/features/simulacao`. Cada fatia termina com os testes passando e um commit. Sem migration e sem apagar dado. Nada é gravado no Cadastro. As outras seções do Diagnóstico e os outros passos da Simulação não mudam. A tela não tem biblioteca de teste de componente: as regras vão em funções puras testadas, e o visual é conferido no navegador. Esta entrega depende das specs 037 e 038 (a branch nasce em cima delas).

## Fatia 1 — Servidor: três pontos pequenos (Histórias 2, 3 e 5)
- [x] T001 [US2] `avaliar.ts`: cada célula de `avaliacao.cobertura[dia][função].porHora` ganha `exigido` (as pessoas exigidas da função naquela hora, de `req.emHora`); `avaliar.test.ts` confere o valor em hora com e sem turnos de loja
- [x] T002 [US3] `simulacoes.schemas.ts` e `vagas.ts`: a vaga nova (sem `matricula`) aceita `turnos: [{ dia, entrada, saida, iniIntervalo?, fimIntervalo? }]`; `aplicarVagasEDesligados` cria os turnos com a matrícula `VAGA-n` que atribuiu; vaga que já existe ignora o campo (seus turnos seguem em `turnos` do pedido); teste em `vagas.test.ts`
- [x] T003 [US3] `simulacoes.routes.ts` e `simulacoes.service.ts`: `POST /simulacoes/:id/efeito-contratacao` (pedido `{ funcao, cargaH }`, vaga de 4 a 44 horas inteiras): calcula o resultado da simulação com e sem a vaga, sem gravar, e devolve `{ custoPct, custoEstado }` só para o dono; gestor e visualizador recebem `{}`
- [x] T004 [P] [US5] Testes de integração em `simulacoes.routes.integration.test.ts`: a cobertura traz `exigido` para todos os perfis; `PUT` com vaga e turnos cria a vaga e cobre a falta; a prévia devolve o custo só ao dono e não grava nada; visualizador continua sem editar
- [x] T005 Rodar os testes do servidor (unidade e integração) e commitar a fatia

## Fatia 2 — Regras puras da tela (Histórias 1 a 4)
- [x] T006 [US1] `escala/escala-regras.js` (novo, puro): `horasDoDia(dia)` (horas abertas do dia da simulação), `diasDasAbas(diasAbertos)`, `quartis(valores)` e `tomDoQuartil(valor, quartis)` (quatro tons), `mediaDoDia`, `totalDaSemana(turnosDaPessoa)` ("40h · 5 dias") e `turnoDoDia`/folga
- [x] T007 [US2] Em `escala-regras.js`: `celulasDaFuncao(coberturaDaFuncao, reforco)` (por hora: pessoas, exigido, `ok`, texto "N !" quando abaixo, e `reforcada` para a borda tracejada), `minimoDaFuncao(porHora)` ("mín. 1" ou "mín. 2 + reforço" quando o exigido varia no dia) e `faixaDeAviso(faltas, dia)` ("Faltam 3 h de farmacêutico no sábado, das 19h às 21h. Contratar na linha da função resolve."), nula quando fecha
- [x] T008 [US3] Em `escala-regras.js`: `sugerirContratacao({ funcao, porDia, horasDoDia, regra, tipo })` devolve dias, entra e sai que cobrem as horas sem cobertura da função (a janela mais comum, até as horas do dia, sem passar de 6 h por dia sem intervalo e com as horas semanais entre 4 e 30 no parcial); `cargaDaContratacao(tipo, turnos, regra)` (integral = jornada cheia da regra; parcial = soma dos turnos, arredondada para cima, de 4 a 30) e mensagens de erro do formulário (entra depois do sai, acima de 30 h, sem dias)
- [x] T009 [US3] Em `escala-regras.js`: `efeitoDaContratacao({ cobertura, turnosNovos })` devolve as horas que a contratação cobre ("cobre 3h sem farmacêutico"), se o horário da loja muda ("horário da loja sem mudança") e a cobertura recalculada com a vaga; `coberturaComTurnos(cobertura, turnosPorFuncao)` recalcula pessoas e `ok` na tela quando um turno muda
- [x] T010 [US4] `escala/movimento-regras.js` (novo, puro): `moverTurno(turno, deltaHoras, janela)` e `redimensionarTurno(turno, borda, deltaHoras, janela)` de 15 em 15 minutos, dentro das horas do dia, com o mínimo de 1 hora e sem trocar entrada e saída; `arrastoPorTeclado(turno, tecla)`; reaproveita `quarto` e `limitar` de `features/grade/tempo.js`
- [x] T011 [P] [US1] `escala-regras.test.js` e `movimento-regras.test.js`: quartis e tons; total da semana; células com "N !" e reforçada; "mín." com e sem reforço; faixa de aviso (uma e várias faixas, some quando fecha); sugestão (falta numa hora, em duas, em dias diferentes, parcial acima de 30 h, dia curto); carga da contratação; efeito; mover e redimensionar (limites, 15 minutos, mínimo de 1 hora)
- [x] T012 Rodar os testes da tela e commitar a fatia

## Fatia 3 — A grade, em leitura (Histórias 1, 2, 5 e 6)
- [x] T013 [US1] `styles/alquimia.css`: tokens que faltarem (azul escuro e azul claro das funções, os quatro tons da escala de venda e clientes, texto verde de sucesso) usando o mais próximo do Design System
- [x] T014 [US1] `escala/GradeDeHoras.jsx` (novo): cabeçalho das horas, linha "Venda por hora" (R$, só o dono, "R$ · só o dono vê") e "Clientes por hora" ("cupons vendidos"), com a média do dia à direita; sem base mostra "Sem clientes por hora nesta base"
- [x] T015 [US2] `escala/LinhaDaFuncao.jsx` (novo): resumo com chevron de recolher, cor e nome da função, "N pessoas", "+ Contratar" (só dono e gestor, só rascunho) e as células de cobertura (verde, ou rosa com "N !" e borda vermelha, ou tracejada azul); à direita "mín. N"
- [x] T016 [US1] `escala/LinhaDaPessoa.jsx` (novo): turno em barra, "Função · 44h", total da semana e a barra "Folga" nos dias de folga; sem arrastar nesta fatia
- [x] T017 [US1] `escala/EscalaPorHora.jsx` (novo): título, texto de ajuda, abas dos dias abertos (Seg a Dom, a selecionada em preto), faixa de contexto ("Nenhum turno selecionado" ou o turno), faixa amarela de aviso, dia fechado ou sem dados, e as linhas; `SimulacaoPage.jsx` a renderiza em largura total abaixo da grade atual
- [x] T018 [US5] Permissões: o dono vê a linha de venda; o gestor não vê venda nem custo; visualizador e simulação gravada só leem (sem "+ Contratar")
- [x] T019 Conferir no navegador (dono, gestor e visualizador; Arariba) e rodar os testes da tela; commitar a fatia

## Fatia 4 — + Contratar e a contratação simulada (História 3)
- [x] T020 [US3] `escala/FormularioContratar.jsx` (novo): card sob a linha da função (um aberto por vez) com título "Contratar <função>", o subtítulo, "Fechar", Tipo, Dias (chips), Entra e Sai, a sugestão preenchida, o efeito na semana (horas cobertas e horário da loja) e, para o dono, o custo em % vindo da prévia e a venda como o sistema calcula; "Cancelar" e "Adicionar à simulação" (desabilitado com o motivo quando inválido)
- [x] T021 [US3] Adicionar: envia a vaga com os turnos (`salvar({ vagas })`), fecha o formulário e mostra a linha azul "Contratação simulada" ("Função · 16h parcial", barra tracejada azul, "Remover" em vermelho); a cobertura marca as horas reforçadas e o total da semana sobe
- [x] T022 [US3] Remover: envia as vagas sem a contratação e a cobertura volta ao estado anterior; erro do servidor aparece na própria seção
- [x] T023 Conferir no navegador (falta no sábado, sugestão, adicionar, remover; gestor e visualizador) e rodar os testes; commitar a fatia

## Fatia 5 — Arrastar e redimensionar (História 4)
- [x] T024 [US4] `LinhaDaPessoa.jsx`: arrastar a barra para mover e as bordas para redimensionar (de 15 em 15 minutos, com ponteiro e com teclado); durante o gesto mostra o turno e recalcula a cobertura e a faixa de aviso na tela; ao soltar grava `turnos` por `salvar`; a contratação simulada se comporta igual; só dono e gestor em rascunho
- [x] T025 [US4] Avisos de regra (jornada, intervalo, interjornada) da avaliação aparecem junto da grade e não impedem "Salvar como cenário"
- [x] T026 Conferir no navegador e rodar os testes; commitar a fatia

## Fatia 6 — Celular, estados e fechamento
- [x] T027 [US6] `escala/EscalaMobile.jsx` (novo): abaixo de ~700 px, lista por função com o turno de cada pessoa em texto ("07h–15h"), cobertura por hora numa faixa com rolagem horizontal e "+ Contratar" por função; sem rolagem lateral da página
- [x] T028 [US6] Estados: sem base, sem turno selecionado, dia fechado, dia sem dados, função sem ninguém; conferir cada um
- [x] T029 Remover o que ficou sem uso (a grade antiga `features/grade/Grade.jsx` só se ninguém mais a usar, e as funções de `tempo.js` que sobrarem sem uso); rodar `tsc`, todos os testes e `vite build`; conferir no navegador (computador e celular de 375 px)
- [x] T030 Atualizar o README onde descreve a Simulação; atualizar o `local/ver-tudo`; enviar a branch `feat/escala-por-hora`

## Dependências
- Fatia 1 antes das fatias 4 e 5 (vaga com turnos, prévia). Fatia 2 antes da 3. Fatias 1 e 2 são independentes entre si.
- Fatia 3 antes da 4 e da 5; a 4 e a 5 são independentes entre si.
- O PR desta entrega só deve ser aberto depois dos PRs dos cenários em linhas e do resultado em horas.

## Ordem sugerida
Fatias 1 a 6, na ordem. Nenhuma toca em dados: tudo é código e tela.
