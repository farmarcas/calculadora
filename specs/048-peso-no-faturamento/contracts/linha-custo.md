# Contrato: coluna "Custo de pessoal" das linhas de cenário

`GET /lojas/:id/diagnostico` → `cenarios.<regra>.linhas[]`

- **Dono**: `custoPctFaturamento: { hoje, depois, aumentoPp, aumentoMensal } | null`, `custoSentido`.
- **Gestor e consulta**: só `custoSentido`; nenhum outro campo de custo, folha, faturamento ou %.
