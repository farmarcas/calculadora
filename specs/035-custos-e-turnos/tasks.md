# Tarefas: Custos e Turnos, com o faturamento hora a hora ao lado dos turnos

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node/src/modules`, tela em `frontend/react/src`. Cada fatia termina com os testes passando e um commit. Sem migration e sem apagar dado. Validação, cobertura, mínimo de farmacêutico, modo "Mínimo único do dia" e gravação dos turnos não mudam, e os textos que já existiam ficam iguais.

## Fatia 1 — Servidor: faturamento por hora no painel (Histórias 2, 3 e 6, P1/P2)
- [x] T001 [US2] `escala/faturamento-por-hora.ts` (novo, puro): `faturamentoPorHora(linhas, { dono })` agrupa a base ativa por hora para segunda a sexta, sábado e domingo (média por dia do tipo = soma ÷ datas distintas daquele tipo; participação no dia), devolve `temBase`, `periodo` (início, fim, dias distintos, semanas), `poucosDias` (menos de 4 semanas) e `tipos.{uteis,sabado,domingo}` (nulo sem venda no tipo); sem `valor` para quem não é dono
- [x] T002 [P] [US2] `escala/faturamento-por-hora.test.ts`: média por tipo de dia à mão; participação soma 1; dia sem venda vira nulo; poucos dias; sem base; para quem não é dono nenhum campo `valor` existe
- [x] T003 [US2] `cadastros/painel.ts` (`ler`): ler a base ativa da loja pelo repositório da Escala e devolver `faturamentoPorHora`; base ilegível ou ausente devolve `{ temBase: false }`, nunca derruba o painel; nada mais na resposta muda
- [x] T004 [US6] Teste de integração do painel: loja com base devolve a série; loja sem base devolve `temBase: false`; o dono recebe `valor` e o gestor e a consulta não (o campo nem existe na resposta); o resto da resposta é o mesmo de antes
- [x] T005 Rodar os testes do servidor e commitar a fatia

## Fatia 2 — Regras puras do gráfico (Histórias 2, 3 e 4, P1/P2)
- [ ] T006 [US3] `cadastro-loja/turnos/turnos-grafico.js` (novo, puro): horas do eixo pela janela da loja; faturamento do turno (soma das horas, % do dia, média por hora, pico e as horas dele) para turnos normais, sobrepostos e que viram a noite; as 3 horas de maior faturamento; faixas e linhas dos turnos; quais pares de turnos têm alça (fim = início do próximo)
- [ ] T007 [US2] Em `turnos-grafico.js`: `moverLimite(turnos, indice, novaHora)` muda o fim do turno e o início do seguinte, de 1 em 1 hora, com mínimo de 1 hora por turno e sem sair da janela; devolve os turnos no formato que a tela já edita
- [ ] T008 [US4] Em `turnos-grafico.js`: `sugerirTurnos(serie, janela, turnosAtuais)` agrupa as horas em k trechos contíguos minimizando a variação do faturamento por trecho (k = turnos atuais, ou 3 se forem 1 ou 2, até o máximo de hoje), mantém nomes e mínimos dos turnos atuais por ordem, com Farmacêutico no mínimo 1; nunca altera a entrada
- [ ] T009 [P] [US2] `turnos-grafico.test.js`: faturamento do turno à mão (inclusive turno que vira a noite e hora fora da janela); mover limite (passo de 1 hora, mínimo de 1 hora, bordas); sugestão (corte onde o movimento muda, k pedido, mínimos preservados, determinística)
- [ ] T010 Rodar os testes da tela e commitar a fatia

## Fatia 3 — Aba, ordem, padrão e tokens (História 1, P1)
- [ ] T011 [US1] `cadastro-loja/config.js`: texto da aba "Custos e Turnos" (o id interno `regras` não muda); conferir pendências, atalhos e `DetalheLoja.jsx` que a nomeiam
- [ ] T012 [US1] `AbaRegras.jsx`: ordem "Custos de Salário em Folha" (só dono), "Turnos", "Encargos e Convenção Coletiva" (encargos só dono + convenção, com os mesmos textos e comportamentos); o bloco de encargos sai de dentro de Custos
- [ ] T013 [US1] Modo padrão: loja sem modo escolhido abre em "Por turnos" com os turnos iniciais de hoje, e o ponto de partida do rascunho é o mesmo (nada de "alteração pendente" ao abrir); quem já guardou um modo mantém o guardado; testes da regra
- [ ] T014 [P] `styles/alquimia.css`: tokens `--chart-bar`, `--chart-band-border`, `--chart-band-selected`, `--chart-turn-tint-a`, `--chart-turn-tint-b`, `--chart-detail-border`, `--chart-band-text`
- [ ] T015 Rodar os testes da tela, conferir no navegador e commitar a fatia

## Fatia 4 — Seção Turnos: gráfico, tabela e detalhe (Histórias 2 e 3, P1)
- [ ] T016 [US2] `turnos/GraficoDeTurnos.jsx`: barras por hora relativas ao maior valor, 3 picos em destaque, rótulos de hora, faixas dos turnos, seletor de tipo de dia, aviso de poucos dias, linha de apoio; barras `aria-hidden`
- [ ] T017 [US2] Alças e teclado em `GraficoDeTurnos.jsx`: arrastar (mouse e toque) e setas esquerda e direita movem o limite em 1 hora pelo mesmo `onMudar` dos campos; Enter seleciona; Tab foca faixas e alças; anúncio "Turno <nome>, <início> a <fim>"
- [ ] T018 [US3] `turnos/TabelaDeTurnos.jsx`: colunas Turno, Início, Fim, Faturamento (valor do dia e % do dia), Farmacêutico, Atendimento, Caixa e remover; mesmos campos e contadores de hoje; nota "Farmacêutico: obrigatório, mínimo 1 (Lei 13.021/2014)."; linha selecionada com fundo e barra lateral
- [ ] T019 [US3] `turnos/DetalheDoTurno.jsx`: média por hora, pico, faturamento do turno e mini gráfico com valor acima, barra e hora abaixo, pico em destaque; acompanha início e fim em tempo real
- [ ] T020 [US3] `MinimoPessoas.jsx`: título "Pessoas por Turnos na Loja", textos de hoje mantidos, seletor "Por turnos | Mínimo único do dia" (modo único igual a hoje); seleção sincronizada entre faixa e linha; "+ Adicionar turno" pela regra de hoje
- [ ] T021 [US6] Perfis: para quem não é dono a tabela mostra só "% do dia" e o gráfico só as formas; nenhum valor em reais na tela
- [ ] T022 Rodar os testes da tela, conferir no navegador (dono e gestor, arrastar, teclado, tipo de dia) e commitar a fatia

## Fatia 5 — Sugerir turnos e estado sem dados (Histórias 4 e 5, P1/P2)
- [ ] T023 [US4] Barra de ações: "+ Adicionar turno", "Sugerir turnos pelo movimento" (pré-visualização com faixas tracejadas, "Aplicar" e "Descartar"; só aplica com confirmação, pelo mesmo `onMudar`) e o texto "Pessoas mínimas no horário da loja"
- [ ] T024 [US5] `turnos/SemFaturamento.jsx` e estado sem dados: caixa tracejada "Sem faturamento por hora" com o texto e o botão "Enviar base comercial" (abre o envio de base que já existe), linha do tempo simples dos turnos, "—" no faturamento, sem detalhe, "Sugerir turnos pelo movimento" desabilitado com a dica "Envie a base comercial para usar esta função."
- [ ] T025 [US5] Ao concluir o envio da base, recarregar o painel e passar ao estado normal sem perder os turnos editados do rascunho
- [ ] T026 [P] Testes da tela: estado sem dados, sugerir/aplicar/descartar, sincronização faixa e linha
- [ ] T027 Rodar os testes da tela e commitar a fatia

## Fatia 6 — Celular, validação e entrega
- [ ] T028 Conferir em 375 px: gráfico e tabela rolam dentro do quadro, a página não rola para o lado, alças alcançáveis por toque
- [ ] T029 Percorrer o `quickstart.md` no navegador local (lojas com e sem base, dono e gestor, teclado, celular)
- [ ] T030 Rodar tudo (servidor, integração, tela e type-check), commitar e subir a branch `feat/custos-e-turnos`

## Dependências e ordem
- T001 antes de T003; T006 antes de T007 a T009; T014 antes das Fatias 4 e 5.
- A Fatia 3 pode andar junto da Fatia 1; a Fatia 4 depende das Fatias 1, 2 e 3; a Fatia 5 depende da 4.
- T025 depende de T003 e T024.

## Estratégia
Primeiro o dado certo e protegido no servidor, depois as contas do gráfico puras e testadas, depois a aba e o padrão (que não dependem do gráfico), e por último os componentes, o sugerir e o estado sem dados. Cada fatia é testável sozinha, e a tela sem base continua editando e gravando turnos como hoje em todas elas.
