# Quickstart: Só contratação integral

Pré-requisito: ambiente no ar, perfil dono, Sumaré (1099) no Diagnóstico.

1. Abrir o Diagnóstico de Sumaré: nenhum cartão traz "parcial". Onde havia "1 farmacêutico · parcial", agora há "1 farmacêutico".
2. Conferir o cartão "Manter horários": as horas contratadas são múltiplos da jornada cheia e o custo de pessoal subiu (mais horas ociosas).
3. Clicar em **Personalizar**: a Simulação abre com vagas integrais, com turnos nos dias e horas que cobrem a falta; o número de contratações é o do cartão.
4. Na Escala por hora, abrir "+ Contratar": só integral, com os dias e o horário sugeridos; adicionar e ver a vaga com a carga cheia da regra.
5. Tentar, pela API, criar uma vaga nova de 20h: recusada com a frase em português.
6. Abrir uma simulação gravada antes com vaga parcial: abre igual.
7. Perfil gestor e consulta: sem R$ e sem a palavra "parcial".

Testes: `docker compose exec api npm test` e `npm run test:integration`; `docker compose exec web npm test`.
