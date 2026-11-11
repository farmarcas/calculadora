# Tasks: Peso do custo de pessoal no faturamento

Servidor: `backend/node/src/modules`. Tela: `frontend/react/src/features/diagnostico/cartao`.

## Phase 1: Servidor

- [x] T001 Em `escala/linhas-cenarios.ts`, `custoPctFaturamento` (só dono) ganha `aumentoPp` (`depois − hoje`, uma casa) e `aumentoMensal` (`adicional`, R$ inteiro); `custoSentido` (`aumenta` | `igual` | `diminui`) para todos os perfis, a partir de `adicional`; sem faturamento ou sem salários, `custoEstado` diz o que falta (`sem_faturamento`, `sem_salarios`).
- [x] T002 Testes em `escala/linhas-cenarios.test.ts`: Cosmópolis (8,0% → 9,7%, +1,7 p.p., R$ 7.659), Paulínia (10,3% → 14,7%, +4,4 p.p., R$ 11.112), cenário sem custo (0 p.p., R$ 0), sem faturamento, sem salários, e que gestor e consulta só recebem `custoSentido`.
- [x] T003 Teste de integração (`escala.routes.integration.test.ts`): o dono recebe os quatro números e o sentido; gestor e consulta só o sentido (nenhum `custoPct`, `custoPctFaturamento`, folha ou faturamento); a folha atual em % do faturamento é igual no resumo e no cenário (SC-005).

## Phase 2: Tela

- [x] T004 Em `cartao/linha-regras.js`, `textoDoPeso(linha, dono)`: dono → `"8,0% → 9,7% do faturamento"`, `"+1,7 p.p."`, `"(R$ 7.659/mês)"`; outros → `"Aumenta"` | `"Igual"` | `"Diminui"`; estados sem dado: `"Informe o faturamento para ver o peso da folha"` e `"Informe os salários para calcular"`; testes em `linha-regras.test.js`.
- [x] T005 Em `cartao/LinhaDeCenario.jsx`, a coluna "Custo de pessoal" mostra o texto do peso no lugar do `custoPct`; tira o "+X% sobre a folha".

## Phase 3: Fechamento

- [x] T006 Rodar toda a suíte (servidor: `npm test`, `npm run test:integration`, `tsc`, `eslint`; tela: `npm test`, build); listar as mudanças de teste.
- [x] T007 Conferir na tela, depois de reiniciar a API, Cosmópolis e Paulínia (dono) e um perfil gestor; mostrar a conta aberta.
- [x] T008 Atualizar o `README.md`.

MVP: T001–T005.
