# Contrato: cenário "abrir um dia" no diagnóstico

`GET /api/v1/lojas/:id/diagnostico` → `cenarios[regra].estender`

| Campo | Antes | Depois |
|---|---|---|
| `diasAbrir[].vendaMes` | venda do dia (dono) | igual |
| `diasAbrir[].margemMes` | margem do dia (dono) | **removido** |
| `vendaRefMes` | soma da venda (dono) | igual |
| `margemRefMes` | soma da margem (dono) | **removido** |
| `impactoMensal` | custo − margem (dono) | **removido** |
| `saldoMensal` | — | venda estimada − custo adicional (dono); `null` se faltar venda ou custo |
| `aviso` | citava margem | cita só a estimativa de venda (50% da média) |

Escolha dos dias: maior `vendaMes`, só entre os que a equipe cobre sem nova contratação; não abre dia de venda estimada zero. Não-dono: nenhum valor em reais (como hoje).

`PUT /lojas/:id` e `PUT /lojas/:id/painel` (faturamento): `margemPct` é opcional e, se vier, é ignorada; o valor guardado é mantido.
Planilha de Cadastro: coluna "Margem bruta média (%)" não existe mais no modelo; planilhas antigas com ela são aceitas e a coluna é ignorada.
