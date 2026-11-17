# Feature Specification: Cenários que já contam as folgas

**Feature Branch**: `feat/cenarios-com-folgas`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: Os cenários sugeridos precisam conversar com as simulações propostas: as contratações necessárias cobrindo onde falta e as folgas sugeridas encaixadas, sem erro. O cenário também deve contar as folgas, porque hoje aparece que as pessoas trabalham 49h semanais, e tudo isso serve para adequar cenários em que elas trabalhem 42h.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O cenário já nasce com folgas e contratações que fecham (Priority: P1)

Ao clicar em **Personalizar** num cenário sugerido, a Simulação abre com a equipe já dentro da regra do cenário (por exemplo, 5 dias e até 42h por semana), com as **folgas aplicadas** (inclusive o rodízio de domingo) e com as **contratações posicionadas nos turnos que cobrem o que passou a faltar**. A semana não mostra mais 49h por pessoa.

**Why this priority**: Hoje a Simulação abre mostrando a equipe trabalhando 7 dias e 49h, que é o oposto do que o cenário propõe. O dono não consegue confiar no que vê.

**Independent Test**: Abrir "Personalizar" num cenário de 42h de Sumaré e ver cada pessoa com 5 dias e até 42h, folgas na semana, contratações com turnos, e nenhum aviso de dias ou jornada acima da regra.

**Acceptance Scenarios**:

1. **Given** um cenário de 42h, **When** a pessoa clica em Personalizar, **Then** cada pessoa da equipe abre com no máximo 5 dias e 42h, com as folgas marcadas na Escala da semana.
2. **Given** a equipe com folgas aplicadas, **When** a simulação abre, **Then** as contratações do cenário já têm turnos que cobrem as horas que passaram a faltar.
3. **Given** a simulação aberta, **When** os avisos de regra são vistos, **Then** não há aviso de dias a mais, jornada, intervalo ou descanso entre turnos; só aparece aviso de cobertura onde for inevitável.
4. **Given** uma loja que abre aos domingos, **When** a simulação abre, **Then** ao menos 1 em cada 3 pessoas de cada função folga no domingo daquela semana (rodízio de 3 semanas).

---

### User Story 2 - O número do cenário é o que a Simulação confirma (Priority: P1)

O cartão do **cenário** passa a calcular a necessidade já com as folgas: quantas contratações (e quantas horas) são precisas para cobrir a loja com cada pessoa trabalhando só os dias e as horas da regra e com o domingo em rodízio. O que o cenário diz e o que a Simulação mostra ao abrir passam a ser a mesma conta.

**Why this priority**: Sem isso, o cenário promete "contratar 15h" e a Simulação, com as folgas, ainda mostra falta. É a quebra de confiança que o pedido quer resolver.

**Independent Test**: Para cada regra de Sumaré, comparar as horas de contratação do cartão do cenário com as da Simulação aberta por Personalizar: iguais, e sem falta de cobertura.

**Acceptance Scenarios**:

1. **Given** um cenário que pede contratação, **When** a Simulação é aberta, **Then** as horas contratadas na Simulação são as horas do cartão do cenário.
2. **Given** a Simulação aberta de um cenário, **When** a cobertura é vista, **Then** não há hora abaixo do mínimo, a não ser que o cenário já diga que não resolve sozinho.
3. **Given** uma função com poucas pessoas (por exemplo, 2 farmacêuticas e mínimo de 1 por hora), **When** o cenário é calculado, **Then** a necessidade de contratação inclui o que as folgas exigem, e o cartão mostra o número maior.

---

### User Story 3 - Quando não fecha, o cenário diz com clareza (Priority: P2)

Se mesmo com as folgas e as contratações a cobertura não fecha (por exemplo, o domingo de uma função com 1 pessoa), o cenário e a Simulação mostram **a mesma frase curta** dizendo o que falta e em quais dias, e o status do cenário reflete isso ("Não resolve sozinho").

**Why this priority**: É o caso-limite; sem ele, o dono vê um cenário "ok" que não fecha.

**Independent Test**: Montar uma loja com 1 farmacêutico que abre todos os dias e ver o cenário e a Simulação concordarem sobre o que falta no domingo.

**Acceptance Scenarios**:

1. **Given** uma situação em que a cobertura não fecha, **When** o cenário é visto, **Then** o status e o texto dizem o que falta; a Simulação mostra a mesma coisa.
2. **Given** o cenário "Não resolve sozinho", **When** a Simulação abre, **Then** a faixa de aviso da Escala por hora aponta as mesmas horas.

---

### User Story 4 - Os botões da Simulação continuam funcionando (Priority: P3)

"Sugerir folgas" e "Desfazer sugestão" continuam disponíveis e usam as mesmas regras. Quando a simulação já abriu com as folgas aplicadas, "Sugerir folgas" só aparece se alguém passar do limite depois de ajustes.

**Why this priority**: Evita duas lógicas diferentes de folga.

**Independent Test**: Abrir a Simulação aplicada, tirar uma folga na Escala por hora e ver "Sugerir folgas" voltar a aparecer.

**Acceptance Scenarios**:

1. **Given** uma Simulação que abriu com as folgas aplicadas, **When** a Escala da semana é vista, **Then** o botão "Sugerir folgas" não aparece (ninguém passa do limite).
2. **Given** uma pessoa que volta a passar do limite depois de um ajuste, **When** a Escala da semana é vista, **Then** o botão aparece de novo.

---

### Edge Cases

- Equipe do Cadastro já dentro do limite de dias da regra: nada a aplicar; só as contratações são posicionadas.
- Loja que abre menos de 7 dias: o domingo (ou o dia fechado) não entra no rodízio.
- Pessoa sem horário no Cadastro: continua fora do cálculo, como hoje.
- Regra "hoje" (44h): também aplica as folgas dessa regra (1 folga), para o cenário "hoje" ser comparável.
- Falta inevitável: o cenário não esconde; mostra o que falta e continua permitindo salvar.
- Cenários já salvos: ao recalcular, os números podem mudar (em geral, mais contratações); o histórico não é reescrito sem a pessoa abrir e recalcular.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao abrir uma Simulação a partir de um cenário sugerido (Personalizar), o sistema DEVE aplicar as folgas à equipe atual segundo a regra do cenário (limite de dias, até as horas da regra) e o rodízio de domingo, usando as mesmas regras da spec 042.
- **FR-002**: Depois das folgas, o sistema DEVE posicionar as contratações do cenário nos turnos que cobrem as horas que passaram a faltar, e a Simulação DEVE abrir sem avisos de dias, jornada, intervalo ou descanso entre turnos.
- **FR-003**: O cálculo do cenário DEVE contar as folgas: a necessidade de contratação é a que cobre a loja com cada pessoa trabalhando só os dias e as horas da regra e com o domingo em rodízio.
- **FR-004**: As horas e o número de contratações do cartão do cenário DEVEM ser iguais às da Simulação aberta por Personalizar (mesma conta, uma só fonte).
- **FR-005**: Quando a cobertura não fecha mesmo com folgas e contratações, o cenário e a Simulação DEVEM mostrar a mesma frase curta sobre o que falta e os dias, e o status do cenário ("Não resolve sozinho") DEVE refletir isso.
- **FR-006**: O cenário NÃO DEVE mostrar mais pessoas trabalhando acima do limite de dias e horas da regra; nenhuma pessoa da Simulação aberta por Personalizar passa de 42h na regra de 42h (40h na de 40h; 44h na de 44h).
- **FR-007**: O Cadastro NÃO DEVE mudar; as folgas valem só no cenário e na Simulação.
- **FR-008**: "Sugerir folgas" e "Desfazer sugestão" (spec 042) DEVEM continuar funcionando com as mesmas regras, e o botão só aparece quando alguém passa do limite.
- **FR-009**: Os cartões, as linhas dos cenários e o resultado em horas e porcentagem (specs 037 e 038) DEVEM refletir os novos números sem mostrar R$ para quem não pode.
- **FR-010**: Os textos DEVEM estar em português do Brasil, simples, sem emoji, só a primeira letra maiúscula; DEVEM dizer que o rodízio de domingo e as folgas são regras de referência que o jurídico da Farmarcas confirma.
- **FR-011**: Não DEVE mudar o que a lei exige do farmacêutico (ao menos 1 em todas as horas) nem os mínimos de cobertura das funções.

### Key Entities

- **Escala com folgas**: a semana de cada pessoa depois de aplicar folgas, rodízio de domingo e turnos das contratações.
- **Cenário sugerido**: a proposta (regra, horário, contratações) que agora já nasce sobre a escala com folgas.
- **Contratação do cenário**: horas e turnos de pessoas novas para cobrir o que falta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos cenários abertos por Personalizar nas lojas de teste, ninguém passa do limite de dias e de horas da regra.
- **SC-002**: Em 100% dos casos, as horas de contratação do cartão do cenário são iguais às da Simulação aberta por Personalizar.
- **SC-003**: Em 100% dos casos, a Simulação aberta por Personalizar não tem aviso de regra; só aparece falta de cobertura quando o cenário já diz que não fecha.
- **SC-004**: Em loja que abre domingo, ao menos 1 em cada 3 pessoas de cada função folga no domingo, desde que a cobertura permita.
- **SC-005**: O dono vê a mesma resposta ("o que falta e onde") no cartão do cenário e na Simulação, sem precisar comparar números à mão.

## Assumptions

- **Escopo das regras**: a regra de cada cenário define o limite (5 dias e 42h; 5 dias e 40h; 6 dias e 44h); o rodízio de domingo é 1 em 3 por função, como na spec 042.
- **Fonte única**: a distribuição de folgas e turnos passa a ser calculada no servidor, onde os cenários já são calculados, e a Simulação usa esse resultado ao abrir. A sugestão da tela (spec 042) segue as mesmas regras. Por quê: assim o cenário e a Simulação nunca divergem.
- **Números mudam**: ao contar as folgas, as contratações dos cenários tendem a subir. É esperado e é o objetivo do pedido; os números anteriores usavam equipe a 49h.
- **Mulheres e farmácia**: o art. 386 da CLT e as regras de domingo e feriado para farmácia continuam fora (pendência para o jurídico).
- **Cadastro**: continua com o horário que a loja tem hoje; a diferença aparece só nos cenários e nas simulações.
- **Cenários já salvos**: não são reescritos; os números novos aparecem quando forem recalculados ou reabertos.
