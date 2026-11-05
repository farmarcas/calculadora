# Quickstart: validar a spec 031

Pré-requisito: `docker compose up -d --wait`.

1. **Testes**: `docker compose exec -T api npm test`, `npm run test:integration` na API e `docker compose exec -T web npx vitest run` verdes.
2. **Lista**: em Escala › Simulações, ver uma linha por simulação com saldo (verde ou vermelho, com sinal), horas abertas, folha extra, situação, tipo do cenário ("Mantém/Reduz/Amplia horários"), data e "por Administrador da conta" (nunca TENANT_ADMIN). Rascunhos, gravadas e (com "Mostrar descartadas") descartadas.
3. **Mesmo saldo**: abrir uma simulação e conferir que o saldo do painel de resultado é o mesmo da lista e, depois, o da comparação.
4. **Seleção**: marcar 1 simulação (sem barra), 2 (aparece "2 simulações selecionadas. A primeira escolhida é a base da comparação."), tentar a 5ª (não marca), "Limpar".
5. **Comparação**: "Comparar" abre a tabela com a primeira como base; conferir grupos, linha "Saldo" destacada, ▲/▼ e cores (folha extra subindo = vermelho), "igual" nas linhas sem mudança, contagem "N de 15 itens mudaram".
6. **Controles**: "Mostrar só o que mudou"; "Usar como base" (tudo recalcula); "Remover da comparação" (voltar a menos de duas leva à lista); "+ Adicionar simulação" até 4.
7. **Perfis**: como gestor, a lista e a comparação não têm saldo, folha extra, venda estimada nem venda que deixa de entrar.
8. **Desatualizada**: gravar uma simulação, mudar o horário da loja no Cadastro, voltar à lista: a simulação aparece com o selo "Desatualizada" e a dica.
9. **Textos e teclado**: nenhuma menção a "em uso"; cabeçalho fixo ao rolar; checkbox com "Selecionar <nome>".
