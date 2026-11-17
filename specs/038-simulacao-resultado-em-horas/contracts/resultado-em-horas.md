# Contrato: resultado da simulação em horas e porcentagem

`GET /api/v1/simulacoes/:id` (e as rotas que devolvem o detalhe da simulação). Em `resultado.emHoras`, para qualquer perfil com acesso à simulação. O resto do detalhe fica como está.

```json
{
  "status": "cobre",
  "causa": "Venda das horas novas é estimada.",
  "vendaPct": 0, "vendaEstado": "ok",
  "custoPct": 7.2, "custoEstado": "ok",
  "pessoas": { "hoje": 12, "simulacao": 14 },
  "horasContratadas": { "hoje": 480, "simulacao": 534 },
  "horasAbertas": { "hoje": 99, "simulacao": 99 },
  "horaExtraH": 0,
  "contratar": [
    { "funcao": "Atendimento", "inteiras": 0, "parciaisHoras": [20] },
    { "funcao": "Caixa", "inteiras": 0, "parciaisHoras": [18] }
  ]
}
```

## Garantias
- Idêntico para dono, gestor e consulta.
- Nenhum valor em reais e nenhum salário.
- Sem venda por hora: `vendaPct` nulo e `vendaEstado: "nao_estimada"`. Sem salários: `custoPct` nulo e `custoEstado: "sem_salarios"`.
