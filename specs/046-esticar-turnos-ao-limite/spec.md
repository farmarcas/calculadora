# Feature Specification: Esticar os turnos até o limite da regra

**Feature Branch**: `feat/esticar-turnos-ao-limite`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: Na escala de Cosmópolis os farmacêuticos aparecem com 35h semanais e o atendimento com 40h, mas estamos simulando a regra de 42h. A Simulação só tira dias de folga e corta o que passa do limite; ela não estica os turnos até as 42h. Quero que a Simulação estique os turnos até o limite da regra.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O turno cresce até o limite quando falta cobertura (Priority: P1)

Depois de aplicar as folgas, a Simulação **aumenta o turno de quem trabalha menos que o limite da regra**, até o limite: o menor entre a carga semanal contratada da pessoa e o teto da regra (por exemplo, 42h com a convenção de 8h24; 40h sem ela). O aumento vale **só nos dias e nas horas em que a função ainda está sem cobertura** e respeita o máximo de horas por dia da regra, o horário de funcionamento da loja e o intervalo de 1 hora quando o turno passa de 6 horas.

**Why this priority**: Hoje a Simulação mostra a pessoa trabalhando 35h na regra de 42h e, por isso, sugere contratar para cobrir horas que ela poderia cobrir dentro da própria jornada.

**Independent Test**: Em Cosmópolis (regra de 42h, convenção ligada), com a farmacêutica da manhã em 7h por dia e uma falta de cobertura no começo da tarde: depois de esticar, o turno dela chega a 8h24 por dia em 5 dias (42h), cobre a falta e o cenário pede menos contratação.

**Acceptance Scenarios**:

1. **Given** uma pessoa com 35h na semana e limite de 42h, **When** a Simulação é aberta, **Then** os turnos dela crescem, só onde falta cobertura, até chegar a 42h ou até a falta acabar.
2. **Given** uma pessoa que já está no limite, **When** a Simulação é aberta, **Then** os turnos dela não mudam.
3. **Given** um turno que já tem 8h24 no dia, **When** a Simulação é aberta, **Then** esse dia não cresce, porque é o máximo da regra.
4. **Given** a loja que fecha às 22h, **When** o turno cresce, **Then** ele não passa do horário de funcionamento.
5. **Given** uma função sem falta de cobertura, **When** a Simulação é aberta, **Then** ninguém dela é esticado.

---

### User Story 2 - Os cenários e o Personalizar usam turnos esticados (Priority: P1)

A conta real dos cenários (spec 043) e o "Personalizar" passam a usar a equipe **já esticada**: o que a equipe cobre dentro do próprio limite não gera contratação. O número de contratações do cartão do cenário continua igual ao da Simulação aberta por Personalizar.

**Why this priority**: É onde o dono vê o efeito: menos contratações onde a equipe ainda tem folga de jornada.

**Independent Test**: Para cada regra de Cosmópolis, as contratações do cartão são iguais às vagas da Simulação aberta por Personalizar, e diminuem ou ficam iguais às de antes, nunca aumentam por causa do esticamento.

**Acceptance Scenarios**:

1. **Given** uma falta que um turno esticado cobre, **When** o cenário é calculado, **Then** a contratação some ou diminui.
2. **Given** o cartão e a Simulação abertos pelo mesmo cenário, **When** as contratações são comparadas, **Then** são iguais.
3. **Given** uma falta que nenhum turno consegue cobrir dentro do limite, **When** o cenário é calculado, **Then** a contratação continua sendo sugerida.

---

### User Story 3 - A tela mostra o que foi esticado (Priority: P2)

Na Escala por hora e na Escala da semana, o turno que cresceu aparece com uma marca "ajustado" e uma dica em português simples: "Turno aumentado de 07h–15h para 07h–16h24 para cobrir a falta, dentro do limite de 42h". O total da semana da pessoa passa a mostrar o novo valor (por exemplo, "42h · 5 dias") e **não aparece como acima da jornada**.

**Why this priority**: O dono precisa entender por que o horário de uma pessoa mudou em relação ao Cadastro.

**Independent Test**: Abrir a Simulação e passar o mouse no turno esticado da farmacêutica: a dica diz o que mudou e por quê.

**Acceptance Scenarios**:

1. **Given** um turno esticado, **When** é visto na barra, **Then** há a marca "ajustado" e a dica com o horário de antes e o de depois.
2. **Given** o total da semana da pessoa, **When** é visto, **Then** mostra o valor depois do esticamento, dentro do limite.

---

### User Story 4 - A pessoa pode desfazer e ajustar (Priority: P2)

Cada turno esticado pode ser ajustado de volta, arrastando a barra, como qualquer turno. O botão "Desfazer sugestão" (folgas) passa a desfazer também o esticamento. Nada vai ao Cadastro.

**Why this priority**: É um ponto de partida; o dono decide.

**Independent Test**: Arrastar o fim de um turno esticado de volta para o horário do Cadastro e ver a cobertura e as contratações recalcularem.

**Acceptance Scenarios**:

1. **Given** um turno esticado, **When** o fim é arrastado de volta, **Then** o turno fica como o arrastado e a cobertura recalcula.
2. **Given** "Desfazer sugestão", **When** é clicado, **Then** folgas e esticamentos voltam ao que o Cadastro tinha.

---

### Edge Cases

- Pessoa com carga contratada menor que o teto (por exemplo, 30h): o limite é a carga dela (30h).
- Regra de 40h ou 42h sem a convenção de 8h24: o máximo por dia é 8h e o teto é 40h.
- Turno de até 6h não ganha intervalo; ao passar de 6h, ganha 1h de intervalo (regra já existente).
- Dois turnos da mesma função que se sobrepõem: o esticamento só acontece onde ainda falta pessoa.
- Pessoa sem horário no Cadastro: continua fora.
- Pessoa de horário fixo: o horário dela é mantido (não estica).
- Contratação simulada: não entra (ela já nasce com a jornada cheia).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Depois das folgas, a Simulação DEVE aumentar os turnos de quem trabalha menos que o limite (o menor entre a carga semanal contratada e o teto da regra), só nos dias e nas horas em que a função ainda está sem cobertura, até chegar ao limite ou até a falta acabar.
- **FR-002**: O aumento DEVE respeitar o máximo de horas por dia da regra, o horário de funcionamento da loja, o descanso mínimo entre turnos e o intervalo de 1 hora acima de 6 horas.
- **FR-003**: Quem já está no limite, quem tem horário fixo e as Contratações simuladas NÃO DEVEM ser esticados.
- **FR-004**: A conta real dos cenários (spec 043) e o "Personalizar" DEVEM usar a equipe esticada; o número de contratações do cartão e o da Simulação DEVEM ser iguais.
- **FR-005**: O esticamento NÃO DEVE aumentar o número de contratações de nenhum cenário.
- **FR-006**: A tela DEVE marcar o turno esticado como "ajustado", com a dica do horário de antes e de depois, e o total da semana DEVE mostrar o valor depois do esticamento.
- **FR-007**: Cada turno esticado DEVE poder ser ajustado pelo dono; "Desfazer sugestão" DEVE desfazer também o esticamento.
- **FR-008**: O Cadastro NÃO DEVE mudar.
- **FR-009**: Os textos DEVEM estar em português do Brasil, simples, sem emoji, só a primeira letra maiúscula, sem R$.
- **FR-010**: Os avisos de regra existentes (jornada, intervalo, descanso) DEVEM continuar funcionando; o esticamento nunca deve produzir aviso de jornada acima da regra.

### Key Entities

- **Turno esticado**: o turno de uma pessoa depois de aumentado dentro do limite da regra, com o horário do Cadastro guardado para comparar.
- **Limite da pessoa**: o menor entre a carga semanal contratada e o teto da regra.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos casos, nenhuma pessoa passa do limite de horas por semana nem do máximo por dia depois do esticamento.
- **SC-002**: Para o mesmo cenário, o número de contratações com esticamento é menor ou igual ao de antes.
- **SC-003**: O número de contratações do cartão é igual ao das vagas da Simulação aberta por Personalizar, nas três regras.
- **SC-004**: Em Cosmópolis (42h, convenção ligada), nenhuma pessoa que tinha folga de jornada deixa uma falta de cobertura que ela poderia cobrir dentro do próprio limite.
- **SC-005**: O dono entende, pela dica, por que o horário de uma pessoa difere do Cadastro.

## Assumptions

- **Estica só onde falta cobertura**: não se estica por esticar; o esticamento muda o horário só quando cobre uma falta, para a escala continuar parecida com a do Cadastro.
- **Direção**: o turno cresce no fim (e, se não couber, no começo), dentro do horário da loja.
- **Limite**: o menor entre a carga contratada e o teto efetivo da regra (40h, ou 42h/44h conforme regra e convenção).
- **Ordem**: primeiro as folgas (spec 042), depois o esticamento, depois as contratações (spec 043).
- **Horário fixo**: o Cadastro já marca quem tem horário fixo; essas pessoas não são esticadas.
- **Fonte da regra**: decisão do dono do produto; o limite de horas segue as regras já usadas no sistema (EC 141/2026, ainda a confirmar com o jurídico).
- **Decisão técnica**: o esticamento é uma função pura no servidor (mesmo lugar da spec 043), usada pela conta real dos cenários e pelo Personalizar, e repetida na tela para o botão e para recalcular ao arrastar, com testes dos mesmos casos nos dois lados. Por quê: o cartão e a Simulação continuam sendo a mesma conta.
