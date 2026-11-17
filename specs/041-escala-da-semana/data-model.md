# Data Model: Escala da semana

Não há dado novo nem mudança de banco. O card monta, na tela, a partir do que a simulação já traz:

- **Linha da semana** (por pessoa): `matricula`, `nome`, `funcao`, `cargaH`, `simulada` (verdadeiro para Contratação simulada), `dias[0..6]`, `total { horas, dias, texto }`, `passaDaJornada`.
- **Célula do dia**: `estado` = `turno` | `folga` | `fechada`; para `turno`: `entrada`, `saida`, `intervalo` (texto ou vazio), `textoTurno`.
- **Grupo**: `funcao`, `quantidade` de pessoas, `recolhido` (só na tela; Atendimento começa recolhido).

Regras: dia fechado vem de `diasAbertos`; folga é dia aberto sem turno; `total.horas` desconta o intervalo; `passaDaJornada` = `total.horas > cargaH` (só para quem tem `cargaH`).
