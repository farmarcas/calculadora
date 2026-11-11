# Como conferir

1. Subir o ambiente (`docker compose up -d --build --wait`) e abrir http://localhost:3000, aba Cobertura, como dono.
2. **Cosmópolis**: Manter horários mostra "…a folha sobe de 8,0% para 9,7% do faturamento (R$ 7.659 por mês). Este é o caminho recomendado."; Sem contratações mostra o trecho "Mesmo assim, ainda faltariam 17 h de farmacêutico por semana." em preto e negrito.
3. **Paulínia**: valores 10,3% → 14,7% e R$ 11.112; Sem contratações com falta de farmacêutico e de atendente.
4. Trocar o perfil para gestor e consulta: nenhuma frase tem "R$" nem "%".
5. Largura 1236 px: cada frase em até 3 linhas.
6. Buscar na tela: nenhum "p.p.", "pontos" ou "Personalizar".
7. Testes: `docker compose exec -T api npx vitest run`, `docker compose exec -T api npm run test:integration` (sozinho) e `docker compose exec -T web npx vitest run`.
