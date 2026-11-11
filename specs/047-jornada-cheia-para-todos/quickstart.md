# Quickstart: Jornada cheia para todos

Pré-requisito: ambiente no ar (reinicie a API depois de trocar de branch), perfil dono, Cosmópolis (loja 284, 42h com convenção).

1. Abrir o Diagnóstico de Cosmópolis e anotar as contratações do cenário "Manter horários".
2. **Personalizar**: na Escala da semana, cada pessoa aparece com "42h · 5 dias" (8h24 por dia); nenhuma passa disso.
3. Na Escala por hora, a barra de um turno completado mostra o horário com minutos (por exemplo 07h–15h24) e a marca "ajustado"; a dica diz "Turno aumentado de 07h–15h para 07h–15h24 para completar a jornada de 42h".
4. Arrastar uma barra completada: ela mantém a duração de 8h24, e a cobertura recalcula.
5. Conferir que as contratações do cartão são iguais às da Simulação e menores ou iguais às de antes.
6. Uma pessoa com horário fixo no Cadastro: o turno dela não muda.
7. Mudar a regra para 44h (6 dias, 7h20) e para 40h sem convenção (8h): a jornada cheia muda de acordo.
8. Pela API, enviar um turno com `saida: 15.4001`: recusado; com `15.4`: aceito.

Testes: `docker compose exec api npm test` e `npm run test:integration`; `docker compose exec web npm test`.
