# Data Model — Simulação em 3 passos

## Simulação (existente) — acréscimos
| Campo | Tipo | Observação |
|---|---|---|
| `horarios` | JSON opcional | Horário simulado: `{ versao: 2, dias: [{ aberta, abre, fecha }] × 7 }`. Nulo = igual ao Cadastro. Congelado em `premissas` ao gravar. Nunca altera a loja. |
| `numeroCenario` | inteiro opcional | Preenchido ao gravar; único por loja entre as gravadas. |

Regras: horário só em rascunho; `fecha > abre` por dia aberto; ao menos um dia aberto; horas em passos de 15 min.

## Resultado da simulação (calculado, não gravado em rascunho)
| Campo | Observação |
|---|---|
| `impactoMensal` | folha extra + hora extra + margem perdida (nulo se faltar custo) |
| `folhaExtra` | custo mensal das vagas simuladas |
| `horaExtra` | custo mensal das horas que ainda faltam (ver research 4) |
| `vendaQueSai`, `margemPerdida` | por mês; nulos sem base/margem |
| `horasAbertas` / `horasAbertasAntes` | por semana |
| `funcoes[]` | por função: faltaHoje, diasDeTrabalho, contratacoes[], resultado (coberto/falta + horas), custoMensal |
| `vendaPorHora` | 7 × 24 de venda e clientes, e quais horas estão fechadas na simulação |
Valores em reais só para o dono.
