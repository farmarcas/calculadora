# Tasks: Resultado da venda adicional no Personalizar (com CMV)

Servidor: `backend/node/src/modules/simulacoes`. Tela: `frontend/react/src/features/simulacao`.

## Phase 1: Fundação — a conta pura

- [x] T001 Criar `resultado-horario-estendido.ts`: `calcularHorarioEstendido({ vendaAdicionalMensal, lucroBrutoMensal | cmvPct, aumentoFolhaMensal, horasNovasSemana, origemCmv })` → `{ vendaAdicionalMensal, cmvMensal, cmvPct, lucroBrutoMensal, aumentoFolhaMensal, resultadoMensal, recomendado, origemCmv, estado, horasNovasSemana }`; `cmv = venda − lucro bruto` (por hora) ou `venda × cmvPct` (média); `resultado = lucro bruto − aumento de folha`; `recomendado = resultado ≥ 0`; estados `sem_cmv`, `sem_salarios`, `sem_venda`.
- [x] T002 Testes em `resultado-horario-estendido.test.ts`: **o caso obrigatório** (9.000, 57,8%, 4.680 → CMV 5.202, lucro bruto 3.798, resultado −882, não recomendado); resultado exatamente zero é recomendado; sem venda adicional; sem aumento de folha; sem CMV; sem salários.

## Phase 2: Servidor

- [x] T003 Em `resultado.ts`, montar `horarioEstendido` só para o dono e só com horas novas: venda adicional = `vendaEstimadaDasHorasNovas(...)` na venda real; lucro bruto = a mesma estimativa na régua de margem quando a base tem CMV (origem `hora`), senão `venda × (1 − cmvMedioPct ÷ 100)` (origem `media`); aumento de folha = `folhaExtra + horaExtra` (nulo → `sem_salarios`); sem nenhum CMV → `sem_cmv`.
- [x] T004 Teste de integração em `simulacoes.routes.integration.test.ts`: Simulação com horas a mais traz `resultado.horarioEstendido` para o dono; sem horas a mais não traz; gestor e consulta nunca recebem o campo; recalcula ao mudar horário, vaga ou desligamento.

## Phase 3: Tela

- [x] T005 Criar `BlocoHorarioEstendido.jsx`: título "Resultado do horário estendido", cinco linhas (venda adicional, CMV, lucro bruto, aumento de folha, resultado), selo azul "Recomendado" ou vermelho "Não recomendado", avisos dos estados, e o link "Como calculamos"; em `PainelResultado.jsx`, mostrar o bloco abaixo do resultado em horas, só quando existe.
- [x] T006 Criar `ModalComoCalculamos.jsx`: a conta aberta (horas novas por semana, venda estimada, origem e % do CMV, lucro bruto, aumento de folha, resultado), Esc e botão fecham; `resultado-regras.js` com o texto e as cores, e testes em `resultado-regras.test.js`.

## Phase 4: Fechamento

- [x] T007 Rodar toda a suíte (servidor e tela) e o build; listar as mudanças de teste.
- [x] T008 Conferir na tela, depois de reiniciar a API: uma Simulação que abre horas a mais (dono): bloco, selo e modal; gestor sem o bloco; loja sem CMV.
- [x] T009 Validação final do pedido: mostrar Cosmópolis e Paulínia com horas de farmacêutico faltando, contratações, folha atual e nova em % do faturamento, p.p., R$ e o texto do cenário; confirmar que não sobrou "Equilíbrio" na interface.
- [x] T010 Atualizar o `README.md`.

MVP: T001–T006.
