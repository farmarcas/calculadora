# Feature Specification: Folgas sem segunda-feira, equipe espalhada e folga livre na simulação

**Feature Branch**: `feat/folgas-evitar-segunda-e-livres`

**Created**: 2026-11-19

**Status**: Draft

**Input**: Hoje a sugestão de folgas da Simulação parece aleatória. Pedido: (1) evitar a segunda-feira, só sugerindo folga nela quando for realmente o único jeito; (2) pessoas do mesmo cargo devem, ao máximo, não folgar no mesmo dia; (3) na simulação, deixar livre dar folga a qualquer pessoa em qualquer dia, para simular visões diferentes (hoje só é fácil escalar quem está de folga). Evolui as specs 042 (folgas sugeridas) e 055 (folgas mais intercaladas). Só a Simulação muda; o Cadastro não.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A sugestão evita a segunda-feira (Priority: P1)

Ao sugerir folgas ("Sugerir folgas" na Escala da semana, ou ao abrir uma simulação com as folgas já aplicadas), a segunda-feira só recebe folga quando não houver outro dia que mantenha a cobertura. Segunda é o dia de maior movimento da semana para a loja; a sugestão deve poupá-la.

**Why this priority**: É o que a equipe mais estranha hoje: folgas caindo na segunda sem necessidade.

**Independent Test**: Cinco atendentes na regra de 40h (5 dias), trabalhando 7 dias, cada um com 2 folgas a receber, com sobra de cobertura em vários dias: nenhuma folga sugerida cai na segunda.

**Acceptance Scenarios**:

1. **Given** uma pessoa com folga a receber e pelo menos um outro dia em que a cobertura se mantém, **When** a sugestão é feita, **Then** a folga não cai na segunda.
2. **Given** uma pessoa cujo único dia possível, sem faltar gente, é a segunda, **When** a sugestão é feita, **Then** a folga cai na segunda e a sugestão avisa, em linguagem simples, de quem foi e por quê (por exemplo: "Cristina: só deu para folgar na segunda sem faltar gente.").
3. **Given** a loja fechada na segunda, **When** a sugestão é feita, **Then** nada muda por causa dessa regra.

---

### User Story 2 - Pessoas do mesmo cargo não folgam no mesmo dia (Priority: P1)

As folgas das pessoas da **mesma função** (cargo) caem em dias diferentes sempre que possível: a sugestão só põe duas pessoas do mesmo cargo de folga no mesmo dia quando não houver dia livre que mantenha a cobertura.

**Why this priority**: Duas pessoas do mesmo cargo fora no mesmo dia deixa o dia mais exposto a falta e a loja mais vazia naquele cargo.

**Independent Test**: Três farmacêuticos e cinco atendentes, cada um com 1 ou 2 folgas: dentro de cada cargo, nenhum dia recebe duas folgas enquanto existir dia aberto, ainda sem folga nesse cargo, que mantenha a cobertura.

**Acceptance Scenarios**:

1. **Given** várias pessoas de um cargo para folgar e dias livres de folga naquele cargo, **When** a sugestão é feita, **Then** cada folga cai num dia diferente.
2. **Given** mais folgas do que dias disponíveis para o cargo, **When** a sugestão é feita, **Then** os dias se repetem o mínimo possível (a diferença entre o dia com mais e o dia com menos folgas do cargo é de no máximo 1).
3. **Given** que só um dia mantém a cobertura, **When** a sugestão é feita, **Then** as folgas coincidem nesse dia e a sugestão avisa, sem esconder o fato.

---

### User Story 3 - Dar folga livremente na simulação (Priority: P1)

Na Simulação, quem edita pode dar folga a **qualquer pessoa em qualquer dia em que ela trabalha**, e voltar a escalar quem está de folga, direto pela Escala da semana (um clique na célula do dia, sem precisar abrir a Escala por hora e selecionar o turno). A Escala por hora continua do jeito que é. O sistema **não bloqueia** a escolha: se a folga deixar horas sem cobertura ou fugir de alguma regra, ele mostra os avisos, mas deixa simular.

**Why this priority**: A pessoa quer "simular visões": testar o que acontece se a Cristina folgar na quarta, sem o sistema impedir ou exigir vários passos.

**Independent Test**: Numa simulação aberta para edição, na Escala da semana, dar folga a uma pessoa em um dia de trabalho com um clique: a célula vira "FOLGA", a cobertura e os avisos do dia se atualizam, e o resultado fica salvo na simulação.

**Acceptance Scenarios**:

1. **Given** uma pessoa trabalhando na quarta, **When** a pessoa escolhe dar folga a ela nesse dia na Escala da semana, **Then** a célula vira "FOLGA" e a cobertura do dia é recalculada.
2. **Given** uma pessoa de folga na quinta, **When** a pessoa escolhe escalá-la nesse dia, **Then** ela passa a trabalhar no horário que mais repete (como já acontece na Escala por hora).
3. **Given** uma folga que deixa o dia abaixo do mínimo de cobertura, **When** ela é dada, **Then** ela é aceita e os avisos mostram o que faltou.
4. **Given** uma simulação gravada (somente leitura), **When** a pessoa a abre, **Then** nenhuma célula oferece dar folga.
5. **Given** uma contratação simulada, **When** a pessoa dá folga a ela num dia, **Then** funciona igual ao das pessoas da equipe.

---

### Edge Cases

- **Regras que seguem valendo:** quem passa do limite de dias da regra recebe as folgas que faltam; o rodízio de domingo (ao menos 1 em cada 3 pessoas de cada função); as 11 h de descanso entre os dias; a cobertura vem primeiro.
- **Domingo × mesmo cargo:** o rodízio de domingo (ao menos 1 em cada 3 pessoas do cargo) continua mandando; num cargo com 4 pessoas ou mais, 2 ou mais folgam no domingo, e isso não conta como coincidência.
- **Segunda × domingo:** o rodízio de domingo continua mandando; a regra da segunda só desempata.
- **Função com uma pessoa só:** nada para espalhar; só vale evitar a segunda.
- **Pessoa que já folga na segunda no Cadastro:** a folga existente fica; a regra só vale para as folgas novas.
- **Folga livre em todos os dias de uma pessoa:** é aceita (a pessoa fica sem turnos na semana) e os avisos mostram o efeito.
- **Sugerir de novo depois de folgas dadas à mão:** a sugestão parte do que está na tela e respeita as folgas já dadas.
- **Só a Simulação muda:** o Cadastro e as simulações já gravadas não são alterados.
- **Resultado previsível:** a mesma entrada dá sempre a mesma sugestão (sem sorteio).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao sugerir folgas, o sistema MUST evitar a segunda-feira e só dar folga nela quando nenhum outro dia aberto mantiver a cobertura da função.
- **FR-002**: Quando a folga cair na segunda por falta de alternativa, o sistema MUST avisar, em linguagem simples, de quem foi.
- **FR-003**: Ao sugerir folgas, o sistema MUST evitar duas folgas de pessoas do mesmo cargo no mesmo dia, enquanto houver dia que mantenha a cobertura sem folga desse cargo.
- **FR-004**: Quando houver mais folgas do que dias, o sistema MUST repartir as folgas do cargo com a menor diferença possível entre os dias (no máximo 1).
- **FR-005**: A ordem de prioridade da sugestão MUST ser: cobertura primeiro; depois evitar a segunda; depois não coincidir com colega do mesmo cargo; depois afastar as folgas da mesma pessoa (spec 055). Quando uma regra de preferência não puder ser atendida, a sugestão MUST avisar.
- **FR-006**: O rodízio de domingo, o limite de dias da regra e as 11 h de descanso MUST continuar valendo como hoje.
- **FR-007**: Na Escala da semana de uma simulação editável, o sistema MUST permitir dar folga a uma pessoa num dia de trabalho com uma ação direta na célula, e escalar quem está de folga, sem passar pela Escala por hora.
- **FR-008**: A folga livre MUST ser aceita mesmo que deixe horas abaixo do mínimo ou fuja de uma regra; nesse caso o sistema MUST mostrar os avisos, sem impedir a simulação.
- **FR-009**: Dar ou tirar folga MUST recalcular a cobertura, os avisos e os resultados da simulação e MUST ficar gravado nela.
- **FR-010**: Em simulação gravada (somente leitura), nenhuma ação de folga MUST aparecer.
- **FR-011**: A mesma entrada MUST produzir sempre a mesma sugestão de folgas.
- **FR-012**: O Cadastro MUST permanecer como está; só a Simulação muda.

### Key Entities

- **Folga**: dia aberto em que uma pessoa não trabalha numa simulação (turno ausente); pode vir do Cadastro, da sugestão ou de uma escolha manual.
- **Aviso de folga**: frase curta que diz de quem foi uma folga que não deu para evitar na segunda ou coincidir com colega do cargo, ou que apontou falta de cobertura.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em lojas com sobra de cobertura, nenhuma folga sugerida cai na segunda-feira (0 de N).
- **SC-002**: Dentro de cada cargo, nenhum dia recebe duas folgas sugeridas enquanto houver dia livre que mantenha a cobertura; no pior caso a diferença entre dias é de 1.
- **SC-003**: A sugestão nunca deixa mais horas abaixo do mínimo do que a sugestão de hoje deixa.
- **SC-004**: Dar folga a uma pessoa em um dia leva um clique e a tela mostra a nova cobertura em menos de 2 segundos.
- **SC-005**: Executar a sugestão duas vezes com a mesma entrada dá exatamente o mesmo resultado.

## Assumptions

- **Segunda-feira** é o primeiro dia da semana na escala (a semana vai de segunda a domingo, como já mostra a tela).
- **Ordem das regras (decisão de negócio provisória):** cobertura, depois segunda, depois colega do mesmo cargo, depois afastar as folgas da própria pessoa. Se a equipe quiser outra ordem, é um ajuste simples.
- **Folga livre sem trava:** aceitar tudo e avisar combina com o objetivo de "simular visões"; o sistema não impede por mínimo de cobertura nem por limite de dias.
- **Decision: a ação de folga na Escala da semana é um controle pequeno em cada célula** (a célula inteira continua abrindo o dia na Escala por hora). **Why:** não tira o que já existe e deixa a ação a um clique.
- **Decision: o resultado da sugestão continua sem sorteio.** **Why:** a mesma entrada precisa dar o mesmo resultado (spec 055).
- A Escala por hora continua com "Folga" clicável, "Tirar do dia" e arrastar, como hoje.
