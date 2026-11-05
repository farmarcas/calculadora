# Quickstart: validar a spec 027

Pré-requisito: `docker compose up -d --wait`.

1. **Testes**: `docker compose exec -T api npm test` e `docker compose exec -T web npx vitest run` verdes; integração com `npm run test:integration` na API.
2. **Cadastro sem margem**: abrir http://localhost:3000, Minhas Lojas → uma loja → aba de faturamento e resumo mensal (perfil dono): não há campo "Margem". Baixar o modelo da planilha de Cadastro: sem coluna de margem.
3. **Margem preservada**: numa loja com margem salva (ex.: Cosmópolis, 30%), editar o faturamento pela tela e salvar; conferir no banco que `faturamento->margemPct` continua 30.
4. **Planilha antiga**: importar uma planilha de Cadastro que ainda tem "Margem bruta média (%)" (inclusive com valor 150): a importação termina sem erro e a margem salva não muda.
5. **Abrir dia**: numa loja com um dia fechado e venda informada, pedir o diagnóstico como dono (`X-Perfil: TENANT_ADMIN`): `estender` traz `vendaRefMes`, `saldoMensal` e nenhum campo de margem; sem margem preenchida o saldo aparece igual.
6. **Cartões e Simulação**: os números dos três cartões e da Simulação são os mesmos de antes (os testes de comparação existentes continuam verdes).
7. **Aviso do Diagnóstico**: loja sem base comercial mostra o aviso de venda estimada pelo faturamento, sem pedir margem.
