# Feature Specification: Folgas sugeridas na Simulação

**Feature Branch**: `feat/folgas-sugeridas`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: A Escala da semana (spec 041) mostra todo mundo trabalhando os 7 dias, porque o Cadastro não tem folga para essas pessoas. A Simulação deve **sugerir as folgas** de cada pessoa, respeitando o que a lei diz: folga semanal preferencialmente no domingo, domingo de folga ao menos 1 vez a cada 3 semanas no comércio, e os dois repousos por semana que a EC 141/2026 passa a exigir.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver uma semana com folgas já distribuídas (Priority: P1)

Ao abrir uma Simulação cuja equipe vem do Cadastro com mais dias do que a regra permite (por exemplo, 7 dias na regra de 44h), quem pode editar vê o botão **Sugerir folgas** no card "Escala da semana". Ao clicar, cada pessoa que passa do limite de dias da regra ganha a quantidade de folgas que a regra exige (1 na regra de 44h, 2 nas regras de 42h e 40h), e a semana passa a mostrar "FOLGA" nesses dias. Quem já está dentro do limite não muda.

**Why this priority**: Hoje a semana mostra 49h para quem tem 44h contratadas, e o dono não vê como seria uma escala que cumpre a regra.

**Independent Test**: Abrir a Simulação de Sumaré (equipe com 7 dias), clicar em "Sugerir folgas" e ver cada pessoa com folga, total dentro da jornada e sem aviso de dias a mais.

**Acceptance Scenarios**:

1. **Given** uma pessoa com 7 dias na regra de 44h, **When** clica em "Sugerir folgas", **Then** ela fica com 6 dias de turno e 1 folga, e o total da semana cai de acordo.
2. **Given** a regra de 42h ou 40h, **When** clica em "Sugerir folgas", **Then** cada pessoa fica com 5 dias de turno e 2 folgas.
3. **Given** uma pessoa que já trabalha menos dias que o limite da regra, **When** clica, **Then** nada muda para ela.
4. **Given** as folgas sugeridas, **When** a Escala por hora é vista, **Then** a cobertura reflete as folgas (a mesma escala, sem segundo cálculo).
5. **Given** quem só pode ler (visualizador), **When** vê o card, **Then** não há botão "Sugerir folgas".

---

### User Story 2 - A sugestão preserva a cobertura (Priority: P1)

A sugestão escolhe os dias de folga onde a loja menos precisa daquela pessoa, para **não abrir falta de cobertura** que não existia. Se alguma folga inevitavelmente deixa uma hora abaixo do mínimo, a tela avisa em texto simples e a Escala por hora mostra a falta como já faz hoje.

**Why this priority**: Uma folga que derruba a cobertura de farmacêutico seria pior que não sugerir nada.

**Independent Test**: Com um farmacêutico por turno, sugerir folgas e conferir que os dois farmacêuticos não folgam no mesmo dia e que a faixa de aviso só aparece quando a falta é inevitável.

**Acceptance Scenarios**:

1. **Given** duas pessoas de uma função com mínimo 1 por hora, **When** as folgas são sugeridas, **Then** elas folgam em dias diferentes sempre que possível.
2. **Given** uma folga que inevitavelmente deixa uma hora sem cobertura, **When** a sugestão termina, **Then** aparece um aviso dizendo quais dias e funções ficaram descobertos.

---

### User Story 3 - Domingo com rodízio (Priority: P2)

Quando a loja abre aos domingos, a sugestão **espalha as folgas de domingo**: na semana mostrada, ao menos 1 em cada 3 pessoas da função folga no domingo (arredondando para cima), de modo que, repetindo o rodízio, cada pessoa folgue um domingo ao menos a cada 3 semanas. O texto do card explica isso em uma frase. As demais folgas vão para os dias de menor necessidade.

**Why this priority**: É a regra do comércio (Lei 10.101/2000) e o que a EC 141/2026 mantém como "preferencialmente no domingo". Vale, mas depende de P1 e P2 existirem.

**Independent Test**: Numa loja que abre domingo, com 6 caixas, sugerir folgas e ver 2 caixas folgando no domingo, e as outras 4 folgando em outros dias.

**Acceptance Scenarios**:

1. **Given** uma loja que abre domingo e 6 pessoas numa função, **When** as folgas são sugeridas, **Then** 2 delas folgam no domingo.
2. **Given** uma loja que não abre domingo, **When** as folgas são sugeridas, **Then** o domingo não entra na conta (já é "FECHADA").
3. **Given** uma função com só 1 pessoa, **When** a regra do domingo e a cobertura mínima se chocam, **Then** a cobertura vence e o card avisa que o domingo de folga dessa pessoa precisa de um rodízio fora desta semana.

---

### User Story 4 - Poder desfazer e ajustar (Priority: P2)

A sugestão vale só para esta Simulação; nada vai ao Cadastro. Depois de sugerir, a pessoa pode ajustar cada folga na Escala por hora ("Folga" vira turno e "Tirar do dia" vira folga, como já existe) ou voltar ao que estava antes de sugerir.

**Why this priority**: A sugestão é um ponto de partida; o dono tem a palavra final.

**Independent Test**: Sugerir folgas, clicar em "Desfazer" e ver a semana voltar a 7 dias; sugerir de novo e ajustar uma folga na Escala por hora.

**Acceptance Scenarios**:

1. **Given** folgas sugeridas, **When** clica em "Desfazer sugestão", **Then** os turnos voltam a como estavam antes.
2. **Given** folgas sugeridas, **When** ajusta um dia na Escala por hora, **Then** o ajuste vale e a semana atualiza.

---

### Edge Cases

- Loja que abre menos dias do que a regra permite: ninguém precisa de folga extra; nada muda.
- Pessoa que já tem folgas: só entra na sugestão se tiver mais dias que o limite da regra.
- Contratação simulada: já tem seus próprios dias; não entra na sugestão.
- Folga sugerida que deixa a pessoa abaixo da carga contratada: o total fica menor que a carga e o card mostra o total real; ajustar horas é outra decisão.
- Loja de 24 horas ou sem turnos: sem sugestão; o botão não aparece.
- Rodízio de domingo por mais de uma semana: a tela mostra uma semana típica; o texto lembra que o rodízio completo leva 3 semanas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O card "Escala da semana" DEVE mostrar o botão "Sugerir folgas" para quem pode editar e quando alguma pessoa passa do limite de dias da regra; o visualizador não vê o botão.
- **FR-002**: Ao clicar, o sistema DEVE dar a cada pessoa acima do limite as folgas que a regra exige (7 − dias da regra), sem mexer em quem já está dentro do limite, nem na Contratação simulada.
- **FR-003**: As folgas DEVEM ser escolhidas nos dias em que a função menos precisa da pessoa, evitando abrir falta de cobertura; pessoas da mesma função não folgam no mesmo dia quando houver como evitar.
- **FR-004**: Se uma folga inevitavelmente deixar hora abaixo do mínimo, o sistema DEVE avisar, em texto simples, os dias e as funções afetadas.
- **FR-005**: Quando a loja abre aos domingos, o sistema DEVE sugerir domingo de folga para ao menos 1 em cada 3 pessoas de cada função na semana mostrada (arredondando para cima), respeitando a cobertura mínima; o card explica o rodízio de 3 semanas em uma frase.
- **FR-006**: A sugestão DEVE valer só para a Simulação (nunca grava no Cadastro), DEVE poder ser desfeita ("Desfazer sugestão") e DEVE poder ser ajustada dia a dia na Escala por hora.
- **FR-007**: Os dias de turno e as folgas sugeridos DEVEM entrar na mesma escala da Escala por hora e da Escala da semana (uma só fonte); totais e cobertura recalculam.
- **FR-008**: Os avisos de regra existentes (dias a mais, horas a mais) DEVEM continuar funcionando e a sugestão NÃO DEVE impedir salvar o cenário.
- **FR-009**: Os textos DEVEM estar em português do Brasil, simples, sem emoji, só a primeira letra maiúscula; sem R$.
- **FR-010**: O sistema NÃO DEVE afirmar que a sugestão cumpre a lei: o texto de apoio diz que são regras de referência e que o jurídico da Farmarcas confirma os detalhes.

### Key Entities

- **Folga sugerida**: dia de uma pessoa em que o turno foi retirado pela sugestão, só na Simulação.
- **Rodízio de domingo**: a regra de ao menos 1 domingo de folga a cada 3 semanas, mostrada como uma semana típica.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Depois de "Sugerir folgas", nenhuma pessoa passa do limite de dias da regra e o aviso de dias a mais some, em 100% das pessoas.
- **SC-002**: A sugestão não cria hora nova abaixo do mínimo de cobertura sempre que existir uma distribuição de folgas que evite isso.
- **SC-003**: Em loja que abre domingo, ao menos 1 em cada 3 pessoas de cada função folga no domingo da semana mostrada, desde que a cobertura permita.
- **SC-004**: O dono consegue ver a semana com folgas, ajustar um dia e desfazer, tudo em menos de 1 minuto.
- **SC-005**: Nada do Cadastro muda ao sugerir, ajustar ou desfazer.

## Assumptions

- **Regra de referência**: o limite de dias vem da regra escolhida na Simulação (hoje 44h = 6 dias, 42h e 40h = 5 dias).
- **Folgas sugeridas só nesta semana típica**: a tela mostra uma semana; o rodízio de 3 semanas é explicado em texto, não desenhado em 3 semanas.
- **Mulheres (art. 386 da CLT, domingo a cada 15 dias)**: não confirmado pelo jurídico e o sistema não sabe o sexo das pessoas; fica **fora** desta entrega e registrado como pendência de conferência.
- **Regras específicas de farmácia (domingo, feriado, Portaria 3.665/2023)**: não confirmadas; fora desta entrega.
- **Domingo preferencial**: a regra de 1 em 3 é o mínimo; a sugestão não tenta dar mais domingos do que isso.
- **Decisão técnica**: a sugestão é uma função pura na tela, no mesmo arquivo de regras da escala, e grava os turnos pela mesma chamada que a Escala por hora já usa. Por quê: não precisa de banco nem de endpoint novo, e a cobertura recalcula com a conta que já existe.
- **Onde fica o botão**: no cabeçalho do card "Escala da semana", ao lado da legenda.
