# Validação ponta a ponta — estender horário e reduzir equipe

1. `docker compose up -d --build --wait`; abrir http://localhost:3000 → Escala → loja com escala atual e base comercial → Diagnóstico.
2. Abaixo do Cenário 3 aparecem o **Cenário 4 · Estender horário** e o **Cenário 5 · Reduzir equipe**; trocar 42h ↔ 40h muda os dois sem recarregar.
3. **Cenário 4:** com contratação no Cenário 1, ver horas a estender e o novo horário; conferir que as horas cabem na ociosidade e que a venda é rotulada como referência. Sem sobra, o cartão diz que não há capacidade.
4. **Cenário 5:** em loja com gente sobrando, ver o excedente por cargo e a economia de folha; em loja justa, "não há gente sobrando".
5. Como dono: custo, impacto e economia em reais. Como "Gestor de escala" e "Somente consulta": nenhum valor em reais.
6. O selo "Menor impacto financeiro" continua só entre os cenários 1 a 3.
7. `docker compose exec api npm test`, `npm run test:integration` e `npm run lint` (conferir o código de saída) passam.
