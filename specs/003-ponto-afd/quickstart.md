# Validação ponta a ponta — ponto (AFD)

1. `docker compose up -d --build --wait`; seed; ter uma simulação **em uso** na loja 001 (aprovada na tela Escala → Simulações).
2. Gerar o AFD fictício: `docker compose exec api npm run afd:exemplo` (cria a pasta `backend/node/afd-exemplo/` com dois arquivos: a semana de 05/10, com um atraso, uma falta, um CPF desconhecido e a tarde passando 1h do horário, e a semana de 12/10, com hora extra repetida). Com o seed, a loja 001 já tem CNPJ, CPF fictício nas pessoas e uma simulação em uso desde 01/10/2026.
3. Escala → loja → Gerenciar → Importar: enviar os arquivos; ver aceitas / repetidas / pendentes. Reenviar: 0 novas.
4. Enviar um AFD com CNPJ de outra empresa: recusado com a explicação. Enviar um arquivo truncado: rejeitado inteiro.
5. Pendências: vincular o CPF desconhecido a uma pessoa e ver as batidas entrarem; ignorar outra com motivo.
6. Apuração: conferir atraso, hora extra e a falta nos dias esperados, e o rótulo "apuração gerencial".
7. Painel: aderência e hora extra do período; baixar o limite de hora extra e ver a simulação em uso ficar **desatualizada** com o atalho de clonar.
8. Como "Somente consulta": vê só o agregado da loja (sem pessoa nem batida).
9. `docker compose exec api npm test` e `npm run test:integration` passam.
