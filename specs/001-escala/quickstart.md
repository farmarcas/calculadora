# Validação ponta a ponta

1. `docker compose up -d --build --wait` e abrir http://localhost:3000.
1a. Opcional: `docker compose exec api npm run seed` cria dados fictícios (2 lojas, 8 funcionários, escala atual e vendas da loja 001).
2. Cadastros: baixar o modelo, preencher com 2 lojas e 6 funcionários fictícios, importar, confirmar.
3. Importar planilha com colunas renomeadas: conferir a sugestão de correspondência e confirmar.
4. Reenviar a mesma planilha: nenhum registro duplicado.
5. Loja → enviar escala atual e base comercial: ver quadro, cobertura, déficit e contratações.
6. Grade: mover um turno e ver as verificações mudarem; tentar tirar o farmacêutico e ver o bloqueio.
7. Gravar duas simulações, comparar, aprovar uma como `TENANT_ADMIN`; como `SCHEDULE_MANAGER` o botão não aparece.
8. `docker compose exec api npm test` e `npm run test:integration` passam.
