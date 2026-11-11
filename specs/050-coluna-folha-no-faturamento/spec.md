# Feature Specification: Coluna "Folha no faturamento" dos cenários (layout A3)

**Feature Branch**: `feat/coluna-folha-no-faturamento`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: No card "Cenários" (tabela em linhas), a coluna do custo de pessoal passa a mostrar o peso da folha no faturamento, no layout A3 do board "Cenários · coluna Folha no faturamento · versão A3 (escolhida)". Substitui o "+X% sobre a folha" da spec 037. A conta já existe (spec 048); aqui é apresentação e texto: cabeçalho, grade, célula do dono em três estados (aumenta, diminui, igual), chip só para gestor e consulta, estados sem dados, texto de abertura do card, acessibilidade e testes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O dono lê o peso da folha em uma célula só (Priority: P1)

Na coluna **"Folha no faturamento"** de cada cenário, o dono vê:

- à esquerda, o **peso depois do cenário** em destaque (20 px, negrito), com "do faturamento" embaixo em tamanho pequeno;
- à direita, empilhados, "**hoje 8,0%**" e, embaixo, o **chip da variação**;
- na última linha, em texto pequeno, os **reais por mês**.

**Why this priority**: É o número que o dono usa para decidir, e a coluna atual quebra em cinco linhas.

**Independent Test**: Em Cosmópolis, "Manter horários" mostra "9,7%" em destaque, "hoje 8,0%", o chip "+1,7%" e "R$ 7.659 a mais por mês".

**Acceptance Scenarios**:

1. **Given** um cenário que aumenta a folha, **When** o dono vê a célula, **Then** aparece o chip âmbar "+1,7%" e "R$ 7.659 a mais por mês".
2. **Given** um cenário que diminui a folha, **When** o dono vê a célula, **Then** aparece o chip verde "−0,6%" e "R$ 2.340 a menos por mês", com o sinal "−" (U+2212).
3. **Given** um cenário sem custo adicional (por exemplo, Sem contratações), **When** o dono vê a célula, **Then** aparece o chip neutro com borda "folha igual" e o texto "Sobe só porque a venda cai." no lugar dos reais; nunca aparece "+0,2 p.p. (R$ 0/mês)".
4. **Given** qualquer chip do dono, **When** ele é lido, **Then** o valor é a diferença entre o peso depois e o peso hoje, **já arredondados a uma casa**, mostrada em "%": 9,7 − 8,0 = +1,7%; a interface não escreve "p.p." nem "pontos".

---

### User Story 2 - Gestor e consulta veem só um chip (Priority: P1)

Para gestor e consulta, a coluna se chama **"Custo de pessoal"** e mostra só um chip: "Aumenta" (âmbar), "Igual" (neutro com borda) ou "Diminui" (verde). A classificação vem pronta do servidor, e a resposta da API deles **não traz nenhum campo de custo, folha, faturamento, % nem R$**.

**Why this priority**: Custo e faturamento são do dono.

**Independent Test**: Como gestor, os três casos mostram só os chips, e a resposta da API não contém campos de custo.

**Acceptance Scenarios**:

1. **Given** o perfil gestor ou consulta, **When** a coluna é vista, **Then** o cabeçalho é "Custo de pessoal" e a célula tem só o chip.
2. **Given** a resposta da API desses perfis, **When** é lida, **Then** não há `custoPct`, `custoPctFaturamento`, folha nem faturamento.

---

### User Story 3 - Dados que faltam (Priority: P2)

Quando faltam dados, a célula inteira vira uma frase em texto secundário de 13 px, sem números:

- dono, sem salários: "Informe os salários para ver o custo de pessoal.";
- dono, sem faturamento: "Informe o faturamento para ver o peso da folha.";
- gestor e consulta, com qualquer dado faltando: "Dados do custo ainda não informados.".

**Why this priority**: Evita número errado ou célula vazia.

**Independent Test**: Uma loja sem salários e outra sem faturamento mostram as frases certas, sem números.

**Acceptance Scenarios**:

1. **Given** uma loja sem salários, **When** o dono vê a célula, **Then** aparece a frase dos salários e nenhum número.
2. **Given** uma loja sem faturamento, **When** o dono vê a célula, **Then** aparece a frase do faturamento e nenhum número.
3. **Given** a mesma situação, **When** gestor ou consulta vê a célula, **Then** aparece "Dados do custo ainda não informados.".

---

### User Story 4 - A tabela cabe sem quebrar (Priority: P2)

A grade tem as colunas **Cenário 200px | Contratar 1fr | Horário 1,25fr | Venda 84px | Folha 200px | botão 120px**, com espaço de 16px. A altura da linha é definida pelo Horário, e a coluna da folha **nunca passa de 3 linhas** em 1236px de largura.

**Why this priority**: Hoje a coluna da folha quebra e estica a linha.

**Independent Test**: Em 1236px, a célula do dono mais alta tem no máximo 3 linhas e a linha tem a altura do Horário.

**Acceptance Scenarios**:

1. **Given** a largura de 1236px, **When** os cenários são vistos, **Then** a coluna da folha tem no máximo 3 linhas.
2. **Given** a coluna da folha, **When** o texto é longo, **Then** ele não aumenta a altura da linha além da do Horário.

---

### User Story 5 - Texto de abertura do card (Priority: P3)

O texto de abertura passa a ser: "Estimativas para a regra de 42h, com o quadro, os salários e a base comercial importados. Compare cada cenário com o horário e a folha de hoje. Nada altera o cadastro." (com o nome da regra do cenário no lugar de "42h"). A regra de "50% da margem da hora vizinha" sai da descrição e vai para o "Como calculamos".

**Why this priority**: O texto antigo fala de "% sobre a folha" e da regra dos 50% que não é do cartão.

**Independent Test**: Ler o texto de abertura no Diagnóstico.

**Acceptance Scenarios**:

1. **Given** o card "Cenários", **When** o texto de abertura é lido, **Then** é o novo, e não cita 50% nem margem da hora vizinha.

---

### Edge Cases

- Cenário indisponível: continua mostrando a frase de indisponível, como hoje.
- Pesos que arredondam para o mesmo valor, com custo em R$ diferente de zero: o chip mostra "+0,0%" ou "−0,0%" conforme o sinal do custo; o estado (aumenta ou diminui) vem do R$, não da diferença arredondada.
- Valores em reais com ponto de milhar (R$ 11.112); percentuais com vírgula e uma casa.
- Visão de grupo fica de fora.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O cabeçalho da coluna DEVE ser "Folha no faturamento" para o dono e "Custo de pessoal" para gestor e consulta.
- **FR-002**: A célula do dono DEVE seguir o layout A3: peso depois (20 px, negrito) com "do faturamento" embaixo; à direita "hoje X,X%" e o chip; na última linha, reais por mês ou o texto de "folha igual".
- **FR-003**: O estado do dono DEVE vir do custo em R$: maior que zero, chip âmbar "+X,X%" e "R$ N a mais por mês"; menor que zero, chip verde "−X,X%" e "R$ N a menos por mês"; zero, chip neutro com borda "folha igual" e "Sobe só porque a venda cai.".
- **FR-004**: O valor do chip DEVE ser o peso depois menos o peso hoje, **ambos arredondados a uma casa antes da conta**, exibido em "%"; a interface NÃO DEVE escrever "p.p." nem "pontos".
- **FR-005**: Gestor e consulta DEVEM ver só um chip: "Aumenta", "Igual" ou "Diminui"; a API deles NÃO DEVE conter campos de custo, folha, faturamento, % nem R$.
- **FR-006**: Sem salários ou sem faturamento, a célula DEVE mostrar a frase certa (dono) ou "Dados do custo ainda não informados." (gestor e consulta), em 13 px secundário, sem números.
- **FR-007**: A grade DEVE ter as colunas 200px, 1fr, 1,25fr, 84px, 200px e 120px, com espaço de 16px; a altura da linha vem do Horário; a coluna da folha NÃO DEVE passar de 3 linhas em 1236px.
- **FR-008**: O texto de abertura do card DEVE ser o novo, e a regra de 50% da margem da hora vizinha DEVE ir para o "Como calculamos".
- **FR-009**: A cor NUNCA DEVE ser a única informação: o chip traz sinal ou texto; cada chip DEVE ter `aria-label` completo (por exemplo, "Folha sobe 1,7 ponto percentual, de 8,0% para 9,7% do faturamento"); o contraste de texto pequeno sobre âmbar e verde DEVE ser pelo menos AA.
- **FR-010**: Usar só tokens e componentes do Alquimia; as cores âmbar e verde do chip entram como tokens novos (`#B45F00` e `#3E7500`) por não existirem no DS.
- **FR-011**: Os textos DEVEM estar em português do Brasil, simples, sem emoji, só a primeira letra maiúscula.

### Key Entities

- **Chip de variação**: rótulo curto com o sentido da mudança da folha (aumenta, igual ou diminui) e, para o dono, a diferença entre os pesos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cosmópolis, Manter horários: "9,7%", "hoje 8,0%", chip "+1,7%" e "R$ 7.659 a mais por mês".
- **SC-002**: Cosmópolis, Sem contratações: peso 8,2%, chip "folha igual" e "Sobe só porque a venda cai.".
- **SC-003**: Um cenário que reduz equipe: 7,4%, chip "−0,6%" e "R$ 2.340 a menos por mês".
- **SC-004**: Paulínia, Manter horários: "14,7%", chip "+4,4%" e "R$ 11.112 a mais por mês".
- **SC-005**: Gestor: só os três chips, e a API sem nenhum campo de custo, folha ou faturamento.
- **SC-006**: Em 1236px, a coluna da folha tem no máximo 3 linhas.
- **SC-007**: A conta do chip bate com os pesos exibidos em 100% dos casos.

## Assumptions

- **Substitui a apresentação da spec 048**: a conta e os campos (`custoPctFaturamento`, `custoSentido`) continuam; o que muda é o `aumentoPp`, que passa a ser a diferença dos pesos já arredondados, e a tela, que deixa de escrever "p.p.".
- **Botão**: o botão do cenário se chama "Analisar" (renomeado antes); o board mostra "Personalizar" em alguns exemplos antigos e isso não é seguido.
- **Cores**: âmbar e verde do chip entram como tokens locais do Radar, por não existirem no DS (nota do board).
- **Frases**: "Dados do custo ainda não informados." vale para gestor e consulta; as frases do dono vêm do pedido.
- **Decisão técnica**: o servidor entrega a variação já calculada sobre os pesos arredondados e a classificação; a tela só formata. Por quê: a conta do chip fica igual à que está na tela e quem não é dono não recebe número.
