# Tarefas: Ambiente de produção no Coolify

## Fatia 1 — API de produção (migrations na subida)
- [x] T001 `backend/node/docker/prod-entrypoint.sh`: roda `prisma migrate deploy` e depois `exec node dist/server.js`; para se a migration falhar
- [x] T002 `backend/node/Dockerfile`: estágio `runtime` copia o entrypoint e o usa no `CMD`; o seed e as ferramentas de desenvolvimento não entram; manter o estágio `dev` intacto
- [x] T003 Construir a imagem (`docker build backend/node`) e conferir que ela inicia só com `DATABASE_URL` apontando para um Postgres de teste (projeto separado do local)

## Fatia 2 — Tela de produção (nginx)
- [x] T004 `frontend/react/docker/nginx.conf.template`: serve `dist` com volta ao `index.html`, repassa `/api` e `/health` para a API (resolvendo o endereço a cada chamada), limite de envio de 20 MB, cache longo só para arquivos com hash
- [x] T005 `frontend/react/Dockerfile`: estágios `build` (vite build) e `runtime` (nginx alpine, healthcheck); `dev` intacto
- [x] T006 `frontend/react/.dockerignore`: conferir e ajustar para a imagem não levar `node_modules` nem `dist` locais
- [x] T007 Construir a imagem e conferir que `/` abre e que o proxy chega à API

## Fatia 3 — Compose de produção e variáveis
- [x] T008 `docker-compose.prod.yml`: `postgres` (volume nomeado, sem portas, healthcheck), `api` (alvo `runtime`, espera o banco saudável, sem portas), `web` (alvo `runtime`, espera a API saudável, só exposto internamente); `restart: unless-stopped`; variáveis obrigatórias com mensagem clara
- [x] T009 `.env.production.example` com os três nomes, comentários simples (senha só com letras e números; endereço se liga ao serviço `web` no Coolify; produção aberta sem login) e sem segredos; `.gitignore` libera esse arquivo
- [x] T010 Validar com o roteiro do `quickstart.md` em projeto separado `calculadora-prod`: três serviços saudáveis, nenhuma porta publicada, zero lojas e "Grupo inicial", dados sobrevivem a novo `up --build`, erro claro sem `POSTGRES_PASSWORD`
- [x] T011 Conferir que o ambiente local continua subindo igual (`docker compose ps` do projeto atual saudável e tela em localhost:3000)

## Fatia 4 — Fechamento
- [x] T012 Rodar `scripts/sync-templates.sh` e conferir o que mudou em `templates/`
- [ ] T013 Resumo final com o que ficou de fora (login, domínio/DNS, monitoramento, homologação); remover o projeto de teste `calculadora-prod` (com confirmação); commitar a fatia

## Dependências
Fatia 1 e Fatia 2 são independentes; a Fatia 3 precisa das duas; a Fatia 4 vem por último. Primeira entrega útil: fatias 1 a 3 (produção sobe e funciona); a 4 fecha e sincroniza os modelos.
