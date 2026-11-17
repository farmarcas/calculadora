# Contrato: resultado do horário estendido

`GET /simulacoes/:id` → `resultado.horarioEstendido` (só `TENANT_ADMIN`; os outros perfis nem recebem o campo).

```json
{ "vendaAdicionalMensal": 9000, "cmvMensal": 5202, "cmvPct": 57.8, "lucroBrutoMensal": 3798,
  "aumentoFolhaMensal": 4680, "resultadoMensal": -882, "recomendado": false,
  "origemCmv": "media", "estado": "ok", "horasNovasSemana": 3 }
```
- Sem horas novas: o campo não existe.
- `estado` diferente de `ok`: os números que faltam vêm `null` e a tela mostra o aviso do estado.
