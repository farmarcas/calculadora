# Tasks: Cobertura por turno e parâmetros legais editáveis

**Input**: `specs/008-cobertura-por-turno/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos (conta por camadas conferida à mão, paridade com o mínimo único, validação de turnos, versão vigente, quadro por turno, permissões).
Formato: `[ID] [P] [US] descrição com caminho`. Caminhos do backend relativos a `backend/node/`, do front a `frontend/react/`.
Regra de ouro: **os testes que já existem não mudam e seguem verdes** (paridade). Segurança do banco: nada de `down -v`, `prisma migrate reset`; só migration nova.

## Phase 1: Setup

- [X] T001 Conferir o branch `feat/cobertura-por-turno`, o ambiente de pé (`docker compose ps` saudável) e os testes atuais verdes (`npm test`, `npm run test:integration`), anotando as contagens de partida (195 unitários, 105 de integração)

## Phase 2: Fatia 1 — Requisitos no motor (base da US4, sem mudança visível)

**Teste independente**: todos os testes antigos passam sem alteração; com requisitos por hora, a necessidade confere com a conta manual por camadas.

- [X] T002 Teste + `src/modules/regras/requisitos.ts`: tipo `Requisitos` (`funcoes`, `emHora(cargo, dia, hora)`), `comoRequisitos(minimos | requisitos)` (o mínimo antigo vira "igual em todas as horas"), `requisitosDaLoja(minimos, turnos)` e as camadas de necessidade (horas e blocos de 8 h por camada)
- [X] T003 Teste + `src/modules/regras/capacidade.ts`: `verificarRegra` aceita mínimo antigo ou requisitos; necessidade de horas = soma por hora, de turnos = soma por camada de ⌈horas ÷ 8⌉; com requisito igual dá o mesmo número de hoje; `memoria` cita o turno quando houver
- [X] T004 [P] Teste + `src/modules/escala/cobertura.ts`: exigência por hora (`ok` compara com o requisito da hora); campo `minimo` continua para compatibilidade
- [X] T005 [P] Teste + `src/modules/simulacoes/avaliar.ts` e `vagas.ts`: cobertura por dia e hora e o aviso de falta usam o requisito da hora; aviso de intervalo descoberto só onde o requisito é 1
- [X] T006 Teste + `src/modules/escala/cenarios.ts` e `cenarios-extras.ts`: `custoMensalDaHora` passa a depender do requisito da hora cortada; cortes e extensões usam `verificarRegra` com requisitos (resultado idêntico com requisito igual)
- [X] T007 [P] Teste + `src/modules/apuracao/periodo.ts` e `simulacoes/simulacoes.service.ts`: o snapshot de premissas aceita a forma antiga e a nova; comparação "premissas mudaram" por igualdade profunda
- [X] T008 Rodar tudo: os 195 + 105 testes antigos continuam verdes sem alteração, `tsc` e `lint` limpos

**Checkpoint**: motor pronto para turnos; nada mudou para o usuário.

## Phase 3: Fatia 2 — US1 + US2: turnos e mínimos por turno (P1) 🎯 MVP

**Teste independente**: definir três turnos com mínimos diferentes, reabrir e conferir; turnos com buraco ou sobreposição são recusados; loja antiga abre igual.

- [X] T009 Migration `lojas.turnos` (Json, nula) e `schema.prisma`; gerar o client
- [X] T010 Teste + `src/modules/regras/turnos.ts`: validar turnos (1 a 6, sem sobreposição, sem buraco, dentro do horário aberto, nomes únicos, turno que vira a noite como dois pedaços, Farmacêutico ≥ 1, mínimos inteiros 0–10); resolver o turno de cada hora; pré-preencher os mínimos de cada turno com o mínimo único; avisar quando o horário da loja deixa de caber
- [X] T011 [US1] Teste + `src/modules/escala/escala.schemas.ts`, `escala.service.ts` e repositório: `PUT /lojas/:id/configuracao` aceita `turnos` (ou `null` para voltar ao mínimo único), mensagens em português, auditoria; `GET` devolve `turnos` e `turnosAvisos`
- [X] T012 [US2] Teste de integração: gravar e reler turnos e mínimos; recusas (sobreposição, buraco, fora do horário, mais de 6, Farmacêutico 0); consulta não edita; remover turno com mínimos pede confirmação (sinalizado na API), em `src/modules/escala/escala.routes.integration.test.ts`
- [X] T013 [P] [US1] Editor de turnos e mínimos por cargo (nome, início, fim, tabela cargos × turnos, mínimo único como ponto de partida, avisos de erro) em `src/features/diagnostico/Configuracao.jsx` (e componente novo `TurnosLoja.jsx` se ficar grande)

**Checkpoint**: a loja já exige quantidades diferentes por turno e o motor as usa.

## Phase 4: Fatia 3 — US3 + US4: quadro por turno e Diagnóstico (P1)

**Teste independente**: loja com pico à tarde mostra falta no turno certo e nunca num turno que cumpre; loja sem turnos dá o mesmo Diagnóstico de antes.

- [X] T014 Teste + `src/modules/escala/quadro-turnos.ts`: por cargo e turno, pessoas presentes (pior hora do turno no pior dia, descontado intervalo) × exigido, `falta`; lista de pessoas fora da conta com o motivo (sem função, sem horário, sem dias)
- [X] T015 [US4] Teste + `src/modules/escala/diagnostico.ts`: montar requisitos da loja, devolver `quadroTurnos` (um turno "Dia todo" quando não há turnos), explicação (`memoria`) citando o turno de origem da necessidade, nas regras 44h, 42h e 40h
- [X] T016 [US4] Teste de integração: Diagnóstico com turnos (necessidade maior no pico, menor que o pico aplicado ao dia todo), sem turnos (idêntico), cenários 2 a 5 respeitando o mínimo do turno e permissões inalteradas, em `src/modules/escala/escala.routes.integration.test.ts`
- [X] T017 [P] [US3] Quadro por turno na tela (cargos × turnos, presentes × exigido, destaque de falta, pessoas fora da conta) em `src/features/diagnostico/QuadroTurnos.jsx` e ligação em `Diagnostico.jsx`/`Configuracao.jsx`

**Checkpoint**: onde a loja está descoberta aparece por turno, e a contratação sugerida usa o mínimo de cada turno.

## Phase 5: Fatia 4 — US5: parâmetros legais editáveis (P2)

**Teste independente**: alterar a jornada da fase de 40h, ver o Diagnóstico recalcular, ver a versão antiga no histórico e voltar ao valor anterior; gestor e consulta só veem.

- [X] T018 Migration `parametros_legais` com a versão inicial (atual: 44 h, 8 h, 6 dias, 220; r42: 16/12/2026, 42 h, 8 h, 8,4 h com convenção, 5 dias, 210; r40: 01/12/2027, 40 h, 8 h, 5 dias, 200) e `schema.prisma`
- [X] T019 Teste + `src/modules/regras/parametros.ts`: versão vigente de uma fase (a mais recente com início ≤ hoje; se todas no futuro, a mais antiga), validação dos valores (jornada > 0, horas por dia em (0, 24], dias 1–7, divisor > 0), padrão = valores de hoje
- [X] T020 Teste + `src/modules/regras/perfis.ts` e `custos/custo.ts`: `regraPara(id, convenção, tabela = padrão)` e divisor vindo da tabela; todas as chamadas e testes atuais intactos
- [X] T021 Teste + `src/modules/parametros/` (rota, serviço, repositório): `GET /parametros-legais` (todos os perfis) e `POST /parametros-legais` (só dono, 403 para os demais), nova versão sem editar a antiga, auditoria `parametros.alterados`
- [X] T022 Serviços do Diagnóstico, simulações e apuração carregam a tabela vigente e a passam adiante; teste de integração: alterar a 40h muda o Diagnóstico, voltar restaura, em `escala.routes.integration.test.ts`
- [X] T023 [P] Tela `src/features/parametros/ParametrosLegais.jsx` (valores vigentes por fase, histórico, formulário de nova versão só para o dono) e entrada no menu da Escala

**Checkpoint**: a lei pode mudar sem alterar o sistema.

## Phase 6: Fatia 5 — US6 e fechamento

- [ ] T024 [US6] Aviso de estimativa ("valide com seu contador e com a convenção coletiva do sindicato") visível no Diagnóstico, junto dos cenários, em `src/features/diagnostico/Diagnostico.jsx`; `avisoEstimativa` na resposta; teste
- [ ] T025 Permissões ponta a ponta com dono, gestor e consulta (turnos, mínimos, parâmetros) conferidas na tela
- [ ] T026 Conferir que as lojas existentes (sem turnos) têm o mesmo resultado de antes: loja 001 com selo "Foco em economia", R$ 8.710 e margem de referência do Cenário 4 em R$ 3.770
- [ ] T027 README (turnos, mínimo por turno, parâmetros legais, aviso, o que ficou de fora) e `quickstart.md` conferido
- [ ] T028 Rodar tudo: `npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit`, build do `web`, `scripts/sync-templates.sh --check`, `scripts/check-repo.sh`

## Dependências

- T001 antes de tudo; Fatia 1 (T002–T008) antes das demais.
- Fatia 2 depende da 1; Fatia 3 depende da 2; Fatia 4 só depende da 1 (pode ir depois da 3); fechamento por último.
- Entrega em ordem: 1, 2, 3, 4, 5 (cada fatia termina com os testes verdes e commit).
