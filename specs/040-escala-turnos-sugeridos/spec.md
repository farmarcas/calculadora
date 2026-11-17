# Feature Specification: Escala por hora com turnos sugeridos e arrastar mais fácil

**Feature Branch**: `feat/escala-turnos-sugeridos`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Revise a parte da escala e do arrastar as pessoas nos horários, e também, quando sugere uma contratação, veja de colocar já uma sugestão de turno já com a necessidade."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A contratação já chega com o turno sugerido (Priority: P1)

Quando a Simulação nasce de um cenário sugerido (botão **Personalizar**), as contratações do cenário já chegam com **dias e horário de turno sugeridos**, escolhidos para cobrir onde falta gente, em vez de aparecer como "Sem turnos" e não cobrir nada. Numa simulação que já tem contratações sem turno, cada uma mostra o botão **Sugerir turno**, que faz a mesma coisa.

**Why this priority**: Hoje a contratação sugerida existe na conta mas não aparece na escala, então a falta de cobertura continua marcada. O empresário precisa ver, de cara, onde a pessoa nova entra.

**Independent Test**: Abrir "Personalizar" num cenário que contrata 1 farmacêutico parcial e ver, na Escala por hora, a pessoa nova com turno nos dias e horas em que faltava farmacêutico, e a falta fechando.

**Acceptance Scenarios**:

1. **Given** um cenário que contrata, **When** a pessoa clica em Personalizar, **Then** cada contratação já tem turnos, e as horas semanais dos turnos batem com as horas da contratação.
2. **Given** uma contratação que cobre uma falta, **When** a simulação abre, **Then** as horas que ela cobre aparecem reforçadas e a faixa amarela já mostra só o que ainda falta.
3. **Given** uma contratação sem turno numa simulação já aberta, **When** a pessoa clica em "Sugerir turno", **Then** os turnos sugeridos entram na escala e a cobertura atualiza.
4. **Given** várias contratações da mesma função, **When** os turnos são sugeridos, **Then** cada uma cobre o que as anteriores deixaram descoberto.

---

### User Story 2 - Ver o turno sugerido na grade enquanto contrata (Priority: P1)

Enquanto o formulário **+ Contratar** está aberto, a grade mostra o **turno sugerido** da pessoa nova, como uma barra tracejada na linha "Contratação simulada" e as horas que ele reforça. A pessoa pode **arrastar essa barra** (mover e puxar as bordas) e o Entra e o Sai do formulário acompanham. Ao adicionar, o turno vira a contratação simulada.

**Why this priority**: Enxergar o turno na grade, ao lado da falta, é mais claro que ler horas num formulário.

**Independent Test**: Abrir "+ Contratar" do Farmacêutico num dia com falta e ver a barra tracejada sobre as horas descobertas; arrastar a barra e ver Entra e Sai mudarem.

**Acceptance Scenarios**:

1. **Given** o formulário aberto, **When** a grade é vista, **Then** a linha de prévia mostra o turno sugerido nos dias escolhidos e as horas reforçadas.
2. **Given** a barra de prévia, **When** é arrastada ou redimensionada, **Then** Entra e Sai do formulário mudam e o efeito na semana é recalculado.
3. **Given** o formulário fechado ou cancelado, **When** a grade é vista, **Then** a prévia some e nada foi gravado.

---

### User Story 3 - Arrastar pessoas nos horários, com mais controle (Priority: P2)

O ajuste dos turnos fica mais fácil e mais completo: as **alças das bordas são maiores e visíveis**; durante o gesto aparece o **horário novo** do turno; uma pessoa de **folga** pode receber um turno naquele dia (clicando em "Folga") e um dia pode ser **tirado** de uma pessoa (vira folga). A faixa de contexto mostra o turno selecionado, o total da semana da pessoa e os avisos dela.

**Why this priority**: Hoje só dá para mover turnos que já existem, e as alças são difíceis de acertar.

**Independent Test**: Clicar numa "Folga" e ver nascer um turno igual ao da pessoa em outro dia; selecionar um turno e usar "Tirar do dia" para virar folga; ver o total da semana mudar nos dois casos.

**Acceptance Scenarios**:

1. **Given** uma pessoa de folga num dia, **When** a pessoa clica em "Folga" (com permissão de editar), **Then** nasce um turno com o horário habitual dela e a cobertura atualiza.
2. **Given** um turno selecionado, **When** a pessoa clica em "Tirar do dia", **Then** o dia vira folga e a cobertura atualiza.
3. **Given** o gesto de arrastar, **When** está em andamento, **Then** o horário do turno aparece na barra e a cobertura responde na hora.
4. **Given** uma pessoa que passa dos dias ou das horas da regra com a mudança, **When** a mudança é feita, **Then** o aviso de regra aparece junto da pessoa e não impede salvar.

---

### User Story 4 - Erros e avisos aparecem junto da escala (Priority: P2)

Se uma mudança de turno não puder ser gravada, a mensagem aparece **na própria seção da escala** e o turno volta ao que estava. Os avisos de regra da pessoa selecionada (jornada, intervalo, folga) aparecem na faixa de contexto.

**Why this priority**: Hoje a mensagem de erro fica no topo da página, longe de onde a pessoa está mexendo.

**Independent Test**: Provocar um erro de gravação e ver a mensagem dentro da seção da escala.

**Acceptance Scenarios**:

1. **Given** um erro ao gravar uma mudança, **When** acontece, **Then** a mensagem aparece na seção e o turno volta ao anterior.
2. **Given** uma pessoa selecionada com avisos de regra, **When** a faixa de contexto é vista, **Then** os avisos dela aparecem ali.

---

### User Story 5 - Mesmas permissões (Priority: P3)

Quem só consulta continua só lendo: sem "Sugerir turno", sem arrastar, sem criar ou tirar turno. Gestor e dono editam. O gestor continua sem ver venda nem custo, e o dono vê o efeito em % de custo no formulário.

**Why this priority**: Garante que a melhoria não abre edição nem valores a quem não pode.

**Independent Test**: Abrir a mesma simulação como dono, gestor e visualizador e comparar.

**Acceptance Scenarios**:

1. **Given** o visualizador, **When** a escala é vista, **Then** não há "Sugerir turno", alças, "Folga" clicável nem "Tirar do dia".
2. **Given** o gestor, **When** a escala é vista, **Then** edita, mas não vê venda nem custo.

---

### Edge Cases

- Contratação maior que a que cabe nos dias abertos: o sistema reduz os dias, aumenta as horas por dia até o máximo da regra e avisa o que sobrou.
- Falta que nenhuma contratação cobre inteira: a sugestão cobre o máximo possível e a faixa amarela mostra o que ainda falta.
- Simulação sem nenhuma falta: a sugestão usa o dia e o horário de maior movimento de clientes, quando houver, ou a abertura da loja.
- Pessoa sem horário habitual (nunca teve turno): "Folga" clicável cria um turno com o horário de abertura do dia e a duração da jornada diária da regra.
- Tirar o último turno de uma contratação simulada: ela volta a "Sem turnos", com o botão "Sugerir turno".
- Simulação gravada (não editável): só leitura, como o visualizador.
- Celular: a lista por função mostra os turnos sugeridos em texto; arrastar continua só no computador.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao abrir uma simulação a partir de um cenário (Personalizar), o sistema MUST dar a cada contratação turnos sugeridos (dias e horário) que cobrem as horas sem cobertura da função, com as horas semanais dos turnos iguais às da contratação.
- **FR-002**: O sistema MUST oferecer "Sugerir turno" nas contratações simuladas sem turno, com a mesma sugestão, e MUST sugerir várias contratações da mesma função uma depois da outra, cada uma sobre o que sobrou descoberto.
- **FR-003**: Com o formulário "+ Contratar" aberto, a grade MUST mostrar o turno sugerido nos dias escolhidos (barra tracejada) e as horas que ele reforça.
- **FR-004**: A barra de prévia MUST poder ser movida e redimensionada (de 15 em 15 minutos), e o Entra, o Sai e o efeito na semana do formulário MUST acompanhar.
- **FR-005**: As alças das bordas dos turnos MUST ser maiores e visíveis, e o horário novo MUST aparecer na barra durante o gesto.
- **FR-006**: Clicar em "Folga" de uma pessoa MUST criar um turno naquele dia (horário habitual da pessoa, ou o da abertura com a jornada diária da regra), e "Tirar do dia" MUST transformar o turno selecionado em folga.
- **FR-007**: Toda mudança de turno MUST recalcular a cobertura, a faixa de aviso e o total da semana na hora, e MUST gravar ao terminar o gesto.
- **FR-008**: Erro ao gravar MUST aparecer na seção da escala, e o turno MUST voltar ao anterior.
- **FR-009**: A faixa de contexto MUST mostrar, para o turno selecionado, o horário, o total da semana da pessoa e os avisos de regra dela.
- **FR-010**: O sistema MUST manter as permissões: visualizador e simulação gravada só leem; gestor edita sem ver venda nem custo; dono vê o custo em %.
- **FR-011**: Avisos de regra MUST NOT impedir salvar o cenário.
- **FR-012**: O sistema MUST NOT gravar nada no Cadastro e MUST NOT mexer nos outros passos da Simulação nem em outras seções do Diagnóstico.

### Key Entities

- **Turno sugerido**: dias e horário propostos para uma contratação, escolhidos pela necessidade de cobertura.
- **Prévia do turno**: a barra tracejada da contratação que ainda não foi adicionada, ligada ao formulário.
- **Folga**: dia sem turno de uma pessoa, que pode receber um turno.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Numa simulação aberta por "Personalizar", 100% das contratações com falta de cobertura a resolver chegam com turnos que a cobrem o máximo possível.
- **SC-002**: Uma pessoa vê o turno sugerido de uma nova contratação na grade, antes de adicionar, em menos de 1 segundo depois de abrir o formulário.
- **SC-003**: Uma pessoa coloca alguém numa folga ou tira alguém de um dia em até 2 cliques.
- **SC-004**: Qualquer erro de gravação de turno aparece dentro da seção da escala.
- **SC-005**: Nenhum valor em reais aparece para gestor e visualizador.

## Assumptions

- Decision: o turno é sugerido automaticamente ao criar a simulação pelo Personalizar e fica gravado na simulação (nunca no Cadastro); a pessoa pode ajustar ou remover. Why: a necessidade já é conhecida nesse momento, e o pedido é "já colocar".
- Decision: para uma contratação com N horas semanais, os dias são os de maior falta, com 6 horas por dia no máximo quando parcial (sem intervalo) e a jornada diária da regra quando integral. Why: é o limite sem intervalo e o da regra que o sistema já usa.
- Decision: a sugestão não cobre a venda nem o custo, só a cobertura de pessoas por hora. Why: é a necessidade que a escala mostra; o efeito em custo e venda segue no formulário.
- Decision: o horário habitual de uma pessoa em "Folga" é o do turno dela em outro dia da mesma semana (o mais frequente). Why: é o que ela já cumpre.
- Decision: arrastar no celular continua fora (a lista mostra os turnos em texto). Why: já combinado na entrega anterior.
- Fora do escopo: arrastar um turno de um dia para outro, mudar a regra de cálculo da cobertura e os outros passos da Simulação.
