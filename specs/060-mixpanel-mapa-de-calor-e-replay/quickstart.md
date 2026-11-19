# Quickstart — validar mapa de calor e replay

Pré-requisitos: token no `.env` (como na spec 059), login do Radar (SSO) e acesso ao Mixpanel do Radar Escala.

1. Subir o ambiente e entrar com login do Radar; abrir Diagnóstico e Simulações, clicar em abas e botões, rolar a página.
2. No Mixpanel, abrir **Session Replay**: a sessão aparece ligada à pessoa; reproduzir e conferir que **nenhum** texto, valor, nome, CNPJ ou campo preenchido é legível.
3. Abrir **Heatmaps** nas telas visitadas e ver os cliques e a rolagem.
4. Modo demonstração (sem SSO): nenhuma sessão nova.
5. `MIXPANEL_REPLAY_PERCENT=0`: nenhuma sessão nova, e a medição de eventos (spec 059) segue funcionando.
6. Bloquear `mixpanel.com` e `mxpnl.com` no navegador: sem erro visível.
7. `docker compose exec web npm test` passa.
