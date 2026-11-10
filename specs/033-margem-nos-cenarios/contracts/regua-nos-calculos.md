# Contrato: a régua nos cenários e na Simulação

## Campo novo
`regua` aparece em: cada cenário (e no resumo do sugerido) da resposta do diagnóstico; no detalhe da simulação (`resultado.regua`); em cada item da lista e da comparação de simulações.

```json
{ "regua": { "tipo": "margem" } }
{ "regua": { "tipo": "venda", "motivo": "margem_incoerente" } }
```

- `tipo`: `margem` ou `venda`.
- `motivo`: só quando `tipo` é `venda` e a base tem hora a hora: `sem_margem`, `margem_parcial` ou `margem_incoerente`.
- Sem base hora a hora, `regua` é `null` (como hoje não há perda nem ganho estimados).
- É a mesma em todos os cenários, no sugerido, na Simulação, na lista e na comparação da mesma loja.

## Como ler os campos existentes
Os campos abaixo **mantêm o nome** e passam a carregar **margem** quando `regua.tipo` é `margem`; quando é `venda`, seguem como hoje.

| Onde | Campos |
|---|---|
| Cenários | `faturamentoPerdidoMensal`, `vendaAdicionalMensal`, `vendaCortadaMes`, `vendaGanhaMes`, `impacto`, `impactoRobusto`, saldo da operação, `vendaPerdidaPorDia`, `horasEstendidas[].vendaMes` |
| Simulação | `vendaQueSai`, `vendaEstimada`, `saldoMensal`, `saldoAnual`, `vendaEstimadaPorHora` |
| Lista e comparação | `saldoMensal`, `vendaEstimada`, `vendaQueSai` |

## O que NÃO muda
- Custos: `folhaExtra`, `horaExtra`, `custoAdicional`, `economiaFolha`.
- Informação de venda real: venda por hora, clientes por hora, ticket médio, faturamento de referência e os percentuais do impacto sobre o faturamento (`faturamentoPerdidoPct`, `vendaAdicionalPct`, peso do saldo).

## Perfis
Valores em reais (venda ou margem) só para o dono do grupo; os demais perfis não recebem esses campos. `regua` não tem valores e vai para todos.

## Erros
Nenhum erro novo. Base com dados estranhos nunca derruba a resposta: cai em `venda` com o motivo.
