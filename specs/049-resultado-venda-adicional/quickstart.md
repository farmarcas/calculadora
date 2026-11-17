# Quickstart: Resultado da venda adicional (com CMV)

1. Abrir uma Simulação (Personalizar) de uma loja com base comercial e CMV; em "Mudar horários", abrir 3 horas a mais no sábado e contratar 1 pessoa.
2. O painel mostra o bloco "Resultado do horário estendido" com venda adicional, CMV, lucro bruto, aumento de folha e resultado; selo azul "Recomendado" ou vermelho "Não recomendado".
3. "Como calculamos" abre o modal com a conta aberta e a origem do CMV (por hora ou média); Esc fecha.
4. O caso obrigatório (venda 9.000, CMV 57,8%, folha +4.680) está no teste unitário e dá −882, vermelho.
5. Loja sem CMV (nem por hora nem médio): o bloco pede o CMV.
6. Perfil gestor e consulta: o bloco não aparece e a resposta da API não tem o campo.
7. Simulação sem horas a mais: o bloco não aparece.
