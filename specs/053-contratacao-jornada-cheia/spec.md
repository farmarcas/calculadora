# Spec 053: a contratação simulada também trabalha a jornada cheia

**Branch**: `feat/coluna-folha-no-faturamento` · **Created**: 2026-11-11 · **Status**: Implementada (correção pequena da spec 047)

**Pedido**: "a contratação simulada também não entra com o horário cheio, por quê?" (Cosmópolis: a vaga de 42 h aparecia com 21 h em 4 dias, turnos de 6 h só onde faltava farmacêutico).

**Causa**: a jornada cheia da spec 047 só valia para quem já está no quadro. Os turnos da vaga nova eram gerados só para cobrir a falta (`turnosParaVaga`), sem completar a jornada.

**O que muda**
- Contratação integral (acima de 30 h): depois de cobrir onde falta, cada turno cresce até a jornada do dia (8h24 com a convenção, 8h sem ela; carga ÷ dias da regra, nunca mais que o máximo do dia), no fim do turno e, se não couber, no começo.
- Se ainda sobrarem horas do contrato, entram turnos nos outros dias abertos (os que mais precisam primeiro), até os dias da regra.
- Respeita o horário da loja e as 11 h de descanso entre os dias; minutos inteiros.
- Parcial (até 30 h) continua cobrindo só a falta.

**Aceite**: Cosmópolis, Manter horários: a vaga de farmacêutico aparece com "42h · 5 dias", turnos de 8h24 (por exemplo 07h–16h24). Testes em `semana-com-folgas.test.ts`.
