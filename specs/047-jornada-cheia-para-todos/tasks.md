# Tasks: Jornada cheia para todos

**Input**: `/specs/047-jornada-cheia-para-todos/` (spec, plan, research, data-model, contracts, quickstart)

Servidor: `backend/node/src/modules`. Tela: `frontend/react/src/features/simulacao/escala`.

## Phase 1: Fundação — horas em minutos inteiros (bloqueia as histórias)

- [x] T001 Em `simulacoes/simulacoes.schemas.ts`, `hora` aceita minutos inteiros (`h × 60` inteiro, tolerância de 1e-6) em vez de quartos; mensagem "Use horários com minutos inteiros"; ajustar os testes de integração que recusavam fora dos quartos para recusar só fração de minuto (`15.4001`) e aceitar `15.4`.
- [x] T002 Em `simulacoes/vagas.ts`, `emQuartosDeHora` vira `emMinutosDeHora` (arredonda ao minuto, sem distorcer o Cadastro); atualizar os usos em `simulacoes.service.ts`, o teste do 14h38 (agora o horário fica 14h38) e `vagas.test.ts`.
- [x] T003 Na tela, `escala-regras.js`: `turnosParaGravar` arredonda ao minuto (no lugar do quarto) e mantém `antes`; `movimento-regras.js`: `moverTurno` mantém a duração (saída = entrada + duração, sem arredondar a quarto); `redimensionarTurno` segue em quartos; testes.

## Phase 2: História 1 e 2 — Completar a jornada na conta dos cenários e no Personalizar (P1)

**Teste independente**: Cosmópolis, 42h: cada pessoa fecha em 42h (8h24 × 5) e as contratações diminuem ou ficam iguais.

- [x] T004 [US1] Em `escala/semana-com-folgas.ts`, `esticarTurnos` ganha a **fase 2**: depois da fase 1, para cada pessoa sem horário fixo e cada dia que trabalha, completar a duração líquida até `jornadaDia = min(maxDia, tetoEfetivo ÷ dias)` (limite da pessoa `min(cargaH, teto)`): estender o fim até fechar ou até o descanso de 11 h; se não alcançar, o começo até abrir; intervalo de 1 h quando passa de 6 h; tudo em minutos; guarda `antes`.
- [x] T005 [US1] Testes em `escala/semana-com-folgas.test.ts`: 7h/dia vira 8h24 em 5 dias (42h); sem convenção vira 8h × 5 (40h); regra de 44h vira 7h20 × 6; não passa do máximo do dia nem do teto; não sai do horário da loja; respeita o descanso de 11 h; quem está na jornada, horário fixo e vagas não mudam; não cria dias; carga menor limita; determinístico; a falta só diminui.
- [x] T006 [US2] Atualizar os testes de unidade e de integração que mudam de número (cenários, comparativo, diagnóstico, simulações), **listando cada mudança**; teste de integração: Personalizar traz turnos completados com minutos e `antes`, nenhuma pessoa passa de 42h nem de 8h24 por dia, e as contratações do cartão são iguais às das vagas e menores ou iguais às de antes (SC-001 a SC-003).

## Phase 3: História 3 — A tela mostra e explica (P2)

- [x] T007 [US3] Em `escala-regras.js`: `textoDoEsticamento` passa a dizer "para completar a jornada de 42h" quando o crescimento foi por jornada (e "para cobrir a falta" quando foi por falta); como o servidor guarda só `antes`, a dica usa "para cobrir a falta e completar a jornada, dentro do limite de 42h"; testes.
- [x] T008 [US3] `LinhaDaSemana.jsx`/`semana-regras.js`: o total da semana mostra os minutos (por exemplo "42h · 5 dias"; "41h45" quando for o caso) sem destaque de excesso; teste.
- [x] T009 [US3] Em `folgas-regras.js`, `esticarTurnos` na tela com a fase 2 e os mesmos casos do servidor; "Sugerir folgas"/"Desfazer sugestão" seguem a mesma chave; testes.

## Phase 4: Fechamento

- [x] T010 Rodar toda a suíte (servidor: `npm test`, `npm run test:integration`, `tsc`, `eslint`; tela: `npm test`, build) e corrigir; listar os testes cujos números mudaram de propósito.
- [x] T011 Conferir no navegador (dono, gestor, consulta) os passos do `quickstart.md`, em Cosmópolis, depois de reiniciar a API; Cadastro intacto.
- [x] T012 Atualizar o `README.md` (cenários, Personalizar, folgas, esticamento) com a jornada cheia e os minutos inteiros.

## Dependências e ordem

T001 → T002 → T003 (em paralelo com T001 e T002 na tela); depois T004 → T006, T007 → T009, por fim T010 → T012.

MVP: T001–T006: o servidor já completa a jornada de todos nos cenários e no Personalizar.

Risco: T001–T003 mudam o que a Simulação aceita guardar; T004–T006 mudam a conta dos cenários. Cada passo roda a suíte inteira antes do seguinte, e as mudanças de número são listadas.
