# Quickstart: Esticar os turnos até o limite da regra

Pré-requisito: ambiente no ar (reinicie a API depois de trocar de branch: `docker compose restart api`), perfil dono, Cosmópolis (loja 284, regra de 42h com convenção de 8h24).

1. Abrir o Diagnóstico de Cosmópolis e anotar as contratações do cenário "Manter horários".
2. Clicar em **Personalizar**: a Simulação abre com as folgas aplicadas e os turnos esticados onde faltava cobertura; a Escala da semana mostra as pessoas com até "42h · 5 dias" e nenhuma acima.
3. Na Escala por hora, passar o mouse num turno esticado: a marca "ajustado" e a dica com o horário de antes e de depois.
4. Conferir que as contratações da Simulação são as do cartão (iguais) e menores ou iguais às do passo 1.
5. Arrastar o fim de um turno esticado de volta ao horário do Cadastro: a cobertura recalcula e a marca some.
6. Uma pessoa com horário fixo no Cadastro: o turno dela não é esticado.
7. Uma função sem falta de cobertura: ninguém dela é esticado.
8. Perfil gestor e consulta: sem R$ e sem erro.

Testes: `docker compose exec api npm test` e `npm run test:integration`; `docker compose exec web npm test`.
