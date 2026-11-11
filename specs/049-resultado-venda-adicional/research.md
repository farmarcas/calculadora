# Research: Resultado da venda adicional (com CMV)

- **Venda adicional**: `vendaEstimadaDasHorasNovas(diasCadastro, dias, tabela).vendaMes` (R$/mês). Em `resultado.ts`, `vendaGanhaReal` já é a venda real das horas novas.
- **CMV por hora**: a base traz `cmv` por linha; `reguaDaBase` e `linhasNaRegua` convertem a venda em margem (lucro bruto) quando a régua é "margem". Para o bloco, o lucro bruto das horas novas é a venda estimada **na régua de margem** (já usa a hora, ou a hora vizinha, com CMV) e o CMV é `venda − lucro bruto`.
- **CMV médio**: `cmvMedioPct` do Cadastro da loja (`preencherComCmvMedio`); quando a base não tem CMV por hora, `lucro bruto = venda × (1 − cmvMedio ÷ 100)`.
- **Origem**: `'hora'` quando a régua é margem pela base; `'media'` quando vem do CMV médio; `null` sem nenhum.
- **Aumento de folha**: `custoAdicional = folhaExtra + horaExtra` (já calculado para o dono); nulo se faltar salário (o bloco diz "Informe os salários").
- **Resultado**: `lucroBruto − aumentoDeFolha`; `recomendado = resultado ≥ 0`.
- **Teste obrigatório**: 9.000 × 57,8% = 5.202; 9.000 − 5.202 = 3.798; 3.798 − 4.680 = −882 → não recomendado.
- **Quando aparece**: só se há horas novas (`horasNovas` com alguma hora aberta a mais) e o perfil é dono.
