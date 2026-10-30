# Contrato da API: farmacêutico único mínimo e contratação por horas

Sem rota nova. Os campos abaixo entram nas respostas existentes; valores em reais só para `TENANT_ADMIN` (ausentes, não nulos, para os demais).

## GET /lojas/:id/diagnostico — `regras[].funcoes[]`
```json
{
  "funcao": "Farmacêutico", "obrigatorio": true,
  "necessidadeH": 94, "capacidadeH": 40, "saldoH": -54, "metaH": 94, "gapH": 54,
  "contratar": 2, "contratarInteiras": 1, "parcialH": 14,
  "sugestao": {
    "tipo": "integral_parcial", "inteiras": 1, "parcialH": 14,
    "horasContratadas": 54, "horasUsadas": 54, "horasOciosas": 0, "ociosidadePct": 0,
    "motivo": "obrigatoria",
    "avisos": ["O horário do farmacêutico parcial precisa ser registrado no CRF e não pode coincidir com o horário em que ele atua em outra farmácia."],
    "custoMensal": 10078.09
  }
}
```
Demais cargos: `obrigatorio: false`, `metaH` (nível de hoje ou meta do dono), `gapH`, `sugestao` com `motivo: "meta"`.

## cenarios[regra].manter.contratacoes[]
`{ funcao, pessoas, inteiras, parcial: { horas, turnos }, horasContratadas, horasUsadas, horasOciosas, ociosidadePct, motivo }`. O comparativo repete essas contratações.

## Fatia 5
`sugestao.parcial.distribuicao`: `[{ dia, de: "HH:MM", ate: "HH:MM" }]`.

## Fatia 6
`POST/PATCH /funcionarios` aceitam `horarioFixo: boolean`; o diagnóstico devolve `redistribuicao: { cobertura, descoberto[], avisos[] }`.

## Compatibilidade
O parâmetro de consulta `limiteParcial` continua aceito e é ignorado. Nenhum erro novo.
