# Feature Specification: Intervalo de até 2 horas não precisa de cobertura

**Feature Branch**: `feat/intervalo-farmaceutico-sem-cobertura`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: O sistema está sugerindo contratar farmacêuticos só para cobrir o intervalo de almoço, porém, pela lei, o farmacêutico pode ficar até 2 horas em intervalo sem necessidade de cobertura. Também pode valer para Atendimento e Caixa.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O intervalo deixa de contar como falta (Priority: P1)

Hoje, enquanto o único farmacêutico da loja está no intervalo de almoço, a hora aparece como "0 !" e entra na conta de quanto falta, e o sistema sugere contratar gente só para tapar esse buraco. Com a regra nova, **o intervalo de até 2 horas conta como cobertura**: a pessoa segue contando como presente naquelas horas, a hora não é marcada como falta e o buraco não gera contratação.

**Why this priority**: É o motivo de contratações a mais nos cenários e das horas marcadas como descobertas que, na lei, não precisam de cobertura.

**Independent Test**: Abrir a Simulação de uma loja em que a única farmacêutica da manhã sai para almoçar das 10h às 11h: a hora das 10h mostra a farmacêutica presente (sem "0 !") e o cenário não pede contratação por causa dessa hora.

**Acceptance Scenarios**:

1. **Given** um farmacêutico com intervalo de 1 hora no meio do turno e mais ninguém na função naquela hora, **When** a cobertura é calculada, **Then** essa hora tem 1 pessoa e não é falta.
2. **Given** um farmacêutico com intervalo de exatamente 2 horas, **When** a cobertura é calculada, **Then** o intervalo continua contando como cobertura.
3. **Given** um farmacêutico com intervalo maior que 2 horas, **When** a cobertura é calculada, **Then** as horas do intervalo voltam a descontar, como hoje.
4. **Given** um cenário que hoje pede farmacêutico só por causa do intervalo, **When** o cenário é recalculado, **Then** a contratação some ou diminui.

---

### User Story 2 - Vale para todas as funções (Priority: P1)

A regra vale para **Farmacêutico, Atendimento e Caixa**: em qualquer função, a pessoa em intervalo de até 2 horas continua contando como presente. Assim, a meta do dono de 1 caixa por hora também não "cai" na hora do almoço de quem está sozinho.

**Why this priority**: Pedido do dono: o intervalo não deve abrir falta nem gerar contratação em função nenhuma.

**Independent Test**: Um caixa com intervalo de 1 hora e meta de 1 por hora mostra a hora do intervalo coberta, sem "0 !".

**Acceptance Scenarios**:

1. **Given** um caixa no intervalo de 1 hora e sem outra pessoa na função, **When** a cobertura é vista, **Then** a hora continua coberta.
2. **Given** um atendente com intervalo de mais de 2 horas, **When** a cobertura é vista, **Then** as horas do intervalo voltam a descontar.

---

### User Story 3 - A tela explica (Priority: P2)

Na Escala por hora, a barra de cada pessoa continua mostrando o trecho do intervalo, e a dica passa a dizer que **o intervalo de até 2 horas não precisa de cobertura**. A célula das horas de intervalo mostra a pessoa presente, e a dica da célula informa quem está em intervalo e que isso não precisa de cobertura.

**Why this priority**: Evita a dúvida de "por que aparece 1 se ele está almoçando?".

**Independent Test**: Passar o mouse na barra e na célula da hora do almoço e ler a explicação.

**Acceptance Scenarios**:

1. **Given** a barra de uma pessoa com intervalo, **When** o mouse passa sobre ela, **Then** a dica cita que o intervalo de até 2 horas não precisa de cobertura.
2. **Given** a célula da hora do almoço, **When** o mouse passa sobre ela, **Then** a dica cita quem está em intervalo e que isso não precisa de cobertura.

---

### Edge Cases

- Pessoa sem intervalo cadastrado: nada muda.
- Duas pessoas da mesma função com intervalos em horas diferentes: a cobertura segue igual (as duas contam o tempo todo).
- Intervalo que começa ou termina no meio de uma hora: vale a mesma regra, por hora inteira.
- Contratação simulada com intervalo: o intervalo dela também conta como cobertura.
- Regras de jornada e intervalo mínimo (1 hora acima de 6 horas) não mudam; só a conta da cobertura.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Na cobertura de **qualquer função** (Farmacêutico, Atendimento e Caixa), um intervalo de **até 2 horas** NÃO DEVE descontar a pessoa da hora: ela conta como presente durante o intervalo.
- **FR-002**: Um intervalo **maior que 2 horas** DEVE descontar como hoje.
- **FR-003**: A pessoa em intervalo DEVE continuar aparecendo como "em intervalo" na tela, só que sem abrir falta.
- **FR-004**: A regra DEVE valer em todos os lugares que medem cobertura: a Escala por hora e as faltas da Simulação, a cobertura do Diagnóstico, a conta real dos cenários (spec 043) e o recálculo na tela ao arrastar um turno.
- **FR-005**: As contratações sugeridas pelos cenários e pelo Personalizar DEVEM deixar de existir quando a única falta é o intervalo do farmacêutico.
- **FR-006**: A tela DEVE explicar a regra na dica da barra do turno e da célula da hora de intervalo, em português simples.
- **FR-007**: As regras de jornada diária, intervalo mínimo e descanso entre turnos DEVEM continuar como estão.
- **FR-008**: O Cadastro NÃO DEVE mudar.
- **FR-009**: Os textos DEVEM estar em português do Brasil, simples, sem emoji, só a primeira letra maiúscula; a regra é de referência e o jurídico da Farmarcas confirma os detalhes.

### Key Entities

- **Intervalo de até 2 horas**: pausa no meio do turno de qualquer pessoa, que não abre falta de cobertura.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhuma hora de intervalo de até 2 horas aparece como falta, de nenhuma função, em nenhuma tela.
- **SC-002**: Nenhum cenário nem Personalizar sugere contratar apenas por causa de intervalo de até 2 horas.
- **SC-003**: Intervalos maiores que 2 horas dão os mesmos números de cobertura de antes.
- **SC-004**: O dono entende, pela dica da tela, por que a hora do almoço do farmacêutico está coberta, sem precisar perguntar.

## Assumptions

- **Fonte da regra**: a informação do dono do produto de que o farmacêutico pode ficar até 2 horas em intervalo sem cobertura, estendida por ele a Atendimento e Caixa; não foi confirmada pelo jurídico, então o texto diz que é regra de referência.
- **Todas as funções**: o critério é o mesmo para todas, o que também simplifica a conta (não depende da função da pessoa).
- **Limite de 2 horas** é por intervalo (o intervalo cadastrado da pessoa no dia).
- **Decisão técnica**: ajustar a conta de "quem está presente" nos pontos que a repetem (servidor e tela), sem depender da função. Por quê: é o mesmo critério em todos os lugares, e os números do cenário e da Simulação continuam sendo a mesma conta.
