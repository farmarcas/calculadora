# Contrato: CMV no Cadastro e na base comercial

## Cadastro da loja (dono)
`PATCH /api/v1/lojas/:id` e a importação de lojas/Cadastro aceitam `faturamento.cmvPct` (número de 0 a 100 ou `null`). Fora da faixa: 400 com mensagem em português. Gestor e consulta nunca recebem `cmvPct` na resposta (o campo não existe).
`faturamento.margemPct` deixa de existir (removido pela migration); o que vier dele em pedidos é ignorado.

## Planilha de lojas e de Cadastro
Coluna **CMV médio (%)** (sinônimos: cmv médio, cmv %, cmv pct). A coluna antiga de margem continua entendida e ignorada, sem erro e sem aviso de coluna desconhecida.

## Base comercial (hora a hora)
Coluna **CMV (R$)** (sinônimos: cmv, custo da mercadoria, cmv bruto). Opcional. Coluna ausente = CMV nulo nas horas. A coluna "Margem bruta (R$)" antiga é entendida e ignorada.

## Respostas de cálculo
`regua` (cenários, Simulação, lista, comparação) continua `{ tipo: 'margem' | 'venda', motivo? }` com os motivos `sem_margem` (falta CMV), `margem_parcial` (CMV incompleto) e `margem_incoerente` (CMV maior que a venda). Sem valores em reais; vai para todos os perfis. Os campos de perda, ganho e saldo carregam o lucro bruto quando a régua é `margem` (como na spec 033).
