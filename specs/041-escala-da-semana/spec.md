# Feature Specification: Escala da semana

**Feature Branch**: `feat/escala-da-semana`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: Novo card "Escala da semana", logo depois de "Escala por hora": a semana de cada pessoa, com folgas e intervalos, agrupada por função, com Contratação simulada, total da semana e clique no dia que abre a Escala por hora daquele dia. Sem R$, igual para dono, gestor e visualizador. Referência: board "Escala da semana · versão A (escolhida)".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a semana de cada pessoa de uma vez (Priority: P1)

Abaixo da "Escala por hora", aparece o card **Escala da semana**: uma tabela com uma linha por pessoa e uma coluna por dia (Seg a Dom) mais a coluna **Semana**. Cada dia de trabalho mostra entrada e saída em negrito e, embaixo, o intervalo ("int. 11h"). Folga aparece como quadro tracejado cinza "FOLGA"; dia em que a loja não abre aparece "FECHADA". As linhas ficam agrupadas por função (Farmacêutico, Atendimento, Caixa), cada célula com a cor da função, e cada grupo recolhe e expande; todos começam abertos, menos Atendimento.

**Why this priority**: Hoje a semana de uma pessoa só se vê dia a dia, trocando de aba. O dono quer bater o olho e entender quem trabalha quando.

**Independent Test**: Abrir uma simulação com equipe cadastrada e conferir que a tabela mostra todas as pessoas, com folgas, intervalos e fechada nos dias certos, e que Atendimento vem recolhido.

**Acceptance Scenarios**:

1. **Given** uma simulação com turnos, **When** o card aparece, **Then** cada pessoa mostra seus horários por dia, com intervalo quando houver, e a folga nos dias sem turno.
2. **Given** uma loja que não abre domingo, **When** a tabela aparece, **Then** a coluna de domingo mostra "FECHADA" para todos, sem horário e sem folga.
3. **Given** a tela recém-aberta, **When** os grupos aparecem, **Then** Farmacêutico e Caixa estão abertos e Atendimento recolhido; clicar no cabeçalho do grupo recolhe ou expande.
4. **Given** uma pessoa com turnos, **When** olho a coluna Semana, **Then** ela mostra horas e dias no formato "40h · 5 dias", e o total é a soma das células da linha, com o intervalo descontado.

---

### User Story 2 - Ver a Contratação simulada na semana (Priority: P1)

Quando a simulação tem uma **Contratação simulada** (vinda do cenário ou de "+ Contratar"), ela aparece como uma linha no grupo da função, com borda tracejada e nome em azul. Os dias que ela não cobre aparecem como folga. Ela entra no total da semana e não grava nada no Cadastro.

**Why this priority**: É o que mostra onde a pessoa nova entra e quanto ela acrescenta.

**Independent Test**: Contratar um farmacêutico parcial para sexta e sábado e ver a linha tracejada com horário só nesses dois dias e folga nos outros.

**Acceptance Scenarios**:

1. **Given** uma Contratação simulada ativa, **When** o card aparece, **Then** há uma linha "Contratação simulada" no grupo da função, tracejada, com o nome em azul.
2. **Given** uma contratação que cobre só alguns dias, **When** a linha aparece, **Then** os demais dias estão como folga e a coluna Semana soma só os dias cobertos.
3. **Given** a contratação removida, **When** o card atualiza, **Then** a linha some e nada do Cadastro mudou.

---

### User Story 3 - Clicar no dia e ir para a Escala por hora (Priority: P2)

Clicar numa célula de dia leva para a "Escala por hora" daquele dia, para ajustar. Quem só pode ler (visualizador) vê o card igual, mas as células não são clicáveis; ele ainda pode recolher e expandir os grupos.

**Why this priority**: Liga a visão da semana ao ajuste, mas o card já vale sozinho.

**Independent Test**: Clicar na quinta de uma pessoa e ver a Escala por hora na aba de quinta; repetir como visualizador e ver que não clica.

**Acceptance Scenarios**:

1. **Given** quem pode editar, **When** clica numa célula de dia, **Then** a "Escala por hora" mostra aquele dia.
2. **Given** o visualizador, **When** tenta clicar numa célula, **Then** nada acontece; os grupos continuam recolhendo e expandindo.
3. **Given** uma célula de folga ou fechada, **When** é clicada por quem edita, **Then** também abre o dia correspondente (a folga pode ser tratada lá).

---

### User Story 4 - Aviso quando a pessoa passa da jornada (Priority: P3)

Se o total da semana passa da jornada contratada da pessoa, o texto da coluna Semana fica destacado com a cor de atenção.

**Why this priority**: Evita surpresa de hora extra, mas é refinamento.

**Independent Test**: Tornar o turno de uma pessoa de 44h em mais de 44h e ver o total destacado.

**Acceptance Scenarios**:

1. **Given** uma pessoa cujo total passa da jornada, **When** o card atualiza, **Then** o total aparece em destaque de atenção.
2. **Given** um total igual ou menor que a jornada, **When** o card aparece, **Then** não há destaque.

---

### Edge Cases

- Loja sem nenhuma escala cadastrada: o card mostra "Ainda não há escala para esta semana. Cadastre os turnos para ver a escala da semana." com o botão "Cadastrar turnos".
- Pessoa sem nenhum turno na semana: linha com folga em todos os dias abertos e total "0h · 0 dias".
- Pessoa desligada: não aparece.
- Função sem ninguém: o grupo não aparece.
- Turno que passa da meia-noite ou intervalo que não cabe no turno: o intervalo é omitido, sem erro.
- Tela estreita: a tabela rola para o lado, com a coluna da pessoa fixa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE mostrar o card "Escala da semana" logo depois de "Escala por hora", com título e o subtítulo "Veja a semana de cada pessoa, com folgas e intervalos."
- **FR-002**: A tabela DEVE ter as colunas Pessoa, Seg, Ter, Qua, Qui, Sex, Sáb, Dom e Semana, com as linhas agrupadas por função.
- **FR-003**: Cada grupo DEVE recolher e expandir; ao abrir, só Atendimento vem recolhido.
- **FR-004**: Cada linha DEVE mostrar o nome da pessoa e, abaixo, a função e a carga semanal contratada.
- **FR-005**: Dia de trabalho DEVE mostrar entrada e saída em negrito e, quando houver, o intervalo em texto secundário; sem intervalo, a segunda linha é omitida.
- **FR-006**: A célula DEVE usar a cor da função (verde Farmacêutico, azul Atendimento, amarelo Caixa).
- **FR-007**: Dia sem turno DEVE aparecer como "FOLGA" (quadro tracejado cinza); dia em que a loja não abre DEVE aparecer como "FECHADA", sem horário e sem folga.
- **FR-008**: A Contratação simulada DEVE aparecer como linha própria no grupo da função, tracejada, com o nome em azul, com folga nos dias não cobertos, entrando no total, sem gravar nada no Cadastro.
- **FR-009**: A coluna Semana DEVE mostrar "Xh · Y dias", somando as horas de cada dia sem o intervalo, e DEVE bater com a soma das células da linha.
- **FR-010**: Total acima da jornada contratada DEVE ser destacado com a cor de atenção.
- **FR-011**: Clicar numa célula DEVE abrir a "Escala por hora" daquele dia, apenas para quem pode editar; o visualizador não clica, mas recolhe e expande os grupos.
- **FR-012**: O card NÃO DEVE mostrar R$ para nenhum perfil e DEVE ser igual para dono, gestor e visualizador (exceto o clique).
- **FR-013**: Os dados DEVEM vir da mesma escala da "Escala por hora" (turnos e quadro da simulação); não pode haver um segundo cálculo.
- **FR-014**: Sem escala cadastrada, o sistema DEVE mostrar o estado vazio "Ainda não há escala para esta semana. Cadastre os turnos para ver a escala da semana." com o botão "Cadastrar turnos".
- **FR-015**: Em tela estreita, a tabela DEVE rolar para o lado com a coluna da pessoa fixa; o desenho do celular fica para uma etapa futura.
- **FR-016**: Os textos DEVEM estar em português do Brasil, simples, sem emoji, só a primeira letra maiúscula, usando sempre "Contratação simulada", "Escala por hora" e "Escala da semana".

### Key Entities

- **Pessoa da semana**: nome, função, carga contratada, e um turno ou folga para cada dia.
- **Turno do dia**: entrada, saída e intervalo de uma pessoa num dia.
- **Contratação simulada**: pessoa que existe só na simulação, com os turnos que cobre.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em até 5 segundos olhando o card, o dono responde "quem trabalha na sexta e até que horas?" sem trocar de aba.
- **SC-002**: Em 100% das linhas, o total da coluna Semana é igual à soma das células do dia, descontado o intervalo.
- **SC-003**: Nenhum valor em R$ aparece no card em nenhum dos três perfis.
- **SC-004**: Um clique numa célula leva ao dia certo da Escala por hora em 100% dos casos, para quem pode editar.
- **SC-005**: Nada do Cadastro muda ao ver, recolher grupos ou clicar nas células.

## Assumptions

- **Onde fica (confirmado pela pessoa)**: o card entra na **Simulação**, logo abaixo da "Escala por hora", e não no Diagnóstico. O Diagnóstico não tem turnos nem essa grade.
- **Visualizador**: as células não são clicáveis, como no pedido; ele só recolhe e expande os grupos.
- **Mesma fonte**: usa o quadro e os turnos já carregados pela Escala por hora, então não há chamada nova ao servidor nem mudança de banco.
- **Decisão técnica**: é só tela (React, tokens do Alquimia), reaproveitando as contas de `escala-regras.js` (total da semana, intervalo, contratações simuladas). Por quê: evita um segundo cálculo e garante que os totais batem.
- **Jornada contratada**: a carga semanal da pessoa no quadro.
- **Estado vazio**: "Cadastrar turnos" leva à tela onde os turnos são definidos (Personalizar / Cadastro da loja).
- **Celular**: rolagem lateral por enquanto, como pedido.
