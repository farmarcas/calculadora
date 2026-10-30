# Validação ponta a ponta — cenários

1. `docker compose up -d --build --wait`; `docker compose exec api npm run seed` se o banco estiver vazio; abrir http://localhost:3000 → Escala → loja com escala atual e base comercial.
2. Diagnóstico: abaixo do quadro central aparecem os três cenários; trocar 42h ↔ 40h muda os três sem recarregar.
3. **Cenário 1:** contratação por cargo, ociosidade, horário total da semana e, como dono com custos informados, custo adicional em reais e em %. Conferir a conta com "Déficit e contratações".
4. **Cenário 2:** horas a reduzir, novo horário dia a dia e venda e margem cortadas; conferir que as horas cortadas são as de menor venda do "Horários de maior venda".
5. **Cenário 3:** só corta o que não se paga e contrata o resto; sem custos ou sem base comercial, explica o que falta.
6. Dono com tudo informado: um cenário aparece com "Menor impacto financeiro". Como "Gestor de escala": nenhum valor de custo nem destaque.
7. Loja que já cobre tudo: os cenários dizem que não há o que contratar nem cortar.
8. `docker compose exec api npm test` e `npm run test:integration` passam.
