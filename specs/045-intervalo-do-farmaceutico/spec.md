# Feature Specification: Intervalo do farmacêutico não precisa de cobertura

**Feature Branch**: `feat/intervalo-farmaceutico-sem-cobertura`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: O sistema está sugerindo contratar farmacêuticos só para cobrir o intervalo de almoço, porém, pela lei, o farmacêutico pode ficar até 2 horas em intervalo sem necessidade de cobertura.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O intervalo do farmacêutico deixa de contar como falta (Priority: P1)

Hoje, enquanto o único farmacêutico da loja está no intervalo de almoço, a hora aparece como "0 !" e entra na conta de quanto falta, e o sistema sugere contratar gente só para tapar esse buraco. Com a regra nova, **o intervalo de até 2 horas do farmacêutico conta como cobertura**: a pessoa segue contando como presente naquelas horas, a hora não é marcada como falta e o buraco não gera contratação.

**Why this priority**: É o motivo de contratações a mais nos cenários e das horas marcadas como descobertas que, na lei, não precisam de cobertura.

**Independent Test**: Abrir a Simulação de uma loja em que a única farmacêutica da manhã sai para almoçar das 10h às 11h: a hora das 10h mostra a farmacêutica presente (sem "0 !") e o cenário não pede contratação por causa dessa hora.

**Acceptance Scenarios**:

1. **Given** um farmacêutico com intervalo de 1 hora no meio do turno e mais ninguém na função naquela hora, **When** a cobertura é calculada, **Then** essa hora tem 1 pessoa e não é falta.
2. **Given** um farmacêutico com intervalo de exatamente 2 horas, **When** a cobertura é calculada, **Then** o intervalo continua contando como cobertura.
3. **Given** um farmacêutico com intervalo maior que 2 horas, **When** a cobertura é calculada, **Then** as horas do intervalo voltam a descontar, como hoje.
4. **Given** um cenário que hoje pede farmacêutico só por causa do intervalo, **When** o cenário é recalculado, **Then** a contratação some ou diminui.

---

### User Story 2 - Só vale para o farmacêutico (Priority: P1)

Para as demais funções (Atendimento e Caixa), o intervalo **continua descontando** da cobertura, como hoje. A regra nova é só do farmacêutico.

**Why this priority**: É o que a lei do pedido diz; mexer nas outras funções mudaria metas do dono sem pedido.

**Independent Test**: Um caixa com intervalo de 1 hora e meta de 1 por hora continua mostrando "0 !" naquela hora.

**Acceptance Scenarios**:

1. **Given** um caixa no intervalo e sem outra pessoa na função, **When** a cobertura é vista, **Then** a hora continua abaixo da meta.
2. **Given** um farmacêutico e um caixa no mesmo intervalo, **When** a cobertura é vista, **Then** só a função farmacêutico mantém a hora coberta.

---

### User Story 3 - A tela explica (Priority: P2)

Na Escala por hora, a barra do farmacêutico continua mostrando o trecho do intervalo, e a dica passa a dizer que **o intervalo do farmacêutico, de até 2 horas, não precisa de cobertura**. A célula das horas de intervalo mostra a pessoa presente, e a dica da célula informa "Farmacêutico em intervalo (não precisa de cobertura)".

**Why this priority**: Evita a dúvida de "por que aparece 1 se ele está almoçando?".

**Independent Test**: Passar o mouse na barra e na célula da hora do almoço e ler a explicação.

**Acceptance Scenarios**:

1. **Given** a barra do farmacêutico com intervalo, **When** o mouse passa sobre ela, **Then** a dica cita que o intervalo de até 2 horas não precisa de cobertura.
2. **Given** a célula da hora do almoço, **When** o mouse passa sobre ela, **Then** a dica cita que o farmacêutico está em intervalo e que isso não precisa de cobertura.

---

### Edge Cases

- Farmacêutico sem intervalo cadastrado: nada muda.
- Dois farmacêuticos com intervalos em horas diferentes: a cobertura segue igual (os dois contam o tempo todo).
- Intervalo que começa ou termina no meio de uma hora: vale a mesma regra, por hora inteira.
- Contratação simulada de farmacêutico com intervalo: o intervalo dela também conta como cobertura.
- Regras de jornada e intervalo mínimo (1 hora acima de 6 horas) não mudam; só a conta da cobertura.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Na cobertura de **farmacêutico**, um intervalo de **até 2 horas** NÃO DEVE descontar a pessoa da hora: ela conta como presente durante o intervalo.
- **FR-002**: Um intervalo de farmacêutico **maior que 2 horas** DEVE descontar como hoje.
- **FR-003**: Para as **demais funções**, o intervalo DEVE continuar descontando da cobertura.
- **FR-004**: A regra DEVE valer em todos os lugares que medem cobertura: a Escala por hora e as faltas da Simulação, a cobertura do Diagnóstico, a conta real dos cenários (spec 043) e o recálculo na tela ao arrastar um turno.
- **FR-005**: As contratações sugeridas pelos cenários e pelo Personalizar DEVEM deixar de existir quando a única falta é o intervalo do farmacêutico.
- **FR-006**: A tela DEVE explicar a regra na dica da barra do turno e da célula da hora de intervalo, em português simples.
- **FR-007**: As regras de jornada diária, intervalo mínimo e descanso entre turnos DEVEM continuar como estão.
- **FR-008**: O Cadastro NÃO DEVE mudar.
- **FR-009**: Os textos DEVEM estar em português do Brasil, simples, sem emoji, só a primeira letra maiúscula; a regra é de referência e o jurídico da Farmarcas confirma os detalhes.

### Key Entities

- **Intervalo do farmacêutico**: pausa de até 2 horas no meio do turno do farmacêutico, que não abre falta de cobertura.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhuma hora de intervalo de até 2 horas de um farmacêutico aparece como falta de farmacêutico, em nenhuma tela.
- **SC-002**: Nenhum cenário nem Personalizar sugere contratar farmacêutico apenas por causa de intervalo de até 2 horas.
- **SC-003**: Para Atendimento e Caixa, os números de cobertura são idênticos aos de antes.
- **SC-004**: O dono entende, pela dica da tela, por que a hora do almoço do farmacêutico está coberta, sem precisar perguntar.

## Assumptions

- **Fonte da regra**: a informação do dono do produto de que o farmacêutico pode ficar até 2 horas em intervalo sem cobertura; não foi confirmada pelo jurídico, então o texto diz que é regra de referência.
- **Só farmacêutico**: é o único cargo obrigatório; as metas do dono para as outras funções continuam descontando o intervalo.
- **Limite de 2 horas** é por intervalo (o intervalo cadastrado da pessoa no dia).
- **Decisão técnica**: ajustar a conta de "quem está presente" nos pontos que a repetem (servidor e tela), recebendo a função da pessoa. Por quê: é o mesmo critério em todos os lugares, e os números do cenário e da Simulação continuam sendo a mesma conta.
