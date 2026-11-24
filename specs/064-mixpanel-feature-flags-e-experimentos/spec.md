# Feature Specification: Feature flags e experimentos prontos no Mixpanel

**Feature Branch**: `feat/mixpanel-feature-flags-e-experimentos`

**Created**: 2026-11-24

**Status**: Draft

**Input**: "Como posso habilitar feature flags e experiments? Eu queria apenas deixar já preparado quando for usar." Continua as specs [059](../059-mixpanel-servico-central/spec.md) e [060](../060-mixpanel-mapa-de-calor-e-replay/spec.md): o serviço central de medição é o único ponto de contato com o Mixpanel.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Liberar uma função nova aos poucos, sem publicar de novo (Priority: P1)

Quando uma função nova existir, o time cria uma **flag** no Mixpanel e escolhe para quem ela fica ligada (uma parcela das pessoas, um perfil, uma lista). A tela nova só aparece para quem estiver na regra. Desligar é mudar no Mixpanel, sem publicar o sistema.

**Why this priority**: É o ganho principal: liberar e recuar rápido, com risco menor.

**Independent Test**: Criar uma flag de teste no Mixpanel, ligá-la para uma pessoa identificada e ver o sistema responder "ligada" para ela e "desligada" para as outras.

**Acceptance Scenarios**:

1. **Given** uma flag ligada para o perfil `TENANT_ADMIN`, **When** uma pessoa com esse perfil entra, **Then** o sistema trata a flag como ligada para ela.
2. **Given** a mesma flag, **When** uma pessoa de outro perfil entra, **Then** o sistema a trata como desligada.
3. **Given** uma flag que não existe no Mixpanel, **When** o sistema a consulta, **Then** vale o padrão (desligada) e nada quebra.

---

### User Story 2 - Testar duas versões e ver qual funciona melhor (Priority: P2)

O time cria um **experimento** com duas ou mais versões (A e B). O Mixpanel divide as pessoas, o sistema mostra a versão de cada uma e o Mixpanel compara os resultados com os eventos que já são medidos (spec 059).

**Why this priority**: Depende de ter uma mudança de tela real para comparar; por isso vem depois da flag simples.

**Independent Test**: Com um experimento de teste, duas pessoas diferentes recebem versões possíveis e o Mixpanel registra qual versão cada uma viu.

**Acceptance Scenarios**:

1. **Given** um experimento com duas versões, **When** uma pessoa identificada abre a tela, **Then** ela recebe sempre a mesma versão enquanto o experimento durar.
2. **Given** a pessoa recebeu uma versão, **When** ela usa a tela, **Then** o Mixpanel registra que ela entrou no experimento e em qual versão.

---

### User Story 3 - Preparado, mas sem mudar nada hoje (Priority: P1)

Hoje não há flag nem experimento. O sistema fica **preparado**: o app sabe perguntar ao Mixpanel e há um jeito único e documentado de usar. O comportamento atual das telas não muda.

**Why this priority**: É exatamente o pedido: deixar pronto para quando for usar.

**Independent Test**: Com o preparo ligado e nenhuma flag criada, todas as telas se comportam como antes e os testes existentes passam.

**Acceptance Scenarios**:

1. **Given** nenhuma flag criada, **When** o sistema abre, **Then** nada muda para a pessoa.
2. **Given** o Mixpanel fora do ar, sem token ou bloqueado no navegador, **When** o sistema abre, **Then** vale o padrão de cada flag, sem erro visível nem lentidão perceptível.
3. **Given** modo demonstração (sem login do Radar), **When** o sistema abre, **Then** nenhuma flag é consultada e vale o padrão.

---

### Edge Cases

- Flag consultada antes de as flags chegarem do Mixpanel: vale o padrão naquele instante e a tela não pisca nem trava esperando.
- Pessoa troca de perfil ou de loja durante a sessão: a regra usa o perfil atual quando as flags forem buscadas de novo no próximo login.
- Flag apagada ou renomeada no Mixpanel: o sistema volta ao padrão, sem erro.
- Pessoa sai e outra entra no mesmo navegador: as flags da anterior não valem para a nova.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST poder consultar flags e experimentos do projeto Radar Escala do Mixpanel, só com pessoa logada pelo Radar.
- **FR-002**: O sistema MUST oferecer duas operações simples ao resto do app: saber se uma flag está ligada, e saber qual versão de um experimento a pessoa recebeu, sempre com um valor padrão.
- **FR-003**: Nenhuma tela MUST falar direto com o Mixpanel; tudo passa pelo serviço central de medição.
- **FR-004**: As regras de quem recebe a flag MUST poder usar as propriedades da pessoa que já são enviadas (perfil, papel no Radar, operador, quantidade de grupos e de lojas, acesso total).
- **FR-005**: Quando a pessoa entra num experimento, o sistema MUST registrar isso no Mixpanel para a análise do resultado.
- **FR-006**: Com falha, bloqueio, token ausente ou modo demonstração, o sistema MUST usar o valor padrão, sem erro visível.
- **FR-007**: O comportamento atual de todas as telas MUST ficar idêntico enquanto nenhuma flag existir.
- **FR-008**: O guia do front MUST explicar, em passos curtos, como criar uma flag e usá-la numa tela nova, e como montar um experimento.
- **FR-009**: Deve ser possível desligar o preparo inteiro por configuração, como já ocorre com a medição.

### Key Entities

- **Flag**: chave com nome, valor padrão e regra de quem a recebe, definida no Mixpanel.
- **Experimento**: flag com versões e uma métrica de sucesso, com resultado calculado no Mixpanel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Com uma flag de teste ligada no Mixpanel, a pessoa certa vê o comportamento novo em até 1 minuto após entrar, sem publicar o sistema.
- **SC-002**: Com nenhuma flag criada, 0 diferenças visíveis nas telas e 100% dos testes existentes passando.
- **SC-003**: Com o Mixpanel indisponível, 0 telas quebradas ou lentidão perceptível.
- **SC-004**: Uma pessoa do time consegue criar uma flag nova e usá-la numa tela seguindo só o guia, sem ajuda.

## Assumptions

- Hoje não há função nova para controlar; por isso nenhuma flag real é criada. Só uma flag de teste, apagada ao final, para validar o caminho.
- Padrão do agente: toda flag nasce **desligada** quando não puder ser consultada, porque é o comportamento de hoje e o mais seguro.
- Padrão do agente: a consulta só acontece depois da identificação da pessoa, como na medição e na gravação.
- Depende de o plano do Mixpanel do projeto Radar Escala incluir feature flags e experimentos; isso é verificado na implementação e, se faltar, a pessoa é avisada.
- Fora do escopo: criar flags ou experimentos reais, decidir o que testar, e medição no servidor.
