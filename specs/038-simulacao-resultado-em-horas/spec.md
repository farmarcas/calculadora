# Feature Specification: Resultado da simulação em horas e porcentagem, sem valores em reais

**Feature Branch**: `feat/simulacao-resultado-em-horas`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Na parte de simulação do cenário, o card 'Resultado da simulação' também foca nos valores em reais. Quero ele focado somente em horas e em aumento e redução em porcentagem. Mistura da opção B (números grandes em % e tabela Hoje × Simulação) com o melhor da A (status, faixa dos 7 dias, contratar e causa)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O resultado em % e em horas, sem reais (Priority: P1)

O card "Resultado da simulação" deixa de mostrar o saldo por mês, a folha extra, a hora extra em reais, a margem que deixa de entrar, a margem estimada, a economia de folha e a explicação de CMV. No lugar, mostra dois números grandes em %, **Venda** e **Custo de pessoal** (variação em relação a hoje, com seta e sinal), e uma tabela **Hoje × Simulação × Mudança** com horas abertas, pessoas, horas contratadas e hora extra em horas.

**Why this priority**: É o pedido central: o empresário lê o efeito da simulação em horas e em porcentagem, como já ocorre nas linhas de cenário.

**Independent Test**: Montar uma simulação que contrata 2 pessoas sem mudar o horário e ver Venda "● 0%", Custo de pessoal "▲ +x%" e a tabela com horas abertas iguais, pessoas e horas contratadas maiores, sem nenhum "R$" no card.

**Acceptance Scenarios**:

1. **Given** uma simulação aberta por qualquer perfil, **When** o card é visto, **Then** não há nenhum valor em reais, nem saldo, folha, margem, economia ou explicação de CMV.
2. **Given** uma simulação que contrata, **When** o card é visto, **Then** o custo de pessoal mostra a variação em % contra a folha de hoje, com seta e sinal (▲ +7,2%).
3. **Given** uma simulação que muda o horário, **When** o card é visto, **Then** a venda mostra a variação em % contra a venda de hoje (▼ −2,9% ou ▲ +1,7%), vermelha para baixo e verde para cima.
4. **Given** a tabela, **When** é vista, **Then** traz para Horas abertas, Pessoas, Horas contratadas e Hora extra os valores de hoje, os da simulação e a mudança (por exemplo "99h · 90h · −9h"), e "não precisa" quando a hora extra é zero.

---

### User Story 2 - O horário da simulação em horas, com os 7 dias (Priority: P1)

O card mostra o total de horas por semana da simulação, a mudança em horas (verde se aumenta, vermelha se reduz, "sem mudança" se igual) e a faixa dos 7 dias com as horas abertas de cada um: cinza sem mudança, verde se aumenta, rosa se reduz, e rosa com "Fechado" e as horas perdidas se o dia fecha. Nunca um traço.

**Why this priority**: O horário é o foco; a faixa mostra onde a simulação mexe.

**Independent Test**: Reduzir o sábado e fechar o domingo e ver "Sáb 10h −2h" e "Dom Fechado −12h" em rosa, com o total "(−14h)".

**Acceptance Scenarios**:

1. **Given** um horário igual ao de hoje, **When** o card é visto, **Then** a faixa mostra as horas dos 7 dias em cinza e o total diz "sem mudança".
2. **Given** dias que aumentam, reduzem ou fecham, **When** o card é visto, **Then** cada um aparece com a cor e a diferença combinadas.

---

### User Story 3 - Status e causa em poucas palavras (Priority: P1)

O card mostra uma pill de status (a primeira que se aplica: Inviável, Não resolve sozinho, Não recomendado, Vende mais, Perde venda, Equipe menor que hoje ou Cobre o horário) e, quando há consequência, uma faixa amarela de uma linha com a causa (por exemplo "Faltam 6 h de farmacêutico.", "Sem venda por hora: perda não estimada.", "Venda das horas novas é estimada.").

**Why this priority**: É a leitura rápida do resultado, igual à das linhas de cenário.

**Independent Test**: Simular um horário sem farmacêutico em algumas horas e ver a pill e a faixa amarela com as horas que faltam.

**Acceptance Scenarios**:

1. **Given** uma simulação que perde venda, **When** o card é visto, **Then** a pill diz "Perde venda".
2. **Given** uma simulação sem venda por hora, **When** o card é visto, **Then** a Venda mostra "Não estimada" e a faixa amarela explica.

---

### User Story 4 - O que contratar, com as horas do parcial (Priority: P2)

O card lista, por função, o que a simulação contrata: "1 atendente", "2 caixas" e, para o contrato parcial, "1 farmacêutico · parcial de 20h", deixando claro quantas horas ele tem. Sem contratação: "Nenhuma contratação".

**Why this priority**: Responde "quem eu preciso contratar", com as horas do parcial que a decisão do produto exige.

**Independent Test**: Simular um farmacêutico parcial de 20h e ver "1 farmacêutico · parcial de 20h".

**Acceptance Scenarios**:

1. **Given** vagas inteiras e parciais, **When** o card é visto, **Then** cada vaga aparece por função, e a parcial mostra as horas semanais.
2. **Given** nenhuma vaga, **When** o card é visto, **Then** diz "Nenhuma contratação".

---

### User Story 5 - Iguais para dono, gestor e consulta (Priority: P2)

Como não há reais, o card é igual para dono, gestor e consulta. O dono continua vendo os valores em reais **só na comparação de simulações salvas**. O botão "Salvar como cenário N" e o texto de apoio continuam como hoje.

**Why this priority**: Garante que a mudança não abra nem feche informação além do desenhado.

**Independent Test**: Abrir a mesma simulação como dono, gestor e consulta e comparar o card.

**Acceptance Scenarios**:

1. **Given** a mesma simulação, **When** dono, gestor e consulta abrem o card, **Then** os números e textos são os mesmos.
2. **Given** a comparação de simulações salvas, **When** o dono a abre, **Then** os valores em reais continuam lá, como hoje.

---

### User Story 6 - Estados sem dado e em cálculo (Priority: P3)

Enquanto a simulação calcula, os números mostram o indicador de carregamento de hoje. Sem venda por hora, a Venda diz "Não estimada". Sem salários informados, o Custo de pessoal mostra "—" com a frase "Informe os salários para ver a variação do custo.".

**Why this priority**: Evita números vazios sem explicação.

**Independent Test**: Abrir uma simulação de uma loja sem salários e ver "—" e a frase.

**Acceptance Scenarios**:

1. **Given** uma loja sem salários, **When** o card é visto, **Then** o custo mostra "—" e a frase pedindo os salários.
2. **Given** a simulação calculando, **When** o card é visto, **Then** mostra o carregamento.

---

### Edge Cases

- Simulação sem alterações: pill "Cobre o horário" (ou o status que valer), venda "● 0%", custo "● 0%" e tabela sem mudança.
- Pessoa desligada na simulação: conta como saída em Pessoas e em Horas contratadas.
- Loja sem base comercial: a Venda diz "Não estimada" e a faixa amarela explica.
- Tela estreita (celular): o card empilha as informações, sem rolar para o lado.
- Simulação já gravada: o card é recalculado como hoje, na régua atual da loja.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O card MUST NOT mostrar nenhum valor em reais, saldo, folha extra, margem, economia nem explicação de CMV, para nenhum perfil.
- **FR-002**: O card MUST mostrar a variação em % da Venda e do Custo de pessoal em relação a hoje, com seta e sinal, nas cores combinadas (venda para cima verde e para baixo vermelha; custo para cima neutro e para baixo verde), e "—" ou "Não estimada" quando não houver cálculo.
- **FR-003**: O card MUST mostrar a tabela Hoje × Simulação × Mudança de horas abertas, pessoas, horas contratadas e hora extra em horas.
- **FR-004**: O card MUST mostrar o total de horas por semana, a mudança em horas e a faixa dos 7 dias com as horas abertas de cada dia, nunca um traço.
- **FR-005**: O card MUST mostrar uma pill de status pela prioridade combinada e, quando houver consequência, uma faixa amarela de uma linha com a causa.
- **FR-006**: O card MUST listar o que a simulação contrata por função, com as horas semanais do contrato parcial.
- **FR-007**: O card MUST ser igual para dono, gestor e consulta; nenhuma variação em % pode revelar valores em reais.
- **FR-008**: O sistema MUST manter o botão "Salvar como cenário N", o texto de apoio e o comportamento de salvar e clonar como hoje.
- **FR-009**: O sistema MUST manter os valores em reais da comparação de simulações salvas, só para o dono.
- **FR-010**: O sistema MUST usar textos em português, curtos, sem jargão, sem a sigla CMV, com o sinal "−" tipográfico e horas como "99h" e "+2".
- **FR-011**: O sistema MUST usar só cores do Design System e MUST empilhar o card em tela estreita.
- **FR-012**: O cálculo da simulação (cobertura, horário, vagas, hora extra, saldo) MUST NOT mudar: só a forma de mostrar.

### Key Entities

- **Resultado da simulação (card)**: variação de venda e de custo de pessoal em %, tabela de horas e pessoas, horário por dia, status, causa e o que contratar.
- **Variação em %**: mudança da venda e do custo de pessoal da simulação contra a venda e o custo de pessoal de hoje.
- **Pessoas e horas contratadas**: pessoas e horas semanais do quadro de hoje e do quadro da simulação (com as vagas simuladas e sem os desligados).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhum "R$" aparece no card em qualquer perfil e estado.
- **SC-002**: Dono, gestor e consulta veem os mesmos números e textos no card da mesma simulação.
- **SC-003**: A faixa dos 7 dias mostra as horas de todos os dias, sem nenhum traço.
- **SC-004**: Toda variação mostrada tem seta e sinal, e os casos sem cálculo mostram "—" ou "Não estimada".
- **SC-005**: Uma pessoa lê em até 5 segundos o que a simulação muda no horário, na venda e no custo de pessoal.

## Assumptions

- Decision: a base dos % é a venda e o custo de pessoal de hoje (o horário do Cadastro e o quadro atual), a mesma das linhas de cenário. Why: manter a mesma leitura nos dois lugares.
- Decision: "Pessoas" e "Horas contratadas" de hoje são as do quadro do Cadastro (sem vagas); as da simulação incluem as vagas simuladas e excluem os desligados. Why: é o que a simulação já considera como equipe.
- Decision: "Hora extra" mostra as horas por semana que ainda faltam cobrir com hora extra; zero vira "não precisa". Why: a simulação já calcula essas horas para chegar ao custo.
- Decision: o card mostra as horas do contrato parcial ("parcial de 20h"). Why: é a decisão do produto; as linhas de cenário seguem como estão nesta entrega.
- Decision: a faixa dos 7 dias, a pill e a faixa amarela reaproveitam o desenho e as regras das linhas de cenário. Why: um só visual para o mesmo conceito.
- Decision: esta entrega depende da spec 037 (cenários em linhas) e deve entrar depois dela. Why: reaproveita as regras e os componentes dela.
- Fora do escopo: a comparação de simulações salvas, a lista de simulações, os passos de horário e de contratações da Simulação, e as linhas de cenário.
