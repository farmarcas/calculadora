# Validação ponta a ponta — vagas e custo

1. `docker compose up -d --build --wait`; `docker compose exec api npm run seed` (se o banco estiver vazio).
2. Escala → loja 001 → Simulações → nova simulação (escala atual, 40h).
3. No rascunho, adicionar uma vaga de Atendimento de 24h; ela aparece na tabela e na grade; dar turnos a ela e ver a cobertura mudar. Conferir que Cadastros não ganhou ninguém.
4. Marcar um desligamento simulado e ver a pessoa sair da cobertura.
5. Configuração → Custos (como Dono): informar salário médio por função e encargos. Como "Gestor de escala", a seção não existe.
6. Gravar duas simulações (com e sem vaga), comparar: ver custo mensal, anual e a diferença; conferir a conta com a memória de cálculo.
7. Apagar os custos: a comparação mostra só o aviso, sem total.
8. `docker compose exec api npm test` e `npm run test:integration` passam.
