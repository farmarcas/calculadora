# Contrato HTTP — mudanças (`/api/v1`)

`GET /lojas/:id/diagnostico?recaptura=20` (opcional; inteiro de 0 a 30, padrão 0; 400 fora disso).

Em `cenarios.r42` e `cenarios.r40`:
```jsonc
{
  "origemVenda": "cadastro",              // base | cadastro | estimativa | null
  "diasProtegidos": [4, 5, 3],            // 0 = segunda
  "economia": {
    "diasFechar": [ { "dia": 6, "vendaMes": 34667, "margemMes": 9707 } ],   // venda e margem só para o dono
    "horasSemana": 78, "horasReduzir": 12, "horarioSemana": [ /* × 7 */ ],
    "naoRecomendado": null,               // { "dias": [4], "texto": "…" } quando só dá fechando um dia protegido
    "resumo": "Fechando o domingo a equipe atual cobre o horário sem contratar…",
    "margemCortadaMes": 9707, "impactoMensal": 9707
  },
  "equilibrio": {
    "diasFechar": [], "contratacoes": [ /* … */ ], "pessoasContratar": 2,
    "coincideComManter": true, "coincideComEconomia": false,
    "resumo": "O equilíbrio para esta loja é contratar tudo.",
    "custoAdicionalMensal": 10914, "resultadoMensal": 41320, "impactoMensal": 10914
  },
  "estender": {
    "disponivel": true, "diasAbrir": [ { "dia": 6, "abre": "08:00", "fecha": "14:00", "vendaMes": 0, "margemMes": 3200 } ],
    "horasEstender": 6, "margemRefMes": 3200, "aviso": "Referência: 50% da média dos dias abertos, não uma previsão.",
    "custoAdicionalMensal": 0, "impactoMensal": -3200
  }
}
```
- Para `SCHEDULE_MANAGER` e `SCHEDULE_VIEWER`, todo campo de venda, margem, custo, economia, resultado e impacto é **ausente**; ficam os dias, os horários e o texto sem valores.
- Os campos `cortes` (cenários 2 e 3) e `extensoes` (cenário 4) deixam de existir.
