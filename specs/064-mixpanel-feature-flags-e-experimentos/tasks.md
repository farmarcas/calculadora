# Tasks: Feature flags e experimentos prontos no Mixpanel

**Input**: `specs/064-mixpanel-feature-flags-e-experimentos/` (spec, plan, research, quickstart)

**Formato**: `- [ ] T### [P] [US#] descrição com caminho`. Pasta do serviço: `frontend/react/src/analytics/`.

## Phase 1: Configuração

- [x] T001 [P] Criar `MIXPANEL_FLAGS=` (vazio liga quando há token; `0` ou `false` desliga) em `.env.example` e `.env.production.example`, com comentário em linguagem simples
- [x] T002 [P] Repassar como `VITE_MIXPANEL_FLAGS` em `docker-compose.yml` (serviço `web`) e `docker-compose.prod.yml` (args), e acrescentar `ARG VITE_MIXPANEL_FLAGS` em `frontend/react/Dockerfile`
- [x] T003 [P] Em `.github/workflows/deploy.yml`, passar `--build-arg VITE_MIXPANEL_FLAGS=${{ vars.MIXPANEL_FLAGS }}` no build de produção (variável do repositório, opcional)

## Phase 2: US3 + US1 — Preparado e com flag por pessoa (P1)

**Meta**: serviço consulta flags só após identificar; sem flag, tudo no padrão. **Teste**: quickstart passos 1 a 3 e 5 a 6.

- [x] T004 [US3] Em `analytics/servico.js`, `mixpanel.init` com flags desligadas; função `flagsLigadas(valor)` lê `VITE_MIXPANEL_FLAGS` (vazio = liga; `0`/`false` = desliga)
- [x] T005 [US1] Em `identificar`: quando a pessoa muda, ligar as flags com `set_config` passando como contexto as propriedades da pessoa e buscar com `flags.load_flags()`; mudança só de propriedades usa `flags.update_context`; tudo dentro do `seguro`
- [x] T006 [US3] Em `limpar`: desligar as flags antes do `mixpanel.reset()` para o SDK não buscar flags de pessoa anônima
- [x] T007 [US1] Em `servico.js`, exportar `flagLigada(nome)` (padrão `false`) e `variante(nome, padrao)`, usando `is_enabled_sync` e `get_variant_value_sync`; sem token, sem pessoa, com flags desligadas ou com erro, devolvem o padrão
- [x] T008 [P] [US1] Em `servico.test.js`: sem token e em modo demonstração nada é consultado; consulta só após `identificar`; contexto leva as propriedades da pessoa; `limpar` desliga antes do reset; `VITE_MIXPANEL_FLAGS=0` não consulta; erro do SDK não lança; padrão quando a flag não existe

## Phase 3: US2 — Gancho para telas e experimentos (P2)

**Meta**: telas leem flag e versão sem falar com o Mixpanel. **Teste**: quickstart passo 4.

- [x] T009 [US2] Criar `analytics/useFlag.js` com `useFlag(nome)` e `useVariante(nome, padrao)`: devolvem o padrão até as flags chegarem e re-renderizam quando chegarem (assinatura simples exposta pelo serviço, sem expor o SDK)
- [x] T010 [P] [US2] Criar `analytics/useFlag.test.jsx`: padrão antes das flags, valor novo após chegarem, sem erro sem token

## Phase 4: Documentação e verificação

- [x] T011 Atualizar `frontend/FRONTEND.MD` (seção de medição): como criar uma flag no Mixpanel e usar `useFlag` numa tela nova, como montar um experimento, e a regra do padrão desligado (FR-008)
- [x] T012 Rodar `docker compose exec -T web npx vitest run` e `vite build`; corrigir o que quebrar
- [x] T013 Sincronizar templates (`sh scripts/sync-templates.sh`) e conferir `git status`: token só no `.env`
- [ ] T014 Validar com flag e experimento de teste reais no Mixpanel (confirmar a chave de contexto para regras por perfil, decisão 4 do `research.md`), e apagar os de teste ao final; depois do deploy, repetir com login real

## Dependências

T001–T003 e T004 podem andar juntos → T005 e T006 (depois de T004) → T007 → T008 → T009 → T010 → T011–T013 → T014 (T014 final só após deploy de produção).

## MVP

Fases 1 e 2: serviço preparado, flag por pessoa e padrão seguro. A Fase 3 acrescenta o gancho para telas e experimentos.
