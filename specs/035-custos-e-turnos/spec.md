# Feature Specification: Custos e Turnos, com o faturamento hora a hora ao lado dos turnos

**Feature Branch**: `feat/custos-e-turnos`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Reformular a tela de turnos e mínimos de pessoas do Cadastro da loja para mostrar o faturamento médio de cada hora ao lado dos turnos (board 'Cadastro de turnos com faturamento hora a hora', versão D 'Gráfico e tabela, combinados', mais o estado 'sem dados'). Ao entrar na tela, 'Por turnos' passa a ser o padrão. A aba 'Regras e custos' passa a se chamar 'Custos e Turnos' e a tela fica na ordem: Custos de Salário em Folha, Turnos, Encargos e Convenção Coletiva."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aba "Custos e Turnos" na nova ordem, com "Por turnos" como padrão (Priority: P1)

A aba que hoje se chama "Regras e custos" passa a se chamar **Custos e Turnos**, e a tela fica na ordem: **Custos de Salário em Folha**, **Turnos** e **Encargos e Convenção Coletiva**. Ao entrar, a loja que ainda não escolheu o modo já abre em "Por turnos".

**Why this priority**: É a base das outras histórias (o gráfico mora na seção Turnos) e organiza a tela na ordem em que o dono pensa: quanto paga, como distribui a equipe, o que pesa em cima.

**Independent Test**: Abrir o Cadastro de uma loja nova e ver o nome da aba, a ordem das seções e o modo "Por turnos" selecionado.

**Acceptance Scenarios**:

1. **Given** o Cadastro de uma loja, **When** as abas são vistas, **Then** a terceira se chama "Custos e Turnos"; o endereço da aba e os atalhos que levam a ela continuam funcionando.
2. **Given** a aba aberta, **When** a tela é lida de cima para baixo, **Then** as seções aparecem como "Custos de Salário em Folha" (só o dono), "Turnos" e "Encargos e Convenção Coletiva".
3. **Given** "Encargos e Convenção Coletiva", **When** é vista, **Then** traz juntos o bloco de encargos (só o dono, hoje dentro de Custos) e a convenção coletiva, com os mesmos textos e comportamentos de hoje.
4. **Given** uma loja que nunca escolheu o modo de mínimo, **When** a aba abre, **Then** o modo "Por turnos" vem selecionado, com os turnos sugeridos pela tela de hoje.
5. **Given** uma loja que já tinha escolhido "Mínimo único do dia", **When** a aba abre, **Then** o modo escolhido continua "Mínimo único do dia" (a escolha guardada vale).
6. **Given** os avisos de pendência que levam a esta aba, **When** são clicados, **Then** abrem a aba "Custos e Turnos" no campo certo.

---

### User Story 2 - Gráfico do faturamento por hora com as faixas dos turnos (Priority: P1)

Na seção Turnos (título "Pessoas por Turnos na Loja"), um gráfico mostra, para cada hora de funcionamento, o faturamento médio daquela hora, com uma faixa por turno em cima. Arrastar a alça entre dois turnos muda o fim de um e o início do outro.

**Why this priority**: Hoje os turnos aparecem como barras de horário sem dizer quanto a loja vende em cada hora. O dono monta turnos às cegas; com o gráfico ele vê onde está o movimento.

**Independent Test**: Numa loja com base comercial e 3 turnos, ver as barras por hora e as 3 faixas, arrastar a alça entre o 1.º e o 2.º turno e ver os horários e os valores da tabela mudarem juntos.

**Acceptance Scenarios**:

1. **Given** uma loja com base comercial, **When** a seção Turnos é vista, **Then** o gráfico tem uma coluna por hora de funcionamento, barras proporcionais ao faturamento médio da hora (relativas ao maior valor do dia), as 3 horas de maior faturamento em destaque e os rótulos de hora embaixo.
2. **Given** os turnos, **When** o gráfico é visto, **Then** há uma faixa por turno acima das barras, ocupando as horas dele, com o texto "<Nome> · 07:00–10:00".
3. **Given** duas faixas vizinhas, **When** a alça entre elas é arrastada, **Then** o fim de um turno e o início do próximo mudam juntos, de 1 em 1 hora, com no mínimo 1 hora por turno, e os campos da tabela e os valores de faturamento acompanham na hora.
4. **Given** uma faixa ou uma linha da tabela, **When** é clicada, **Then** o turno é selecionado nas duas (faixa com borda de destaque, linha com fundo e barra lateral), e só um turno fica selecionado por vez.
5. **Given** o gráfico, **When** é navegado por teclado, **Then** cada faixa e cada alça recebem foco com Tab, as setas esquerda e direita movem o limite em 1 hora, Enter seleciona o turno, e o leitor de tela anuncia "Turno <nome>, <início> a <fim>".
6. **Given** a linha de apoio abaixo do gráfico, **When** é lida, **Then** diz "Clique em uma faixa do gráfico ou em uma linha da tabela para ver o faturamento hora a hora do turno."
7. **Given** o seletor de tipo de dia, **When** é trocado (Dias úteis, Sábado, Domingo), **Then** só o gráfico e os números de faturamento mudam; turnos e mínimos não mudam.
8. **Given** uma base com menos de 4 semanas de vendas, **When** o gráfico é visto, **Then** aparece o aviso "Poucos dias de venda na base. Os valores podem não representar o movimento normal da loja."
9. **Given** horas fora do horário da loja, **When** o gráfico é visto, **Then** elas não aparecem.

---

### User Story 3 - Tabela de turnos com faturamento e detalhe do turno selecionado (Priority: P1)

Uma linha por turno com nome, início, fim, faturamento do turno e os mínimos de Farmacêutico, Atendimento e Caixa; embaixo da linha selecionada, um detalhe com a média por hora, o pico e um mini gráfico das horas do turno.

**Why this priority**: É o jeito de editar os turnos e ver o peso de cada um sem sair da tela.

**Independent Test**: Selecionar o turno "Intermediário" e ver o detalhe com a média por hora, o pico e o mini gráfico; mudar o fim dele e ver os números e as barras acompanharem.

**Acceptance Scenarios**:

1. **Given** a tabela, **When** é vista, **Then** tem as colunas Turno, Início, Fim, Faturamento, Farmacêutico, Atendimento, Caixa e a ação de remover; nome, início e fim são editáveis com os mesmos campos de hoje.
2. **Given** a coluna Faturamento, **When** é vista, **Then** mostra o valor do turno por dia (soma das horas dele) em negrito e, abaixo, "<n>% do dia".
3. **Given** os mínimos, **When** são editados, **Then** os três cargos usam o contador de hoje; Farmacêutico tem mínimo 1 (o "−" fica desabilitado em 1 e não há "×"); Atendimento e Caixa têm "×" para tirar o cargo do turno, como hoje.
4. **Given** a nota abaixo da tabela, **When** é lida, **Then** diz "Farmacêutico: obrigatório, mínimo 1 (Lei 13.021/2014)."
5. **Given** um turno selecionado, **When** o detalhe aparece, **Then** mostra MÉDIA POR HORA (valor do turno ÷ horas dele), PICO (hora de maior faturamento e o valor) e FATURAMENTO DO TURNO (valor por dia e % do dia), e um mini gráfico com o valor acima de cada barra e a hora abaixo, com a hora de pico em destaque.
6. **Given** uma mudança de início ou de fim, **When** é feita (por campo ou por alça), **Then** o detalhe e a tabela acompanham em tempo real.
7. **Given** o botão "+ Adicionar turno", **When** é clicado, **Then** cria o turno pela regra de hoje (primeiro intervalo livre, ou divide o último turno ao meio).
8. **Given** a validação dos turnos, **When** a tela é salva, **Then** valem as mesmas regras de hoje (cobertura do horário da loja, mínimo de 1 farmacêutico, nomes e horários válidos) e os dados são gravados como hoje.

---

### User Story 4 - Sugerir turnos pelo movimento (Priority: P2)

O botão "Sugerir turnos pelo movimento" propõe limites de turno a partir das horas de maior e de menor faturamento, como pré-visualização no gráfico, e só altera os turnos se a pessoa confirmar.

**Why this priority**: Acelera a montagem dos turnos, mas a tela funciona sem ele.

**Independent Test**: Clicar em "Sugerir turnos pelo movimento", ver faixas tracejadas no gráfico, "Descartar" e ver que nada mudou; clicar de novo e "Aplicar" e ver os turnos mudarem.

**Acceptance Scenarios**:

1. **Given** uma loja com faturamento por hora, **When** o botão é clicado, **Then** a sugestão aparece no gráfico como faixas tracejadas, com os botões "Aplicar" e "Descartar".
2. **Given** a pré-visualização, **When** "Descartar" é clicado, **Then** nada muda nos turnos.
3. **Given** a pré-visualização, **When** "Aplicar" é clicado, **Then** os turnos passam a ser os sugeridos (com a mesma validação e os mínimos de hoje) e a pessoa ainda precisa salvar como em qualquer edição.
4. **Given** uma loja sem faturamento por hora, **When** a tela é vista, **Then** o botão fica desabilitado com a dica "Envie a base comercial para usar esta função."

---

### User Story 5 - Estado sem dados (loja sem base comercial) (Priority: P1)

Sem faturamento por hora, no lugar do gráfico aparece uma caixa que explica e leva ao envio da base; o resto da tela segue funcionando.

**Why this priority**: Muitas lojas ainda não têm base; a tela não pode quebrar nem esconder os turnos.

**Independent Test**: Abrir uma loja sem base e ver a caixa, a linha do tempo simples dos turnos, "—" no faturamento e o botão de sugerir desabilitado; enviar uma base e ver a tela passar ao estado normal sem perder os turnos editados.

**Acceptance Scenarios**:

1. **Given** uma loja sem base comercial, **When** a seção Turnos é vista, **Then** no lugar do gráfico há uma caixa com borda tracejada, o título "Sem faturamento por hora", o texto "Envie a base comercial para ver o movimento de cada hora ao lado dos turnos." e o botão "Enviar base comercial", que abre o envio de base que já existe.
2. **Given** o estado sem dados, **When** a seção é vista, **Then** abaixo da caixa há a linha do tempo simples dos turnos (faixas "<Nome> · 07:00–10:00"), sem barras.
3. **Given** o estado sem dados, **When** a tabela é vista, **Then** a coluna Faturamento mostra "—" e o detalhe do turno selecionado não aparece.
4. **Given** o estado sem dados, **When** turnos e mínimos são editados e salvos, **Then** tudo funciona como hoje.
5. **Given** a base enviada e processada, **When** a tela é vista de novo, **Then** passa ao estado normal e os turnos já editados (ainda não salvos) continuam como estavam.

---

### User Story 6 - Quem vê o quê (Priority: P2)

Os valores em reais do faturamento por hora são do dono do grupo. Os outros perfis veem o formato do movimento (barras e % do dia), sem valores em reais.

**Why this priority**: Regra do produto que não pode ser quebrada.

**Independent Test**: Abrir a mesma loja como dono e como gestor e conferir que o gestor não recebe nenhum valor em reais.

**Acceptance Scenarios**:

1. **Given** o dono, **When** a seção Turnos é vista, **Then** os valores em R$ aparecem na tabela, no detalhe e no mini gráfico.
2. **Given** um gestor ou perfil de consulta, **When** a seção é vista, **Then** as barras e a % do dia aparecem, mas nenhum valor em reais; a coluna Faturamento mostra só a "% do dia", e o servidor nem envia os valores.

---

### Edge Cases

- Loja 24 horas ou com horário que passa da meia-noite: o eixo e as faixas seguem a regra de turnos de hoje.
- Turno que não cobre o horário da loja: o selo "Horário da loja coberto" some e o aviso de cobertura de hoje aparece; nada novo aqui.
- Dia do tipo escolhido sem nenhuma venda na base (por exemplo, domingo com loja fechada): o gráfico mostra "Sem vendas neste tipo de dia" em vez de barras vazias.
- Alças em turnos com 1 hora: não arrastam além do mínimo de 1 hora.
- Muitos turnos (até o máximo de hoje): as faixas ficam legíveis; o texto da faixa é cortado com reticências e o nome completo aparece na tabela e na dica.
- Celular: o gráfico e a tabela rolam dentro do próprio quadro; as alças ficam alcançáveis por toque.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A aba MUST se chamar "Custos e Turnos" e as seções MUST aparecer na ordem "Custos de Salário em Folha", "Turnos", "Encargos e Convenção Coletiva", sem mudar o que cada bloco faz.
- **FR-002**: Loja sem modo de mínimo escolhido MUST abrir em "Por turnos"; a escolha já guardada MUST valer.
- **FR-003**: A seção Turnos MUST se chamar "Pessoas por Turnos na Loja" e manter todos os textos de hoje (subtítulo, "Por turnos", "Mínimo único do dia", "Horário da loja…", "Horário da loja coberto", "Obrigatório: mínimo 1 (Lei 13.021/2014)").
- **FR-004**: O gráfico MUST mostrar o faturamento médio de cada hora de funcionamento, por tipo de dia, calculado da base comercial ativa da loja, com as faixas dos turnos acima e as 3 horas de maior faturamento em destaque.
- **FR-005**: Arrastar uma alça MUST mudar o fim do turno e o início do seguinte, de 1 em 1 hora, com mínimo de 1 hora por turno, e atualizar tabela e detalhe na hora; o mesmo MUST ser possível por teclado.
- **FR-006**: Selecionar uma faixa ou uma linha MUST sincronizar as duas; só um turno selecionado por vez.
- **FR-007**: A tabela MUST ter uma linha por turno com nome, início, fim, faturamento (valor do dia e % do dia), e os três cargos com os contadores e regras de hoje.
- **FR-008**: O detalhe do turno selecionado MUST mostrar média por hora, pico e faturamento do turno, e um mini gráfico com as horas dele.
- **FR-009**: "Sugerir turnos pelo movimento" MUST mostrar uma pré-visualização, aplicar só com confirmação, e ficar desabilitado sem faturamento por hora.
- **FR-010**: O estado sem dados MUST mostrar a caixa "Sem faturamento por hora" com "Enviar base comercial", a linha do tempo simples dos turnos, "—" no faturamento e nenhum detalhe; a edição e a gravação MUST continuar iguais.
- **FR-011**: Valores em reais do faturamento por hora MUST chegar à tela só para o dono do grupo.
- **FR-012**: A validação, a cobertura do horário, o mínimo de 1 farmacêutico, o modo "Mínimo único do dia" e a gravação dos turnos MUST continuar exatamente como hoje.
- **FR-013**: A tela MUST ser usável por teclado e leitor de tela (alvos de pelo menos 40 px, anúncio "Turno <nome>, <início> a <fim>", alternativa em texto pela tabela e pelo detalhe) e no celular sem rolagem lateral da página.
- **FR-014**: Cores novas do gráfico MUST virar tokens do sistema de design (ou usar o equivalente mais próximo), sem cores soltas nos componentes.

### Key Entities

- **Faturamento médio por hora**: para cada hora de funcionamento e tipo de dia, a média de venda daquela hora na base comercial ativa; com a % do dia.
- **Turno**: nome, início, fim e mínimos por cargo (como hoje); ganha, só para exibição, o faturamento do turno (soma das horas), a média por hora e o pico.
- **Sugestão de turnos**: proposta temporária de limites, que nunca é gravada sem confirmação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Numa loja com base, a pessoa vê quanto cada turno fatura e onde está o pico sem sair da tela de turnos.
- **SC-002**: Arrastar uma alça e ver a tabela e o detalhe atualizarem leva menos de 1 segundo, sem recarregar.
- **SC-003**: Numa loja sem base, todas as edições e a gravação de turnos funcionam como antes, e a tela diz como ver o gráfico.
- **SC-004**: Nenhum valor em reais do faturamento por hora chega a quem não é dono do grupo.
- **SC-005**: A aba abre com "Por turnos" em toda loja sem escolha guardada; nenhuma escolha já guardada muda.
- **SC-006**: Todos os textos que já existiam na tela continuam iguais.

## Assumptions

- Decision: o período da média é toda a base comercial ativa da loja, a mesma que o resto do produto usa. Why: é um dado só, coerente com o Diagnóstico; a ideia de "últimos 90 dias" depende de confirmação do produto e pode virar um filtro depois.
- Decision: os tipos de dia são Dias úteis (segunda a sexta, padrão), Sábado e Domingo. Why: é o que o desenho propõe e o que se confirma com o produto.
- Decision: o faturamento por hora vem calculado do servidor, a partir da base ativa, e a tela não refaz a conta. Why: mantém a regra de que valores em reais só saem para o dono.
- Decision: o nome interno da aba (endereço e atalhos) não muda; só o texto que a pessoa lê. Why: evita quebrar links e avisos de pendência.
- Assumption (de negócio): "Sugerir turnos pelo movimento" propõe até o número de turnos que a loja já tem (ou 3, se tiver só 1 ou 2), cortando nos pontos de maior mudança de faturamento. Why: respeita o limite de turnos de hoje e é fácil de explicar; o desenho não fixa a regra.
- Fora do escopo: mudar o modo "Mínimo único do dia", a regra de cobertura, o cálculo de cenários, o faturamento por hora em outras telas, e o filtro de período.
