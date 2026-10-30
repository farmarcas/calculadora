# Contrato HTTP — mudanças (`/api/v1`)

## Configuração da loja
`PUT /lojas/:id/configuracao` (dono e gestor) aceita, além de `convencao8h24` e `minimos`:
```jsonc
{ "turnos": [ { "nome": "Manhã", "inicio": "08:00", "fim": "14:00",
                "minimos": { "Farmacêutico": 1, "Atendimento": 1 } },
              { "nome": "Tarde", "inicio": "14:00", "fim": "20:00",
                "minimos": { "Farmacêutico": 1, "Atendimento": 3, "Caixa": 1 } } ] }
```
- `"turnos": null` volta ao mínimo único do dia inteiro.
- 400 em português para: sobreposição, buraco no horário, turno fora do horário de funcionamento, mais de 6 turnos, nome repetido, Farmacêutico abaixo de 1.
- `GET /lojas/:id/configuracao` devolve `turnos` e `turnosAvisos` (ex.: "o horário mudou e os turnos não cobrem mais o sábado").

## Diagnóstico
`GET /lojas/:id/diagnostico` ganha:
```jsonc
{ "quadroTurnos": {
    "turnos": [ { "nome": "Tarde", "inicio": "14:00", "fim": "20:00" } ],
    "cargos": [ { "cargo": "Atendimento",
                  "turnos": [ { "turno": "Tarde", "presentes": 2, "exigido": 3, "falta": true } ] } ],
    "foraDaConta": [ { "nome": "Ana", "motivo": "sem horário de entrada e saída" } ] },
  "avisoEstimativa": "Resultado é uma estimativa. Valide com seu contador e com a convenção coletiva do sindicato." }
```
- Loja sem turnos: `quadroTurnos` traz um único turno "Dia todo".
- A `memoria` de cada cargo passa a citar o turno de origem da necessidade.

## Parâmetros legais (novo)
- `GET /parametros-legais` — todos os perfis. Devolve, por fase, a versão vigente e o histórico.
- `POST /parametros-legais` — só `TENANT_ADMIN` (403 para os demais): cria nova versão `{ fase, jornadaSemanalH, horasDiaMax, horasDiaMaxConvencao?, diasTrabalho, divisor, vigenciaInicio }`. 400 para valores impossíveis. Auditoria `parametros.alterados`.
