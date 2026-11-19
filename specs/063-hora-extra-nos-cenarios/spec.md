# Feature Specification: Hora extra antes de contratar, nos Cenários, no Diagnóstico e na Simulação

**Feature Branch**: `feat/hora-extra-nos-cenarios`

**Created**: 2026-11-19

**Status**: Draft

**Input**: Os Cenários só sabem resolver uma falta de cobertura contratando gente. A decisão "cobrir com hora extra de quem já está escalado antes de contratar" também precisa valer nos Cenários e no Diagnóstico, entrar no custo e no peso da folha no faturamento, e bater com a Simulação. Evolui as specs 043 (cenários com folgas), 044 (só contratação integral), 048/050 (peso da folha) e 052 (card de resultado da Simulação).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O cenário cobre a falta com hora extra antes de contratar (Priority: P1)

Quando um cenário deixa horas sem cobertura, ele primeiro tenta fechar a falta com **hora extra de quem já está escalado** naquela função (até **2 h por dia e 10 h por semana por pessoa**). Se a hora extra fecha tudo, o cenário diz que **não é preciso contratar**. Se fecha só em parte, ele **contrata apenas o que sobra** e mostra as duas coisas. Se a hora extra não fecha nada (ninguém para fazer), o cenário continua exigindo contratação, como hoje.

**Why this priority**: É o pedido central: contratar é a decisão mais cara, e hoje os Cenários a recomendam mesmo quando uma pequena hora extra resolveria.

**Independent Test**: Uma loja com 2 farmacêuticos e 2 h por semana sem cobertura de farmacêutico: o cenário mostra "Sem contratar: cobre com 2 h de hora extra por semana de farmacêutico" e nenhuma contratação.

**Acceptance Scenarios**:

1. **Given** uma falta de 2 h por semana numa função com pessoas escaladas, **When** o cenário é calculado, **Then** a falta é coberta com hora extra, não há contratação e o cenário diz "Sem contratar: cobre com 2 h de hora extra por semana".
2. **Given** uma falta de 25 h por semana numa função com 2 pessoas (teto de 20 h de hora extra), **When** o cenário é calculado, **Then** são 20 h de hora extra e a contratação cobre as 5 h que sobram; os dois aparecem.
3. **Given** uma função sem ninguém escalado, **When** o cenário é calculado, **Then** não há hora extra e a contratação é a de hoje.
4. **Given** a falta de uma função que ninguém da equipe atual pode cobrir em determinado horário, **When** o cenário é calculado, **Then** essas horas ficam para a contratação.

---

### User Story 2 - O custo da hora extra entra no custo e no peso da folha (Priority: P1)

O custo da hora extra (hora normal mais adicional de 50%, mais encargos; a mesma conta que a Simulação usa hoje) é somado ao **custo adicional** do cenário e, por isso, entra no **peso da folha no faturamento**. Quem decide enxerga o preço real de "não contratar".

**Why this priority**: Sem custo, a hora extra pareceria de graça e o cenário seria enganoso.

**Independent Test**: O mesmo cenário com hora extra e sem hora extra tem pesos da folha diferentes; a diferença é exatamente o custo mensal da hora extra dividido pelo faturamento.

**Acceptance Scenarios**:

1. **Given** um cenário que cobre com 2 h por semana de hora extra de farmacêutico, **When** o custo é calculado, **Then** o custo adicional do cenário inclui a hora extra pela conta do adicional de 50% e dos encargos, com a mesma semana de cálculo da Simulação.
2. **Given** a loja sem salário informado para o cargo, **When** o custo é calculado, **Then** o custo adicional fica sem valor (nunca parcial), como já é hoje.
3. **Given** o dono do grupo, **When** vê o cartão, **Then** vê o custo e o peso em R$ e %; **Given** gestor ou consulta, **Then** veem só "Aumenta/Igual/Diminui" quando houver variação, sem R$ nem % (spec 052).

---

### User Story 3 - Cartão do cenário e Simulação mostram o mesmo número (Priority: P1)

A regra de "hora extra antes de contratar" é **uma só**, usada pelos Cenários e pela Simulação. O cartão do cenário e a Simulação aberta por "Personalizar" dão o **mesmo número** (hora extra, contratação, custo e peso da folha). Depois de aberta, a Simulação continua deixando a pessoa mexer, e a hora extra que sobrar de uma contratação simulada é calculada pela mesma regra e pelos mesmos limites.

**Why this priority**: A spec 043 já exige que cartão e Simulação não divirjam; com hora extra o risco de divergir cresce.

**Independent Test**: Para um cenário que cobre só com hora extra, o número do cartão e o da Simulação aberta por Personalizar são idênticos.

**Acceptance Scenarios**:

1. **Given** um cenário com hora extra, **When** a pessoa clica em Personalizar, **Then** a Simulação mostra a mesma hora extra, a mesma contratação, o mesmo custo e o mesmo peso da folha do cartão.
2. **Given** a Simulação com a falta que sobra depois de contratações simuladas, **When** a hora extra é calculada, **Then** ela respeita o mesmo limite por pessoa dos Cenários e o que passar do limite aparece como falta a cobrir.

---

### User Story 4 - As telas mostram a hora extra com texto claro (Priority: P1)

No cartão do cenário e no Diagnóstico: a coluna "Contratar" e o texto do cenário mostram a hora extra ("Hora extra: 2 h por semana de farmacêutico"); o chip de custo e o peso da folha refletem o custo novo; e, quando o cenário cobre sem contratar ninguém, o status e o rótulo do cartão têm um texto claro, por exemplo "Cobre sem contratar".

**Why this priority**: O número só ajuda se a tela explicar de onde vem.

**Independent Test**: Um cenário que cobre só com hora extra mostra, na coluna "Contratar", "Hora extra: 2 h por semana de farmacêutico" e o rótulo "Cobre sem contratar".

**Acceptance Scenarios**:

1. **Given** um cenário com hora extra e contratação parcial, **When** o cartão é mostrado, **Then** a coluna "Contratar" mostra as duas linhas ("Hora extra: N h por semana de {cargo}" e "Contratar: …").
2. **Given** um cenário que cobre só com hora extra, **When** o cartão é mostrado, **Then** o rótulo diz "Cobre sem contratar" e o texto explica a hora extra.
3. **Given** gestor ou consulta, **When** veem o cartão, **Then** veem as horas de hora extra (não são valores em reais) mas nenhum R$ nem %.

---

### User Story 5 - Alerta quando a hora extra é demais (Priority: P2)

Quando a hora extra se repete a ponto de **contratar sair mais barato**, ou quando a falta passa do teto de hora extra, o cenário **avisa em linguagem simples** e compara os dois custos: o da hora extra e o de contratar.

**Independent Test**: Num cenário em que 18 h por semana de hora extra custam mais por mês do que uma contratação integral, aparece o alerta com os dois valores (para o dono) e a recomendação de considerar contratar.

**Acceptance Scenarios**:

1. **Given** uma hora extra mensal maior que o custo de uma contratação integral que cobriria a mesma falta, **When** o cenário é mostrado, **Then** um alerta diz que contratar sairia mais barato e compara os dois custos.
2. **Given** uma falta que passa do teto por pessoa, **When** o cenário é mostrado, **Then** o alerta diz que a hora extra não basta e que o resto vira contratação.
3. **Given** gestor ou consulta, **Then** o alerta aparece sem valores em reais.

---

### User Story 6 - Parecer e PDF falam em hora extra (Priority: P2)

O parecer da Simulação e o PDF que falam em "contratar" passam a falar também em hora extra: "Sem contratar ninguém, cobrindo com N h de hora extra por semana" e o custo respectivo (só para quem vê valores).

**Acceptance Scenarios**:

1. **Given** uma simulação coberta só com hora extra, **When** o parecer é gerado, **Then** o texto diz que não é preciso contratar e informa a hora extra.
2. **Given** uma simulação com hora extra e contratação, **Then** o parecer cita as duas.

---

### Edge Cases

- **Sem falta de cobertura:** nada muda.
- **Sem salário informado:** o custo da hora extra e o custo adicional ficam sem valor (nunca parcial); as horas de hora extra continuam aparecendo.
- **Função sem ninguém escalado:** sem hora extra; contrata.
- **Farmacêutico:** a falta de farmacêutico também pode ser coberta por hora extra de quem já é farmacêutico; os limites de jornada e o jurídico (CRF) seguem sendo regras de referência que a equipe confirma.
- **Quem já passa da jornada:** não entra como candidato a hora extra além do teto de 2 h por dia e 10 h por semana.
- **Mais de um cargo com falta:** cada cargo calcula a sua hora extra e a sua contratação.
- **Cenários que reduzem ou estendem o horário:** vale a mesma regra quando há falta a cobrir.
- **Simulação já feita antes desta mudança:** simulações gravadas não são recalculadas; o número só muda em simulações novas ou reabertas por Personalizar.
- **Permissões:** gestor e consulta nunca veem R$ nem %; a checagem continua no servidor.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Antes de recomendar contratação, o sistema MUST tentar cobrir a falta de cada função com hora extra de quem já está escalado nela, respeitando **2 h por dia e 10 h por semana por pessoa**.
- **FR-002**: Se a hora extra cobre toda a falta, o cenário MUST NOT contratar ninguém e MUST dizer "Sem contratar: cobre com N h de hora extra por semana".
- **FR-003**: Se cobre em parte, o cenário MUST contratar apenas o que sobra e MUST mostrar a hora extra e a contratação.
- **FR-004**: O custo da hora extra MUST ser a hora normal mais adicional de 50% mais encargos, pela mesma conta que a Simulação usa hoje (mesma semana de cálculo), em um só lugar compartilhado.
- **FR-005**: O custo da hora extra MUST entrar no custo adicional do cenário e, por consequência, no peso da folha no faturamento.
- **FR-006**: Sem salário informado, o custo adicional MUST ficar sem valor (nunca parcial).
- **FR-007**: A regra de hora extra antes de contratar MUST ser uma só, usada igualmente pelos Cenários e pela Simulação; o cartão do cenário e a Simulação aberta por Personalizar MUST mostrar o mesmo número.
- **FR-008**: A coluna "Contratar" e o texto do cenário MUST mostrar a hora extra ("Hora extra: N h por semana de {cargo}"); o chip de custo e o peso da folha MUST refletir o custo novo.
- **FR-009**: Quando o cenário cobre sem contratar, o status e o rótulo do cartão MUST ter um texto claro ("Cobre sem contratar").
- **FR-010**: O sistema MUST avisar, em linguagem simples, quando contratar sair mais barato que a hora extra ou quando a falta passar do teto, comparando os dois custos (para quem vê valores).
- **FR-011**: Dono vê R$ e %; gestor e consulta veem só as horas e "Aumenta/Igual/Diminui" (spec 052); a checagem é no servidor.
- **FR-012**: O parecer e o PDF MUST falar da hora extra quando existir.
- **FR-013**: Simulações já gravadas MUST NOT ser recalculadas.

### Key Entities

- **Hora extra do cenário**: por função, as horas por semana cobertas por quem já está escalado, limitadas por pessoa (2 h/dia, 10 h/semana), e o custo mensal correspondente.
- **Contratação restante**: a contratação integral que cobre só o que a hora extra não fechou (spec 044).
- **Alerta de hora extra**: aviso com os dois custos (hora extra × contratar) e o motivo (mais barato contratar ou teto atingido).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos cenários com falta que cabe no teto de hora extra, o cenário não recomenda contratar.
- **SC-002**: O número do cartão do cenário e o da Simulação aberta por Personalizar são idênticos em horas, custo e peso da folha, em todos os casos de teste (com e sem hora extra).
- **SC-003**: O peso da folha com hora extra difere do peso sem hora extra exatamente pelo custo mensal da hora extra dividido pelo faturamento (com 1 casa decimal).
- **SC-004**: Quem lê o cartão entende em uma leitura, sem abrir outra tela, se o cenário contrata, usa hora extra ou os dois.
- **SC-005**: Gestor e consulta nunca veem R$ nem % de hora extra (0 vazamentos em teste de permissão).

## Assumptions

- **Decisão da pessoa (19/11/2026):** o custo da hora extra é **só o adicional de 50% mais encargos**, como a Simulação já faz; os reflexos (descanso remunerado, férias e 13º) ficam fora e o jurídico confirma depois.
- **Decisão da pessoa (19/11/2026):** o limite é de **2 h por dia e 10 h por semana por pessoa** (referência da CLT, a equipe jurídica confirma), com **alerta** quando contratar sair mais barato.
- **Fato do código:** hoje a Simulação não decide hora extra nem tem teto: cobra como hora extra só a falta que sobra depois das contratações adicionadas à mão. Esta spec cria a regra e a Simulação passa a usá-la.
- **Alerta de "hora extra demais":** **Decision: avisar quando a hora extra mensal da função for maior que o custo mensal da contratação integral que cobriria a mesma falta, ou quando a falta passar do teto.** **Why:** é a comparação que a pessoa pediu e usa só números que o cenário já tem.
- **Escopo dos cenários:** vale para todo cenário que hoje contrata para cobrir falta (Manter e, quando há falta, os que reduzem ou estendem o horário).
- **Rótulo:** **Decision: "Cobre sem contratar"** para o cenário coberto só com hora extra. **Why:** linguagem do dia a dia, curta, e distinta de "Resolve" e "Não resolve sozinho".
- **Fora de escopo:** reflexos da hora extra, mudança do salário-hora, o Cadastro, e recalcular simulações já gravadas.
