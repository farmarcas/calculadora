# Data Model: Cenário 2 com travas

Sem tabela nem migration. Tipos novos ou alterados no cálculo e na resposta do Diagnóstico.

## Núcleo (`ajustes-fim-de-semana.ts`)
- `TRAVAS`: `{ perdaMaxPct: 10, horasMinPct: 85, horasMinDia: 4 }`.
- `Passo`: `{ tipo: 'reduzir' | 'fechar', dia, horas?, de?: { abre, fecha }, para?: { abre, fecha } }`.
- `EstadoFimDeSemana`: horário resultante de cada dia (`DiaAberto[]`), `passos`, `perdaPct`, `horasSemana`.
- `ResultadoSequencia`: `{ cobre, dias, passos, parou: 'perda' | 'horas' | 'fim_de_semana' | null, faltaH, perdaPct, horasSemana }`; `fim_de_semana` quando não há mais o que reduzir ou fechar (dias protegidos, já fechados ou no piso de 4 h).

## `CenarioEconomia` (acréscimos)
| Campo | Tipo | Observação |
|---|---|---|
| `naoResolveSozinho` | boolean | a equipe não coube dentro das travas |
| `travou` | 'perda' \| 'horas' \| 'fim_de_semana' \| null | qual trava parou (ou nada mais a mexer) |
| `faltaH` | número \| null | horas de cobertura que ainda faltam |
| `passos` | `Passo[]` | na ordem aplicada |
| `horariosAjustados` | `{ dia, antes: {abre,fecha}, depois: {abre,fecha} \| null }[]` | reduções e fechamentos, para o cartão (`depois` nulo = fecha) |
| `margemInformada` | boolean | sem margem, `margemCortadaMes` é nulo |
| `perdaFaturamentoPct` | número (só dono) | perda sobre o faturamento mensal |

`margemCortadaMes` e `vendaCortadaMes`: nulos quando a margem (ou a venda) não foi informada, em vez de 0.

## `ColunaComparativo` (acréscimos)
`status` ganha `'nao_resolve'`; `ajustes`: `{ dia, antes, depois }[]` (visível a todos); `faltaH` (todos); `perdaFaturamentoPct` (dono).

## Regras
- Só sábado (5) e domingo (6) entram nos passos; segunda a sexta nunca.
- Dia protegido (3 de maior faturamento) só reduz.
- `naoResolveSozinho` ⇒ `viavel` verdadeiro porém sem selo de viável nem de sugerido (o status do comparativo é `nao_resolve`).
