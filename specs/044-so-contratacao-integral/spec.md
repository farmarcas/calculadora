# Feature Specification: Só contratação integral

**Feature Branch**: `feat/so-contratacao-integral`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: Hoje o sistema permite contratar funcionários de forma parcial, mas na prática isso não vai ser possível. Vamos deixar somente a possibilidade de contratar integral.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Os cenários só sugerem contratação integral (Priority: P1)

Nos cartões dos cenários e no quadro central do Diagnóstico, toda contratação sugerida é de **pessoa integral** (jornada cheia da regra). Não aparece mais "parcial", nem horas de parcial, nem a variante de contrato com hora extra. Quando falta pouco (por exemplo, 14 horas na semana), o cenário sugere **1 pessoa integral** e mostra que sobra tempo dela.

**Why this priority**: É o que o negócio consegue contratar. Hoje os cartões prometem uma pessoa de 14h por semana que não existe na prática.

**Independent Test**: Abrir o Diagnóstico de uma loja que hoje sugere "1 farmacêutico · parcial" e ver "1 farmacêutico" integral, sem a palavra "parcial" em nenhum cartão.

**Acceptance Scenarios**:

1. **Given** um cenário que hoje sugeriria um parcial, **When** o cartão é visto, **Then** ele mostra uma contratação integral (1 pessoa por parcial que existiria) e nenhum texto com "parcial".
2. **Given** uma falta de mais de uma jornada, **When** o cenário é calculado, **Then** a contratação é de N pessoas integrais, sem parcial para completar o resto.
3. **Given** a contratação integral que passa do que falta, **When** o cenário é visto, **Then** as horas que sobram aparecem como horas ociosas, e o custo de pessoal sobe de acordo.

---

### User Story 2 - "+ Contratar" na Escala por hora só cria integral (Priority: P1)

No formulário **+ Contratar** da Escala por hora, não há mais a escolha entre integral e parcial: a contratação é sempre integral, com a jornada cheia da regra. O formulário continua mostrando os dias e o horário sugeridos para cobrir o que falta, e o efeito na semana.

**Why this priority**: Evita que a pessoa monte uma Simulação com um tipo de contratação que não existe.

**Independent Test**: Abrir "+ Contratar" de uma função e ver só a opção integral, com os dias e a janela sugeridos, e adicionar a vaga com a jornada cheia da regra.

**Acceptance Scenarios**:

1. **Given** o formulário "+ Contratar" aberto, **When** a pessoa o vê, **Then** não há opção de parcial; a vaga é integral.
2. **Given** a vaga integral adicionada, **When** a Simulação é vista, **Then** a vaga tem a carga cheia da regra e os turnos sugeridos nos dias e horas que cobrem a falta.
3. **Given** uma regra de 42h ou 40h, **When** a vaga é criada, **Then** ela respeita os dias e as horas da regra (por exemplo, até 5 dias).

---

### User Story 3 - Personalizar abre com contratações integrais (Priority: P1)

Ao clicar em **Personalizar** num cenário, a Simulação já abre com as contratações **integrais** do cenário, com turnos que cobrem o que falta e as folgas aplicadas (specs 042 e 043). A contagem de contratações do cartão do cenário e a da Simulação continuam iguais.

**Why this priority**: Mantém a promessa da spec 043: o cartão e a Simulação são a mesma conta.

**Independent Test**: Para cada regra de Sumaré, comparar o número de contratações do cartão com o das vagas da Simulação aberta por Personalizar: iguais, todas integrais.

**Acceptance Scenarios**:

1. **Given** um cenário com contratações, **When** Personalizar é clicado, **Then** todas as vagas criadas têm a carga cheia da regra.
2. **Given** a Simulação aberta, **When** o resultado em horas é visto, **Then** as horas contratadas são múltiplos da jornada cheia.

---

### User Story 4 - Simulações antigas com parcial continuam abrindo (Priority: P2)

Simulações já gravadas com uma vaga parcial continuam abrindo e mostrando essa vaga como estava. Só **não é mais possível criar** uma vaga parcial nova.

**Why this priority**: Não perder o que já foi salvo.

**Independent Test**: Abrir uma simulação gravada com vaga parcial e ver os mesmos números; tentar criar uma vaga parcial nova e ser impedido.

**Acceptance Scenarios**:

1. **Given** uma simulação gravada com vaga parcial, **When** é aberta, **Then** a vaga aparece com as horas que tinha, sem erro.
2. **Given** o servidor, **When** recebe um pedido para criar uma vaga nova com menos que a jornada cheia, **Then** recusa com uma frase em português simples.

---

### Edge Cases

- Falta menor que 1 hora de jornada: 1 integral; as horas que sobram são ociosas.
- Função em que ninguém tem mínimo (sem meta): continua sem contratação.
- Farmacêutico: o aviso do CRF para parcial some, porque não há mais parcial.
- Cenários e simulações já gravadas: números antigos não são reescritos; os novos aparecem quando forem recalculados.
- Loja de 24h ou sem turnos: sem mudança de comportamento além de ser integral.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A sugestão de contratação dos cenários e do Diagnóstico DEVE ser só de pessoas integrais (jornada cheia da regra), nunca parcial e nunca a variante de contrato com hora extra.
- **FR-002**: O número de integrais DEVE cobrir a falta: `ceil(falta ÷ jornada cheia)` na conta por horas, e as integrais necessárias para fechar a cobertura hora a hora na conta real (spec 043).
- **FR-003**: Os cartões, as linhas dos cenários e o resultado em horas DEVEM mostrar a contratação integral sem a palavra "parcial" e DEVEM mostrar as horas ociosas quando a integral passa do que falta.
- **FR-004**: O formulário "+ Contratar" DEVE criar só vaga integral, com a carga cheia da regra, e manter a sugestão de dias e horário e o efeito na semana.
- **FR-005**: "Personalizar" DEVE criar a Simulação com vagas integrais; o número de contratações do cartão e o da Simulação DEVEM ser iguais.
- **FR-006**: O servidor DEVE recusar a criação de uma vaga **nova** com carga diferente da jornada cheia da regra, com mensagem em português simples; vagas já existentes em simulações salvas DEVEM continuar abrindo e valendo.
- **FR-007**: O custo da contratação DEVE ser calculado só com a jornada cheia; sem R$ para quem não é dono.
- **FR-008**: O aviso do CRF para farmacêutico parcial DEVE sair; o restante dos avisos permanece.
- **FR-009**: Os textos DEVEM estar em português do Brasil, simples, sem emoji, só a primeira letra maiúscula; nenhum texto novo DEVE falar em "parcial".
- **FR-010**: Nada do Cadastro DEVE mudar.

### Key Entities

- **Contratação integral**: pessoa nova com a carga cheia da regra (44h na regra de 44h; até 40 ou 42h conforme a regra).
- **Vaga simulada**: contratação que existe só na Simulação, agora sempre integral para as novas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos cenários e simulações novas, toda contratação tem a carga cheia da regra.
- **SC-002**: A palavra "parcial" não aparece nos cartões, nas linhas dos cenários, no resultado em horas, no formulário "+ Contratar" nem nos avisos de contratação.
- **SC-003**: Para o mesmo cenário, o número de contratações do cartão é igual ao das vagas da Simulação aberta por Personalizar, nas três regras.
- **SC-004**: 100% das simulações gravadas antes continuam abrindo sem erro.

## Assumptions

- **Jornada cheia**: é a que o sistema já usa para a contratação integral em cada regra (hoje, até 44h; 40h nas regras de 42h e 40h sem convenção de 8h24).
- **Excedente**: quando a integral passa do que falta, a sobra é mostrada como horas ociosas, sem tentar reduzir a jornada da pessoa nova.
- **Variante com hora extra** (26h + até 6h extras): sai junto, porque é uma forma de parcial.
- **Cenários e simulações salvas**: números antigos não são reescritos.
- **Decisão técnica**: o ajuste é no motor que sugere contratações (servidor) e nos pontos que o usam, e na tela do "+ Contratar". Por quê: assim o cartão e a Simulação continuam sendo a mesma conta, como na spec 043.
