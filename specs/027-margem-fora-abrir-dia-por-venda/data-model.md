# Data Model: Margem fora do dia a dia

Nenhuma tabela ou coluna muda.

**Loja.faturamento** (JSON, só o dono vê): `{ dias[7], mensal, margemPct? }`
- `dias` e `mensal`: como hoje.
- `margemPct`: continua guardada se existir. Passa a ser **opcional no pedido** (a tela não envia) e **imutável por gravação**: a API mantém o valor que já está no banco; em loja nova fica sem valor.

**Venda por hora (base comercial)**: a coluna `margem` continua gravada; nenhuma conta a lê.

**Cenário "abrir um dia"** (resposta do diagnóstico, só o dono vê reais):
- `diasAbrir[].vendaMes` (venda estimada do dia por mês); some `margemMes`.
- `vendaRefMes` (soma dos dias abertos); some `margemRefMes`.
- `saldoMensal = vendaRefMes − custoAdicionalMensal`; substitui `impactoMensal`.
