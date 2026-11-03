# Feature Specification: Clareza dos cenários do Diagnóstico

**Feature Branch**: `feat/clareza-dos-cenarios`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "Clareza dos cenários do Diagnóstico da escala: nomes fixos com premissa fixa no subtítulo e uma linha de resultado variável por loja; linha de consequência em amarelo quando falta cobertura; regras de aparecimento dos cenários; selo 'Menor custo'; comparação com o Cenário 1; chip '(opcional)'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entender o que cada cenário faz, sem contradição (Priority: P1)

O dono ou gerente abre o Diagnóstico de uma loja (ex.: Sumaré, que não precisa contratar farmacêutico) e lê os três cenários. Cada card traz o nome de sempre, uma **premissa** que nunca muda e uma **linha de resultado** que diz o que acontece naquela loja. Hoje o Cenário 2 diz "Reduzir o fim de semana para manter a equipe atual" mesmo quando nenhum horário muda.

**Why this priority**: É o problema relatado: o texto do cenário contradiz a análise e faz o leitor desconfiar do resultado.

**Independent Test**: Abrir Sumaré e conferir que o Cenário 2 mostra a premissa "Não contratar; ajustar horários só se precisar" e o resultado "Nenhum horário precisa mudar", sem a palavra "reduzir".

**Acceptance Scenarios**:

1. **Given** qualquer loja, **When** o Diagnóstico mostra os cenários, **Then** os nomes são sempre "Manter horários", "Foco em economia" e "Equilíbrio", e a premissa de cada um é sempre a mesma: contratar para cobrir a escala nos horários de hoje; não contratar e ajustar horários só se precisar; a melhor combinação dos dois.
2. **Given** uma loja em que o Cenário 2 não muda horário, **When** o card aparece, **Then** a linha de resultado diz que nenhum horário precisa mudar e nada fala em reduzir ou fechar.
3. **Given** uma loja em que o Cenário 2 fecha ou encurta um dia, **When** o card aparece, **Then** a linha de resultado diz qual dia muda, com o horário de antes e o de depois.
4. **Given** o Cenário 1, **When** o card aparece, **Then** o resultado lista o que contrata (ex.: "1 atendente e 1 apoio"); as vagas que existem só para manter o nível de hoje, sem exigência legal, aparecem marcadas como "(opcional)".

---

### User Story 2 - Ver o que se perde ao escolher não contratar (Priority: P1)

Ao olhar o Cenário 2, o leitor precisa ver na hora o que acontece com a cobertura. Uma linha em amarelo mostra a consequência, conforme o caso:

- Se o cenário **reduz horários**: a venda e a margem que deixam de entrar (valores que o sistema já calcula).
- Se **não reduz horários**, mas deixa uma função abaixo do nível de hoje: a falta em horas por função (ex.: "Atendimento 32 h por semana abaixo do nível de hoje · Apoio 4 h"), com a explicação de que a loja segue atendida pelo restante da equipe e **sem** falar de venda perdida.
- Só há alerta de risco para a venda quando o **farmacêutico fica ausente**: o total de horas abertas sem farmacêutico.

**Why this priority**: Sem isso o "R$ 0" do Cenário 2 parece o melhor resultado sem ressalva.

**Independent Test**: Em Sumaré, o Cenário 2 mostra a linha amarela com a falta de atendimento e apoio por semana e nenhuma menção a venda perdida.

**Acceptance Scenarios**:

1. **Given** um cenário que deixa função abaixo do nível de hoje e não muda horário, **When** o card aparece, **Then** a linha amarela mostra as horas faltantes por função e não mostra venda perdida.
2. **Given** um cenário que reduz horários, **When** o card aparece, **Then** a linha amarela mostra a venda e a margem perdidas.
3. **Given** um cenário em que nenhuma função fica abaixo do nível de hoje, **When** o card aparece, **Then** a linha amarela não aparece.
4. **Given** um cenário que deixa horas abertas sem farmacêutico, **When** o card aparece, **Then** a linha amarela diz quantas horas por semana isso acontece; com 0 h, não menciona risco.

---

### User Story 3 - Só mostrar o que acrescenta informação (Priority: P2)

O Diagnóstico não repete cenários iguais nem aponta como "sugerido" um cenário que deixa a loja abaixo do nível de hoje.

**Why this priority**: Reduz ruído; hoje o Cenário 3 aparece como cópia do 1 com um aviso confuso.

**Independent Test**: Em uma loja em que o Cenário 3 coincide com o 1, o Cenário 3 aparece recolhido com "Mesmo resultado do Cenário 1".

**Acceptance Scenarios**:

1. **Given** uma loja que já cobre todos os dias e o Cenário 1 não contrata nada, **When** o Diagnóstico abre, **Then** em vez dos três cards aparece uma frase única dizendo que a equipe atual cobre tudo e não há o que contratar nem reduzir.
2. **Given** um Cenário 3 com o mesmo resultado do 1 ou do 2, **When** o Diagnóstico abre, **Then** o 3 aparece recolhido com "Mesmo resultado do Cenário 1" (ou "2").
3. **Given** que o Cenário 2 é o de menor custo, **When** deixa uma função abaixo do nível de hoje, **Then** ele recebe o selo "Menor custo" e **não** recebe o selo "Cenário sugerido".
4. **Given** o Cenário 2 com impacto menor que o do Cenário 1, **When** o card aparece, **Then** a comparação diz o valor economizado e o que se perde em troca (ex.: "R$ 3.592 a menos por mês que o Cenário 1, com 32 h de atendimento a menos").

---

### Edge Cases

- Loja sem custos informados (só gerente, sem valores em R$): a linha de consequência mostra apenas horas; a comparação em reais não aparece.
- Loja sem escala importada: as regras valem sobre o quadro do Cadastro, como hoje.
- Cenário 2 que "não resolve sozinho" (obrigação legal): mantém o status atual e a linha amarela mostra a falta que sobra.
- Todos os cenários inviáveis ou indisponíveis: mantêm as mensagens atuais.
- Os três cenários diferentes entre si: nada é recolhido.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Os cenários 1, 2 e 3 MUST manter os nomes "Manter horários", "Foco em economia" e "Equilíbrio" em toda loja.
- **FR-002**: Cada card MUST mostrar uma premissa fixa, igual em todas as lojas, e uma linha de resultado que depende da loja.
- **FR-003**: A linha de resultado do Cenário 2 MUST dizer "Nenhum horário precisa mudar" quando não há ajuste de horário, e MUST descrever os dias alterados quando há.
- **FR-004**: O sistema MUST mostrar uma linha em amarelo quando o cenário reduz horários (venda e margem perdidas) ou deixa função abaixo do nível de hoje (horas faltantes por função), e MUST omiti-la quando não há falta.
- **FR-005**: Em cenário que não reduz horários, a linha de consequência MUST NOT apresentar valor de venda perdida.
- **FR-006**: O sistema MUST informar as horas semanais com a loja aberta sem farmacêutico quando houver, e MUST tratar só isso como risco para a venda.
- **FR-007**: Os cenários 2 e 3 MUST ser exibidos conforme as regras: frase única quando a loja cobre tudo; Cenário 3 recolhido com "Mesmo resultado do Cenário X" quando coincide; os dois cards separados nos demais casos.
- **FR-008**: O selo "Menor impacto mensal" MUST passar a "Menor custo", e o selo "Cenário sugerido" MUST NOT ir para um cenário que deixa função abaixo do nível de hoje.
- **FR-009**: A comparação de um cenário com o Cenário 1 MUST mostrar o valor economizado ou acrescido e, quando houver, a falta de cobertura que acompanha a economia.
- **FR-010**: As contratações que existem só para manter o nível de hoje MUST aparecer marcadas "(opcional)", no lugar de "(meta)".
- **FR-011**: Valores em R$ MUST continuar visíveis apenas para o dono.

### Key Entities

- **Cenário**: nome fixo, premissa fixa, resultado, consequência (horas faltantes por função, horas sem farmacêutico, venda e margem perdidas), selos e comparação com o Cenário 1.
- **Falta de cobertura**: horas por semana abaixo do nível de hoje, por função, com a indicação de que é meta e não exigência legal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em nenhuma loja o texto de um cenário contradiz o resultado exibido (o Cenário 2 sem ajuste nunca fala em reduzir).
- **SC-002**: Em Sumaré, o leitor identifica em uma única olhada, no card do Cenário 2, o que se perde ao não contratar (horas faltantes por função).
- **SC-003**: Nenhum cenário idêntico a outro aparece como card completo.
- **SC-004**: Nenhum cenário que deixa função abaixo do nível de hoje recebe o selo "Cenário sugerido".
- **SC-005**: Os valores de venda e margem perdidas só aparecem em cenários que reduzem horários.

## Assumptions

- Business: o farmacêutico também atende no balcão; por isso a venda só é considerada em risco nas faixas sem farmacêutico (confirmado pela pessoa que pediu).
- Business: o selo "Cenário sugerido" vai para o Cenário 1 quando o Cenário 2 deixa função abaixo do nível de hoje; se nenhum cenário estiver nessa condição, segue a regra atual (menor custo). Decisão tomada porque a regra do limite de falta não foi definida; fica simples e revisável.
- Business: o marcador das contratações de nível de hoje será "(opcional)".
- Decision: a mudança é de texto e de regras de exibição; nenhum dado novo é guardado. Why: tudo parte do diagnóstico e dos cenários que o sistema já calcula.
- Decision: as horas sem farmacêutico de cada cenário devem refletir os ajustes de horário daquele cenário; se o cálculo atual só traz o valor de hoje, o plano inclui recalculá-lo. Why: um número de hoje no card de um cenário enganaria.
- Fora do escopo: mudar a conta de venda perdida, criar conta de venda perdida por falta de atendimento, mudar os cenários 4 e 5, mudar o quadro de diagnóstico.
