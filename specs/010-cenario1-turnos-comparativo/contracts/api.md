# Contrato HTTP — mudanças (`/api/v1`)

`GET /lojas/:id/diagnostico` aceita, opcionalmente, premissas só para simular (nada é gravado):
`?recaptura=20&margemPct=25&fatorDiaNovo=50&diasProtegidos=3&limiteParcial=3`
(faixas: recaptura 0–30, margemPct 0–100, fatorDiaNovo 0–100, diasProtegidos 0–6, limiteParcial 0–3; fora delas, 400 em português).

Resposta, em `cenarios.r42` / `cenarios.r40`:
```jsonc
{
  "manter": {
    "contratacoes": [ { "funcao": "Farmacêutico", "inteiras": 1, "parcial": { "turnos": 2, "horas": 16 }, "pessoas": 2, "ajustado": false } ],
    "custoAdicionalMensal": 14500, "custoAnual": 174000,
    "impactoPctFaturamento": 3.4, "faturamentoMensalRef": 420000
  },
  "comparativo": {
    "cenarios": [
      { "id": "manter",    "nome": "Manter horários", "status": "viavel", "alertas": [],
        "contratacoes": [ /* … */ ], "horasSemana": 90,
        "custoFolhaMensal": 50880, "margemMes": 0, "resultadoLiquidoMensal": -14500, "impactoPctFaturamento": 3.4 },
      { "id": "economia",  "nome": "Foco em economia", "status": "nao_recomendado", "alertas": ["Fecha o sábado, um dos 3 dias de maior faturamento."] },
      { "id": "equilibrio","nome": "Equilíbrio", "status": "viavel", "alertas": [] }
    ],
    "destaque": "equilibrio"
  },
  "premissas": { "recaptura": 0, "margemPct": 28, "fatorDiaNovo": 50, "diasProtegidos": 3, "limiteParcial": 3 }
}
```
Na raiz do Diagnóstico: `etapas.r42` / `etapas.r40` por cargo (`etapa1`, `adicional`).
- Para `SCHEDULE_MANAGER` e `SCHEDULE_VIEWER`: sem `custoAnual`, `impactoPctFaturamento`, `faturamentoMensalRef`, `custoFolhaMensal`, `margemMes`, `resultadoLiquidoMensal` e sem `premissas.margemPct`.
