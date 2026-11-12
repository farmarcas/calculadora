# Feature Specification: Admin do Radar vê todos os grupos

**Feature Branch**: `feat/sso-radar`

**Created**: 2026-11-10

**Status**: Approved

**Input**: User description: "Ajuste para que quando um perfil ADM logar no radar, preciso chamar API para listar os GEs, pois este perfil terá acesso a todos os GEs; demais perfis, como associado por ex., esses sim vem o grupo de GEs/lojas que possui acesso. Se for perfil ADM precisa implementar a chamada do endpoint para listar os GEs e então enviar para a calculadora já com esses GEs que o ADM possui acesso; demais perfis usar grupos que está vinculado."

Muda a regra de grupos da spec 031 (FR-010 e a premissa "quem tem a permissão entra como Dono do grupo mesmo sendo Admin ou Angel… só vê os grupos das lojas ligadas a ela") apenas para o papel Admin do Radar.

## Clarifications

### Session 2026-11-12

- Q: O Angel também vê todos os grupos? → A: Sim (2026-11-12). Admin e Angel recebem todos os grupos com acesso ao grupo inteiro; os demais papéis continuam só com os vinculados. Substitui a premissa de que só o Admin vê todos e a de que o Angel fica como "demais perfis".

### Session 2026-11-10

- Q: Quem monta a lista de grupos do Admin? → A: O Radar, no clique do link da calculadora. O Radar já entrega à calculadora a lista final, juntando os grupos das lojas da pessoa com os grupos que o papel dela libera. A calculadora não chama nenhuma API nova do Radar nem ganha configuração nova.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin entra vendo todos os grupos (Priority: P1)

Uma pessoa com papel Admin no Radar e a permissão "Gestão de Escala" clica em Gestão → Escala. O Radar confere quem ela é e entrega à calculadora todos os grupos econômicos. O filtro de Grupo no topo lista todos esses grupos, não só os das lojas ligadas a ela. Ela escolhe qualquer grupo e trabalha nele como Dono do grupo, vendo todas as lojas que a calculadora tem daquele grupo.

**Why this priority**: O Admin é a equipe interna que apoia todas as redes. Hoje ele só vê os grupos das lojas a que está vinculado no Radar, o que na prática é pouco ou nada, e fica sem como ajudar os associados.

**Independent Test**: Entrar com uma conta Admin que tem a permissão e não está vinculada a nenhuma loja: entra, e o filtro de Grupo traz todos os grupos do Radar. Escolher um grupo que tem lojas na calculadora e ver todas elas.

**Acceptance Scenarios**:

1. **Given** uma conta Admin com a permissão "Gestão de Escala", **When** entra pela Gestão → Escala, **Then** o filtro de Grupo lista todos os grupos econômicos do Radar.
2. **Given** uma conta Admin sem nenhuma loja vinculada no Radar, **When** entra, **Then** entra normalmente, sem a tela de sem acesso.
3. **Given** um grupo do Radar que ainda não existe na calculadora, **When** o Admin entra, **Then** o grupo passa a existir na calculadora, com o número e o nome do Radar, e aparece no filtro sem lojas, pronto para a importação do cadastro.
4. **Given** um grupo escolhido, **When** o Admin abre o filtro de Loja, **Then** vê todas as lojas ativas que a calculadora tem daquele grupo, como Dono do grupo com acesso total, mesmo que esteja vinculado a só uma delas no Radar.
5. **Given** uma conta Admin sem a permissão "Gestão de Escala", **When** tenta entrar, **Then** vê a tela de sem acesso, como hoje.

---

### User Story 2 - Demais papéis continuam com os grupos vinculados (Priority: P1)

Associado, Angel e qualquer outro papel que não seja Admin entram como hoje: só os grupos e lojas ligados à conta no Radar.

**Why this priority**: Garante que a mudança não abre os dados de outras redes para quem não é da equipe interna.

**Independent Test**: Entrar com uma conta User (associado) e uma Angel, cada uma ligada a 2 grupos, e ver só esses 2 no filtro; pedir os dados de um terceiro grupo é recusado.

**Acceptance Scenarios**:

1. **Given** uma conta que não é Admin, **When** entra, **Then** o filtro mostra só os grupos das lojas ligadas a ela, como na spec 031.
2. **Given** uma conta que não é Admin com parte das lojas de um grupo, **When** usa a calculadora, **Then** continua vendo só essas lojas.
3. **Given** uma conta que não é Admin, **When** tenta abrir um grupo fora da sua lista, **Then** o pedido é recusado como se o grupo não existisse.

---

### Edge Cases

- **Lista vazia**: quem não recebe nenhum grupo vê a tela de sem acesso, como hoje.
- **Radar ainda sem a mudança publicada**: a calculadora continua funcionando como hoje (grupos das lojas vinculadas), sem erro.
- **Lista alterada no navegador**: não tem efeito; a lista sai do servidor do Radar direto para o servidor da calculadora, sem passar pelo navegador.
- **Grupo desativado na calculadora**: continua fora do filtro, mesmo que o Radar o traga.
- **Grupo que já existe na calculadora com outro nome**: o nome da calculadora fica como está.
- **Admin também vinculado a lojas**: essas lojas são criadas na calculadora como hoje (pelo CNPJ), e o Admin continua vendo todos os grupos, com acesso total.
- **Muitos grupos**: o filtro continua utilizável com centenas de grupos, em ordem alfabética.
- **Papel mudou no Radar durante a sessão**: vale na próxima entrada, como as demais mudanças de acesso.

## Requirements *(mandatory)*

### Functional Requirements

**Radar (no clique do link)**

- **FR-001**: Ao validar o código do link da calculadora, o Radar MUST entregar junto a lista final de grupos econômicos da pessoa, cada um com número, nome e se o acesso é ao grupo inteiro.
- **FR-002**: Para o papel Admin, a lista MUST trazer todos os grupos econômicos do Radar, com acesso ao grupo inteiro.
- **FR-003**: Para os demais papéis, a lista MUST trazer só os grupos das lojas ligadas à pessoa, sem acesso ao grupo inteiro (vale a lista de lojas, como hoje).
- **FR-004**: A lista MUST ser montada pelo servidor do Radar a partir do cadastro da pessoa; nada que venha do navegador pode aumentá-la.
- **FR-005**: A mudança MUST NOT alterar o que o Radar devolve hoje para os outros sistemas que entram pelo mesmo caminho (como o Prisma) além de um campo novo, que eles podem ignorar.

**Calculadora**

- **FR-006**: A calculadora MUST usar a lista recebida do Radar como os grupos da sessão, sem fazer nenhuma chamada nova ao Radar e sem configuração nova.
- **FR-007**: Em grupo com acesso ao grupo inteiro, a pessoa MUST ver e alterar todas as lojas que a calculadora tem do grupo e poder usar as importações do grupo.
- **FR-008**: Nos demais grupos, o acesso MUST continuar limitado às lojas ligadas à pessoa no Radar (spec 031, FR-013 a FR-015).
- **FR-009**: Grupos da lista que não existem na calculadora MUST ser criados no login, só com número e nome; o que já existe MUST NOT ser sobrescrito, e grupo desativado na calculadora MUST ficar fora do acesso.
- **FR-010**: A permissão "Gestão de Escala" MUST continuar obrigatória para todos os papéis, e todos entram como Dono do grupo. O Admin MUST NOT virar Operador da plataforma.
- **FR-011**: Se o Radar não mandar a lista, a calculadora MUST seguir a regra de hoje (grupos das lojas vinculadas).
- **FR-012**: O filtro de Grupo MUST listar os grupos em ordem alfabética.

### Key Entities

- **Lista de grupos do login**: número, nome e "acesso ao grupo inteiro" de cada grupo, montada pelo Radar no clique do link.
- **Papel no Radar**: Admin libera todos os grupos; os demais, só os vinculados.
- **Acesso da sessão**: grupos com acesso total (Admin) ou limitados às lojas vinculadas (demais).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma conta Admin com a permissão entra e encontra no filtro 100% dos grupos do Radar que não estão desativados na calculadora.
- **SC-002**: Uma conta que não é Admin continua vendo só os seus grupos e lojas, em teste com pelo menos 1 associado e 1 Angel.
- **SC-003**: O login do Admin termina em até 5 segundos com até 2.000 grupos.
- **SC-004**: Alterar qualquer dado no navegador durante a entrada não acrescenta nenhum grupo, em 100% das tentativas.

## Assumptions

- "Perfil ADM" é o papel **Admin** do Radar. Angel continua como "demais perfis" (só os grupos vinculados).
- Todos os grupos econômicos do Radar entram na lista do Admin, inclusive os sem lojas ativas.
- Decision: a lista é montada no passo em que o Radar valida o código do link e entrega o login à calculadora. Why: é o único passo feito de servidor para servidor, então a lista não pode ser alterada no navegador, e a calculadora já chama esse passo hoje.
- Decision: o grupo criado pelo login do Admin nasce sem lojas. Why: a lista traz só número e nome; as lojas entram pela importação do cadastro ou quando um associado do grupo entra.
- Decision: a lista vale só no login, como o resto do acesso. Why: a calculadora não depende do Radar durante o uso; um grupo novo no Radar aparece na próxima entrada.
- Fora desta entrega: dar ao Angel a visão de todos os grupos e criar as lojas de todos os grupos no login do Admin.

## Dependencies

- Em `api-authentication-dotnet`, publicado antes ou depois da calculadora (as duas ordens funcionam): a lista de grupos na validação do código do link.
- Nenhuma mudança no `webapp-radar` nem no `api-management-dotnet`.
- Nenhuma configuração nova na calculadora.
