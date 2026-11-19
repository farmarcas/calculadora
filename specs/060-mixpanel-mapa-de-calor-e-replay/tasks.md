# Tasks: Mapa de calor e replay de sessão no Mixpanel

**Input**: `specs/060-mixpanel-mapa-de-calor-e-replay/` (spec, plan, research, quickstart)

**Formato**: `- [ ] T### [P] [US#] descrição com caminho`. Pasta do serviço: `frontend/react/src/analytics/`.

## Phase 1: Configuração

- [ ] T001 [P] Criar `MIXPANEL_REPLAY_PERCENT=` (vazio = 100 quando há token; 0 desliga) em `.env.example` e `.env.production.example`, com comentário em linguagem simples
- [ ] T002 [P] Repassar como `VITE_MIXPANEL_REPLAY_PERCENT` em `docker-compose.yml` (serviço `web`) e `docker-compose.prod.yml` (args), e acrescentar `ARG VITE_MIXPANEL_REPLAY_PERCENT` em `frontend/react/Dockerfile`
- [ ] T003 [P] Em `.github/workflows/deploy.yml`, passar `--build-arg VITE_MIXPANEL_REPLAY_PERCENT=${{ vars.MIXPANEL_REPLAY_PERCENT }}` no build de produção (variável do repositório, opcional; vazio vale 100)

## Phase 2: US1 + US2 — Mapa de calor e replay com tudo coberto (P1)

**Meta**: sessões gravadas com conteúdo coberto e mapa de calor por tela. **Teste**: quickstart passos 1 a 3.

- [ ] T004 [US1] Em `analytics/servico.js`, passar ao `mixpanel.init`: `record_sessions_percent: 0`, `record_heatmap_data: true`, `record_mask_all_text: true`, `record_mask_inputs: true`, `record_console: false`, `record_network: false`, `record_canvas: false`, `record_max_ms` de 1 hora
- [ ] T005 [US2] Em `analytics/servico.js`, função `percentualDeGravacao()` que lê `VITE_MIXPANEL_REPLAY_PERCENT` (vazio = 100; valor inválido ou fora de 0–100 = 0) e, em `identificar`, na primeira identificação da sessão do navegador, sorteia e chama `mixpanel.start_session_recording()` dentro do `seguro`; `limpar` chama `stop_session_recording()`
- [ ] T006 [P] [US1] Em `analytics/servico.test.js`: o `init` recebe as opções de cobertura e `record_sessions_percent: 0`; sem token nada é iniciado

## Phase 3: US3 — Só com pessoa logada e fácil de desligar (P2)

- [ ] T007 [P] [US3] Testes em `servico.test.js`: não grava antes de `identificar`; com percentual 0 nunca chama `start_session_recording`; com 100 chama uma vez por pessoa (não repete ao mudar de perfil); `limpar` para a gravação; falha do SDK ao iniciar não lança erro
- [ ] T008 [US3] Atualizar `frontend/FRONTEND.MD` (seção de medição) com a regra de cobertura: tudo sai coberto por padrão, e como ajustar o percentual (FR-009)

## Phase 4: Verificação

- [ ] T009 Rodar `docker compose exec web npm test` e `vite build`; corrigir o que quebrar
- [ ] T010 Sincronizar templates (`sh scripts/sync-templates.sh`) e conferir `git status`: token só no `.env`
- [ ] T011 Seguir o `quickstart.md` com login real depois do deploy: sessão aparece no Replay com tudo coberto, mapa de calor nas telas visitadas, e `MIXPANEL_REPLAY_PERCENT=0` não grava; conferir se o plano do Mixpanel inclui replay e heatmaps

## Dependências

T001–T003 e T004 podem andar juntos → T005 (depois de T004) → T006–T008 → T009–T010 → T011 (só depois do deploy de produção).

## MVP

Fases 1 e 2: gravação com tudo coberto e mapa de calor ligados. A Fase 3 garante o liga/desliga e os testes de proteção.
