# Feature Specification: Horário de funcionamento por dia da semana (e loja 24 horas)

**Feature Branch**: `feat/escala-horario-semana`
**Created**: 2026-10-27
**Status**: Draft
**Input**: User description: "No cadastro das lojas, está apenas considerando funcionamento de seg a sex, porém as lojas têm possibilidade de abrir de seg a domingo e, no cadastro, ter a opção de marcar se ela está aberta ou fechada no dia da semana e ainda se a loja é 24 horas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar a semana inteira da loja (Priority: P1)

No cadastro da loja, a pessoa vê os sete dias (segunda a domingo). Para cada dia marca **aberta** ou **fechada** e, se aberta, informa a hora de abertura e de fechamento ou marca **24 horas**. Há um atalho **"Loja 24 horas"** que deixa todos os dias abertos o dia inteiro e um atalho para **copiar o horário de um dia para os outros**. A tabela de lojas passa a mostrar um resumo legível ("Seg a sáb 08:00–22:00 · Dom fechada").

**Why this priority**: hoje só dá para informar segunda a sexta; sem isso, sábado, domingo e lojas 24h ficam fora de qualquer cálculo.

**Independent Test**: cadastrar uma loja aberta de segunda a domingo com domingo mais curto e uma segunda loja 24 horas, reabrir e conferir que tudo foi guardado.

**Acceptance Scenarios**:

1. **Given** o formulário de loja, **When** marca sábado e domingo como abertos com horários próprios, **Then** os sete dias ficam guardados exatamente como informados.
2. **Given** um dia marcado como fechado, **Then** os campos de horário desse dia ficam indisponíveis e o dia não conta como aberto.
3. **Given** o atalho "Loja 24 horas", **When** é marcado, **Then** os sete dias passam a "aberto 24 horas".
4. **Given** um dia aberto com fechamento antes ou igual à abertura, **When** tenta salvar, **Then** o sistema recusa e explica.
5. **Given** lojas já cadastradas com horário de segunda a sexta (e sábado/domingo opcionais) no formato antigo, **Then** continuam funcionando e aparecem corretamente nos sete dias, sem a pessoa precisar recadastrar.

---

### User Story 2 - Planilha e importação com a semana inteira (Priority: P2)

A planilha modelo de lojas passa a ter as colunas de horário por dia (abre e fecha de segunda a domingo) e a indicação de loja 24 horas. Dia sem horário é dia fechado. A importação continua entendendo planilhas fora do modelo, inclusive as que usam as colunas antigas (semana, sábado e domingo).

**Why this priority**: o cadastro em massa é o caminho principal; sem isso a nova semana só existe no formulário.

**Independent Test**: importar a planilha nova com domingo fechado e uma loja 24h, e depois importar uma planilha com as colunas antigas, conferindo os dois resultados.

**Acceptance Scenarios**:

1. **Given** a planilha modelo, **Then** traz as colunas por dia e a coluna de loja 24 horas, com uma linha de exemplo.
2. **Given** uma planilha com a loja 24h marcada, **When** importa, **Then** a loja fica aberta 24 horas nos sete dias.
3. **Given** uma planilha com horário só nos dias úteis, **Then** sábado e domingo ficam fechados.
4. **Given** uma planilha com as colunas antigas (semana, sábado, domingo), **Then** o sistema entende e confirma a correspondência como hoje.
5. **Given** um horário inválido numa linha, **Then** a linha é rejeitada com o motivo e as outras seguem.

---

### User Story 3 - O horário real vale em todo o sistema (Priority: P3)

O diagnóstico, a cobertura por faixa, a verificação das regras, as simulações (grade, cobertura e erros) e o ponto/apuração passam a usar o horário de cada dia: dias fechados não exigem ninguém, domingo e sábado entram quando abertos, e loja 24 horas exige cobertura (inclusive farmacêutico) nas 24 horas. A grade de simulação mostra apenas os dias abertos.

**Why this priority**: é o que faz o cadastro mudar o resultado; depende das duas anteriores.

**Independent Test**: a mesma escala avaliada numa loja aberta de segunda a sexta e noutra aberta também aos domingos: a segunda deve exigir mais horas e mostrar o domingo na grade.

**Acceptance Scenarios**:

1. **Given** uma loja aberta de segunda a domingo, **When** abre o diagnóstico, **Then** a necessidade semanal de horas e turnos conta os sete dias.
2. **Given** um domingo fechado, **Then** nenhum turno nem cobertura é exigido nele.
3. **Given** uma loja 24 horas, **Then** a cobertura por hora vai de 00h a 24h e o farmacêutico é exigido em todas elas.
4. **Given** uma simulação gravada antes da mudança, **Then** continua com o horário que tinha quando foi gravada (premissas congeladas).
5. **Given** o horário da loja muda depois da aprovação, **Then** a simulação em uso é marcada como desatualizada, como já acontece.

---

### Edge Cases

- Loja com todos os dias fechados: o diagnóstico avisa que não há horário de funcionamento.
- Dia aberto 24 horas ao lado de dia com horário normal: cada dia vale por si.
- Abertura 00:00 e fechamento 24:00 equivale a 24 horas.
- Horário que atravessa a meia-noite (ex.: abre 18:00 e fecha 02:00): fora desta entrega; deve ser cadastrado como "24 horas" ou como dois dias (ver Assumptions).
- Feriados e horários especiais por data: fora do escopo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O cadastro de loja MUST permitir, para cada dia de segunda a domingo, marcar aberta ou fechada e informar abertura e fechamento ou 24 horas.
- **FR-002**: O cadastro MUST oferecer o atalho "Loja 24 horas" e o atalho de copiar o horário de um dia para os demais.
- **FR-003**: O sistema MUST validar que, em dia aberto com horário, o fechamento é depois da abertura.
- **FR-004**: A tabela de lojas MUST mostrar um resumo legível do funcionamento da semana.
- **FR-005**: O sistema MUST continuar lendo os horários cadastrados no formato antigo, sem exigir novo cadastro.
- **FR-006**: A planilha modelo MUST trazer horário por dia e a indicação de loja 24 horas, e dia sem horário MUST valer como fechado.
- **FR-007**: A importação MUST entender também planilhas com as colunas antigas e planilhas fora do modelo, com confirmação antes de gravar.
- **FR-008**: O diagnóstico, a cobertura e a verificação de regras MUST usar o horário de cada dia, sem exigir nada em dia fechado.
- **FR-009**: Em loja 24 horas, a cobertura e a exigência de farmacêutico MUST valer nas 24 horas de cada dia.
- **FR-010**: A grade das simulações MUST mostrar só os dias abertos; simulações gravadas MUST manter o horário de quando foram gravadas.
- **FR-011**: A apuração do ponto MUST usar o horário de cada dia.
- **FR-012**: Mudança no horário da loja MUST marcar a simulação em uso como desatualizada, sem alterar nada automaticamente.

### Key Entities

- **Horário da loja**: para cada dia da semana, se está aberta ou fechada e a faixa de funcionamento (abertura e fechamento, ou 24 horas).
- **Loja**: passa a ter o horário da semana inteira e a indicação de loja 24 horas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A pessoa cadastra a semana completa de uma loja em menos de 1 minuto, e em menos de 15 segundos quando a loja é 24 horas.
- **SC-002**: 100% das lojas já cadastradas continuam com o mesmo horário e o mesmo resultado de diagnóstico depois da mudança.
- **SC-003**: Uma loja aberta aos sete dias mostra no diagnóstico a necessidade dos sete dias, conferida contra a conta manual.
- **SC-004**: 0 dias fechados com exigência de cobertura ou turno.
- **SC-005**: Planilhas com as colunas antigas continuam sendo importadas sem ajuste manual.

## Assumptions

- Decision: o horário passa a ser guardado dia a dia (segunda a domingo); o formato antigo é lido e convertido sem exigir recadastro. Why: mantém as lojas existentes funcionando e permite qualquer combinação de dias.
- Decision: "Loja 24 horas" é um atalho que marca os sete dias como aberto 24 horas; cada dia pode depois ser ajustado. Why: cobre loja 24h e também loja que é 24h só em alguns dias.
- Decision: nesta entrega os **turnos continuam dentro do dia** (00:00 a 24:00). Em loja 24 horas, o turno da noite que passa da meia-noite é montado como dois turnos (um até 24:00 e outro a partir de 00:00 do dia seguinte). Why: a grade e as regras de descanso entre jornadas assumem turnos dentro do dia; atravessar a meia-noite é uma mudança maior, tratada à parte se o negócio pedir.
- Decision: fuso e horário de verão não entram; vale o horário de parede da loja.
- Fora do escopo: feriados, horários especiais por data, turno que atravessa a meia-noite como uma peça só.
- Dependência: cadastros, diagnóstico, simulações e ponto já existentes (specs 001 a 003).
