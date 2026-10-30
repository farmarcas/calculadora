# Contrato da API: Cenário 2 com travas

Sem rota nova. `GET /lojas/:id/diagnostico` devolve, em `cenarios[regra].economia` e em `cenarios[regra].comparativo.cenarios[]`, os campos abaixo. Valores em reais só para `TENANT_ADMIN` (ausentes, não nulos, para os demais).

## economia
```json
{
  "viavel": true,
  "naoResolveSozinho": true,
  "travou": "perda",
  "faltaH": 18,
  "passos": [
    { "tipo": "reduzir", "dia": 6, "horas": 4, "de": {"abre": "08:00", "fecha": "22:00"}, "para": {"abre": "08:00", "fecha": "18:00"} },
    { "tipo": "fechar", "dia": 6 }
  ],
  "horariosAjustados": [ { "dia": 5, "antes": "08h–22h", "depois": "08h–18h" }, { "dia": 6, "antes": "08h–22h", "depois": "fechado" } ],
  "perdaFaturamentoPct": 9.4,
  "margemCortadaMes": null
}
```

## comparativo.cenarios[]
- `status`: `viavel` | `nao_recomendado` | `inviavel` | **`nao_resolve`** | `null` (sem dados).
- `ajustes`: lista de `{ dia, antes, depois }` (o "depois" é `fechado` quando fecha).
- `faltaH`: horas que ainda faltam (quando `nao_resolve`).
- `margemMes`, `resultadoLiquidoMensal`: `null` (não 0) quando a margem não foi informada.
- Alerta novo: "Informe a margem bruta média da loja no Cadastro…".

## Erros
Nenhum erro novo.
