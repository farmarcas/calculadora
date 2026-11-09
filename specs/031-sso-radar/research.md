# Research: Entrar pelo Radar (SSO)

## 1. Como a pessoa chega à calculadora

- **Decision** (de quem pediu): link no Radar, igual ao Prisma (desde 2026-11-09, em Gestão → Escala). O `SsoService` do Radar chama `Sso/Start?slug=Calculadora` com a sessão de quem está logado e abre o `RedirectUrl` (`<CallbackUrl>?code=…`) em outra aba.
- **Rationale**: em produção, `Sso/Start` responde 500 sem usuário logado, inclusive com Basic ou slug inexistente, porque o `SessionUser` é montado antes da ação. O código é gerado para quem está logado, então a chamada precisa partir do Radar.
- **Alternatives**: rota `Sso/LoginUrl` e página `/sso/entrar` no Radar; URL do login em variável com `req_token`; `Sso/Start` chamado pela API da calculadora antes do login. Todas descartadas.

## 2. Tela sem sessão

- **Decision**: como no Prisma, a calculadora mostra "Ir para o Radar", sem redirecionar sozinha. O endereço vem de `VITE_RADAR_URL`, gravado na imagem da tela a partir de `RADAR_URL`.
- **Rationale**: é um endereço público fixo por ambiente, como o `environment.radarUrl` do Prisma. Sem redirecionamento, não existe ciclo a evitar nem tela de retorno a guardar: o Radar abre outra aba, que não compartilha o `sessionStorage`.

## 3. Prova de que o retorno é do login daquele navegador

- **Decision**: não há `state`. O FR-005 foi retirado.
- **Rationale**: o login nasce no Radar, e a calculadora não tem o que comparar. O Prisma faz igual. Restam o código de uso único, com validade de `CodeTtlSeconds`, e a troca com as credenciais da calculadora.

## 3a. Convivência com o `AUTH_MODE=radar` da `main`

- **Decision**: manter os dois logins, um por vez. A sessão do `AUTH_MODE=radar` fica em `res.locals.sessaoRadar`, separada da `res.locals.sessao`. Sob `/escala`, o retorno usa `BASE_URL`, e o nginx do cluster reescreve o caminho do cookie com `proxy_cookie_path`.
- **Rationale**: a junção não apaga o trabalho de ninguém nem derruba a publicação em `/escala`. Qual login fica é uma decisão separada.

## 4. Sessão: JWT num cookie + tabela de sessões

- **Decision**: JWT HS256 (`jose`) com `sub`, `sid` e `exp`, num cookie httpOnly, `SameSite=Lax`, `Secure` em produção, `Path=/api`. Papel e acesso ficam na tabela `sessoes`, lida a cada pedido pela chave primária.
- **Rationale**: um dono pode ter centenas de lojas e um cookie cabe 4 KB, então o acesso não cabe no JWT. A tabela faz o "Sair" valer na hora. O cookie httpOnly não fica ao alcance de script da página e funciona no download de arquivos, que hoje usa `fetch` direto. Tela e API têm a mesma origem (nginx e proxy do Vite), logo não há CORS, e `SameSite=Lax` bloqueia POST de outro site.
- **Alternatives**: `Authorization: Bearer` guardado no `localStorage` (exposto a XSS, e exige mexer em cada chamada); tudo no JWT (não cabe, e o "Sair" não invalida).
- **Custo**: uma leitura por chave primária a cada pedido; `exigirGe` já faz outra.

## 5. Tecnologia nova (Constituição III)

- **Decision**: `jose` (assinar e conferir JWT) e `cookie-parser` (ler o cookie). Chamadas ao Radar usam o `fetch` nativo do Node 22, com `AbortSignal.timeout(10000)`.
- **Rationale**: assinatura de JWT não se escreve à mão. `jose` não tem dependências e é ESM, como o projeto.

## 6. Origem de grupos, lojas e papel

- **Decision**: `GET SessionInfo` da API de autenticação, com o token do Radar, uma vez no login. O token do Radar é descartado em seguida.
- **Rationale**: é o que o pedido descreve, e `SessionInfo` já traz `stores[].economicGroup`, `cnpj`, `status`, `name` e `role`. `EconomicGroupController` do `api-management-dotnet` é restrito a Admin e Angel, então não serve ao dono.
- **Sem mudança no `SessionInfo`**: ele já traz `permissions[]` como `{ farmarcasSystem, key }`, com as permissões padrão do papel e as concedidas na edição do usuário.

## 7. Regra de papel (FR-012)

Revista em 2026-11-09: o papel deixa de vir de `role` e `occupation`.

| Radar | Calculadora |
| --- | --- |
| `permissions[]` com `Management` / `ManagementWorkSchedule` | `TENANT_ADMIN` nos grupos das suas lojas |
| Sem essa permissão | sem acesso |

A permissão nasce na migration `20261109120000 - Add Escala permissions.sql` do `api-management-dotnet`: card "Escala" (`AccessWorkSchedule`) com o item "Gestão de Escala" (`ManagementWorkSchedule`), categoria Administrar, no sistema `Management`, liberada para Admin, Angel e User sem ser padrão. Só a chave do item vale; o card sozinho não dá acesso. `PLATFORM_OPERATOR`, `SCHEDULE_MANAGER` e `SCHEDULE_VIEWER` continuam no código, mas o login pelo Radar não os atribui.

## 8. Ligação e criação de grupos e lojas (FR-011, FR-013)

- **Decision**: buscar as lojas por CNPJ primeiro e usar o `geId` real delas; só então criar o que falta. Grupo: `identificacao = String(economicGroup.id)`, `nome = economicGroup.name`. Loja: `codigo = String(store.id)` (o mesmo `Id` da planilha da plataforma), `nome`, `cnpj`. Só lojas com `status = 2` (Active), equivalente ao "Ativado" da carga.
- **Rationale**: buscar por CNPJ primeiro limita o estrago se o número do grupo não bater com a `identificacao`: as lojas já carregadas continuam achadas. Depois da criação, a situação "Revisar" e o painel de pendências já acusam o que falta, sem regra nova.
- **Concorrência**: `createMany` com `skipDuplicates` respeita os índices únicos parciais; dois logins simultâneos não falham, e o resultado é relido.
- **Carga depois do login**: `comparar.ts` trata `ultimaCarga` nula. Campos vazios são preenchidos pela carga; o nome, que já existe, vira conflito para o operador decidir, o que é seguro.
- **Casos que não criam nada**: loja com CNPJ de uma loja excluída, grupo desativado, loja sem grupo ou sem CNPJ válido. Ficam fora do acesso e vão para o log.

## 9. Restrição por loja sem reescrever os repositórios

- **Decision**: middleware `guardaDeLojas`, com tabela de rotas e negação por padrão, aplicado a quem tem acesso parcial ao grupo. Rotas por loja conferem a loja; `/simulacoes/:id` e `/funcionarios/:id` resolvem a loja antes; listagens recebem os ids para filtrar; rota que não está na tabela responde 403.
- **Rationale**: filtrar por loja em todas as consultas de 5 repositórios seria um diff grande e arriscado. Com negação por padrão, uma rota nova esquecida fica bloqueada para quem tem acesso parcial, em vez de vazar.
- **Acesso total**: quem tem todas as lojas ativas do grupo no login (e o operador) não passa pela guarda.
- **Importações de grupo inteiro**: `importacoes/cadastro*` e `cargas/base*` ficam fora da tabela, logo recusadas para acesso parcial.

## 10. Login desligável só fora de produção

- **Decision**: `SSO_HABILITADO`, falso por padrão em desenvolvimento e teste. Com `NODE_ENV=production`, `env.ts` recusa subir sem o SSO ligado e sem as variáveis obrigatórias.
- **Rationale**: mantém os 64 usos de `X-GE`/`X-Perfil` nos testes e o ambiente local sem Radar. A trava impede produção aberta por engano, e a falha aparece na publicação com o nome da variável (spec 021).

## 11. Quem fez, na auditoria (FR-020)

- **Decision**: `AsyncLocalStorage` preenchido pelo middleware de sessão; `auditar` lê dele e grava `usuario_id` e `usuario_nome`.
- **Rationale**: cobre todos os pontos de auditoria sem alterar cada chamada, e ninguém esquece.

## 12. Tela depois do login (FR-007)

- **Decision**: depois do login a pessoa cai na tela inicial.
- **Rationale**: o Radar abre outra aba, que não enxerga o que a aba anterior guardou, e o menu do Radar não aponta para uma tela específica.

## 13. Rota `/api/v1/users`

- **Decision**: passa a exigir sessão e perfil de operador.
- **Rationale**: é o CRUD de exemplo do esqueleto, hoje aberto, e não pode ficar fora do FR-009. Removê-lo foge do escopo.

## 14. Lacuna do Golden Path

`AGENTS.md` registra que autenticação e JWT não têm skill. As decisões acima seguem o modelo do `prisma-api-dotnet` (`RadarSsoExchangeService`, `SsoController`) e ficam registradas aqui.
