# Contrato: linhas de cenários no diagnóstico

`GET /api/v1/lojas/:id/diagnostico` (qualquer perfil com acesso à loja). Em `cenarios.r42.linhas` e `cenarios.r40.linhas`, uma lista de três itens na ordem Equilíbrio, Manter horários, Sem contratações. Todo o resto da resposta fica como está.

```json
{
  "id": "equilibrio",
  "nome": "Equilíbrio",
  "igualA": null,
  "status": "vende_mais",
  "causa": "Venda das horas novas é estimada.",
  "indisponivel": null,
  "contratar": [{ "funcao": "Atendimento", "inteiras": 0, "parcialHoras": 18 }],
  "horasSemana": 103,
  "horasDiferenca": 9,
  "horarioSemana": [{ "dia": 0, "aberto": true, "abre": "08:00", "fecha": "22:00" }],
  "vendaPct": 1.7, "vendaEstado": "ok",
  "custoPct": 2.8, "custoEstado": "ok",
  "contratacoes": [], "ajustes": [], "diasFechar": []
}
```

## Garantias
- Idênticas para dono, gestor e consulta (mesmos campos e mesmos valores); só o selo "Cenário sugerido" (em `comparativo.sugerido`) é exclusivo do dono.
- Nenhum valor em reais e nenhum salário em `linhas`.
- Equilíbrio fica `indisponivel` para todos quando faltam vendas ou custos; a tela escolhe o texto pelo perfil.
