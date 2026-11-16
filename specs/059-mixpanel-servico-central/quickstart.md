# Quickstart — validar a medição

Pré-requisitos: Docker aberto; um token do projeto Radar Escala (ou de um projeto de teste) só no `.env`.

1. Colocar `MIXPANEL_TOKEN=<token>` no `.env` e rodar `docker compose up -d --build --wait`.
2. Abrir http://localhost:3000, entrar com login do Radar (SSO ligado) e abrir três telas.
3. No Mixpanel (Radar Escala → Eventos ao vivo), ver `tela_vista` x3 ligados à pessoa, com `ambiente=desenvolvimento`.
4. Fazer cada ação-chave do [catálogo](contracts/catalogo-eventos.md) e ver o evento correspondente.
5. Sair e entrar com outra pessoa: eventos não se misturam.
6. Esvaziar `MIXPANEL_TOKEN`, reiniciar o `web`: a calculadora funciona igual e nada chega ao Mixpanel.
7. Bloquear `mixpanel.com` no navegador: sem erro visível.
8. `docker compose exec web npm test` e testes do backend passam.
