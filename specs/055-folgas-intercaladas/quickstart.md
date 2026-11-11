# Como conferir

1. Subir o ambiente e abrir uma simulação de uma loja com várias pessoas que passam do limite de dias (por exemplo Cosmópolis, "Analisar").
2. Na Escala da semana, clicar em **Sugerir folgas**: nenhuma pessoa com 2 folgas fica com elas em dias seguidos (incluindo domingo e segunda), e as folgas da função aparecem em vários dias diferentes, não só segunda, terça e quarta.
3. Quando não houver como afastar sem faltar gente, aparece o aviso com o nome ("Fulana: não deu para afastar as folgas sem faltar gente.").
4. A cobertura por hora não fica pior que antes (mesmas horas abaixo do mínimo ou menos).
5. Clicar de novo ou recarregar: a sugestão é a mesma. Abrir a simulação com as folgas aplicadas (servidor) dá o mesmo resultado do botão (tela).
6. O Cadastro não muda.
7. Testes: `docker compose exec -T api npx vitest run`, `… api npm run test:integration` (sozinho) e `… web npx vitest run`.
