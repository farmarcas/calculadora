# Quickstart: como verificar

Pré-requisito: `docker compose ps` com os três serviços `healthy`.

1. **Testes**: `docker compose exec -T api npm test`, `docker compose exec -T api npm run test:integration` e `docker compose exec -T web npx vitest run` (devem passar, com os novos testes de hora extra).
2. **Cobre só com hora extra (US1)**: numa loja com 2 farmacêuticos e ~2 h por semana sem cobertura de farmacêutico, o cenário "Manter" mostra "Sem contratar: cobre com 2 h de hora extra por semana" e "Cobre sem contratar".
3. **Cobre em parte**: com uma falta maior que o teto (pessoas × 10 h), o cartão mostra a hora extra e a contratação do que sobra.
4. **Custo e peso (US2)**: o custo adicional e o peso da folha do cartão sobem pela hora extra; sem salário informado, o custo fica vazio.
5. **Cartão × Simulação (US3)**: clicar em Personalizar: horas, custo e peso da folha são os mesmos do cartão.
6. **Permissões**: com perfil gestor/consulta, ver as horas de hora extra mas nenhum R$ nem %.
7. **Alertas (US5) e parecer (US6)**: num caso de hora extra cara, aparece o alerta com os dois custos (dono); o parecer fala da hora extra.
8. Reiniciar a API (`docker compose restart api`) antes de conferir na tela: ela não recarrega sozinha.
