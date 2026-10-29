# Data Model — Cenários por dia

Sem mudança de banco. Mudam só as formas de resposta do Diagnóstico.

**Venda do dia (calculada)**: `{ dia (0 = segunda), venda, margem, margemMes, protegido }` por dia aberto ou com venda; `origemVenda`: `base` | `cadastro` | `estimativa`.

**CenarioEconomia** (muda): `diasFechar: [{ dia, vendaMes, margemMes }]`, `horasReduzir`, `horasSemana`, `horarioSemana`, `naoRecomendado: { dias, texto } | null`, `margemCortadaMes`, `vendaCortadaMes`, `aviso`, `indisponivel`, `resumo`. Sai `cortes`.

**CenarioEquilibrio** (muda): `diasFechar`, `contratacoes`, `pessoasContratar`, `margemCortadaMes`, `coincideComManter`, `coincideComEconomia`, `resumo`, e (dono) `custoAdicionalMensal`, `resultadoMensal`, `impactoMensal`. Sai `cortes` e `naoCompensa`.

**CenarioEstender** (muda): `diasAbrir: [{ dia, abre, fecha, vendaMes, margemMes }]`, `horasEstender`, `horasSemana`, `horarioSemana`, `vendaRefMes`, `margemRefMes`, `aviso`, `resumo`, (dono) `custoAdicionalMensal`, `impactoMensal`. Sai `extensoes`.

**CenariosRegra** (acrescenta): `vendasPorDia`, `origemVenda`, `diasProtegidos`.
