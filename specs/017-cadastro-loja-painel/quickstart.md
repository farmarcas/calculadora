# Quickstart — validar o Cadastro de loja em painel

1. `docker compose up -d --build --wait`; abrir http://localhost:3000, Cadastros › Lojas.
2. A tela mostra a lista (esquerda) e a loja (direita); buscar por nome, código e CNPJ; filtrar "Cadastro: Revisar" e UF; recarregar mantém loja e aba.
3. Dados e funcionamento: preencher horário e faturamento por dia; conferir 13h/12h, "77h abertas", soma semanal, mensal × 52 ÷ 12 e o alerta de 10% com "Usar R$ …"; "Copiar horário da segunda" não copia faturamento.
4. Regras e custos: encargos recolhidos; chave da convenção; mínimo por turnos com dois turnos sobrepostos e um que passa do fechamento; barra mostra sobreposição e faixas fora; modo "Mínimo único do dia" sem apagar os turnos.
5. Alterar algo em Dados e em Regras: o contador diz "2 alterações"; "Salvar alterações" grava tudo; "Cancelar" desfaz; trocar de loja pergunta antes.
6. Equipe: adicionar, editar e remover (com desfazer); CPF mascarado.
7. "Cadastrar loja" (operador): Equipe e Regras desabilitadas até gravar.
8. Larguras 1440, 1100, 768 e 420; teclado nas abas, switches e formulários.
9. Testes: `docker compose exec -T api npm test` e `npm run test:integration`; `docker compose exec -T web npm test`.
