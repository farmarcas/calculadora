# Contrato HTTP — mudança (`/api/v1`)

`GET /lojas/:id/diagnostico`: cada `cenarios.r42` e `cenarios.r40` ganha `estender` e `reduzir`.

```jsonc
{
  "estender": {
    "disponivel": true,
    "motivoIndisponivel": null,          // texto quando não há capacidade sobrando
    "foco": "Abrir mais usando horas já pagas",
    "direcionamento": "…",
    "horasEstender": 4,
    "horasSemana": 90,
    "horarioSemana": [ { "dia": 0, "aberto": true, "abre": "07:00", "fecha": "22:00" } /* × 7 */ ],
    "extensoes": [ { "dia": 0, "de": "07:00", "ate": "08:00", "vendaRef": 320.0, "margemRef": 80.0 } ],
    "vendaRefMes": 1386.67, "margemRefMes": 346.67,   // nulos sem base comercial
    "aviso": "…",                        // referência baseada na hora vizinha; poucos dias de venda
    "custoAdicionalMensal": 7800,        // só dono (o do Cenário 1; nulo sem custos)
    "impactoMensal": 7453.33             // só dono: custo − margem de referência (nulo sem dado)
  },
  "reduzir": {
    "temExcedente": true,
    "foco": "Ajustar a equipe ao horário atual",
    "direcionamento": "…",
    "cargos": [ { "funcao": "Caixa", "pessoasHoje": 4, "pessoasNecessarias": 3, "excedente": 1,
                  "economiaMensal": 2380 /* só dono; nulo sem salário */ } ],
    "pessoasExcedentes": 1,
    "economiaMensal": 2380,              // só dono; nulo se faltar salário de algum cargo com excedente
    "economiaPct": 5.5,                  // só dono, sobre a folha atual
    "impactoMensal": -2380,              // só dono
    "aviso": "Capacidade excedente para decisão da gestão; depende de validação trabalhista e do contrato de cada pessoa."
  }
}
```

Para quem não é `TENANT_ADMIN`, ficam de fora `custoAdicionalMensal`, `impactoMensal`, `economiaMensal` (incluindo a de cada cargo) e `economiaPct`. O `destaque` segue só entre `manter`, `economia` e `equilibrio`.
