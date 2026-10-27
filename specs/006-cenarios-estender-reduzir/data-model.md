# Modelo de dados — estender horário e reduzir equipe

Sem mudança no banco. Cálculo na hora a partir de: `lojas` (horário por dia, mínimos, convenção, custos), `turnos_atuais` (quadro) e `vendas_hora` (base comercial).

A resposta do diagnóstico ganha, dentro de cada `cenarios.r42` e `cenarios.r40`, os campos `estender` e `reduzir` (ver `contracts/api.md`).
