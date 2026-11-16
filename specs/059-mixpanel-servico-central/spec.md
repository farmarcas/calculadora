# Feature Specification: Medição de uso com Mixpanel (serviço central do Radar Escala)

**Feature Branch**: `feat/coluna-folha-no-faturamento` (os ajustes se acumulam nesta branch até a pessoa mandar abrir o PR)

**Created**: 2026-11-16

**Status**: Draft

**Input**: "Vamos implantar o Mixpanel nesse projeto, fazendo um serviço centralizado no projeto Radar Escala." O destino dos dados é o projeto **Radar Escala** do Mixpanel. Respostas da pessoa: medir o **básico + ações-chave**; identificar quem usou por **nome e e-mail**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saber quem usa e quais telas abre (Priority: P1)

Quando alguém entra na calculadora pelo Radar e navega, o time de produto vê no Mixpanel **quem é a pessoa** (ID, nome e e-mail), com que perfil, e **quais telas ela abriu** (Minhas Lojas, Parâmetros legais, Escala/Diagnóstico, Escala/Simulações, Grupos).

**Why this priority**: É o mínimo que responde "estão usando? o quê?". Sem isso nada mais tem valor.

**Independent Test**: Entrar com um usuário, abrir três telas e ver no Mixpanel (Radar Escala) a pessoa identificada e três eventos de tela em poucos minutos.

**Acceptance Scenarios**:

1. **Given** uma pessoa que fez login, **When** ela abre uma tela do menu, **Then** um evento de "tela vista" com o nome da tela chega ao Mixpanel já ligado a ela.
2. **Given** uma pessoa com um perfil (ex.: operador ou visualizador), **When** ela navega, **Then** o perfil aparece ligado a ela no Mixpanel e permite filtrar o uso por perfil.
3. **Given** uma pessoa que saiu (logout), **When** outra entra no mesmo computador, **Then** os eventos não se misturam entre as duas.

---

### User Story 2 - Medir as ações-chave (Priority: P1)

O time vê quantas vezes as pessoas fazem as ações que importam: **simular cenário**, **salvar/nomear cenário**, **importar planilha**, **salvar parâmetros**, **exportar** e **trocar de loja**, além do **login**.

**Why this priority**: Telas dizem onde a pessoa esteve; ações dizem se ela teve valor.

**Independent Test**: Fazer cada ação uma vez e ver um evento correspondente, com o nome combinado e dados simples do contexto (ex.: qual regra de horas), sem valores financeiros sensíveis.

**Acceptance Scenarios**:

1. **Given** a tela de Simulações, **When** a pessoa roda uma simulação, **Then** um evento "simulação executada" chega com a regra de horas usada.
2. **Given** a importação de planilha, **When** ela termina (com sucesso ou erro), **Then** um evento informa o resultado.

---

### User Story 3 - Um único ponto de medição, fácil de manter (Priority: P2)

Existe **um só serviço** de medição no projeto. Telas e funcionalidades pedem "registre este evento" a ele e nunca falam com o Mixpanel diretamente. Trocar a ferramenta, desligar ou ajustar o que é enviado é mexer em **um lugar**.

**Why this priority**: Evita código espalhado e permite desligar a medição sem tocar nas telas.

**Independent Test**: Com a medição desligada, a calculadora funciona igual e nenhum dado sai; ligada, os eventos aparecem no Mixpanel.

**Acceptance Scenarios**:

1. **Given** a medição desligada (sem chave configurada), **When** a pessoa usa o sistema, **Then** nada é enviado e nenhum erro aparece.
2. **Given** o Mixpanel fora do ar ou bloqueado no navegador, **When** a pessoa usa o sistema, **Then** a calculadora funciona normalmente.

---

### Edge Cases

- Bloqueador de anúncios impede o envio: o sistema segue funcionando, sem aviso.
- Modo demonstração (sem login pelo Radar): a pessoa não tem nome/e-mail; a medição fica desligada ou anônima, nunca com dados inventados.
- Ambiente local e de teste não podem poluir os números reais do Radar Escala.
- Eventos nunca levam salário, folha, faturamento nem CPF; só nomes de tela/ação e identificadores simples.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST ter um serviço central de medição, único ponto de contato com o Mixpanel.
- **FR-002**: O sistema MUST enviar os dados para o projeto **Radar Escala** do Mixpanel, usando uma chave configurada por ambiente (nunca no código versionado).
- **FR-003**: O sistema MUST identificar a pessoa logada por **nome e e-mail**, mais ID e **perfil**, e parar de associar eventos a ela no logout.
- **FR-004**: O sistema MUST registrar um evento a cada tela aberta.
- **FR-005**: O sistema MUST registrar login e as ações-chave: simular cenário, salvar/nomear cenário, importar planilha, salvar parâmetros, exportar e trocar de loja.
- **FR-006**: Todo evento MUST carregar o contexto atual (tela e ambiente); grupo, CNPJ, loja e bandeira ficam de fora.
- **FR-007**: O sistema MUST funcionar normalmente com a medição desligada ou indisponível.
- **FR-008**: O sistema MUST NOT enviar valores financeiros, dados de folha ou documentos pessoais.
- **FR-009**: Os nomes dos eventos MUST seguir um padrão único e documentado (catálogo), para o Mixpanel não ficar bagunçado.
- **FR-010**: Dados de desenvolvimento/homologação MUST ficar separados dos de produção.

### Key Entities

- **Evento**: algo que aconteceu (tela vista, ação-chave), com nome do catálogo, momento e contexto.
- **Pessoa medida**: quem fez login (ID, nome, e-mail e perfil; nada além disso).
- **Catálogo de eventos**: lista oficial de nomes e dados permitidos em cada evento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em até 5 minutos após o uso, 100% das telas abertas e ações-chave de um teste aparecem no Mixpanel, ligadas à pessoa certa.
- **SC-002**: Com o Mixpanel indisponível, 0 telas quebradas ou lentidão perceptível.
- **SC-003**: Nenhuma funcionalidade chama o Mixpanel diretamente; só o serviço central.
- **SC-004**: O time consegue responder no Mixpanel "quantas pessoas usaram Simulações esta semana?" sem preparo manual.

## Assumptions

- A medição roda no navegador (front), onde estão a tela, o clique e a sessão; o serviço central fica no front e usa o login já existente para obter a identidade.
- Uma chave (token) do projeto Radar Escala por ambiente; o Radar Escala já existe no Mixpanel (id 4084146). Não há projeto de homologação do Escala: em dev/homologação a medição fica **desligada** por padrão, e só liga se houver uma chave de teste.
- Nome e e-mail vão ao Mixpanel por decisão da pessoa responsável; isso é dado pessoal (LGPD) e deve constar na política de privacidade do Radar. Por isso o envio só ocorre com a medição ligada.
- Fora do escopo: dashboards no Mixpanel, medição no servidor (API), gravação de sessão (replay), testes A/B.
- Dependência: o login do Radar (SSO) já fornece ID, nome, e-mail e perfil.
