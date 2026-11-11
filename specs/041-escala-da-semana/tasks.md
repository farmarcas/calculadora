# Tasks: Escala da semana

**Input**: `/specs/041-escala-da-semana/` (spec, plan, research, data-model, quickstart)

Formato: `- [ ] ID [P?] [Story] Descrição com caminho`. Pasta base da tela: `frontend/react/src/features/simulacao`.

## Phase 1: Fundação (bloqueia as histórias)

- [ ] T001 [P] Criar `escala/semana-regras.js` com `montarSemana({ quadro, turnos, diasAbertos })`: grupos por função (ordem Farmacêutico, Atendimento, Caixa), pessoas sem desligados, e por pessoa 7 células `turno | folga | fechada` (fechada = dia fora de `diasAbertos`; folga = dia aberto sem turno), intervalo via `textoDoIntervalo`, texto via `textoDoTurno`, total via `totalDaSemana` (intervalo descontado).
- [ ] T002 [P] Em `escala/semana-regras.js`, `passaDaJornada(horas, cargaH)` (verdadeiro só se `cargaH` existe e `horas > cargaH`) e `semEscala(turnos)` para o estado vazio.
- [ ] T003 Testes em `escala/semana-regras.test.js`: grupos e ordem; folga × fechada; intervalo omitido quando não há; total = soma das células sem o intervalo; Contratação simulada (`vaga`) com folga nos dias não cobertos; desligado não aparece; jornada; estado vazio.
- [ ] T004 [P] Tokens em `frontend/react/src/styles/alquimia.css`: `--escala-semana-farmaceutico|atendimento|caixa` (fundo e borda, só apontando para tokens do DS) e `--escala-semana-atencao`.

## Phase 2: História 1 — Ver a semana de cada pessoa (P1)

**Teste independente**: abrir uma Simulação com equipe e ver tabela, grupos, folga, fechada, intervalo e total.

- [ ] T005 [US1] Criar `escala/LinhaDaSemana.jsx`: nome + "função · carga"; 7 células (horário em negrito, "int. 11h" embaixo, cor da função; FOLGA tracejada cinza; FECHADA em texto); coluna Semana "Xh · Y dias".
- [ ] T006 [US1] Criar `escala/EscalaDaSemana.jsx`: cartão com título "Escala da semana", subtítulo "Veja a semana de cada pessoa, com folgas e intervalos.", legenda, cabeçalho Pessoa/Seg…Dom/Semana, grupos com chevron (Atendimento recolhido por padrão), tabela com rolagem lateral e coluna da pessoa fixa (`sticky`).
- [ ] T007 [US1] Estado vazio: texto "Ainda não há escala para esta semana. Cadastre os turnos para ver a escala da semana." e botão "Cadastrar turnos" (leva ao Cadastro da loja).
- [ ] T008 [US1] Em `SimulacaoPage.jsx`, renderizar `EscalaDaSemana` logo abaixo da `EscalaPorHora`, com `sim` (turnos com o ajuste em andamento), sem R$.

## Phase 3: História 2 — Contratação simulada (P1)

- [ ] T009 [US2] Em `LinhaDaSemana.jsx`, estilo da Contratação simulada (borda tracejada, nome em azul "Contratação simulada" + "função · Nh parcial"); linha própria no grupo da função, nos dias não cobertos aparece folga; entra no total. Conferir que remover a vaga tira a linha.

## Phase 4: História 3 — Clique no dia (P2)

- [ ] T010 [US3] Em `escala/EscalaPorHora.jsx`, aceitar `dia` e `onDia` opcionais (controlado quando vierem; sem eles, comporta-se como hoje).
- [ ] T011 [US3] Em `SimulacaoPage.jsx`, guardar o dia escolhido, passar para `EscalaPorHora` e para o card; ao clicar numa célula (folga e fechada incluídas, exceto onde a loja não abre), definir o dia e rolar até a Escala por hora.
- [ ] T012 [US3] Visualizador (`editavel` falso): células sem clique e sem cursor de ação; grupos continuam recolhendo e expandindo.

## Phase 5: História 4 — Aviso de jornada (P3)

- [ ] T013 [US4] Em `LinhaDaSemana.jsx`, destacar o total com `--escala-semana-atencao` quando `passaDaJornada`; sem destaque quando igual ou menor.

## Phase 6: Fechamento

- [ ] T014 Conferir no navegador (dono, gestor, visualizador) todos os passos do `quickstart.md`, incluindo largura estreita; checar que não há R$ no card.
- [ ] T015 Rodar `npm test`, lint e build do web; `npx tsc` não é necessário (sem mudança no servidor).
- [ ] T016 Atualizar `frontend/README.md` (ou o README da escala, se existir) com uma linha sobre a Escala da semana.

## Dependências e ordem

T001–T004 primeiro (paralelos entre si, T003 depois de T001–T002) → US1 (T005→T008) → US2 (T009) → US3 (T010→T012) → US4 (T013) → T014–T016.

MVP: Fundação + US1 + US2 (T001–T009): o card já mostra a semana e a Contratação simulada.
