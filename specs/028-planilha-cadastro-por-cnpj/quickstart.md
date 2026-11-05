# Quickstart: validar a spec 028

Pré-requisito: `docker compose up -d --wait`.

1. **Testes**: `docker compose exec -T api npm test`, `npm run test:integration` na API e `docker compose exec -T web npx vitest run` verdes.
2. **Modelo novo**: baixar o modelo (Importar → modelo). Aba Lojas: sem "Código da loja", com "CNPJ *" e "Nome da loja / Apelido", sem RAT/FAP/rescisão. Aba Funcionários: "CNPJ da loja *", coluna "Cargo" com lista (Farmacêutico, Atendimento, Caixa), sem "Código da loja de lotação" nem o antigo "Cargo".
3. **Importar por CNPJ**: preencher uma loja já cadastrada só com o CNPJ (com pontos e depois sem) e o faturamento; importar; conferir a atualização na loja certa. CNPJ desconhecido, inválido e repetido: só essas linhas são recusadas, com a mensagem.
4. **Funcionários por CNPJ**: importar funcionários com o "CNPJ da loja"; conferir que estão na loja certa e que "Balconista" digitado vira Atendimento.
5. **Planilha antiga**: importar uma planilha no formato anterior (código, função de escala, cargo livre, RAT/FAP/rescisão com valores quaisquer): importa sem erro e o código cadastrado não muda.
6. **Encargos**: abrir Regras de uma loja: sem campos de RAT, FAP e rescisão; o total é o do regime. O custo de contratação (Cenário 1) usa esse total. Uma loja que tinha RAT/FAP guardados ainda os tem no banco (`custos->encargos`).
