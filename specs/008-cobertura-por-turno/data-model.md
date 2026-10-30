# Data Model — Cobertura por turno e parâmetros legais

Migration expand-only; nada é apagado.

**Loja** (`lojas`)
- `turnos` Json? — novo: `{ "versao": 1, "turnos": [ { "nome": "Manhã", "inicio": "08:00", "fim": "14:00", "minimos": { "Farmacêutico": 1, "Atendimento": 2 } } ] }`; de 1 a 6 turnos; cargos: Farmacêutico, Atendimento, Caixa, Apoio, Perfumaria; Farmacêutico ≥ 1 em todo turno; inteiros de 0 a 10.
- `minimos` continua: mínimo único usado quando a loja não tem turnos e como reserva.

**ParametroLegal** (`parametros_legais`) — novo, vale para todo o grupo
- `id` uuid v7; `fase` (`atual` | `r42` | `r40`).
- `jornadaSemanalH` decimal > 0; `horasDiaMax` decimal (0, 24]; `horasDiaMaxConvencao` decimal nulo (só usado na 42h, 8,4 h); `diasTrabalho` inteiro 1–7; `divisor` decimal > 0 (220 / 210 / 200).
- `vigenciaInicio` date; `criadoPor` perfil; `createdAt`.
- Versão inicial inserida pela migration: atual (início 2000-01-01, 44 h, 8 h, 6 dias, 220), r42 (início 2026-12-16, 42 h, 8 h, 8,4 h com convenção, 5 dias, 210), r40 (início 2027-12-01, 40 h, 8 h, 5 dias, 200).
- Nunca se edita nem apaga uma versão: alterar cria outra (histórico).

**Quadro do turno** (calculado, não gravado): por cargo e turno `{ presentes, exigido, falta }` mais lista de pessoas fora da conta com o motivo.
