# Feature Specification: Admin do Radar recebe as lojas dos grupos

**Feature Branch**: `feat/sso-radar`

**Created**: 2026-11-11

**Status**: Approved

**Input**: User description: "Ao sincronizar todos os GE para o perfil ADM do Radar, as lojas estão vindo junto? → Sim, faça: o Radar manda também as lojas ativas de todos os grupos e a calculadora cria as que faltam."

Completa a spec 037 (Admin do Radar vê todos os grupos), que deixou as lojas de fora.

## Clarifications

### Session 2026-11-12

- Q: O Angel também recebe as lojas de todos os grupos? → A: Sim (2026-11-12), igual ao Admin.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin encontra as lojas de qualquer grupo (Priority: P1)

Uma pessoa com papel Admin no Radar e a permissão "Gestão de Escala" entra pela Gestão → Escala. Além de todos os grupos, a calculadora recebe do Radar as lojas ativas de todos eles. Ao escolher um grupo, o filtro de Loja já traz as lojas daquele grupo, mesmo que ninguém tenha importado o cadastro nem entrado por ele antes.

**Why this priority**: Com a spec 037, o Admin vê todos os grupos, mas a maioria aparece vazia até alguém importar o cadastro. Sem as lojas, ele não consegue começar a ajudar o associado.

**Independent Test**: Entrar com uma conta Admin num ambiente em que a calculadora não tem nenhuma loja de um grupo X: escolher o grupo X e ver as lojas ativas dele, com os dados pendentes para completar.

**Acceptance Scenarios**:

1. **Given** um grupo cujas lojas ainda não existem na calculadora, **When** o Admin entra, **Then** as lojas ativas desse grupo no Radar passam a existir na calculadora, só com número, nome e CNPJ, e aparecem no filtro de Loja.
2. **Given** uma loja que já existe na calculadora, **When** o Admin entra, **Then** ela não é alterada.
3. **Given** uma loja excluída na calculadora, **When** o Admin entra, **Then** ela não volta.
4. **Given** uma loja desativada no Radar, sem grupo ou sem CNPJ válido, **When** o Admin entra, **Then** ela não é criada e o login continua.
5. **Given** um grupo desativado na calculadora, **When** o Admin entra, **Then** nenhuma loja é criada nele.
6. **Given** uma loja criada pelo login do Admin, **When** alguém abre o Cadastro, **Then** ela aparece com os dados pendentes para completar, como as lojas criadas no login do associado.

---

### User Story 2 - Demais papéis não mudam (Priority: P1)

Associado, Angel e os demais papéis continuam recebendo só as lojas vinculadas a eles, como hoje.

**Why this priority**: As lojas de todas as redes só podem chegar a quem já vê todos os grupos.

**Independent Test**: Entrar com uma conta User ligada a uma loja: só ela é criada, e nenhuma loja de outro grupo aparece na calculadora por causa desse login.

**Acceptance Scenarios**:

1. **Given** uma conta que não é Admin, **When** entra, **Then** só as lojas vinculadas a ela são criadas, como na spec 031.

---

### Edge Cases

- **Mesmo CNPJ em mais de um grupo no Radar**: a loja é criada uma vez só, no primeiro grupo que aparecer; o que já existe na calculadora vale.
- **Volume**: o login do Admin precisa continuar rápido com a rede inteira (milhares de lojas).
- **Radar ainda sem a mudança publicada**: o Admin entra como na spec 037 (grupos sem lojas).
- **Lista alterada no navegador**: sem efeito; vem de servidor para servidor, como os grupos.
- **Loja nova no Radar durante a sessão**: aparece na próxima entrada.

## Requirements *(mandatory)*

### Functional Requirements

**Radar (no clique do link)**

- **FR-001**: Ao validar o código do link da calculadora, o Radar MUST mandar também, para o papel Admin, as lojas ativas de todos os grupos econômicos, cada uma com número, nome, CNPJ e grupo.
- **FR-002**: Para os demais papéis, essa lista MUST ir vazia; as lojas deles continuam vindo como hoje.
- **FR-003**: O campo novo MUST ser opcional para quem não o usa (Prisma e versões antigas da calculadora).

**Calculadora**

- **FR-004**: No login do Admin, as lojas recebidas MUST passar pelas mesmas regras das lojas do associado: só ativas, com grupo e CNPJ válido; criadas só com número, nome e CNPJ; o que existe não é sobrescrito; loja excluída não volta; grupo desativado não recebe loja.
- **FR-005**: Sem o campo novo, o login MUST seguir a spec 037.
- **FR-006**: O acesso do Admin MUST continuar total em todos os grupos, com ou sem lojas.

### Key Entities

- **Lojas da rede**: número, nome, CNPJ e grupo de cada loja ativa do Radar, enviadas só para o Admin.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Depois do primeiro login de um Admin, 100% das lojas ativas do Radar com grupo e CNPJ válido existem na calculadora, salvo as excluídas e as de grupos desativados.
- **SC-002**: O login do Admin termina em até 5 segundos com 2.000 grupos e 10.000 lojas; nas entradas seguintes, sem lojas novas, em até 3 segundos.
- **SC-003**: Nenhum login de quem não é Admin cria loja que não esteja vinculada à pessoa.

## Assumptions

- "Loja ativa" é a mesma regra de hoje: status Ativado no Radar.
- Decision: as lojas vão no mesmo passo que já leva os grupos (validação do código do link). Why: mesma segurança e nenhuma chamada nova, como a spec 037.
- Decision: a calculadora usa o mesmo caminho que já cria as lojas do associado. Why: as regras de criação (CNPJ, excluída, grupo desativado) já estão testadas ali.
- Fora desta entrega: atualizar nome ou CNPJ de loja que já existe e trazer horários, faturamento ou custos do Radar.

## Dependencies

- `api-authentication-dotnet`: a lista de lojas no `Sso/Exchange`, nas duas branches da integração.
- Nenhuma mudança no `webapp-radar`, no `api-management-dotnet` nem no banco da calculadora.
