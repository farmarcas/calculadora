# Tasks: Só contratação integral

**Input**: `/specs/044-so-contratacao-integral/` (spec, plan, research, data-model, contracts, quickstart)

Servidor: `backend/node/src/modules`. Tela: `frontend/react/src/features`.

## Phase 1: Fundação — o motor só sugere integral (bloqueia as histórias)

- [ ] T001 Em `regras/contratacao-horas.ts`, `sugerirContratacao` devolve só `{ principal }` integral: `inteiras = ceil(gapH ÷ jornadaIntegralH)`, `parcialH = null`, `extrasH = 0`, `variante = null`, `alternativa = null`; gap desprezível continua sem sugestão. Atualizar `contratacao-horas.test.ts` (casos de parcial, integral + parcial e variante viram integral; ociosidade = `inteiras × J − gap`).
- [ ] T002 Em `regras/capacidade.ts`, tirar o aviso do CRF para parcial e o ramo `parcial` (turnos novos do parcial); `contratar = contratarInteiras`, `parcialH = null`, `parcialTurnos = 0`; ajustar `capacidade.test.ts`.
- [ ] T003 Em `escala/semana-com-folgas.ts`, o laço só trata integrais (cargas = `inteiras × cheia`); `turnosParaVaga` deixa de ter o ramo de parcial por dia e usa o de integral (até `regra.dias` dias, até o máximo do dia); ajustar `semana-com-folgas.test.ts`.

## Phase 2: História 1 — Cenários só com integral (P1)

**Teste independente**: o Diagnóstico não tem a palavra "parcial" e as contratações são integrais.

- [ ] T004 [US1] Em `escala/{cenarios,comparativo,etapas,linhas-cenarios,diagnostico}.ts`, remover campos e textos de parcial (`parcial`, `parcialH`, `horasParciais`, `distribuicao` do parcial); `contratacoesDe`/`vagasDe` só com inteiras; manter os campos antigos como `null` onde o contrato os expõe.
- [ ] T005 [US1] Remover `escala/distribuir-parcial.ts` e seus usos em `diagnostico.ts` se nada mais o chamar (e `distribuir-parcial.test.ts`).
- [ ] T006 [US1] Em `escala/premissas.ts`, `limiteParcial` fica aceito e ignorado; tirar de qualquer texto da tela.
- [ ] T007 [US1] Atualizar os testes de unidade e de integração dos cenários (`cenarios.test.ts`, `comparativo.test.ts`, `etapas.test.ts`, `linhas-cenarios.test.ts`, `diagnostico.test.ts`, `escala.routes.integration.test.ts`) com os números novos, **listando cada mudança**.
- [ ] T008 [US1] Na tela, `diagnostico/cartao/linha-regras.js` e `Comparativo.jsx`: sem "· parcial" nem `parcialHoras`; teste em `linha-regras.test.js`.

## Phase 3: História 2 — "+ Contratar" só integral (P1)

- [ ] T009 [US2] Em `simulacao/escala/FormularioContratar.jsx`, tirar o seletor de tipo; a contratação é integral com a carga cheia da regra (`regraInfo`), mostrando "Integral · N h por semana".
- [ ] T010 [US2] Em `simulacao/escala/escala-regras.js`, `sugerirContratacao`/`erroDoFormulario`/`cargaDaContratacao`/`turnosParaVaga` só para integral; remover `LIMITE_PARCIAL_H`/`MIN_VAGA_H` do que for de contratação nova; ajustar `escala-regras.test.js`.
- [ ] T011 [US2] Em `simulacao/escala/EscalaPorHora.jsx`, `EscalaMobile.jsx` e `LinhaDaSemana.jsx`, textos "parcial" viram "integral"/somem ("Contratação simulada · 40h").

## Phase 4: História 3 — Personalizar com integrais (P1)

- [ ] T012 [US3] Em `simulacoes/vagas.ts`, `vagasSugeridas` e `aplicarVagasEDesligados` só com integrais (cheia = `min(44, floor(teto efetivo))`); `simulacoes.service.ts`: `criar` com `comVagasSugeridas` já cria vagas integrais pela semana com folgas.
- [ ] T013 [US3] Teste de integração: para cada regra, o número de contratações do cartão é igual ao das vagas da Simulação aberta por Personalizar, todas com a carga cheia (SC-003).

## Phase 5: História 4 — Vaga nova só integral; antigas abrem (P2)

- [ ] T014 [US4] Em `simulacoes/simulacoes.service.ts` (editar/criar com `vagas`), recusar vaga **sem** matrícula com `cargaH` diferente da jornada cheia da regra da simulação: "A contratação é integral: N horas por semana nesta regra."; vagas com matrícula passam como estavam.
- [ ] T015 [US4] Ajustar os testes de integração que criam vagas de 16h e 20h (`simulacoes.routes.integration.test.ts`) para a carga cheia e adicionar: vaga nova de 20h é recusada; simulação gravada antes com vaga parcial abre igual (criada direto no banco de teste com `cargaH` 20).
- [ ] T016 [US4] Em `simulacoes/{resultado,resultado-em-horas}.ts` e `simulacao/{PassoContratacoes.jsx,resultado-regras.js}`, manter a leitura de `tipo: 'parcial'` só para vagas antigas; nada novo mostra "parcial".

## Phase 6: Fechamento

- [ ] T017 Rodar toda a suíte (servidor: `npm test`, `npm run test:integration`, `tsc`, `eslint`; tela: `npm test`, build) e corrigir; listar os testes cujos números mudaram de propósito.
- [ ] T018 Conferir no navegador (dono, gestor, consulta) os passos do `quickstart.md`; sem R$ para quem não pode; Cadastro intacto.
- [ ] T019 Atualizar o `README.md` (cenários, Personalizar, "+ Contratar") e retirar as menções a parcial e ao limite do parcial.

## Dependências e ordem

T001 → T002 → T003; depois US1 (T004→T008), US2 (T009→T011), US3 (T012→T013), US4 (T014→T016), por fim T017–T019.

MVP: Fundação + US1 + US3 (T001–T008, T012–T013): os cenários e o Personalizar já saem integrais.

Risco: T001–T004 mexem no motor dos cenários e vão mudar muitos números nos testes; cada passo roda a suíte inteira antes do seguinte, e cada mudança é listada.
