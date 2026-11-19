# Quickstart: como verificar

Pré-requisito: `docker compose ps` com os três serviços `healthy`.

1. **Testes**: `docker compose exec -T api npm test` e `docker compose exec -T web npx vitest run` (devem passar; há testes novos de segunda, mesmo cargo, determinismo e folga livre).
2. **Segunda (US1)**: abrir uma simulação de uma loja com sobra de cobertura, na Escala da semana clicar "Sugerir folgas": nenhuma célula "FOLGA" cai na segunda, exceto com o aviso "só deu para folgar na segunda sem faltar gente".
3. **Mesmo cargo (US2)**: na mesma tela, pessoas do mesmo cargo folgam em dias diferentes; se coincidirem, há aviso.
4. **Folga livre (US3)**: na Escala da semana, no dia de trabalho de uma pessoa, usar o botão pequeno "dar folga": a célula vira "FOLGA", a cobertura/avisos se atualizam e ao recarregar a simulação a folga continua. Usar "escalar" numa folga: volta o turno.
5. **Somente leitura**: abrir uma simulação gravada: nenhum botão de folga aparece.
