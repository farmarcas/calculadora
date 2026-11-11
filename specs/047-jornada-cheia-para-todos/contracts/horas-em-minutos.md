# Contrato: horas em minutos inteiros

Rotas e formato de erro não mudam (`/api/v1`).

## Turnos da Simulação (`PUT /simulacoes/:id`, `POST /lojas/:id/simulacoes`)
- `entrada`, `saida`, `iniIntervalo`, `fimIntervalo` e `antes.*`: horas decimais de 0 a 24, com **minutos inteiros** (antes, só múltiplos de 15 minutos). Exemplo válido: `15.4` (15h24). Fração de minuto (por exemplo `15.4001` ou `15.123`) → `400`, com a mensagem "Use horários com minutos inteiros".
- Quartos de hora continuam válidos.

## Criação por Personalizar
- Os turnos voltam completados até a jornada cheia, com minutos (por exemplo, `saida: 16.4`) e `antes`.
