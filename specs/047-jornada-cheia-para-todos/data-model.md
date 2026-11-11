# Data Model: Jornada cheia para todos

Nenhuma tabela nem migration (as horas dos turnos já são `Float`).

- **Horas**: valores decimais que representam minutos inteiros (por exemplo 15,4 = 15h24); o servidor recusa fração de minuto.
- **Turno**: os campos e o `antes` (spec 046) não mudam.
- **Jornada cheia (derivada)**: `jornadaDia = min(maxDia, tetoEfetivo ÷ dias)`; `limite = min(cargaH, tetoEfetivo)`.
