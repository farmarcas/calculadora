# Tasks: Cenários de horário decididos por dia da semana

**Input**: `specs/009-cenarios-por-dia/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos (cada cenário conferido à mão, enumeração contra a conta manual, dias protegidos, origem da venda, permissões).
Formato: `[ID] [P] [US] descrição com caminho`. Caminhos do backend relativos a `backend/node/`, do front a `frontend/react/`.
Segurança do banco: sem migration nesta spec; nada de `down -v` nem `prisma migrate reset`.

## Ordem de execução entre as duas specs

1. **010 fatias 1 e 2** (regra de contratação do documento e etapas do Cenário 1), **antes** desta spec: o Cenário 3 usa a mesma regra de contratação.
2. **009 fatias 1 a 4** (esta spec)
3. **010 fatias 3 e 4** (comparativo e premissas; a recaptura entra pelas premissas)
4. **009 fatia 5** (remover o código por hora e fechar)

## Phase 1: Setup

- [X] T001 Conferir o branch `feat/cenarios-por-dia` (com a spec 010 fatias 1 e 2 já feitas), o ambiente de pé e os testes atuais verdes, anotando as contagens de partida

## Phase 2: Fatia 1 — Base por dia (fundação das US1 a US4)

**Teste independente**: venda e margem mensal por dia conferem com a conta à mão nas três origens; os três dias de maior faturamento saem como protegidos.

- [X] T002 Teste + `src/modules/escala/vendas-cadastro.ts`: devolver também se a venda veio só do mensal (`soMensal`)
- [X] T003 Teste + `src/modules/escala/cenarios-dias.ts`: `vendasPorDia` (soma das horas de cada dia da semana, venda e margem médias), origem (`base`, `cadastro`, `estimativa`), margem mensal (× 52 ÷ 12), dias protegidos (3 de maior faturamento entre os dias abertos; empate: o mais tardio)
- [X] T004 `src/modules/escala/cenarios.ts` e `diagnostico.ts`: tipos novos de resposta (`vendasPorDia`, `origemVenda`, `diasProtegidos`) e entrada dos cenários com a venda por dia
- [X] T005 Valores de venda e margem só para o dono em qualquer origem (hoje só quando a origem é o cadastro), em `diagnostico.ts`; ajustar os testes que esperavam gestor e consulta vendo venda e margem com base comercial
- [X] T006 Rodar tudo e commitar a fatia

## Phase 3: Fatia 2 — US1 + US4: Cenário 2, fechar dias (P1) 🎯 MVP

**Teste independente**: equipe que não cobre os sete dias: fecha o de menor margem até caber; só fecha dia protegido como último recurso, marcando "não recomendado".

- [X] T007 [US1] Teste + `cenarios-dias.ts`: `montarEconomiaDia` (guloso por menor margem mensal, não protegidos primeiro; `naoRecomendado` com os dias atingidos; nunca fecha o último dia aberto; indisponível apontando o Cenário 1; margem perdida; horário novo), com contas à mão
- [X] T008 [US1] Casos de borda com testes: equipe já cobre, loja 24 horas, loja que abre só alguns dias, faturamento só mensal (estimativa avisada), sem faturamento nem base (indisponível dizendo o que falta), em `cenarios-dias.test.ts`
- [X] T009 [US1] Teste de integração: Cenário 2 nas duas regras, origem da venda, dono × gestor × consulta, em `escala.routes.integration.test.ts`
- [X] T010 [P] [US1] Cartão do Cenário 2 (dias a fechar, horário novo, margem perdida só ao dono, "não recomendado", origem da venda, frase-resumo) em `features/diagnostico/Cenarios.jsx`

**Checkpoint**: o Cenário 2 decide por dia.

## Phase 4: Fatia 3 — US2: Cenário 3, equilíbrio por enumeração (P1)

**Teste independente**: em loja com um dia de pouca venda e contratação cara, o escolhido é o de maior resultado, conferido contra a enumeração manual.

- [X] T011 [US2] Teste + `cenarios-dias.ts`: `montarEquilibrioDia` (enumera os subconjuntos não vazios dos dias abertos sem dia protegido, até 127; contratações pela regra da spec 010; `resultado = margem dos dias abertos − custo adicional`; desempate por menos contratações e depois menos dias fechados; `coincideComManter` e `coincideComEconomia`; frase-resumo)
- [X] T012 [US2] Testes de otimalidade: conta à mão sobre todas as combinações de um caso pequeno e propriedade de dominância (o equilíbrio nunca é pior que os cenários 1 e 2), em `cenarios-dias.test.ts`
- [X] T013 [US2] `destacar` (selo "Menor impacto financeiro") com os números novos dos cenários 2 e 3; falta de custos ou faturamento diz o que falta; teste de integração, em `cenarios.ts` e `escala.routes.integration.test.ts`
- [X] T014 [P] [US2] Cartão do Cenário 3 (dias fechados, contratações, resultado, frase-resumo, avisos de coincidência) em `features/diagnostico/Cenarios.jsx`

**Checkpoint**: o equilíbrio é sempre o melhor resultado possível.

## Phase 5: Fatia 4 — US3: Cenário 4, abrir um dia fechado (P2)

**Teste independente**: loja fechada aos domingos com sobra na equipe do Cenário 1: o domingo abre sem nova contratação, e a margem de referência confere com a conta à mão.

- [ ] T015 [US3] Teste + `cenarios-dias.ts`: `montarEstenderDia` (equipe = atual + vagas do Cenário 1; candidatos = dias fechados; cabe sem nova contratação; horário do dia aberto mais curto; margem do dia no cadastro ou na base, senão 50% da média dos dias abertos, avisada como referência; escolhe o de maior margem e repete enquanto couber)
- [ ] T016 [US3] Casos de borda com testes: nenhum dia fechado, sem sobra de capacidade, faturamento do dia fechado conhecido, sem venda nenhuma
- [ ] T017 [US3] Teste de integração do Cenário 4 e das permissões, em `escala.routes.integration.test.ts`; [P] cartão do Cenário 4 (dia a abrir, horário, margem de referência, aviso) em `features/diagnostico/Cenarios.jsx`

**Checkpoint**: o Cenário 4 abre dias, não horas. Segue a spec 010 (fatias 3 e 4).

## Phase 6: Fatia 5 — Fechamento (depois da spec 010 fatias 3 e 4)

- [ ] T018 Remover o código por hora (`cortarPontas`, `candidatas`, `aplicarCorte`, `juntarFatias`, `cortarQueNaoSePagam`, `custoMensalDoTrecho`, o Estender por hora) e reescrever ou retirar os testes antigos dos cenários 2, 3 e 4 por hora; manter Manter, Reduzir equipe e o que eles usam
- [ ] T019 Permissões ponta a ponta (venda, margem, economia e resultado só ao dono) conferidas na tela com os três perfis
- [ ] T020 Conferir a loja 001: registrar os novos valores dos cenários 2, 3 e 4 e do selo (hoje: "Foco em economia", R$ 8.710) e explicar a diferença na tela
- [ ] T021 README (decisão por dia, dias protegidos, o que mudou e o que ficou de fora) e `quickstart.md` conferido
- [ ] T022 Rodar tudo: `npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit`, build do `web`, `scripts/sync-templates.sh --check`, `scripts/check-repo.sh`

## Dependências

- Antes: spec 010 fatias 1 e 2.
- T002 a T006 antes dos cenários; Fatia 2, 3 e 4 em ordem (o Cenário 3 compara com o Cenário 2; o Cenário 4 usa a equipe do Cenário 1).
- Fatia 5 só depois da spec 010 fatias 3 e 4.
