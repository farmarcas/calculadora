# Tasks: Intervalo de até 2 horas não precisa de cobertura

**Input**: `/specs/045-intervalo-do-farmaceutico/` (spec, plan, research, data-model, quickstart)

Servidor: `backend/node/src/modules`. Tela: `frontend/react/src/features/simulacao/escala`.

## Phase 1: Fundação — o critério em um ponto só (bloqueia as histórias)

- [ ] T001 Criar `regras/intervalo.ts`: `LIMITE_INTERVALO_SEM_COBERTURA_H = 2` e `intervaloDesconta(ini, fim)` (verdadeiro só quando `fim − ini > 2`); teste `regras/intervalo.test.ts` (1h, 2h exatas, 2h15, sem intervalo).
- [ ] T002 [P] `simulacoes/avaliar.ts`: `presente` só desconta quando `intervaloDesconta`; testes em `avaliar.test.ts` (1h conta, 2h conta, 3h desconta; Atendimento e Caixa também).
- [ ] T003 [P] `escala/cobertura.ts`: `cobre` com o mesmo critério; testes em `cobertura.test.ts`.
- [ ] T004 [P] `escala/distribuir-parcial.ts`: `cobreCelula` com o mesmo critério; teste.
- [ ] T005 [P] `escala/semana-com-folgas.ts`: `presente` com o mesmo critério; testes em `semana-com-folgas.test.ts` (almoço de 1h do único farmacêutico não vira falta nem contratação).

## Phase 2: História 1 e 2 — Intervalo sem falta, em todas as funções (P1)

**Teste independente**: o almoço de 1h do único farmacêutico (e do único caixa) não aparece como falta.

- [ ] T006 [US1] Atualizar os testes de unidade e de integração que dependiam do intervalo (cenários, comparativo, diagnóstico, simulações, vagas), com os números novos, **listando cada mudança**.
- [ ] T007 [US2] Teste de integração: loja com 1 caixa e meta de 1 por hora, caixa com intervalo de 1h: `avaliacao.cobertura` sem hora abaixo do mínimo; intervalo de 3h volta a descontar.
- [ ] T008 [US1] Teste de integração: Personalizar de uma loja em que a única falta é o almoço do farmacêutico não cria contratação por isso.

## Phase 3: História 3 — A tela explica (P2)

- [ ] T009 [US3] Em `escala-regras.js`: constante `LIMITE_INTERVALO_SEM_COBERTURA_H = 2`; `presente` e `recalcularCobertura` com o critério; `quemEstaEmIntervalo` só para a dica (quem está em intervalo de até 2 h e, por isso, não abre falta); testes em `escala-regras.test.js` com os mesmos casos do servidor.
- [ ] T010 [US3] `LinhaDaPessoa.jsx`: dica da barra "Intervalo 10h–11h: não precisa de cobertura (até 2 horas)"; `LinhaDaFuncao.jsx`: dica da célula "Em intervalo (não precisa de cobertura): Eliane"; `EscalaMobile.jsx` com o mesmo texto.
- [ ] T011 [US3] Conferir `folgas-regras.js` e `movimento-regras.js`: usam a mesma cobertura recalculada (nada a repetir); teste de uma folga que deixa de abrir falta por causa do almoço.

## Phase 4: Fechamento

- [ ] T012 Rodar toda a suíte (servidor: `npm test`, `npm run test:integration`, `tsc`, `eslint`; tela: `npm test`, build) e corrigir; listar os testes cujos números mudaram de propósito.
- [ ] T013 Conferir no navegador (dono, gestor, consulta) os passos do `quickstart.md`, depois de reiniciar a API; Cadastro intacto.
- [ ] T014 Atualizar o `README.md` (cobertura e intervalo) e registrar a regra das 2 horas como pendência de confirmação com o jurídico.

## Dependências e ordem

T001 → T002–T005 (em paralelo); depois T006–T008, T009–T011, por fim T012–T014.

MVP: T001–T008: o servidor (Diagnóstico, Simulação e cenários) já não conta o almoço como falta.

Risco: T006 muda números de vários testes de cenários; cada passo roda a suíte inteira antes do seguinte.
