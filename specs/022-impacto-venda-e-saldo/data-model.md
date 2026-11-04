# Modelo de dados — Impacto em venda e saldo

Sem tabela nova. Mudanças nas respostas do Diagnóstico (campos novos; os de margem saem).

## Por coluna do comparativo (só o dono vê R$)
- `vendaPerdidaMensal` (número | null) e `vendaPerdidaPorDia` (`[{ dia, ate?, vendaMes }]`).
- `economiaFolhaMensal`, `custoAdicionalMensal`, `vendaAdicionalMensal`.
- `saldoMensal`, `saldoAnual`, `pesoNoFaturamentoPct`.
- `semVendaHoraria` (booleano): quando verdadeiro, a venda perdida e o saldo vêm nulos e a tela mostra o aviso.
- Saem: `margemMes`, `resultadoLiquidoMensal`, `ganhoFrenteManterMensal` (a comparação passa a ser o saldo).

## Cenários (`economia` e `equilibrio`)
- `vendaCortadaMes` por dia (`vendaCortadaPorDia`), `vendaGanhaMes`, `impactoRobusto` (com metade da venda ganha).
- Saem: `margemCortadaMes`, `margemGanhaMes`.

## Premissas
- `fatorHoraNova` (0–100, padrão 50). Sai `margemPct`.

## Simulação (resultado)
- Entram: `economiaFolha`, `saldoMensal`. `margemPerdida` e `margemInformada` saem.

## Grupo
- `somarGrupo(lojas) → { saldoMensal, vendaPerdidaMensal, economiaFolhaMensal, vendaAdicionalMensal, pesoNoFaturamentoPct, lojasSemDado }`.
