# Feature Specification: Folgas sugeridas mais intercaladas

**Feature Branch**: `feat/coluna-folha-no-faturamento` (os ajustes se acumulam nesta branch até a pessoa mandar abrir o PR)

**Created**: 2026-11-11

**Status**: Draft

**Input**: Ao sugerir folgas na Escala da semana ("Sugerir folgas") e ao abrir uma simulação com as folgas aplicadas, as folgas ficam sequenciais: a mesma pessoa pode receber duas folgas em dias seguidos (por exemplo segunda e terça) e as pessoas da mesma função tendem a folgar em dias colados, sempre nos primeiros dias da semana. Pedido: folgas mais intercaladas. Evolui a spec 042 (folgas sugeridas). Decisões da pessoa: o problema são os **dois** casos (da mesma pessoa e da equipe) e, quando não der para afastar sem faltar gente, **a cobertura vem primeiro**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - As folgas da mesma pessoa ficam afastadas (Priority: P1)

Quem recebe duas ou mais folgas na sugestão fica com elas **afastadas entre si**: não em dias seguidos (por exemplo, segunda e terça), mas com dias de trabalho no meio (por exemplo, terça e sábado). Quem recebe uma folga só não muda.

**Why this priority**: Folga em dois dias seguidos encaixa um bloco de descanso e deixa a pessoa trabalhar longas sequências; afastar é o que a equipe espera da sugestão.

**Independent Test**: Cinco atendentes na regra de 40h (5 dias), trabalhando 7 dias, cada um com 2 folgas: nenhuma pessoa fica com as duas folgas em dias seguidos quando existir uma alternativa sem faltar gente.

**Acceptance Scenarios**:

1. **Given** uma pessoa com 2 folgas a receber e alternativas sem abrir falta, **When** a sugestão é feita, **Then** os dois dias de folga não são vizinhos.
2. **Given** uma pessoa com 1 folga a receber, **When** a sugestão é feita, **Then** a escolha do dia segue as regras de hoje (menos falta nova de cobertura primeiro).
3. **Given** o fim da semana ligando ao começo (domingo e segunda), **When** a sugestão afasta as folgas, **Then** domingo e segunda também contam como dias seguidos.

---

### User Story 2 - As folgas da equipe se espalham pelos dias (Priority: P1)

As folgas das pessoas da **mesma função** se espalham pelos dias da semana: a sugestão evita que todo mundo folgue junto ou em fila nos mesmos dias, e deixa de escolher sempre os primeiros dias da semana.

**Independent Test**: Cinco atendentes com 2 folgas cada: as 10 folgas caem em vários dias diferentes (nenhum dia com mais da metade da equipe de folga quando houver alternativa sem faltar gente) e não só em segunda, terça e quarta.

**Acceptance Scenarios**:

1. **Given** uma função com várias pessoas para folgar e dias com sobra de cobertura, **When** a sugestão é feita, **Then** as folgas são distribuídas por vários dias, com no máximo uma pessoa a mais de folga num dia do que no dia com menos folgas, quando a cobertura permite.
2. **Given** dias empatados em cobertura, **When** a sugestão escolhe o dia, **Then** não é sempre o de menor número (segunda): o desempate espalha a escolha.
3. **Given** a mesma equipe e a mesma entrada, **When** a sugestão é feita duas vezes, **Then** o resultado é exatamente o mesmo.

---

### User Story 3 - A cobertura vem primeiro e a sugestão avisa (Priority: P1)

Afastar ou espalhar as folgas **nunca** abre falta de cobertura. Quando não houver como afastar sem faltar gente, a sugestão aceita folgas coladas e **avisa em linguagem simples**, por exemplo: "Cristina: não deu para afastar as folgas sem faltar gente."

**Acceptance Scenarios**:

1. **Given** uma pessoa cujas únicas opções de dia, sem falta, são seguidas, **When** a sugestão é feita, **Then** as folgas ficam coladas e a sugestão mostra o aviso com o nome da pessoa.
2. **Given** qualquer sugestão, **When** é comparada com a de hoje, **Then** a quantidade de horas abaixo do mínimo nunca é maior do que a que a sugestão de hoje deixa.

---

### Edge Cases

- **Regras que seguem valendo:** quem passa do limite de dias da regra ganha as folgas que faltam; o rodízio de domingo (ao menos 1 em cada 3 pessoas da função folga no domingo); as 11 h de descanso entre os dias; escolher primeiro o dia que abre menos falta nova.
- **Função com uma pessoa só:** nada para espalhar; a folga segue a regra de hoje.
- **Pessoa que já tem folga no Cadastro:** as folgas que ela já tem entram na conta de "dias seguidos", e só as novas são escolhidas.
- **Loja que abre poucos dias:** com poucos dias abertos pode não haver como afastar; vale o aviso.
- **Só a Simulação muda:** o Cadastro não é alterado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Na sugestão de folgas, as folgas novas de uma mesma pessoa não ficam em dias seguidos quando existir uma alternativa que não abre falta de cobertura; domingo e segunda contam como seguidos.
- **FR-002**: As folgas das pessoas de uma mesma função são distribuídas pelos dias da semana, sem acumular todas nos mesmos dias nem nos primeiros dias.
- **FR-003**: Cobertura primeiro: a distribuição nunca abre falta de cobertura que a sugestão de hoje não abriria; entre os dias que não abrem falta nova, escolhe-se o que afasta e espalha.
- **FR-004**: Quando não for possível afastar sem faltar gente, a sugestão mantém as folgas coladas e mostra um aviso em linguagem simples com o nome da pessoa.
- **FR-005**: As regras da spec 042 continuam: limite de dias da regra, rodízio de domingo (1 em cada 3 por função), 11 h de descanso e prioridade ao dia que abre menos falta nova.
- **FR-006**: A mesma entrada gera sempre a mesma sugestão (sem sorteio).
- **FR-007**: O servidor (ao abrir uma simulação com as folgas aplicadas) e a tela (botão "Sugerir folgas") produzem a mesma sugestão para a mesma entrada.
- **FR-008**: Só a Simulação muda; o Cadastro não é alterado. Textos em pt-BR simples, sem "p.p." nem "pontos".

### Key Entities

- **Folga sugerida**: dia da semana em que a pessoa deixa de trabalhar na simulação, escolhido pela sugestão.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Com 5 atendentes e 2 folgas cada, nenhuma pessoa fica com folgas em dias seguidos quando há alternativa sem faltar gente (0 casos em 100% dos testes desse exemplo).
- **SC-002**: As folgas da função se distribuem em pelo menos 5 dias diferentes da semana no mesmo exemplo.
- **SC-003**: As horas abaixo do mínimo depois da sugestão nunca são maiores que as da sugestão de hoje.
- **SC-004**: Duas execuções com a mesma entrada dão resultados idênticos, e servidor e tela dão o mesmo resultado.

## Assumptions

- **O problema:** Decision: tratar os dois casos (mesma pessoa e equipe). Why: a pessoa confirmou "os dois".
- **Prioridade:** Decision: cobertura primeiro, aceitar folgas coladas com aviso. Why: a pessoa confirmou.
- **Dias seguidos:** Decision: domingo e segunda contam como seguidos (a semana "dá a volta"). Why: quem folga dom e seg descansa dois dias colados na prática.
- **Espalhar a equipe:** Decision: balancear o número de folgas por dia da função; sem sorteio. Why: previsível e repetível.
- **Fora do escopo:** mudar a regra do domingo, o limite de dias, a folga dominical da mulher (item 10) e o Cadastro.
