# Quickstart: Peso do custo de pessoal no faturamento

Pré-requisito: ambiente no ar (reinicie a API depois de trocar de branch).

1. Cosmópolis, regra de 42h, perfil dono: "Manter horários" mostra "8,0% → 9,7% do faturamento", "+1,7 p.p." e "(R$ 7.659/mês)"; o "+21,3%" não aparece.
2. Paulínia: "10,3% → 14,7%", "+4,4 p.p.", "(R$ 11.112/mês)".
3. "Sem contratações": a % nova vem do faturamento depois da variação da venda; o aumento em R$ é zero.
4. Perfil gestor e consulta: só "Aumenta", "Igual" ou "Diminui"; a resposta da API não tem número de custo.
5. Loja sem faturamento: "Informe o faturamento para ver o peso da folha"; sem salários: "Informe os salários para calcular".
6. O resumo do Diagnóstico mostra a mesma folha atual em % do faturamento (8,0% em Cosmópolis).
