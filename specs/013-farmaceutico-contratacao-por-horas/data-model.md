# Data Model: farmacêutico único mínimo e contratação por horas

## Banco (só na fatia 6)
- `funcionarios.horario_fixo` — booleano, NOT NULL, padrão `false`. Migration escrita à mão; nenhuma outra tabela muda.
- `lojas.minimos` (JSON) continua igual; passa a significar **meta opcional do dono** (valor maior que zero) em vez de mínimo obrigatório, exceto o farmacêutico (sempre ao menos 1).

## Constantes
- `PARCIAL = { maxHorasSemana: 30, variante: { baseH: 26, extrasMaxH: 6 }, extrasAdicionalPct: 50 }`.
- `FUNCOES_PADRAO_MINIMO = { Farmacêutico: 1, Atendimento: 0, Caixa: 0, Apoio: 0, Perfumaria: 0 }`.

## `LinhaFuncao` (acréscimos; os campos atuais ficam)
| Campo | Tipo | Observação |
|---|---|---|
| `obrigatorio` | boolean | só o farmacêutico |
| `metaH` | número | horas semanais de meta (nível de hoje ou meta do dono); no farmacêutico, as horas abertas |
| `gapH` | número | horas que a capacidade não cobre |
| `sugestao` | objeto \| null | contratação por horas (abaixo) |

`contratar`, `contratarInteiras` e `parcialH` continuam, calculados a partir da sugestão, para os consumidores atuais.

## `sugestao`
`{ tipo: 'parcial' | 'integral' | 'integral_parcial', inteiras, parcialH | null, variante?: 'com_hora_extra', horasContratadas, horasUsadas, horasOciosas, ociosidadePct, custoMensal? (só dono), avisos: string[], motivo: 'obrigatoria' | 'meta' }`.

## `Contratacao` (cenários)
Passa a ter `parcial: { horas, turnos }` (`turnos` derivado, só para compatibilidade), `horasUsadas`, `horasOciosas`, `motivo`.

## Regras
- Só o farmacêutico tem gap obrigatório; o gap dos demais cargos é meta.
- Nenhum parcial passa de 30 h (variante: 26 h + até 6 h extras, identificada).
- `horario_fixo` verdadeiro: a pessoa não é remanejada e o resultado avisa.
