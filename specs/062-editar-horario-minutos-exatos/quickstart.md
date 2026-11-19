# Quickstart: como verificar

Pré-requisito: `docker compose ps` com os três serviços `healthy`.

1. **Testes**: `docker compose exec -T web npx vitest run` e `docker compose exec -T api npm run test:integration` (devem passar, com os testes novos de leitura, validação e do servidor com minutos quebrados).
2. **Digitar o horário (US1)**: abrir uma simulação editável; no lápis de uma pessoa digitar 07:32, intervalo 12:17–13:17, saída 16:24 e salvar. A barra mostra "07h32–16h24"; recarregar mantém.
3. **Erros (US2)**: saída antes da entrada, 06:30 com a loja abrindo às 07:00, só o início do intervalo: cada caso mostra a mensagem ao lado do campo e não grava.
4. **Exibição (US3)**: o mesmo horário aparece na barra, no nome acessível, na Escala da semana e no celular; o total de horas da semana soma os minutos.
5. **Celular (US4)**: com a tela estreita, tocar no lápis da lista, editar e salvar.
6. **Arrastar**: continua andando de 15 em 15 minutos e preservando os minutos do turno.
7. **Somente leitura**: numa simulação gravada não há lápis.
