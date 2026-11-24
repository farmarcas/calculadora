# Feature Specification: Mapa de calor e replay de sessão no Mixpanel

**Feature Branch**: `feat/coluna-folha-no-faturamento` (os ajustes se acumulam nesta branch até a pessoa mandar abrir o PR)

**Created**: 2026-11-17

**Status**: Draft

**Input**: "Gostaria de configurar o heatmaps no Mixpanel." Respostas da pessoa: mapa de calor em **todas as telas, escondendo valores em R$**; e **também replay de sessão** (gravação da navegação). Continua a spec [059](../059-mixpanel-servico-central/spec.md): o serviço central de medição já existe e é o único ponto de contato com o Mixpanel.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver onde as pessoas clicam e até onde rolam (Priority: P1)

O time de produto abre o Mixpanel e vê, em cada tela do Radar Escala, um **mapa de calor** com as áreas mais clicadas e o quanto a página é rolada. Serve para achar botões ignorados, abas que ninguém abre e partes da tela que ninguém lê.

**Why this priority**: É o pedido central e responde "o que as pessoas realmente usam nesta tela".

**Independent Test**: Entrar com login do Radar, clicar e rolar em duas telas, e ver no Mixpanel o mapa de calor dessas telas com os cliques feitos.

**Acceptance Scenarios**:

1. **Given** uma pessoa logada pelo Radar, **When** ela clica em botões e abas de uma tela, **Then** o mapa de calor dessa tela no Mixpanel passa a mostrar esses cliques.
2. **Given** a mesma tela aberta por várias pessoas, **When** o time abre o mapa de calor, **Then** os cliques de todas aparecem somados.

---

### User Story 2 - Rever uma sessão para entender uma dúvida (Priority: P1)

O time assiste, no Mixpanel, à **gravação da navegação** de algumas sessões (cliques, rolagem, troca de telas) para entender onde alguém travou. Textos e números da tela **aparecem cobertos** na gravação.

**Why this priority**: O mapa de calor mostra onde, o replay mostra o porquê.

**Independent Test**: Navegar por Diagnóstico e Simulações e ver a gravação no Mixpanel, ligada à pessoa, com o conteúdo da tela coberto.

**Acceptance Scenarios**:

1. **Given** uma sessão gravada, **When** o time a reproduz, **Then** vê a navegação e os cliques, mas nenhum valor em R$, salário, faturamento, nome, e-mail, CNPJ ou texto digitado é legível.
2. **Given** um campo de formulário preenchido, **When** a sessão é reproduzida, **Then** o conteúdo do campo está coberto.

---

### User Story 3 - Só com pessoa logada e fácil de desligar (Priority: P2)

Mapa de calor e replay só funcionam com **login do Radar** (a mesma regra da medição). Sem token ou com a opção desligada, nada é gravado nem coletado, e a calculadora funciona igual. A parte gravada pode ser reduzida ou desligada por configuração, sem mexer nas telas.

**Why this priority**: Protege dados pessoais (LGPD) e permite recuar rápido.

**Independent Test**: Com a gravação desligada, nenhuma sessão nova aparece no Mixpanel; ligada, aparecem.

**Acceptance Scenarios**:

1. **Given** modo demonstração (sem login do Radar), **When** alguém usa o sistema, **Then** nada é coletado nem gravado.
2. **Given** a gravação desligada por configuração, **When** a pessoa usa o sistema, **Then** nenhuma sessão é gravada e também não há dado novo de mapa de calor (os dois vêm juntos).
3. **Given** o Mixpanel fora do ar ou bloqueado no navegador, **When** a pessoa usa o sistema, **Then** a calculadora funciona normalmente, sem lentidão perceptível.

---

### Edge Cases

- Telas com muito número (folha, faturamento, cenário, simulação): tudo coberto na gravação, nunca só "o que parece dinheiro".
- Texto novo que alguém acrescente no futuro: sai coberto por padrão (cobrir é o normal, descobrir é a exceção).
- Importar planilha e baixar arquivos: o nome e o conteúdo do arquivo nunca entram na gravação.
- Sessão longa ou aba esquecida aberta: a gravação tem limite de duração, para não gerar custo nem volume sem fim.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST coletar dados de mapa de calor (cliques e rolagem) em todas as telas, enviados ao projeto Radar Escala do Mixpanel.
- **FR-002**: O sistema MUST gravar o replay de uma parte das sessões, também no projeto Radar Escala.
- **FR-003**: Toda a gravação MUST sair com texto e campos de formulário cobertos; nenhum valor em R$, dado de pessoa, CNPJ ou nome de loja é legível no replay.
- **FR-004**: Mapa de calor e replay MUST funcionar só com pessoa logada pelo Radar; em modo demonstração, não.
- **FR-005**: A gravação (e com ela o mapa de calor) MUST poder ser ligada e desligada por configuração, sem alterar telas. O mapa de calor do Mixpanel só coleta dentro de sessões gravadas, então não existe um sem o outro.
- **FR-006**: A parcela de sessões gravadas MUST ser configurável, com padrão definido pelo agente.
- **FR-007**: Todo o trabalho MUST passar pelo serviço central de medição; nenhuma tela fala com o Mixpanel.
- **FR-008**: Com falha, bloqueio ou token ausente, o sistema MUST funcionar normalmente, sem erro visível.
- **FR-009**: O guia do front MUST registrar a regra de cobertura (por que tudo sai coberto e como liberar um trecho, se um dia for preciso).

### Key Entities

- **Sessão gravada**: a navegação de uma pessoa logada, com conteúdo coberto, ligada ao perfil dela no Mixpanel.
- **Dado de mapa de calor**: posição do clique ou da rolagem em uma tela; não carrega o texto da tela.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em até 10 minutos após o uso com login real, o time vê o mapa de calor das telas visitadas e ao menos uma sessão gravada, ligada à pessoa certa.
- **SC-002**: Em 100% das gravações revisadas por amostragem, nenhum valor em R$, nome, e-mail, CNPJ ou texto digitado é legível.
- **SC-003**: Com o Mixpanel indisponível, 0 telas quebradas ou lentidão perceptível.
- **SC-004**: Dá para desligar a gravação (e o mapa de calor) em um só lugar, sem publicar mudança nas telas.

## Assumptions

- A pessoa escolheu replay junto com o mapa de calor, ciente de que é mais intrusivo; fica registrado que isso exige aviso na política de privacidade do Radar (LGPD), além do que já vale para nome e e-mail.
- Padrão do agente: **tudo coberto** (texto e campos), sem liberar nenhum trecho. É mais seguro do que tentar cobrir só o que parece dinheiro, já que as telas também mostram nomes de funcionários, lojas e CNPJs. A gravação mostra layout, cliques e navegação; o texto fica como retângulos cobertos.
- Padrão do agente para a parcela gravada: **todas as sessões** no início, porque o número de pessoas é pequeno; ajustável por configuração se a cota do plano do Mixpanel apertar.
- Depende de o plano do Mixpanel do projeto Radar Escala incluir mapa de calor e replay; isso é verificado na implementação e, se faltar, a pessoa é avisada.
- O mapa de calor do Mixpanel é montado a partir das sessões gravadas: sem gravar, não há mapa. Por isso a parcela gravada vale para os dois.
- Fora do escopo: dashboards, alertas, testes A/B e medição no servidor.

## Ajuste (2026-11-24): menu, títulos e abas legíveis

Pedido da pessoa depois de ligar o replay em produção: todo texto, inclusive o nome do menu, vinha coberto e dificultava entender a navegação. Decisão: **menu lateral, títulos de tela e rótulos de abas** (texto fixo, nunca dado) ficam legíveis, marcados um a um com `data-mp-unmask`. Todo o resto segue coberto, e texto novo continua coberto por padrão. Isso ajusta FR-003: nenhum valor em R$, dado de pessoa, CNPJ ou nome de loja é legível; os textos fixos de navegação podem ser.
