# Contrato: campo `cobertura` no detalhe da simulação

`GET /api/v1/simulacoes/:id` passa a devolver, além do que já devolve, o campo `cobertura`. A lista (`GET /lojas/:id/simulacoes`) e a comparação não recebem esse campo.

## Formato

```json
{
  "cobertura": {
    "horas": [8, 9, 10, "…", 21],
    "funcoes": [
      {
        "funcao": "Farmacêutico",
        "minimo": 2,
        "porHora": [
          { "hora": 8, "pessoas": 2, "ok": true, "exigido": 2 },
          { "hora": 12, "pessoas": 1, "ok": false, "exigido": 2 },
          { "hora": 22, "pessoas": null, "ok": null }
        ]
      }
    ],
    "vendas": {
      "periodo": { "inicio": "2026-09-01", "fim": "2026-09-30", "dias": 30 },
      "horas": [{ "hora": 8, "participacao": 0.03, "vendaMedia": 345 }]
    },
    "vagasSemTurnos": 1,
    "horarios": { "versao": 2, "dias": [{ "aberta": true, "abre": "08:00", "fecha": "22:00" }] },
    "turnosDaLoja": {
      "modoMinimo": "turnos",
      "turnos": [{ "nome": "Manhã", "inicio": "08:00", "fim": "10:00" }]
    }
  }
}
```

## Regras
- `cobertura.horas` e `funcoes[].porHora` seguem o formato da cobertura do Diagnóstico (pior dia de cada hora, intervalos descontados).
- `vendas.horas[].vendaMedia` (em reais) **só existe para o dono** (perfil `TENANT_ADMIN`); para os outros perfis o campo não é enviado, só `participacao`.
- `vendas` é `null` sem base comercial; `turnosDaLoja` é `null` quando a loja usa só o mínimo único.
- Nenhum outro campo do detalhe muda.

## Erros
Os mesmos do detalhe (404 simulação inexistente, 403 perfil sem acesso). A cobertura nunca derruba o detalhe: sem horário ou sem pessoas, devolve listas vazias.
