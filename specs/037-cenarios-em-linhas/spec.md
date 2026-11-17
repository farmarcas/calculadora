# Feature Specification: Cenários em linhas, sem valores em reais

**Feature Branch**: `feat/cenarios-em-linhas`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Refatorar os cards de cenário em uma lista em linhas, sem nenhum valor em R$. O foco passa a ser horário e pessoas a contratar; o impacto aparece só como variação em %. Board: 'Cenários em linhas · todos os estados, sem R$'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Os três cenários em linhas, sem reais (Priority: P1)

Em vez de três cartões lado a lado, os cenários aparecem como uma tabela de linhas, uma por cenário (Equilíbrio, Manter horários, Sem contratações), com as colunas **Cenário, Contratar, Horário, Venda, Custo de pessoal** e o botão **Personalizar**. Nenhum valor em reais aparece nas linhas: saldo da operação por mês, custo de folha, margem estimada, margem que deixa de entrar e a explicação de CMV saem de todos os cenários.

**Why this priority**: É o pedido central: o empresário bate o olho e entende "quem contratar, em que horário, e o que isso faz com a venda e com o custo de pessoal", sem números em reais para interpretar.

**Independent Test**: Abrir os cenários de uma loja e ver três linhas na ordem Equilíbrio, Manter horários, Sem contratações, cada uma com as cinco colunas e o botão Personalizar, sem nenhum "R$" na área dos cenários.

**Acceptance Scenarios**:

1. **Given** uma loja com cenários calculados, **When** a tela abre, **Then** aparece uma linha por cenário, na ordem Equilíbrio, Manter horários, Sem contratações, com cenário (selo, nome e status), contratar, horário, venda, custo de pessoal e o botão.
2. **Given** qualquer cenário e qualquer perfil, **When** a linha é vista, **Then** não há nenhum valor em reais, nem saldo, folha, margem ou explicação de CMV.
3. **Given** a coluna Contratar, **When** o cenário pede gente, **Then** diz "1 farmacêutico · parcial", "1 atendente · parcial" ou, sem contratação, "Nenhuma contratação".
4. **Given** o botão "Salvar como cenário" e o "Personalizar" que já existem, **When** a tela muda, **Then** ambos continuam funcionando como hoje.

---

### User Story 2 - A faixa dos 7 dias mostra sempre as horas abertas (Priority: P1)

Na coluna Horário, cada linha traz o total semanal ("94h por semana", com "(+9h)" em verde ou "(−9h)" em vermelho quando muda, ou "sem mudança") e, abaixo, a faixa dos 7 dias. Cada dia mostra as horas abertas, nunca um traço: sem mudança (fundo cinza, "Seg 14h"), aumento (fundo verde, novo total e a diferença, "Sáb 19h +5h"), redução (fundo rosa, "Sáb 9h −5h") e dia fechado (fundo rosa, "Fechado" e as horas perdidas, "−14h"). A faixa aparece em todas as linhas, inclusive nas "sem mudança".

**Why this priority**: O horário é o foco da tela; sem a faixa o empresário não vê o que muda em cada dia.

**Independent Test**: Num cenário que reduz o sábado, ver "Sáb 9h −5h" em rosa; num que fecha um dia, "Fechado −14h"; numa linha sem mudança, as sete horas abertas em cinza.

**Acceptance Scenarios**:

1. **Given** um dia sem mudança, **When** a faixa é vista, **Then** mostra o nome do dia e as horas abertas com fundo cinza.
2. **Given** um dia que aumenta ou reduz, **When** a faixa é vista, **Then** mostra o novo total em negrito e a diferença embaixo, em verde (aumento) ou rosa (redução).
3. **Given** um dia fechado pelo cenário, **When** a faixa é vista, **Then** mostra "Fechado" e as horas perdidas, em rosa.
4. **Given** o cenário Manter horários, **When** a linha é vista, **Then** a faixa dos 7 dias aparece com as horas abertas e diz "sem mudança".

---

### User Story 3 - O status certo, em poucas palavras, e a causa em uma linha (Priority: P1)

Cada cenário tem uma pill de status de até 3 palavras, com ícone, e vale a primeira que se aplica: **Inviável** (vermelho: sem farmacêutico no quadro, só em Sem contratações), **Não resolve sozinho** (vermelho: a equipe não cobre mesmo cortando o fim de semana, só em Sem contratações), **Não recomendado** (vermelho: só cabe fechando um dos 3 dias de maior faturamento), **Vende mais** (verde: abre horas novas sem perder venda), **Perde venda** (amarelo), **Equipe menor que hoje** (amarelo: falta gente em alguma função, sem perda de venda) e **Cobre o horário** (verde: nenhuma das anteriores). Quando há consequência, uma faixa amarela de uma linha, na largura da linha, diz a causa: "Faltam X h de farmacêutico.", "Sem farmacêutico no quadro.", "Só cabe fechando um dos 3 melhores dias.", "Atendente: 1 pessoa a menos que hoje.", "Sem venda por hora: perda não estimada." ou "Venda das horas novas é estimada.". A nota cinza abaixo da linha deixa de existir.

**Why this priority**: O status é o que o empresário lê primeiro; a causa em uma linha evita ter de interpretar números.

**Independent Test**: Montar uma loja que cai em cada estado e ver a pill e a faixa amarela esperadas, uma pill por linha, sem quebra de linha.

**Acceptance Scenarios**:

1. **Given** vários status possíveis ao mesmo tempo, **When** a pill é escolhida, **Then** vale o primeiro da lista de prioridade.
2. **Given** um status com consequência, **When** a linha é vista, **Then** a faixa amarela traz a frase correspondente; sem consequência, não há faixa.
3. **Given** qualquer pill, **When** é vista, **Then** tem no máximo 3 palavras, ícone junto do texto e não quebra linha; nada depende só da cor.

---

### User Story 4 - Visual por estado da linha (Priority: P2)

A linha **sugerida** (só para o dono) tem fundo azul-claro, barra azul à esquerda e o botão Personalizar preenchido, com o selo "CENÁRIO SUGERIDO". As **alternativas** têm fundo branco, botão com contorno azul e o selo "ALTERNATIVA". As linhas **rebaixadas** (Inviável, Não resolve sozinho, Não recomendado) têm fundo cinza, barra vermelha mais larga à esquerda, pill vermelha com texto branco e botão neutro. A linha **indisponível** fica cinza, com o botão desabilitado e um texto dizendo o que falta.

**Why this priority**: O visual ajuda a escolher sem ler tudo, mas depende das linhas e do status estarem prontos.

**Independent Test**: Ver o dono com um sugerido, o gestor com tudo como alternativa e uma linha rebaixada e uma indisponível, cada uma com o visual descrito.

**Acceptance Scenarios**:

1. **Given** o dono com um cenário sugerido, **When** a tela abre, **Then** essa linha tem o visual azul e as outras o visual de alternativa ou rebaixada.
2. **Given** um cenário rebaixado, **When** a linha é vista, **Then** tem fundo cinza, barra vermelha, pill vermelha e botão neutro.
3. **Given** um cenário indisponível, **When** a linha é vista, **Then** o botão está desabilitado e o texto explica: para o dono "Informe as vendas por dia ou por hora e os salários para calcular este cenário."; para gestor e consulta "O dono ainda não informou os custos."

---

### User Story 5 - Variação de venda e de custo de pessoal só em % (Priority: P2)

As colunas **Venda** e **Custo de pessoal** mostram só a variação em %, sempre com seta e sinal: ▲ +1,7%, ▼ −9,7%, ● 0%. Venda para cima é verde e para baixo é vermelha. Custo de pessoal para cima é neutro (texto escuro) e para baixo é verde. Quando não dá para calcular aparece "—"; quando falta venda por hora, "Não estimada" em cinza; sem salários informados, o custo mostra "—" com a frase "Informe os salários para ver a variação do custo.". A base dos % é a venda atual da loja e o custo de pessoal atual, sempre em relação ao horário de hoje.

**Why this priority**: Troca o valor em reais por algo que se lê em um segundo, mas precisa dos cálculos que já existem.

**Independent Test**: Ver um cenário que reduz o fim de semana mostrar "▼ −9,7%" em vermelho na venda e um que contrata mostrar "▲ +3,6%" em texto escuro no custo.

**Acceptance Scenarios**:

1. **Given** uma variação, **When** é mostrada, **Then** tem seta, sinal e % (e o sinal negativo é o "−" tipográfico).
2. **Given** venda por hora indisponível, **When** a coluna Venda é vista, **Then** mostra "Não estimada" em cinza.
3. **Given** salários não informados, **When** a coluna Custo de pessoal é vista, **Then** mostra "—" e a frase pedindo os salários.

---

### User Story 6 - Mesmas linhas para dono, gestor e consulta (Priority: P2)

Como não há reais, as linhas são iguais para os três perfis. A única diferença: gestor e consulta não recebem "CENÁRIO SUGERIDO" (todos aparecem como Alternativa) e veem o Equilíbrio indisponível quando o dono não informou os custos. Os valores em reais continuam só na comparação de cenários salvos, para o dono.

**Why this priority**: Garante que a mudança não abra nem feche informação além do desenhado.

**Independent Test**: Abrir a mesma loja como dono, gestor e consulta e comparar as linhas.

**Acceptance Scenarios**:

1. **Given** o gestor ou a consulta, **When** a tela abre, **Then** nenhuma linha tem o selo "CENÁRIO SUGERIDO".
2. **Given** custos não informados, **When** o gestor abre os cenários, **Then** o Equilíbrio aparece indisponível com o texto "O dono ainda não informou os custos."
3. **Given** a comparação de cenários salvos, **When** o dono a abre, **Then** os valores em reais continuam lá, como hoje.

---

### Edge Cases

- Equilíbrio igual a Manter horários ou igual a Sem contratações: aparece o subtítulo "Igual a Manter horários" ou "Igual a Sem contratações" e as colunas repetem os valores do cenário igual.
- Sem venda por hora: a coluna Venda mostra "Não estimada" e a faixa amarela diz "Sem venda por hora: perda não estimada."
- Cenário que fecha dias: a faixa mostra "Fechado" e as horas perdidas em cada dia fechado.
- Loja com equipe que já cobre tudo: continua valendo a mensagem de hoje, sem linhas.
- Tela estreita (celular): cada linha empilha as colunas em vez de rolar para o lado.
- Perfil de consulta: não vê o botão Personalizar, como hoje.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST mostrar os cenários como uma lista de linhas, uma por cenário, na ordem Equilíbrio, Manter horários, Sem contratações, com as colunas Cenário, Contratar, Horário, Venda, Custo de pessoal e o botão.
- **FR-002**: O sistema MUST NOT mostrar nenhum valor em reais, saldo da operação, custo de folha, margem estimada, margem que deixa de entrar nem explicação de CMV nas linhas dos cenários, para nenhum perfil.
- **FR-003**: O sistema MUST manter os botões "Personalizar" e "Salvar como cenário" funcionando como hoje.
- **FR-004**: A coluna Cenário MUST trazer o selo ("CENÁRIO SUGERIDO" só na linha sugerida, "ALTERNATIVA" nas demais), o nome e a pill de status.
- **FR-005**: A coluna Contratar MUST dizer "1 farmacêutico · parcial", "1 atendente · parcial" ou "Nenhuma contratação".
- **FR-006**: A coluna Horário MUST mostrar o total semanal, a mudança em horas ("(+9h)" verde, "(−9h)" vermelho ou "sem mudança") e a faixa dos 7 dias com as horas abertas de cada dia, nunca um traço, em todas as linhas.
- **FR-007**: A faixa dos 7 dias MUST usar fundo cinza (sem mudança), verde (aumento), rosa (redução) e rosa com "Fechado" e as horas perdidas (dia fechado), com o novo total em negrito e a diferença quando mudar.
- **FR-008**: As colunas Venda e Custo de pessoal MUST mostrar só a variação em %, com seta e sinal, nas cores combinadas, e "—" ou "Não estimada" quando não houver cálculo.
- **FR-009**: A pill de status MUST seguir a prioridade Inviável, Não resolve sozinho, Não recomendado, Vende mais, Perde venda, Equipe menor que hoje, Cobre o horário, com no máximo 3 palavras, ícone, uma linha e sem depender só da cor.
- **FR-010**: Quando houver consequência, a linha MUST trazer uma faixa amarela de uma linha, na largura da linha, com a frase da causa; sem consequência, nenhuma faixa. A nota cinza abaixo da linha MUST deixar de existir.
- **FR-011**: As linhas MUST ter o visual por estado: sugerida (fundo azul-claro, barra azul, botão preenchido), alternativa (fundo branco, botão com contorno azul), rebaixada (fundo cinza, barra vermelha, pill vermelha com texto branco, botão neutro) e indisponível (cinza, botão desabilitado, texto do que falta).
- **FR-012**: As linhas MUST ser iguais para dono, gestor e consulta, exceto que gestor e consulta não recebem o selo "CENÁRIO SUGERIDO" e veem o Equilíbrio indisponível quando o dono não informou os custos.
- **FR-013**: O sistema MUST usar textos em português, curtos, sem jargão, sem a sigla CMV, com o sinal "−" tipográfico e horas como "94h" e "+9h".
- **FR-014**: O sistema MUST NOT alterar o restante da tela (regra de 42h/40h, horário e vendas, resultado da simulação e cenários salvos).
- **FR-015**: O sistema MUST usar só cores do Design System; os tons verde-texto e rosa propostos no quadro usam o token mais próximo ou um novo token de texto de sucesso.

### Key Entities

- **Linha de cenário**: um cenário apresentado em uma linha, com selo, nome, status, contratação, horário por dia, variação de venda e de custo de pessoal, causa e estado visual.
- **Variação em %**: mudança da venda ou do custo de pessoal em relação à venda atual da loja e ao custo de pessoal atual, no horário de hoje.
- **Status do cenário**: um entre sete, escolhido pela prioridade acima.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhuma linha de cenário mostra "R$" em qualquer perfil e estado.
- **SC-002**: Em 100% das linhas, a faixa dos 7 dias mostra as horas abertas de todos os dias, sem nenhum traço.
- **SC-003**: Todos os estados do quadro (3 cenários e seus estados internos, nos 3 perfis) renderizam como desenhado.
- **SC-004**: 100% das pills têm no máximo 3 palavras e cabem em uma linha.
- **SC-005**: Toda variação mostrada tem seta e sinal, e os casos sem cálculo mostram "—" ou "Não estimada".
- **SC-006**: Uma pessoa identifica em até 5 segundos qual cenário é o sugerido e o que cada um muda no horário.

## Assumptions

- Decision: os % usam como base a venda atual da loja e o custo de pessoal atual, em relação ao horário de hoje (o que o quadro indica). Why: o sistema já calcula as variações sobre a venda real da loja, também quando a medida dos cenários é a margem.
- Decision: a tela afetada é a dos cenários sugeridos (Diagnóstico) que leva à Simulação pelo botão Personalizar; a Simulação em si, a regra de 42h/40h e os cenários salvos não mudam. Why: é o que o pedido manda não mexer.
- Decision: em tela estreita cada linha empilha as colunas. Why: manter o uso no celular que foi corrigido antes.
- Decision: o Equilíbrio "igual a" outro cenário mostra o subtítulo e repete as colunas dele. Why: está nos estados do quadro.
- Decision: os cálculos de perda, ganho e custo não mudam, só a forma de mostrar. Why: o pedido é de apresentação.
- Fora do escopo: mudar a ordem dos cenários, os valores em reais da comparação de cenários salvos e a Simulação.
