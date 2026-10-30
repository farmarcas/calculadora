# Quickstart — como conferir

1. Subir o ambiente (`docker compose up -d --build --wait`) e abrir http://localhost:3000, aba Cadastros.
2. Abrir uma loja: preencher cidade, bandeira, horário, faturamento dos 7 dias, mensal e margem. Salvar e reabrir.
3. Na mesma tela, adicionar um funcionário com carga mensal 220, cargo, CPF, entrada 08:00, saída 17:00 e dias segunda a sexta.
4. Em Diagnóstico, escolher a loja **sem enviar base comercial**: os cenários 2–4 aparecem com venda estimada e o aviso de origem "cadastro".
5. Enviar a base comercial: a origem passa a "base comercial".
6. Entrar como gestor e consulta: nenhum valor em reais; CPF mascarado para consulta.
7. Rodar `npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit` no `api` e o build do `web`.
