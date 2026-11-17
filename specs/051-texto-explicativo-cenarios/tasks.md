# Tasks: Texto explicativo em cada cenário

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

## Phase 1: Servidor (US1, US2, US3)

- [x] T001 [US1] Em `backend/node/src/modules/escala/linhas-cenarios.ts`, adicionar o tipo `Explicacao = { partes: { texto: string; negrito?: boolean }[] }` e o campo `explicacao: Explicacao | null` em `LinhaDeCenario`.
- [x] T002 [US1] Criar `explicacaoDaLinha(coluna, status, dono, custoPctFaturamento, custoSentido, custoEstado)` em `linhas-cenarios.ts`: Manter horários (aumenta, igual, diminui; "caminho recomendado" só quando cobre tudo; quando não cobre, "Ainda faltariam N h de F por semana."; dono sem salários ou faturamento omite o custo).
- [x] T003 [US2] Na mesma função, Sem contratações: falta de função (trecho em negrito "Mesmo assim, ainda faltariam N h de F por semana." com a função de mais horas e "e mais N h de outras funções"), e o caso que resolve. Texto "Analisar", nunca "Personalizar", "p.p." ou "pontos".
- [x] T004 [US3] Gestor e consulta: mesmas frases sem "R$" e sem "%"; confirmar que `explicacao` é montada com `dono` e que nenhum campo de custo novo sai na resposta.
- [x] T005 Ligar `explicacao` em `montarLinhas` (nulo para indisponível e Equilíbrio) e manter `causa` como está.
- [x] T006 [P] Testes em `linhas-cenarios.test.ts`: Cosmópolis (8,0 → 9,7, R$ 7.659), Paulínia (10,3 → 14,7, R$ 11.112), folha igual, folha diminui, Manter que não cobre, Sem contratações com falta de farmacêutico, de outra função, de várias funções, que resolve, gestor sem "R$"/"%", sem salários, indisponível.
- [x] T007 Teste de integração da rota de cenários: dono recebe `explicacao` com números; gestor e consulta recebem `explicacao` sem "R$" nem "%".

## Phase 2: Tela (US1, US2)

- [x] T008 [US1] Em `frontend/react/src/features/diagnostico/cartao/linha-regras.js`, função `partesDaExplicacao(linha)` que devolve os trechos para desenhar (e o texto corrido para o `aria-label`).
- [x] T009 [US2] Em `LinhaDeCenario.jsx`, desenhar `linha.explicacao` em texto de 13 px na cor normal, com o trecho `negrito` em preto e negrito (AA), no lugar da faixa amarela de causa; a faixa continua quando não há `explicacao`.
- [x] T010 [P] Testes em `linha-regras.test.js` para os trechos (com e sem negrito, sem "p.p.", sem "Personalizar").

## Phase 3: Fechamento

- [x] T011 Rodar `tsc`, `eslint`, testes de unidade e de integração da API (sozinho) e testes e build da tela.
- [x] T012 Conferir no navegador (1236 px) em Cosmópolis e Paulínia como dono, e como gestor e consulta; frases em até 3 linhas.
- [x] T013 Atualizar o `README.md` (linha antes de "Cenários lado a lado") e marcar as tarefas.
- [x] T014 Commit na branch atual, push, atualizar `local/ver-tudo`. Sem PR novo.

## Dependências

T001 → T002 → T003 → T004 → T005 → T006/T007; T008 depende de T005; T009 depende de T008; T011–T014 por último.
