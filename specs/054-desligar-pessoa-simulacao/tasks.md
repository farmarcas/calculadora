# Tasks: Desligar pessoa na simulação

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

## Phase 1: Servidor (trava o comportamento) — US1, US2, US3

- [x] T001 [US1] Em `backend/node/src/modules/simulacoes/simulacoes.routes.integration.test.ts`, teste do ciclo: desligar uma pessoa muda pessoas ("hoje" = quadro inteiro, "simulação" = menos 1), horas contratadas e, para o dono, `custoDoDono` (folha cai); religar volta ao mesmo `resultado` e à mesma grade de turnos de antes.
- [x] T002 [P] [US1] Mesmo arquivo: desligar o único farmacêutico é aceito e o status do resultado é `inviavel` ("Sem farmacêutico no quadro"); desligar todos não dá erro.
- [x] T003 [P] [US3] Mesmo arquivo: simulação gravada recusa desligar (`SIMULACAO_NAO_EDITAVEL`); desligar uma vaga é recusado; gestor recebe a lista de desligados (marca `desligado` no quadro) e o resultado sem `custoDoDono` nem valores em reais; o Cadastro da loja não muda.

## Phase 2: Regras da tela — US1, US2

- [x] T004 Criar `frontend/react/src/features/simulacao/escala/desligados-regras.js`: `desligadosDoQuadro(quadro)` (só funcionário existente com `desligado`, com nome e função, em ordem), `listaAposDesligar(quadro, matricula)` e `listaAposReligar(quadro, matricula)` (a lista COMPLETA que o servidor espera), `podeDesligar(pessoa, editavel)` (nunca vaga), `tituloDaFaixa(n)` ("Desligados na simulação (N)") e `rotuloDoBotao(acao, nome)` ("Desligar Ana Souza" / "Religar Ana Souza").
- [x] T005 [P] Testes em `desligados-regras.test.js`: lista completa depois de desligar e de religar, vaga nunca desliga, sem desligados não há faixa (`null`), ordem estável, textos sem "p.p." nem "pontos".

## Phase 3: Tela — US1, US2, US3

- [x] T006 [US2] Criar `FaixaDeDesligados.jsx`: a faixa com o título, cada nome com a função e o botão "Religar" (só com `editavel`); sem desligados, nada aparece; em simulação gravada ou consulta, a faixa fica só leitura.
- [x] T007 [US1] Em `EscalaPorHora.jsx`: `desligar(matricula)` e `religar(matricula)` que chamam `onSalvar({ desligados })` com a lista completa, mostrar a faixa acima das visões e passar `onDesligar` às linhas e ao celular. Se a pessoa desligada estava selecionada, limpar a seleção.
- [x] T008 [P] [US1] Botão "Desligar" (com `aria-label` "Desligar {nome}", acessível por teclado) em `LinhaDaPessoa.jsx` (grade do dia), `LinhaDaSemana.jsx` (semana) e `EscalaMobile.jsx` (celular): só em funcionário existente e só com `editavel`.
- [x] T009 [US3] Confirmar que `SimulacaoPage.jsx` passa `editavel` (simulação editável e perfil que escreve) e que a faixa respeita gestor e consulta.

## Phase 4: Fechamento

- [x] T010 Rodar `tsc`, `eslint`, testes de unidade e de integração da API (sozinho) e testes e build da tela.
- [x] T011 Conferir no navegador em Cosmópolis como dono: desligar 1 atendente (Pessoas 8 → 7, folha cai), religar, desligar o único farmacêutico (inviável), recarregar a página; depois como gestor e como consulta; e confirmar que o Cadastro não mudou.
- [x] T012 Atualizar o `README.md` e marcar as tarefas; commit na branch atual, push e atualizar `local/ver-tudo`. Sem PR novo.

## Dependências

T001–T003 podem rodar já (o servidor existe). T004 → T005; T004 → T006 → T007 → T008 → T009; T010–T012 por último.
