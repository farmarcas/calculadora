# Tasks: Usersnap instalado no Radar Escala

**Input**: `specs/065-usersnap-feedback/` (spec, plan, research, quickstart)

**Formato**: `- [ ] T### [P] [US#] descrição com caminho`. Pasta do serviço: `frontend/react/src/feedback/`.

## Phase 1: Configuração

- [x] T001 [P] Criar `USERSNAP_SPACE_KEY=` (vazio = desligado) em `.env.example` e `.env.production.example`, com comentário em linguagem simples
- [x] T002 [P] Repassar como `VITE_USERSNAP_SPACE_KEY` em `docker-compose.yml` (serviço `web`) e `docker-compose.prod.yml` (args), e `ARG VITE_USERSNAP_SPACE_KEY` em `frontend/react/Dockerfile`
- [x] T003 [P] Em `.github/workflows/deploy.yml`, passar `--build-arg VITE_USERSNAP_SPACE_KEY="$USERSNAP_SPACE_KEY"` só no build de produção (segredo `USERSNAP_SPACE_KEY`; homologação fica vazio)
- [x] T004 Instalar `@usersnap/browser` (1.0.2) em `frontend/react` (dentro do container) e conferir `package.json` e `package-lock.json`

## Phase 2: US1 + US2 + US3 — Carregar, identificar e desmontar (P1)

**Meta**: Usersnap só com pessoa logada, identificada, e sai ao sair. **Teste**: quickstart passos 1 a 5.

- [x] T005 [US3] Criar `feedback/servico.js` com `iniciar(config)` (lê a chave; vazio = desligado), `identificar({id,nome,email,perfil,papel_radar,loja})`, `limpar()`; tudo em `seguro()`; único arquivo que importa `@usersnap/browser`
- [x] T006 [US1] Em `identificar`: primeira pessoa chama `loadSpace(chave)` e `api.init({ user: { userId, email, nome, perfil, papel_radar }, custom: { loja } })`; repetir os mesmos dados não refaz nada; troca de loja faz `destroy` e `init` de novo; troca de pessoa também
- [x] T007 [US3] Em `limpar`: `destroy` e esquecer a pessoa; carregamento ainda em andamento ao sair não deixa widget para a próxima pessoa
- [x] T008 [P] [US1] `feedback/servico.test.js` com o pacote simulado: sem chave nada carrega; nada antes de `identificar`; campos do `init` corretos e sem dado extra; mesma pessoa não repete; troca de loja refaz; `limpar` desmonta; falha do `loadSpace` não lança erro
- [x] T009 [US2] Ligar em `App.jsx` (identificar ao entrar e ao trocar de loja, só com sessão do Radar) e em `PortaoDeLogin.jsx` (`limpar` ao sair e ao perder a sessão); `main.jsx` chama `iniciar`

## Phase 3: Documentação e verificação

- [x] T010 Atualizar `frontend/FRONTEND.MD`: o que o Usersnap recebe, que o app não cria botão próprio (widgets no painel), como configurar a chave, e o aviso de que a captura pode mostrar dados da tela (FR-010)
- [x] T011 Rodar `docker compose exec -T web npx vitest run` e `vite build`; corrigir o que quebrar
- [x] T012 Sincronizar templates (`sh scripts/sync-templates.sh`) e conferir `git status`: chave só no `.env`
- [ ] T013 Com a chave real da pessoa, seguir o `quickstart.md` localmente e depois em produção, com widget ativo no painel

## Dependências

T001–T004 juntos → T005 → T006 e T007 → T008 → T009 → T010–T012 → T013 (chave real; produção só após o deploy).

## MVP

Fases 1 e 2: Usersnap carregado só para quem está logado, identificado e desmontado ao sair.
