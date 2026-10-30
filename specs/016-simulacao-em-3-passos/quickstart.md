# Quickstart — validar a simulação em 3 passos

1. `docker compose up -d --build --wait`; abrir http://localhost:3000, grupo com dados, Escala → loja com cenários.
2. Clicar em "Personalizar" num cenário que contrata: a tela mostra 3 passos e o painel; o impacto é igual ao do cenário (SC-003) e aparece só uma vez (SC-001).
3. "Mudar horários": fechar a segunda às 20h → total do dia, rodapé, marca "Alterado"; painel mostra venda e margem que saem e menos horas abertas; o Cadastro da loja continua com o horário antigo.
4. Fechamento ≤ abertura → erro com ícone e texto; painel não muda. "Restaurar do Cadastro" volta tudo. Voltar para "Manter horários" pede confirmação.
5. Adicionar e remover contratações: resultado, custo por função, rodapé e painel mudam juntos.
6. "Salvar como cenário 1" → próximo botão diz cenário 2. Como dono, "Marcar como em uso" aparece; como gestor, não.
7. Larguras 1440, 1100, 768 e 420: sem rolagem horizontal; abaixo de ~1100 o painel desce.
8. Testes: `docker compose exec -T api npm test`.
