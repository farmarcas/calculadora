# Tarefas: Entrar pelo Radar (SSO) com grupos e lojas da pessoa

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Três repositórios: `api-authentication-dotnet` e `webapp-radar` (branch `feat/sso-calculadora`, a partir de `develop`) e `calculadora` (branch `feat/sso-radar`). Com o login desligado, a calculadora continua igual; cada fatia termina com os testes passando ou com o motivo de não terem rodado.

## Fatia 1 — API de autenticação (FR-021)
- [x] T001 [US1] `Farmarcas.Authentication.Domain/SsoSlugType.cs`: slug `Calculadora = 3`
- [x] T006 [P] [US1] `API/appsettings*.json`, `application/deploy.yaml`, `application/secretProviderClass.yaml`, `application-dev/deploy.yaml`: `Sso__Calculadora__*`
- [x] T007 Rodar o build da API de autenticação

## Fatia 2 — Radar (FR-002)
- [x] T008 [US1] `src/app/services/sso/sso.service.ts`: `openCalculadora()`, usando o mesmo caminho do `openPrisma()`, com teste
- [x] T009 [US1] `src/app/services/navigation/navigation.service.ts`, `toolbar-apps.component.html`, `app.module.ts` e `components/calculadora-icon/`: item "Calculadora" em Aplicações

## Fatia 3 — API da calculadora: base
- [x] T012 `backend/node/package.json`: `jose` e `cookie-parser`, com `@types/cookie-parser`
- [x] T013 `prisma/schema.prisma` e `prisma/migrations/<data>_sessoes_e_autor_da_auditoria/`: tabela `sessoes` e colunas `usuario_id` e `usuario_nome` em `auditoria`; aplicar no banco local e conferir que nada foi perdido
- [x] T014 `src/config/env.ts`: `SSO_HABILITADO`, `RADAR_AUTH_URL`, `SSO_CLIENT_ID`, `SSO_CLIENT_SECRET`, `SSO_SLUG`, `JWT_SEGREDO`, `SESSAO_HORAS`; produção recusa subir sem SSO ou sem variável, dizendo qual falta; teste unitário

## Fatia 4 — API da calculadora: login (História 1)
- [x] T015 [P] [US3] `modules/auth/papel.ts`: regra de FR-012, com teste unitário
- [x] T016 [P] [US1] `modules/auth/radar.client.ts`: `trocarCodigo` (`Sso/Exchange`), `lerUsuario` (`SessionInfo`), com limite de 10 s e resposta conferida por Zod
- [x] T017 [P] [US1] `modules/auth/jwt.ts`: assinar e conferir o JWT
- [x] T018 [US1] `modules/auth/auth.repository.ts` e `auth.service.ts`: abrir, ler e encerrar sessão, limpeza das vencidas
- [x] T019 [US1] `modules/auth/auth.routes.ts`: `GET /auth/sessao`, `POST /auth/sso/exchange`, `POST /auth/sair`, com cookies
- [x] T020 [US1] `shared/middlewares/sessao.ts` e `app.ts`: exigir sessão em tudo que não é saúde nem login; `/api/v1/users` só para o operador; `createApp` recebe o Radar de mentira

## Fatia 5 — API da calculadora: acesso (Histórias 2 e 3)
- [x] T021 [P] [US2] `modules/auth/acesso.ts`: plano de criação de grupos e lojas e cálculo de `acessoTotal`, com teste unitário
- [x] T022 [US2] `modules/auth/auth.repository.ts`: buscar por CNPJ, criar o que falta em transação, reler; loja excluída e grupo desativado ficam fora
- [x] T023 [US3] `shared/middlewares/perfil.ts`: com sessão, `X-Perfil` é ignorado e o perfil vem dela
- [x] T024 [US2] `shared/middlewares/ge.ts`: `X-GE` fora do acesso responde `403 GE_INDISPONIVEL`
- [x] T025 [US2] `modules/ge/ge.routes.ts`: `GET /ge` só com os grupos da sessão
- [x] T026 [US2] `shared/middlewares/guarda-de-lojas.ts`: tabela de rotas com negação por padrão para acesso parcial; `modules/cadastros` filtra as listagens; teste unitário da tabela
- [x] T027 [US3] `shared/auditoria/auditoria.ts`: autor lido do `AsyncLocalStorage` preenchido pelo middleware de sessão
- [x] T028 Testes de integração em `modules/auth/auth.routes.integration.test.ts`, com o Radar de mentira: todos os itens do `quickstart.md`, incluindo varrer as rotas de dados sem sessão (SC-002)

## Fatia 6 — Tela (Histórias 1, 2 e 3)
- [x] T029 [US1] `frontend/react/src/api/client.js`: cookie de sessão, aviso de `401` para o portão, sem `X-Perfil` com o login ligado
- [x] T030 [US1] `src/auth/`: `PortaoDeLogin` em `main.jsx`, callback em `/sso/callback`, telas sem sessão ("Ir para o Radar"), saída, erro e sem acesso
- [x] T031 [US2] `src/shell/FaixaDeContexto.jsx` e `src/shell/menu.js`: filtro de Grupo ao lado de Loja na Escala e sozinho em Cadastros; grupo guardado que não é mais da pessoa cai no primeiro; dados do navegador limpos ao sair
- [x] T032 [US3] `src/shell/MenuDaConta.jsx` e `src/App.jsx`: nome, e-mail, papel e "Sair"; bloco "Demonstração" só com o login desligado
- [x] T033 Testes da tela (lógica pura do portão) e `npm test`

## Fatia 7 — Ambiente e entrega
- [x] T034 [P] `docker-compose.yml`, `docker-compose.prod.yml`, `.env.example`, `.env.production.example`, `backend/node/.env.example`, `README.md`: variáveis novas; retirar o aviso de "sem login". `scripts/sync-templates.sh` fica de fora: `templates/` está desatualizada desde a spec 021, e sincronizar traria 112 arquivos sem relação com o login
- [x] T035 Rodar tudo (lint, type-check, unidade, integração, tela), subir o ambiente e percorrer o fluxo com um Radar de mentira local

## Fatia 8 — Permissão Gestão de Escala (2026-11-09)
- [x] T036 [P] `api-management-dotnet`: migration do grupo de permissão "Escala" → "Gestão de Escala" e rollback manual
- [x] T037 [P] `webapp-radar`: item "Escala" em Gestão, só com a permissão; sai o item "Calculadora" do menu Aplicações
- [x] T038 `modules/auth/papel.ts` e `auth.service.ts`: entra só com a permissão, sempre como `TENANT_ADMIN`; testes unitários e de integração

## Dependências e ordem
- As fatias 1 e 2 não dependem das outras no código; a 2 só funciona publicada depois da 1.
- 3 → 4 → 5 → 6. T028 depois de T015–T027. T034 pode andar junto.
- O teste de ponta a ponta real só existe depois de publicar a fatia 1 em dev.

## Estratégia
Primeiro a API de autenticação, que é pequena e bloqueia a publicação. Depois a API, com o login desligado por padrão para nada mudar no ambiente local, e por último a tela. Nada é publicado nem commitado sem pedido.
