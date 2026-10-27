# Validação ponta a ponta — ponto (AFD)

1. `docker compose up -d --build --wait`; seed; ter uma simulação **em uso** na loja 001 (aprovada na tela Escala → Simulações).
2. Gerar o AFD fictício: `docker compose exec api npm run afd:exemplo` (cria arquivos em uma pasta de exemplo, com um atraso, uma hora extra, uma falta e um CPF desconhecido).
3. Escala → loja → Gerenciar → Importar: enviar os arquivos; ver aceitas / repetidas / pendentes. Reenviar: 0 novas.
4. Enviar um AFD com CNPJ de outra empresa: recusado com a explicação. Enviar um arquivo truncado: rejeitado inteiro.
5. Pendências: vincular o CPF desconhecido a uma pessoa e ver as batidas entrarem; ignorar outra com motivo.
6. Apuração: conferir atraso, hora extra e a falta nos dias esperados, e o rótulo "apuração gerencial".
7. Painel: aderência e hora extra do período; baixar o limite de hora extra e ver a simulação em uso ficar **desatualizada** com o atalho de clonar.
8. Como "Somente consulta": vê só o agregado da loja (sem pessoa nem batida).
9. `docker compose exec api npm test` e `npm run test:integration` passam.
