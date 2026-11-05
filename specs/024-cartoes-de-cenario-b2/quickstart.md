# Quickstart: Cartões de cenário B2

1. Ambiente de pé: `docker compose up -d --wait`, abrir http://localhost:3000, Escala › Diagnóstico, escolher uma loja com cenários (ex.: Cosmópolis ou Sumaré).
2. Ver três cartões na ordem Manter horários, Sem contratações e Equilíbrio, alinhados, com o saldo como maior valor e custo de folha e venda do mesmo tamanho.
3. Conferir os sinais e as cores: saldo e valores vermelhos com "−", verdes com "+" (verde #3E7500), neutros em preto.
4. Num cenário que muda horário, clicar em "Ver todos os dias ›": o painel abre pela direita com a tabela e os totais; Esc, clique fora, X e Fechar fecham e o foco volta ao link; "Personalizar horários" abre a Simulação do cenário.
5. Como gestor ou consulta: os valores em reais não aparecem e o resto do cartão e o painel continuam.
6. Largura de 360 px: o painel vira folha inferior; sem rolagem horizontal da página.
7. Testes: `docker compose exec -T api npx vitest run` e `docker compose exec -T web npx vitest run`; `npx vite build`.
