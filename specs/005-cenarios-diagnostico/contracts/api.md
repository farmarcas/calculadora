# Contrato HTTP — mudança (`/api/v1`)

`GET /lojas/:id/diagnostico` (quando há escala atual) passa a trazer `cenarios` para `r42` e `r40`:

```jsonc
{
  "cenarios": {
    "r40": {
      "regra": { "id": "r40", "nome": "40h" },
      "atual": { "horasSemana": 98, "pessoas": 6, "folhaMensal": 43180 /* só dono */ },
      "destaque": "equilibrio" /* só dono; ou null */,
      "vendasBase": { "dias": 21 } /* ou null sem base */,
      "manter": {
        "foco": "Cobrir todo o horário de funcionamento",
        "direcionamento": "…",
        "horarioSemana": [ { "dia": 0, "aberto": true, "abre": "08:00", "fecha": "22:00" } /* × 7 */ ],
        "horasSemana": 98,
        "contratacoes": [ { "funcao": "Farmacêutico", "pessoas": 1, "parcialH": 16, "horasContratadas": 16, "ociosidadePct": 8.3 } ],
        "pessoasContratar": 1,
        "ociosidadePct": 8.3,
        "custoAdicionalMensal": 2244 /* só dono, nulo sem custos */,
        "acrescimoPct": 5.2 /* só dono */
      },
      "economia": {
        "viavel": true, "motivoInviavel": null,
        "foco": "…", "direcionamento": "…",
        "horasReduzir": 14, "horasSemana": 84,
        "horarioSemana": [ … ],
        "cortes": [ { "dia": 6, "de": "20:00", "ate": "22:00", "venda": 530.0, "margem": 130.0 } ],
        "vendaCortadaSemana": 530.0, "vendaCortadaMes": 2296.67, "margemCortadaMes": 565.0   /* nulos sem base */
      },
      "equilibrio": {
        "indisponivel": null /* ou { "motivo": "custos" | "vendas", "texto": "…" } */,
        "coincideComManter": false,
        "foco": "…", "direcionamento": "…",
        "horasReduzir": 6, "horasSemana": 92, "horarioSemana": [ … ], "cortes": [ … ],
        "contratacoes": [ … ], "pessoasContratar": 1, "ociosidadePct": 8.3,
        "margemCortadaMes": 565.0,
        "custoAdicionalMensal": 1800 /* só dono */, "acrescimoPct": 4.2 /* só dono */
      }
    },
    "r42": { … }
  }
}
```

Para quem não é `TENANT_ADMIN`, ficam de fora `folhaMensal`, `custoAdicionalMensal`, `acrescimoPct` e `destaque`.
