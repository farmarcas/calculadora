# Quickstart: validar a spec 029

Pré-requisito: `docker compose up -d --wait`.

1. **Testes**: `docker compose exec -T api npm test`, `npm run test:integration` na API e `docker compose exec -T web npx vitest run` verdes.
2. **Modal de lojas e funcionários**: em Minhas Lojas, abrir "Importar". Ver os três passos, o aviso e o botão "Revisar planilha" desabilitado. Baixar o modelo, preencher uma loja por CNPJ e dois funcionários, arrastar o arquivo para a área de envio (e repetir com "Escolher arquivo" e com Enter na área).
3. **Revisão**: clicar em "Revisar planilha". Ver nome e tamanho, a tabela (Atualiza, Novas, Com erro) e, com uma linha de CNPJ errado, o aviso de erro com "Baixar lista de erros". Conferir no Cadastro que **nada foi gravado** até clicar em "Gravar X lojas e Y funcionários"; depois conferir os dados e o aviso "X lojas e Y funcionários gravados."
4. **Modal da base comercial**: em Escala, abrir "Importar". Ver a etiqueta "Opcional", os passos e o botão desabilitado; escolher uma base e ver nome, tamanho, lojas e período; enviar duas vezes e ver, na segunda, o aviso "Este envio substitui o de …".
5. **Erros de arquivo**: escolher um .pdf, uma planilha sem a coluna Hora e um arquivo vazio: cada um mostra a mensagem do motivo e como corrigir.
6. **Teclado e foco**: abrir cada modal só com o teclado, percorrer com Tab (o foco não sai do modal), fechar com Esc e conferir que o foco volta ao botão "Importar".
