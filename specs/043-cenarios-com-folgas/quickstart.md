# Quickstart: Cenários que já contam as folgas

Pré-requisito: ambiente no ar, perfil dono, Sumaré (1099) no Diagnóstico.

1. Abrir o Diagnóstico de Sumaré e anotar, para a regra de 42h, as contratações e horas do cenário sugerido.
2. Clicar em **Personalizar**: a Simulação abre com cada pessoa em 5 dias e até 42h, folgas na Escala da semana e as contratações com turnos.
3. Conferir que as horas contratadas na Simulação são as do cartão do cenário (passo 1) e que não há aviso de regra.
4. Conferir a Escala por hora: não há hora abaixo do mínimo (ou o cenário já diz "Não resolve sozinho" e a faixa amarela mostra as mesmas horas).
5. Repetir nas regras de 40h e de 44h.
6. Na Escala da semana, o botão "Sugerir folgas" não aparece; tirar uma folga na Escala por hora faz o botão voltar.
7. Perfil gestor e visualizador: sem R$ nos cartões e nas linhas.
8. Conferir que o Cadastro de funcionários não mudou.

Testes: `docker compose exec api npm test` e `npm run test:integration`; `docker compose exec web npm test`.
