# Tasks: Medição de uso com Mixpanel (serviço central)

**Input**: `specs/059-mixpanel-servico-central/` (spec, plan, research, data-model, contracts, quickstart)

**Formato**: `- [ ] T### [P] [US#] descrição com caminho`. Pasta do serviço: `frontend/react/src/analytics/`.

## Phase 1: Setup e configuração

- [x] T001 Adicionar `mixpanel-browser` em `frontend/react/package.json` (e `package-lock.json`)
- [x] T002 [P] Criar a variável `MIXPANEL_TOKEN=` (vazia, com comentário "vazio = medição desligada") em `.env.example` e `.env.production.example`
- [x] T003 [P] Repassar a variável como `VITE_MIXPANEL_TOKEN: ${MIXPANEL_TOKEN:-}` em `docker-compose.yml` (serviço `web`) e como `args` em `docker-compose.prod.yml`; acrescentar `ARG VITE_MIXPANEL_TOKEN` (e `VITE_MIXPANEL_API_HOST` opcional) no estágio `build` de `frontend/react/Dockerfile`
- [x] T004 [P] Conferir a região do projeto Radar Escala (id 4084146) no Mixpanel e registrar em `research.md` se precisa de `VITE_MIXPANEL_API_HOST`

## Phase 2: Serviço central (base de tudo)

- [x] T005 Criar `analytics/catalogo.js` com os 8 eventos de `contracts/catalogo-eventos.md` e a lista de propriedades permitidas por evento
- [x] T006 Criar `analytics/servico.js` com `iniciar`, `identificar`, `registrar`, `limpar`: sem token fica inativo; sem captura automática nem gravação de sessão; descarta evento fora do catálogo e propriedade fora da lista; soma `ambiente` (`producao`/`desenvolvimento`); tudo em `try/catch`, nunca lança erro
- [x] T007 [P] Criar `analytics/servico.test.js` (Mixpanel simulado): sem token nada é enviado; evento desconhecido e propriedade extra são descartados; `identificar` manda ID, nome, e-mail e perfil; `limpar` desfaz a identidade; erro do SDK não vaza
- [x] T008 Chamar `iniciar()` em `src/main.jsx`

## Phase 3: US1 — Quem usa e quais telas (P1)

**Meta**: pessoa identificada e telas registradas. **Teste**: quickstart passos 2–3 e 5.

- [x] T009 [US1] Backend: em `backend/node/src/modules/auth/auth.service.ts` (`corpoDaSessao`), devolver `usuario: { id, nome, email }` (ID = `radarUsuarioId`; conferir o campo em `SessaoAtiva`); ajustar `auth.routes.integration.test.ts`
- [x] T010 [US1] Em `src/App.jsx`: com `sso` ligado, `identificar` ao ter `sessao.usuario` e a cada mudança de `perfil`; sem SSO (demonstração) não identifica nem mede; `limpar` dentro de `sair`
- [x] T011 [US1] Em `src/App.jsx`: `registrar("tela_vista", { tela, secao })` quando a folha atual muda (inclui a primeira tela)
- [x] T012 [P] [US1] Em `src/auth/PortaoDeLogin.jsx`: `registrar("login_concluido")` quando o retorno do login do Radar dá certo (não em recarregar a página)

## Phase 4: US2 — Ações-chave (P1)

**Meta**: cada ação do catálogo gera um evento. **Teste**: quickstart passo 4.

- [x] T013 [P] [US2] `loja_trocada` em `src/App.jsx` (troca pelo filtro da faixa, sem enviar qual loja)
- [x] T014 [P] [US2] `simulacao_criada` com `regra_horas` e `origem` em `src/features/diagnostico/Comparativo.jsx` e `src/features/grade/GradeTab.jsx`
- [x] T015 [P] [US2] `cenario_salvo` ao gravar/clonar em `src/features/simulacao/SimulacaoPage.jsx`
- [x] T016 [P] [US2] `importacao_concluida` com `tipo` e `resultado` (sucesso e erro) em `src/features/cadastros/ModalImportarCadastro.jsx` e `src/features/diagnostico/ModalEnviarBase.jsx`
- [x] T017 [P] [US2] `parametros_salvos` em `src/features/parametros/EncargosPorRegime.jsx` e `src/features/diagnostico/Encargos.jsx`
- [x] T018 [P] [US2] `exportacao_feita` nos downloads (modelo de planilha e lista de erros) em `ModalEnviarBase.jsx` e `ModalImportarCadastro.jsx`

## Phase 5: US3 — Um só ponto, fácil de manter (P2)

- [x] T019 [US3] Garantir que só `analytics/servico.js` importa `mixpanel-browser` (busca no código) e que o catálogo está citado no `frontend/FRONTEND.MD` com a regra "toda medição passa pelo serviço"
- [x] T020 [US3] Teste de falha: SDK que lança erro e rede bloqueada não quebram a tela (cobrir em `servico.test.js`)

## Phase 5b: Propriedades da pessoa (pedido em 2026-11-16)

- [x] T023 Migration `sessoes.papel_radar` (Prisma) e `schema.prisma`; guardar `usuario.role.name` ao abrir a sessão
- [x] T024 `corpoDaSessao` devolve `usuario.papelRadar` e `totalLojas`; ajustar testes de integração do login
- [x] T025 `catalogo.js` lista as propriedades permitidas da pessoa; `servico.identificar` envia só elas; `App.jsx` monta os valores da sessão; testes em `servico.test.js`

## Phase 6: Verificação

- [x] T021 Rodar os testes do front e do backend dentro do Docker e corrigir o que quebrar
- [x] T022 Subir o ambiente (`docker compose up -d --build --wait`) e seguir o `quickstart.md`: com token de teste local e sem token (medição desligada); conferir os eventos nos "Eventos ao vivo" do Mixpanel; token só no `.env`, nunca no git (`git status`)

## Dependências

T001 → T005–T008 → T009–T012 e T013–T018 (podem andar em paralelo entre si) → T019–T020 → T021–T022. T009 antes de T010.

## MVP

Fases 1 a 3: pessoa identificada e telas registradas. As ações-chave (Fase 4) vêm em seguida.
