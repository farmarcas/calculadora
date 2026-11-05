# Feature Specification: Retirar "Marcar como em uso" da Simulação

**Feature Branch**: `feat/retirar-simulacao-em-uso`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Retirar da Simulação a função 'Marcar como em uso' (aprovar simulação): o botão e a janela 'Aprovar simulação', o status 'Em uso' e 'Substituída', o aviso 'Simulação em uso desatualizada', a referência 'em uso' na comparação e a regra que impede descartar a simulação em uso. As simulações que já estavam em uso ou substituídas passam a aparecer como gravadas, sem perder nada. Marcar como em uso nunca alterou o Cadastro, o Diagnóstico nem a folha, então nada disso muda. O restante da Simulação continua igual."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Simulação sem o passo de aprovar (Priority: P1)

Quem simula (o dono) cria, ajusta, grava, clona, descarta e compara simulações como hoje, mas a tela não oferece mais "Marcar como em uso" nem a janela "Aprovar simulação". Uma simulação gravada é só isso: uma simulação gravada, sem a ideia de "aprovada" ou "vigente".

**Why this priority**: É o pedido: a função não muda nada na loja e confunde, porque parece que a simulação passa a valer.

**Independent Test**: Abrir uma simulação e ver que o botão "Marcar como em uso" não existe; criar, gravar, clonar e descartar uma simulação e ver que tudo segue funcionando.

**Acceptance Scenarios**:

1. **Given** uma simulação aberta (rascunho ou gravada), **When** a tela é vista, **Then** não aparece o botão "Marcar como em uso" nem a janela "Aprovar simulação".
2. **Given** a lista de simulações da loja, **When** é vista, **Then** os únicos estados mostrados são Rascunho, Gravada e Descartada (não existem "Em uso" nem "Substituída").
3. **Given** uma simulação gravada, **When** a pessoa a descarta, **Then** ela é descartada normalmente, qualquer que tenha sido o estado anterior.
4. **Given** uma simulação, **When** a pessoa a cria, ajusta, grava, clona ou exporta, **Then** tudo funciona como antes.
5. **Given** o texto de ajuda e de avisos da Simulação, **When** é lido, **Then** não fala em aprovar, em uso, vigência nem substituída.

---

### User Story 2 - Comparação sem uma simulação como base fixa (Priority: P1)

A comparação de 2 ou 3 simulações da mesma loja mostra cada uma pelos seus próprios números lado a lado. Deixa de existir uma "simulação em uso" que entra sozinha como referência e de existirem as diferenças "frente à em uso".

**Why this priority**: Sem o conceito de "em uso", a referência automática não tem mais o que apontar, e as diferenças viravam um valor sem sentido.

**Independent Test**: Comparar duas simulações gravadas e ver cada uma com seus indicadores (cobertura, horas, custo para o dono), sem uma terceira linha de referência e sem a linha "Diferença mensal frente à em uso".

**Acceptance Scenarios**:

1. **Given** duas simulações escolhidas para comparar, **When** a comparação é aberta, **Then** só essas duas aparecem, cada uma com seus indicadores, e nenhuma é marcada como "referência".
2. **Given** a comparação aberta pelo dono, **When** os custos são vistos, **Then** aparece o custo mensal de cada simulação, e não aparece a linha "Diferença mensal frente à em uso".
3. **Given** a síntese em texto de cada simulação, **When** é lida, **Then** descreve a própria simulação (cobertura, horas, vagas e o que falta) e não compara com "a simulação em uso".
4. **Given** uma simulação com erro nas regras, **When** a síntese é lida, **Then** diz que ela tem erro(s) nas regras, sem falar em "aprovar".

---

### User Story 3 - Simulações já marcadas continuam, como gravadas (Priority: P1)

As simulações que já estavam "em uso" ou "substituídas" passam a aparecer como gravadas. Nada se perde: nome, horários, contratações, premissas e resultado continuam iguais, e elas continuam podendo ser abertas, clonadas, comparadas e descartadas.

**Why this priority**: Garante que ninguém perde trabalho feito por causa da retirada da função.

**Independent Test**: Numa base com uma simulação em uso e outra substituída, aplicar a mudança e ver as duas na lista como "Gravada", com os mesmos dados e os mesmos resultados de antes.

**Acceptance Scenarios**:

1. **Given** uma simulação que estava em uso, **When** a lista é aberta depois da mudança, **Then** ela aparece como "Gravada", com o mesmo nome, horários, contratações e resultado.
2. **Given** uma simulação que estava substituída, **When** a lista é aberta, **Then** ela aparece como "Gravada".
3. **Given** uma simulação que estava em uso, **When** a pessoa tenta descartá-la, **Then** consegue (a regra de proteção deixou de existir).
4. **Given** qualquer uma delas, **When** é aberta, **Then** não mostra o aviso "Simulação em uso desatualizada".
5. **Given** o histórico de simulações das lojas, **When** a mudança é aplicada, **Then** nenhuma simulação é apagada e o número delas não muda.

---

### Edge Cases

- Loja com várias simulações antes "em uso" e "substituída": todas viram gravadas e aparecem na ordem de sempre.
- Simulação descartada antes da mudança continua descartada.
- Quem tinha a janela de aprovação aberta durante a mudança: ao recarregar a tela, o botão já não existe.
- Datas de aprovação e de vigência já gravadas ficam guardadas, mesmo sem aparecer na tela.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela da Simulação MUST NOT oferecer o botão "Marcar como em uso" nem a janela "Aprovar simulação".
- **FR-002**: Os estados de uma simulação MUST ser apenas Rascunho, Gravada e Descartada na tela e no que o sistema devolve; "Em uso" e "Substituída" MUST deixar de existir.
- **FR-003**: O sistema MUST NOT mais permitir aprovar uma simulação; a operação de aprovar MUST deixar de existir.
- **FR-004**: O aviso "Simulação em uso desatualizada" (e a checagem que o gera) MUST deixar de existir.
- **FR-005**: A comparação MUST mostrar somente as simulações escolhidas, cada uma com seus indicadores, sem simulação de referência automática e sem a linha "Diferença mensal frente à em uso".
- **FR-006**: A síntese em texto de cada simulação MUST descrever apenas a própria simulação, sem compará-la com "a em uso" e sem falar em aprovar.
- **FR-007**: A regra que impede descartar a simulação em uso MUST deixar de existir; qualquer simulação não descartada MUST poder ser descartada.
- **FR-008**: As simulações que estavam em uso ou substituídas MUST passar a ser gravadas, sem apagar nem alterar nome, horários, contratações, premissas e resultado.
- **FR-009**: As datas e os registros de aprovação e de substituição já gravados MUST permanecer guardados, mesmo sem aparecerem na tela.
- **FR-010**: Criar, ajustar, gravar, clonar, descartar, comparar e exportar uma simulação MUST funcionar como antes, e o Cadastro, o Diagnóstico e a folha MUST NOT mudar.
- **FR-011**: Os textos da Simulação (avisos, ajudas e botões) MUST NOT mais falar em "em uso", "aprovar", "vigência" ou "substituída".

### Key Entities *(include if feature involves data)*

- **Simulação**: nome, loja, regra, quadro, horários, contratações, premissas e estado (rascunho, gravada ou descartada).
- **Registro de aprovação (histórico)**: quem aprovou, quando, início da vigência e quando foi substituída; continua guardado nas simulações que o tinham, sem uso na tela.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhuma tela da Simulação, da lista nem da comparação contém "Marcar como em uso", "Aprovar", "Em uso", "Substituída" ou "desatualizada".
- **SC-002**: 100% das simulações existentes continuam na lista depois da mudança, com os mesmos dados e o mesmo resultado de antes (diferença zero), e nenhuma aparece como "Em uso" ou "Substituída".
- **SC-003**: Em 100% dos casos, a pessoa consegue descartar uma simulação que estava em uso.
- **SC-004**: Comparar duas simulações mostra exatamente duas colunas, sem referência automática.
- **SC-005**: Os números do Cadastro, do Diagnóstico e da folha ficam idênticos aos de antes da mudança.

## Assumptions

- Decisão: as simulações que estavam em uso ou substituídas viram **gravadas** por uma atualização dos dados existentes (os valores guardados), sem apagar nada. Por quê: é o que o pedido descreve, e "gravada" é o estado neutro que já existe.
- Decisão: as datas e os registros de aprovação já gravados ficam guardados, sem tela. Por quê: não há ganho em apagá-los e o pedido é "sem perder nada".
- Decisão: a comparação passa a mostrar só as simulações escolhidas, sem um "quadro atual da loja" como coluna extra. Por quê: hoje a comparação nunca mostrou o quadro atual como coluna; o pedido fala em "base fixa" que deixa de existir, então basta tirar a referência.
- Decisão: o texto "ainda não pode ser aprovada" da síntese vira uma frase só sobre os erros nas regras. Por quê: sem aprovar, a expressão perde o sentido.
- Fora do escopo: criar uma nova forma de marcar a simulação escolhida, e mexer em Cadastro, Diagnóstico, cenários ou folha.
