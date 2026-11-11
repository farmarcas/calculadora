# Tasks: Diagnóstico da escala com tabela por cargo (A1)

**Input**: `specs/058-diagnostico-tabela-por-cargo/` (spec, plan, research, data-model, quickstart)

**Formato**: `- [ ] T### [P] [US#] descrição com caminho`. Pasta do front: `frontend/react/src/features/diagnostico/`.

## Phase 1: Regras puras (base de tudo)

- [ ] T001 Criar `tabela-cargos/tabela-regras.js` com `linhasPorCargo(regra)` (hoje → depois de pessoas, horas e falta; `turnosAcobrir`; `sobraH`), `statusDoCargo` (Obrigatório / Desejável / Sem falta, via `ehDesejavel`), `equipeToda(linhas, regra)` e `textoSetaHoras` ("21h → 0h")
- [ ] T002 [P] Criar `tabela-cargos/tabela-regras.test.js` cobrindo: farmacêutico sempre Obrigatório; outro cargo Desejável só com `contratar > 0`; sem falta mostra "—"; Equipe toda soma e a folga final; cargo inexistente não gera linha
- [ ] T003 Em `cardDiagnostico.js`, ajustar `estadoDoCard` para o chip rosa/verde e o título do estado sem falta ("Cobre o horário na regra de {N}h" no chip verde) e acrescentar `horasDaLoja(diag)`; atualizar `cardDiagnostico.test.js`

## Phase 2: US1 + US2 — Card A1 com tabela por cargo (P1)

**Meta**: layout A1 completo e correto por regra. **Teste**: Cosmópolis, abas 44h/42h/40h.

- [ ] T004 [P] [US1] Criar `tabela-cargos/BarrasDeFalta.jsx`: três barras de 8 px, 42h em vermelho e negrito (token mais próximo, comentário no código), `role="img"` com `aria-label` "42h: faltam 21h por semana"
- [ ] T005 [P] [US1] Criar `tabela-cargos/TabelaPorCargo.jsx`: `<table>` com `th scope`, linha "Loja aberta na semana", linhas por cargo com tag (`corDaFuncao`) + status em pílula (Obrigatório escuro, Desejável com contorno, Sem falta em texto), "0h" final em pílula verde, linha "Equipe toda" (borda de 2 px, "+60h" verde) e a nota explicativa
- [ ] T006 [US1] Refazer o miolo de `QuadroCentral.jsx`: duas colunas (esquerda 400 px: chip, título, parágrafo, barras; direita: "CONTRATAÇÕES SUGERIDAS" + "{N} pessoas" + tabela), mantendo título e abas da regra; esconder "Contratações sugeridas" quando não há falta; empilhar no celular
- [ ] T007 [US2] Conferir que Desejável/Sem falta seguem a regra da spec e que o texto nunca depende só de cor (pílulas com texto)

## Phase 3: US3 — Rodapé e permissões (P1)

- [ ] T008 [P] [US3] Criar `tabela-cargos/RodapeDoCard.jsx`: FOLHA MENSAL ATUAL com "i" (reaproveita `DicaComposicao`, `aria-label` "Como a folha é calculada", Enter/Espaço), "R$ ... · x% do faturamento", FATURAMENTO MENSAL DA LOJA, pílula âmbar de pendência + texto + "Definir função" ou "Sem pendências em cobertura e metas." + "Atualizar base comercial"; sem `folhaMensal`/`faturamentoMensal` (gestor/consulta) os blocos não aparecem
- [ ] T009 [US3] Usar o rodapé em `QuadroCentral.jsx` e remover as células antigas (folha, faturamento, turnos, equipe toda) que viraram tabela/rodapé
- [ ] T010 [P] [US3] Em `backend/node/src/modules/escala/escala.routes.integration.test.ts`, garantir (acrescentar se faltar) que a resposta do diagnóstico para gestor e consulta não traz `folhaMensal` nem `faturamentoMensal`

## Phase 4: US4 — Estados e acessibilidade (P2)

- [ ] T011 [P] [US4] Criar `tabela-cargos/EsqueletoDoCard.jsx` (duas colunas sem números) e usá-lo no carregamento em `Diagnostico.jsx`
- [ ] T012 [US4] Estados: "Dados do custo ainda não informados." no lugar da folha sem custo; "Sem cálculo para esta regra"; loja sem horário mostra "—" em "Loja aberta na semana"
- [ ] T013 [P] [US4] Teste de tela (Vitest/Testing Library) do card: tabela com cabeçalhos, `aria-label` das barras, "i" abre com Enter e Espaço, estado sem falta, gestor sem R$

## Phase 5: Acabamento

- [ ] T014 Prettier + lint + `sh scripts/sync-templates.sh` + `sh scripts/check-repo.sh`; testes completos (API unit/integração, web) e build
- [ ] T015 Verificação visual no navegador em 1440 px e celular (altura ~340 px, três regras, perfil gestor), contraste e teclado
- [ ] T016 Atualizar o README (bullet após "Excluir simulação"), marcar este arquivo, commit, push e merge em `local/ver-tudo`

## Dependências

T001 → T002, T003 → (T004, T005 em paralelo) → T006 → T007; T008 depois de T006; T009 depois de T008; T010 e T011 independentes; T012/T013 depois de T009; T014 → T015 → T016.

## Estratégia

Primeiro as regras puras com testes, depois a tabela e o card (valor principal), depois rodapé e permissões, depois estados e acabamento. Sem mudança de cálculo nem de banco.
