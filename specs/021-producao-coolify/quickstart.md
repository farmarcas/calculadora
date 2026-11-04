# Quickstart: validar a produção localmente

Pré-requisito: Docker aberto. Usa um projeto Compose separado (`calculadora-prod`), sem tocar nos dados do ambiente local.

1. Criar variáveis de teste: `cp .env.production.example /tmp/prod.env` e preencher os três valores.
2. Subir: `docker compose -p calculadora-prod --env-file /tmp/prod.env -f docker-compose.prod.yml up -d --build --wait`
3. Conferir `docker compose -p calculadora-prod -f docker-compose.prod.yml ps`: três serviços saudáveis.
4. Tela: `docker compose -p calculadora-prod -f docker-compose.prod.yml exec web wget -qO- http://127.0.0.1/ ` retorna o HTML.
5. Proxy e API: `... exec web wget -qO- http://127.0.0.1/health/ready` retorna pronto.
6. Banco fechado: `docker compose ... ps` não mostra nenhuma porta publicada.
7. Sem dados de exemplo: contagem de lojas = 0; "Grupo inicial" existe.
8. Persistência: cadastrar uma loja pela API, rodar `up -d --build` de novo, e a loja continua lá.
9. Variável faltando: subir sem `POSTGRES_PASSWORD` e ver a mensagem de erro.
10. Limpeza do teste (só o projeto de teste): `docker compose -p calculadora-prod -f docker-compose.prod.yml down -v` (pedir confirmação antes).
