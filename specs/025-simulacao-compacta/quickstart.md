# Quickstart: Simulação compacta

1. Ambiente de pé: `docker compose up -d --wait`, abrir http://localhost:3000, Escala › Simulações (ou Personalizar num cenário).
2. Lista: mudar a abertura e o fechamento de um dia com + e − (1 hora), digitar um horário válido e um inválido (volta ao anterior), usar ↑ e ↓, ver o selo "Alterado" e o total "N h abertas por semana · antes M h"; "Restaurar do Cadastro" desfaz tudo.
3. Reduzir: fechar mais cedo; o gráfico mostra as horas fechadas listradas, o resumo mostra "Venda que deixa de entrar no dia" e o Resultado mostra "Venda que deixa de entrar" com valor.
4. Abrir mais: abrir mais cedo ou fechar mais tarde; aparecem barras verdes tracejadas com "+x,y", a legenda "Hora nova · venda estimada", o resumo "Venda estimada nas horas novas" e a linha "Venda estimada" do Resultado com "+R$ …"; o saldo recalcula.
5. Dia fechado: "Fechar dia" leva a "Fechado nesta simulação" com "Reabrir"; um dia fechado no Cadastro mostra "Abrir dia".
6. Resultado fixo: rolar a página e ver o card à direita acompanhando, a 1280 e a 1920 px.
7. Perfis: como gestor ou consulta, nenhum valor em reais; o gráfico sem R$ e o resto funcionam.
8. Coerência: o saldo da Simulação aberta por Personalizar de um cenário é igual ao saldo do cartão dele.
9. Testes: `docker compose exec -T api npx vitest run` e `docker compose exec -T web npx vitest run`; `npx vite build`.
