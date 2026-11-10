# Tarefas: Resultado da simulação em horas e porcentagem

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node/src/modules/simulacoes`, tela em `frontend/react/src/features`. Cada fatia termina com os testes passando e um commit. Sem migration e sem apagar dado. O cálculo da simulação, os campos em reais já existentes (só dono), a lista, a comparação de simulações salvas e o passo de contratações não mudam. A tela não tem biblioteca de teste de componente: as regras vão em funções puras testadas, e o visual é conferido no navegador. Esta entrega depende da spec 037 (cenários em linhas): a branch nasce em cima dela.

## Fatia 1 — Servidor: o bloco `emHoras` (Histórias 1, 3, 4, 5 e 6)
- [x] T001 [US3] `simulacoes/resultado-em-horas.ts` (novo, puro): `statusDaSimulacao` escolhe o primeiro que se aplica entre `inviavel` (sem farmacêutico no quadro), `vende_mais` (ganho de venda e nenhuma perda), `perde_venda`, `equipe_menor` (ainda faltam horas depois das contratações) e `cobre`; `causaDaSimulacao` devolve uma só frase ("Sem farmacêutico no quadro.", "Faltam X h de <função>.", "Sem venda por hora: perda não estimada.", "Venda das horas novas é estimada.") ou nulo
- [x] T002 [US1] Em `resultado-em-horas.ts`: variações em % com uma casa e sem zero negativo: venda = (venda real estimada das horas novas − venda real que deixa de entrar) ÷ faturamento mensal real; custo de pessoal = (folha das vagas + hora extra) ÷ folha do quadro de hoje; estados `ok`, `nao_estimada`, `sem_salarios`, `sem_calculo`
- [x] T003 [US4] Em `resultado-em-horas.ts`: `contratarDe(funcoes)` agrupa as vagas por função em `{ funcao, inteiras, parciaisHoras }` (integral = carga a partir do teto da regra, como o resultado já decide); `montarEmHoras(entrada)` junta tudo com `pessoas`, `horasContratadas`, `horasAbertas` e `horaExtraH` (hoje e simulação)
- [x] T004 [P] [US3] `simulacoes/resultado-em-horas.test.ts`: cada status e a prioridade; cada causa; % à mão (zero, positivo, negativo); sem venda por hora; sem salários; contratar com inteiras e parciais; nenhuma chave em reais na saída
- [x] T005 [US1] `simulacoes/resultado.ts`: calcular para todos os perfis a venda real que sai e a venda real estimada (mesma conta, sobre a venda real), o faturamento mensal real, a folha do quadro de hoje, o custo adicional, as pessoas e as horas contratadas de hoje e da simulação e a hora extra em horas; devolver `emHoras` em `base` (antes do corte do dono); os campos em reais seguem só para o dono
- [x] T006 [US5] Teste de integração em `simulacoes/simulacoes.routes.integration.test.ts`: dono, gestor e consulta recebem `resultado.emHoras` idêntico; nenhum campo em reais nem salário; os campos em reais existentes continuam só para o dono; uma simulação que contrata mostra `custoPct` maior que zero e `pessoas.simulacao` maior que `pessoas.hoje`
- [x] T007 Rodar os testes do servidor (unidade e integração) e commitar a fatia

## Fatia 2 — Regras puras do card na tela (Histórias 1 a 4)
- [x] T008 [US2] `features/simulacao/resultado-regras.js` (novo, puro): `diasDaSimulacao(horario)` adapta `horario.dias` e `horario.cadastro` ao formato de `faixaDosDias` (`aberta` → `aberto`); `linhaDaTabela(rotulo, hoje, simulacao, unidade)` devolve hoje, simulação e a mudança com o sinal "−" tipográfico e o tom (verde para mais pessoas ou horas contratadas, vermelho para menos horas abertas)
- [x] T009 [US4] Em `resultado-regras.js`: `textoContratarSimulacao(contratar)` ("1 atendente", "2 caixas", "1 farmacêutico · parcial de 20h", "Nenhuma contratação"); `textoHoraExtra(h)` ("0h" com "não precisa", ou "6h por semana")
- [x] T010 [P] [US1] `resultado-regras.test.js`: adaptação do horário; mudança (zero, mais, menos, meia hora); contratar (inteiras, parcial com horas, nenhuma); hora extra; reaproveita `textoDaVariacao`, `textoDoTotal` e `faixaDosDias` da spec 037 sem repetir os testes deles
- [x] T011 Rodar os testes da tela e commitar a fatia

## Fatia 3 — A tela: o card novo (Histórias 1 a 6)
- [ ] T012 [US1] `features/simulacao/ResultadoEmHoras.jsx` (novo): pill de status; dois números grandes (Venda e Custo de pessoal em %, com o apoio "em relação a hoje" e "N contratações"); total de horas e faixa dos 7 dias (`FaixaDosDias`); tabela Hoje × Simulação × Mudança; "Contratar" por função; faixa amarela de causa; carregamento de hoje enquanto calcula; "Informe os salários para ver a variação do custo." quando faltam salários
- [ ] T013 [US5] `features/simulacao/PainelResultado.jsx`: título e ficha do tipo de solução, o corpo novo, e o botão "Salvar como cenário N" (ou "Clonar para ajustar") e o texto de apoio como hoje; remover as linhas em reais (saldo, folha extra, hora extra, margem, economia), o ⓘ da fórmula e a frase da régua
- [ ] T014 [US6] Conferir os estados: sem base comercial (Venda "Não estimada"), sem salários, simulação gravada (card recalculado), tela estreita (card empilhado sem rolar para o lado)
- [ ] T015 Conferir no navegador (dono, gestor e consulta; Arariba; celular de 375 px) e rodar os testes da tela; commitar a fatia

## Fatia 4 — Limpeza e fechamento
- [ ] T016 Remover de `features/simulacao/formato.js` e de outros arquivos as funções que só o painel antigo usava (saldo com sinal, fórmula do saldo, percentual do peso), sem tocar nas que a comparação e o passo de contratações usam
- [ ] T017 Rodar `tsc`, todos os testes (unidade, integração e tela) e `vite build`; atualizar o README onde descreve o card da Simulação; atualizar o `local/ver-tudo`; enviar a branch `feat/simulacao-resultado-em-horas`

## Dependências
- Fatia 1 antes da 3 (a tela lê `emHoras`). Fatia 2 antes da 3. Fatias 1 e 2 são independentes entre si.
- A limpeza (fatia 4) só depois de o card novo funcionar.
- O PR desta entrega só deve ser aberto depois do PR dos cenários em linhas.

## Ordem sugerida
Fatia 1, fatia 2, fatia 3 e fatia 4. Nenhuma toca em dados: tudo é código e tela.
