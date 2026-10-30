# Feature Specification: Cobertura por turno e parâmetros legais editáveis

**Feature Branch**: `feat/cobertura-por-turno`
**Created**: 2026-10-28
**Status**: Draft
**Input**: User description: "A partir do relatório de gap das regras do fim da escala 6x1: (1) cada loja define seus turnos; o cadastro passa a ter só o cargo, a quantidade de pessoas que ele tem na loja (calculada pela lista de pessoas) e o mínimo exigido por turno; (2) manter o salário médio por função; (3) os parâmetros legais (jornada, horas por dia, dias, divisor, vigência) saem do código e passam a ser uma tabela editável com data de vigência; (4) o mínimo por turno substitui o mínimo único do dia inteiro, como meio-termo entre o mínimo único e a exigência hora a hora."

## Situação de hoje

Cada cargo tem **um único mínimo para o dia inteiro** (ex.: "1 atendente"), que vale em todas as horas abertas. Não existe o conceito de turno da loja. As regras da EC 141/2026 (44h, 42h, 40h, 8h por dia, 5 dias, divisor 220/210/200) estão fixas no código; mudar um valor exige alterar o sistema. O aviso de que o resultado é estimativa e deve ser validado com contador e sindicato só aparece no README.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cada loja define seus turnos (Priority: P1)

Na configuração da loja, a pessoa define os **turnos do dia** com nome, início e fim (ex.: Manhã 08:00–14:00, Tarde 14:00–20:00, Noite 20:00–22:00). Os turnos cobrem o horário de funcionamento sem sobrepor. Loja que não define turnos continua funcionando como hoje: um turno único com todo o horário.

**Why this priority**: é a base de tudo; o mínimo por turno só existe depois que a loja tem turnos.

**Independent Test**: definir três turnos numa loja, salvar, reabrir e conferir; tentar turnos sobrepostos e ver o aviso; abrir uma loja antiga e ver que nada mudou.

**Acceptance Scenarios**:

1. **Given** uma loja aberta das 08:00 às 22:00, **When** defino Manhã 08–14, Tarde 14–20 e Noite 20–22, **Then** os três turnos ficam gravados e aparecem ao reabrir.
2. **Given** turnos que se sobrepõem, deixam buraco no horário aberto ou saem do horário de funcionamento, **When** tento salvar, **Then** o sistema avisa o problema em português e não grava.
3. **Given** uma loja sem turnos definidos, **When** abro o Diagnóstico, **Then** o resultado é o mesmo de antes (um turno único com todo o horário).
4. **Given** uma loja com horário diferente por dia (ex.: sábado até 14h), **Then** os turnos valem para todos os dias, recortados pelo horário de cada dia (o turno da noite não existe no sábado se a loja fecha às 14h).
5. **Given** que mudo o horário de funcionamento da loja depois, **Then** o sistema avisa se os turnos deixaram de caber e pede ajuste.

---

### User Story 2 - Mínimo exigido por cargo em cada turno (Priority: P1)

Para cada turno, a pessoa informa o **mínimo de pessoas por cargo** (Farmacêutico, Atendimento, Caixa, Apoio, Perfumaria). Ex.: Manhã: 1 farmacêutico, 1 atendente; Tarde (pico): 1 farmacêutico, 3 atendentes, 1 caixa. O farmacêutico não pode ficar abaixo de 1 em nenhum turno (a lei exige farmacêutico em todo o horário aberto).

**Why this priority**: é o pedido central: exigir gente diferente conforme o momento do dia.

**Independent Test**: informar mínimos diferentes por turno, salvar e reabrir; tentar 0 farmacêutico e ver a recusa.

**Acceptance Scenarios**:

1. **Given** turnos definidos, **When** informo os mínimos de cada cargo em cada turno, **Then** ficam gravados e aparecem ao reabrir.
2. **Given** o campo de Farmacêutico, **When** informo 0 em qualquer turno, **Then** o sistema recusa com o aviso da exigência legal.
3. **Given** uma loja que já tinha o mínimo único do dia inteiro, **Then** o sistema o aplica a todos os turnos como ponto de partida, sem a pessoa precisar redigitar.
4. **Given** o perfil consulta, **Then** vê os mínimos mas não edita.

---

### User Story 3 - Quadro por cargo e turno, calculado pela lista de pessoas (Priority: P1)

A loja mostra, para cada cargo e cada turno, **quantas pessoas a loja tem** (calculado a partir da lista de funcionários, usando função de escala, horário de entrada e saída e dias trabalhados) ao lado do **mínimo exigido**, e destaca onde falta. Não há digitação de quantidade.

**Why this priority**: responde "onde estou descoberto?" sem a pessoa montar o quadro à mão.

**Independent Test**: com três funcionários com horários conhecidos, conferir a contagem de cada turno e o destaque onde falta.

**Acceptance Scenarios**:

1. **Given** funcionários com função, entrada, saída e dias, **When** abro o quadro da loja, **Then** vejo por cargo e turno quantas pessoas estão presentes (a pior hora do turno, no pior dia) e o mínimo exigido, com destaque onde está abaixo.
2. **Given** uma pessoa cujo horário cobre parte de um turno, **Then** ela só conta nas horas em que de fato está presente, e o número do turno é o da pior hora.
3. **Given** funcionários sem horário ou sem função de escala, **Then** não entram na contagem e o sistema diz quantos ficaram de fora e por quê.
4. **Given** a escala importada, **Then** ela continua mandando sobre o horário digitado, como já ocorre hoje.

---

### User Story 4 - Diagnóstico e cenários usam o mínimo por turno (Priority: P1)

O Diagnóstico, o cálculo de quantas pessoas contratar por cargo e os cinco cenários passam a usar o mínimo de **cada turno** no lugar do mínimo único do dia inteiro, nas três regras (44h, 42h e 40h). O resultado explica de qual turno vem a necessidade de cada contratação.

**Why this priority**: sem isso o mínimo por turno seria só um cadastro.

**Independent Test**: loja com pico à tarde: o cálculo pede mais gente do que o mínimo único de 1, mas menos do que o mínimo de pico aplicado ao dia inteiro; loja sem turnos dá o mesmo resultado de antes.

**Acceptance Scenarios**:

1. **Given** um mínimo maior em um turno, **When** abro o Diagnóstico, **Then** a necessidade de horas e de turnos considera cada turno com o seu mínimo.
2. **Given** a explicação de um número, **Then** ela cita o turno que gerou a necessidade (ex.: "3 atendentes na Tarde").
3. **Given** uma loja sem turnos ou com o mesmo mínimo em todos, **Then** o resultado é idêntico ao anterior.
4. **Given** cenários de cortar ou estender horário, **Then** as pontas cortadas seguem o mínimo do turno a que pertencem.

---

### User Story 5 - Parâmetros legais editáveis, com vigência (Priority: P2)

Uma tela de **Parâmetros legais** lista, para cada fase (atual 44h, transição 42h, final 40h): jornada semanal máxima, horas máximas por dia, dias de trabalho por semana, divisor mensal de horas, e a **data de início da vigência**. O dono pode alterar um valor, e a alteração vira uma nova versão com data de início; as versões antigas ficam no histórico. O Diagnóstico usa os valores vigentes.

**Why this priority**: a lei pode ser regulamentada e as convenções mudam; o sistema não pode depender de alterar código.

**Independent Test**: alterar a jornada da fase de 40h para outro valor, ver o Diagnóstico recalcular, ver a versão antiga no histórico e voltar ao valor anterior.

**Acceptance Scenarios**:

1. **Given** a instalação nova ou atual, **Then** os parâmetros já vêm preenchidos com os valores de hoje (44h/42h/40h, 8h por dia, 6/5/5 dias, divisor 220/210/200).
2. **Given** o perfil dono, **When** altero um parâmetro e informo a data de início, **Then** nasce uma nova versão e o Diagnóstico passa a usá-la.
3. **Given** valores impossíveis (jornada ≤ 0, mais de 24 h por dia, mais de 7 dias, divisor ≤ 0), **Then** o sistema recusa com aviso.
4. **Given** gestor ou consulta, **Then** veem os parâmetros mas não editam.
5. **Given** uma alteração, **Then** fica registrada em auditoria com quem mudou e quando.

---

### User Story 6 - Aviso de estimativa no resultado (Priority: P2)

O Diagnóstico mostra, de forma visível, o aviso de que o resultado é uma **estimativa** e que o lojista deve validar com o contador e com a convenção coletiva do sindicato.

**Why this priority**: exigência do documento de regras; hoje só está no README.

**Independent Test**: abrir o Diagnóstico e ver o aviso sem precisar rolar até o fim.

**Acceptance Scenarios**:

1. **Given** qualquer Diagnóstico aberto, **Then** o aviso aparece, em texto simples, no topo ou junto dos cenários.

---

### Edge Cases

- Loja 24 horas: os turnos podem virar a noite (ex.: Noite 22:00–06:00); o turno que passa da meia-noite cobre horas de dois dias corridos.
- Turno sem nenhuma pessoa presente em alguma hora: conta como zero e destaca a falta.
- Dia em que a loja fecha cedo: só os turnos que têm horas abertas naquele dia entram na conta.
- Pessoa trabalhando em dois turnos no mesmo dia (ex.: 09h às 18h): conta em cada hora em que está presente.
- Parâmetro alterado com data de início no futuro: continua valendo o anterior até a data chegar.
- Remover um turno que tem mínimos preenchidos: o sistema avisa e pede confirmação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A loja MUST permitir definir de 1 a 6 turnos, cada um com nome, hora de início e hora de fim.
- **FR-002**: Os turnos MUST cobrir o horário de funcionamento de cada dia sem sobreposição e sem buracos; o sistema MUST recusar a gravação e dizer o motivo quando isso não ocorrer.
- **FR-003**: Loja sem turnos definidos MUST funcionar como um turno único com todo o horário, com resultado idêntico ao atual.
- **FR-004**: O sistema MUST permitir o mínimo de pessoas por cargo em cada turno, para os cargos existentes (Farmacêutico, Atendimento, Caixa, Apoio, Perfumaria).
- **FR-005**: O mínimo de Farmacêutico MUST ser pelo menos 1 em todo turno.
- **FR-006**: O mínimo único atual do dia inteiro MUST ser aplicado a todos os turnos na migração, sem perda de dado.
- **FR-007**: O sistema MUST calcular, por cargo e turno, quantas pessoas a loja tem (pior hora do turno no pior dia), a partir de função de escala, horário de entrada e saída e dias trabalhados; MUST informar quantos funcionários ficaram fora da conta e por quê.
- **FR-008**: O sistema MUST destacar onde a quantidade é menor que o mínimo exigido.
- **FR-009**: O Diagnóstico, o cálculo de contratações e os cinco cenários MUST usar o mínimo de cada turno nas três regras (44h, 42h, 40h).
- **FR-010**: A explicação de cada número MUST indicar o turno de origem da necessidade.
- **FR-011**: O salário médio por função MUST continuar como está (sem salário individual).
- **FR-012**: O sistema MUST ter uma tabela de parâmetros legais por fase com: jornada semanal máxima, horas máximas por dia, dias de trabalho por semana, divisor mensal e data de início da vigência.
- **FR-013**: Os valores atuais (44h/42h/40h, 8h por dia, 6/5/5 dias, divisor 220/210/200) MUST ser carregados como versão inicial.
- **FR-014**: Alterar um parâmetro MUST criar nova versão com data de início, manter o histórico e registrar auditoria.
- **FR-015**: O Diagnóstico MUST usar, para cada fase, a versão vigente na data de hoje.
- **FR-016**: Só o dono MUST editar parâmetros legais e turnos de loja podem ser editados por dono e gestor; consulta só vê.
- **FR-017**: O Diagnóstico MUST exibir o aviso de estimativa com a recomendação de validar com contador e com a convenção coletiva do sindicato.

### Key Entities

- **Turno da loja**: nome, início, fim; pertence a uma loja (de 1 a 6).
- **Mínimo por turno**: para cada turno e cada cargo, o número mínimo de pessoas.
- **Quadro do turno** (calculado, não gravado): por cargo e turno, pessoas presentes e mínimo exigido.
- **Parâmetros legais por fase**: jornada máxima, horas por dia, dias por semana, divisor, início da vigência, com versões.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Definir três turnos e os mínimos de uma loja leva menos de 5 minutos.
- **SC-002**: Lojas sem turnos definidos têm exatamente o mesmo resultado de Diagnóstico de antes da mudança (100% dos testes existentes continuam passando).
- **SC-003**: Em uma loja com pico à tarde, o sistema indica a falta no turno certo em 100% dos casos de teste e nunca marca falta num turno que já cumpre o mínimo.
- **SC-004**: Alterar um parâmetro legal e ver o Diagnóstico recalculado leva menos de 2 minutos, sem mexer no sistema.
- **SC-005**: Nenhuma gravação inválida (turnos com buraco ou sobreposição, farmacêutico zero, parâmetro impossível) é aceita.

## Assumptions

- **Turnos são por loja e iguais em todos os dias da semana**, recortados pelo horário de cada dia. Why: é a definição mais simples que atende "cada loja define seu turno"; turnos diferentes por dia ficam para depois.
- **Quantidade por turno = pior hora do turno no pior dia.** Why: é conservadora e fácil de explicar; mostra o ponto mais fraco do turno.
- **A quantidade vem só da lista de pessoas** (sem digitação), como combinado. Lojas sem lista veem zero e a orientação de cadastrar a equipe.
- **Cargos continuam os cinco atuais.** Novos cargos (gerente, estoquista, entregador, limpeza etc.) ficam para outra entrega.
- **Parâmetros valem para todo o grupo de lojas**, não por loja; editados só pelo dono.
- **Vigência da fase de 42h:** usamos 16/12/2026, conforme o documento de regras mais recente; o código atual diz 15/12/2026. A data é ajustável na tela de parâmetros, então pode ser corrigida sem mexer no sistema.
- **O aviso de estimativa é fixo**, não editável.
- **Fora do escopo desta entrega**: fator de cobertura de férias e absenteísmo, custo completo (encargos por regime, provisões, adicionais, comissão), cenário de hora extra, adicional noturno, sócio/estagiário/aprendiz, convenções coletivas, mínimo por hora livre. Estão no relatório de gap e entram em entregas seguintes.
- Decisões técnicas (tabelas, telas, motor) ficam para o plano.
