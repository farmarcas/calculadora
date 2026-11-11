# Feature Specification: Jornada cheia para todos

**Feature Branch**: `feat/jornada-cheia-para-todos`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: Considere que todos têm que trabalhar, mesmo sem falta, 8h24 por dia, 5 vezes por semana. (Depois da pergunta sobre a grade de 15 minutos: ajuste para 8h24 exatas.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Todo mundo trabalha a jornada cheia da regra (Priority: P1)

Na Simulação e na conta dos cenários, **cada pessoa da equipe passa a trabalhar a jornada cheia da regra**: o número de dias da regra (5 dias nas regras de 42h e 40h; 6 dias na de 44h) com as horas por dia da regra (8h24 com a convenção de 8h24; 8h sem ela; 7h20 na regra de 44h), **mesmo onde não falta cobertura**. A spec 046 esticava só onde faltava gente; agora o turno é completado até a jornada cheia (8h24 exatas, com minutos), e o esticamento por falta (spec 046) continua decidindo **onde** o turno cresce primeiro.

**Why this priority**: É a regra do negócio: quem é contratado trabalha a jornada inteira. Mostrar 35h ou 37h numa regra de 42h subestima a cobertura e gera contratação desnecessária.

**Independent Test**: Em Cosmópolis (42h, convenção ligada), depois de abrir a Simulação, cada farmacêutico e cada atendente aparece com a jornada cheia da regra em 5 dias, sem passar do máximo por dia.

**Acceptance Scenarios**:

1. **Given** uma pessoa que trabalha 7h por dia na regra de 42h com convenção, **When** a Simulação é aberta, **Then** o turno dela cresce até a jornada cheia do dia, nos 5 dias.
2. **Given** um turno que já tem a jornada cheia, **When** a Simulação é aberta, **Then** ele não muda.
3. **Given** uma pessoa que pode crescer de mais de um jeito, **When** o turno é completado, **Then** o crescimento vai primeiro onde a função tem falta (spec 046) e, sem falta, no fim do turno e, se não couber, no começo.
4. **Given** um turno que não pode crescer mais porque a loja fecha, **When** a Simulação é aberta, **Then** ele cresce o que cabe e a pessoa fica abaixo da jornada cheia nesse dia, sem erro.
5. **Given** a regra de 44h (6 dias), **When** a Simulação é aberta, **Then** a jornada cheia é a dessa regra, e não a de 42h.

---

### User Story 2 - A conta dos cenários usa a jornada cheia (Priority: P1)

A cobertura real dos cenários (spec 043) passa a considerar todos na jornada cheia. O que a equipe cobre dentro da própria jornada não gera contratação, e o número do cartão continua igual ao da Simulação aberta por Personalizar. A jornada cheia **nunca aumenta** contratação.

**Why this priority**: É onde o dono vê o efeito: menos contratações em lojas cujo Cadastro tem horários curtos.

**Independent Test**: Para cada regra de Cosmópolis, as contratações do cartão são iguais às vagas do Personalizar e menores ou iguais às de antes.

**Acceptance Scenarios**:

1. **Given** uma falta que a jornada cheia da equipe cobre, **When** o cenário é calculado, **Then** a contratação some ou diminui.
2. **Given** o cartão e a Simulação abertos pelo mesmo cenário, **When** as contratações são comparadas, **Then** são iguais.

---

### User Story 3 - A tela mostra e explica (Priority: P2)

O turno que cresceu para completar a jornada aparece com a marca "ajustado" e a dica "Turno aumentado de 07h–15h para 07h–16h24 para completar a jornada de 42h". O total da semana mostra a jornada cheia (ou o que coube) e não destaca como acima da jornada. "Desfazer sugestão" volta ao horário do Cadastro.

**Why this priority**: O dono precisa entender por que o horário difere do Cadastro.

**Independent Test**: Passar o mouse no turno aumentado e ler a dica; ver "42h · 5 dias" na Escala da semana.

**Acceptance Scenarios**:

1. **Given** um turno completado até a jornada, **When** é visto na barra, **Then** o horário mostra os minutos (por exemplo, 07h–15h24) e há a marca "ajustado" e a dica com o horário de antes e o de depois.
2. **Given** o total da semana, **When** é visto, **Then** é a jornada cheia da pessoa, sem destaque de excesso.

---

### Edge Cases

- **8h24 e a grade de 15 minutos**: a Simulação passa a aceitar horas com **minutos inteiros** (como 15h24 ou 14h38), e não só de 15 em 15 minutos. Assim a jornada cheia é **8h24 exatas por dia, 42h na semana**. Arrastar um turno na grade continua andando de 15 em 15 minutos, e o turno arrastado mantém a duração que já tinha.
- Pessoa com carga contratada menor que a jornada cheia: o limite é a carga dela.
- Pessoa de horário fixo: o horário é mantido.
- Contratação simulada: já nasce com a jornada cheia; não entra no completar.
- Loja que abre menos horas que a jornada por dia: o turno cresce até o horário de funcionamento.
- Regra sem convenção de 8h24 (40h): 8h por dia, 5 dias.
- Descanso de 11h entre os dias: se o aumento quebra o descanso, não cresce nesse lado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Depois das folgas, a Simulação e a conta dos cenários DEVEM completar o turno de cada pessoa até a jornada cheia da regra: o número de dias da regra com as horas por dia da regra (limitado à carga contratada da pessoa), mesmo sem falta de cobertura.
- **FR-002**: O crescimento DEVE ir primeiro onde a função tem falta (spec 046) e, depois, no fim do turno e, se não couber, no começo, hora a hora ou em quartos de hora até a jornada do dia.
- **FR-003**: O crescimento DEVE respeitar o máximo de horas por dia da regra, o horário de funcionamento da loja, as 11 horas de descanso e o intervalo de 1 hora acima de 6 horas; o dia nunca passa do máximo da regra, e a semana nunca passa do teto.
- **FR-004**: A Simulação DEVE aceitar horários com minutos inteiros (não só quartos de hora), para a jornada cheia poder ser exatamente a da regra (8h24 por dia, 42h na semana); horários com fração de minuto continuam recusados; a tela mostra os minutos (por exemplo, 16h24); arrastar continua de 15 em 15 minutos.
- **FR-005**: Quem tem horário fixo e as Contratações simuladas NÃO DEVEM ser completados.
- **FR-006**: A conta real dos cenários e o "Personalizar" DEVEM usar a equipe completada; o cartão e a Simulação DEVEM ter o mesmo número de contratações, e a jornada cheia NÃO DEVE aumentar a contratação de nenhum cenário.
- **FR-007**: A tela DEVE marcar o turno completado como "ajustado", com a dica do horário de antes e de depois, e o total da semana DEVE mostrar o valor real.
- **FR-008**: "Desfazer sugestão" DEVE voltar ao horário do Cadastro; o Cadastro NÃO DEVE mudar.
- **FR-009**: Os textos DEVEM estar em português do Brasil, simples, sem emoji, só a primeira letra maiúscula, sem R$.

### Key Entities

- **Jornada cheia**: dias da regra × horas por dia da regra (em quartos de hora), limitada à carga contratada.
- **Turno completado**: turno aumentado até a jornada cheia, com o horário de antes guardado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos casos em que o horário da loja permite, cada pessoa (sem horário fixo) fecha a semana na jornada cheia da regra, e nenhuma passa do máximo por dia nem do teto da semana.
- **SC-002**: Para o mesmo cenário, as contratações com a jornada cheia são menores ou iguais às de antes.
- **SC-003**: As contratações do cartão são iguais às das vagas da Simulação aberta por Personalizar, nas três regras.
- **SC-004**: O dono entende, pela dica, por que o horário de uma pessoa difere do Cadastro.

## Assumptions

- **Substitui a regra de "só onde falta" da spec 046**: a decisão da spec 046 era esticar só onde falta cobertura; o pedido novo é completar a jornada de todos. Onde cresce primeiro continua sendo onde falta.
- **Minutos inteiros (decisão do dono)**: a regra de aceitar só horas de 15 em 15 minutos (spec 039) passa a aceitar minutos inteiros na Simulação; isso também elimina o arredondamento de horários do Cadastro como 14h38 (o horário agora é guardado como está).
- **Não cria dias**: a pessoa que trabalha menos de 5 dias na semana continua com os dias que tem; só se completa a duração de cada dia que ela já trabalha.
- **Limite da pessoa**: o menor entre a carga semanal contratada e a jornada cheia; para quem tem 44h contratadas, é a jornada cheia da regra.
- **Regras de horas**: EC 141/2026, ainda a confirmar com o jurídico.
- **Decisão técnica**: ampliar a função de esticar do servidor (spec 046) com uma segunda fase que completa a jornada, repetida na tela com os mesmos casos de teste. Por quê: o cartão e a Simulação continuam sendo a mesma conta.
