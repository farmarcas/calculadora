# Data Model — Cenário 1 em turnos e comparativo

Sem mudança de banco. Mudam as formas de resposta do Diagnóstico.

**LinhaFuncao** (cálculo de capacidade, acrescenta): `contratarInteiras`, `parcialTurnos`, `parcialH`, `ajustado`; `contratar` = total de pessoas.

**Contratacao** (muda): `{ funcao, inteiras, parcial: { turnos, horas } | null, pessoas, horasContratadas, ociosidadePct, ajustado }`.

**Etapas** (novo, por regra de destino, no nível do Diagnóstico): `{ etapa1: Contratacao[] (fase de 42h), etapa2: Contratacao[] (fase de 40h), adicional: [{ funcao, inteiras, horasParciais }] }`.

**Cenário 1 (acrescenta)**: `custoAnual`, `impactoPctFaturamento` (dono), `faturamentoMensalRef` (dono).

**Comparativo** (novo, por regra): `{ cenarios: [{ id, nome, contratacoes, horasSemana, status, alertas, custoFolhaMensal?, margemMes?, resultadoLiquidoMensal?, impactoPctFaturamento? }], destaque }` (campos com `?` só para o dono).

**Premissas** (novo, devolvidas): `{ recaptura, margemPct?, fatorDiaNovo, diasProtegidos, limiteParcial }`.
