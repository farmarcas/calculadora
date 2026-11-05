# Feature Specification: Lista de simulações com resultado e comparação com diferença

**Feature Branch**: `feat/simulacoes-lista-e-comparacao`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Refazer a lista 'Simulações da loja' e a tela 'Comparação de simulações' conforme o board 'Simulações salvas e comparação': lista com resultado por simulação (saldo por mês, horas abertas por semana, folha extra, situação, tipo do cenário, criada em e por quem), seleção de 2 a 4 simulações com barra de comparar (a primeira escolhida é a base), e comparação em tabela com a coluna de diferença frente à base, grupos, cores conforme o efeito no resultado, 'Mostrar só o que mudou', '+ Adicionar simulação', 'Usar como base' e 'Remover da comparação'. Não existe cenário em uso. O saldo por mês é o mesmo cálculo da Simulação. Valores em reais só para o dono do grupo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lista de simulações com o resultado de cada uma (Priority: P1)

Quem simula abre "Simulações da loja" e vê, numa tabela, cada simulação salva com o que mais importa: o saldo por mês, as horas abertas por semana, a folha extra, a situação e o tipo do cenário. Dá para comparar o resultado de várias simulações só olhando a lista, sem abrir cada uma.

**Why this priority**: Hoje a lista só mostra nome, regra, situação e quem criou. Para saber qual simulação é melhor, a pessoa precisa abrir uma por uma.

**Independent Test**: Numa loja com 3 simulações gravadas e 1 rascunho, abrir a lista e conferir, para cada linha, o saldo por mês (com cor e sinal), as horas, a folha extra, a situação e a data com o nome de quem criou.

**Acceptance Scenarios**:

1. **Given** uma loja com simulações, **When** a lista é aberta, **Then** mostra uma linha por simulação com: seleção, nome (com o tipo do cenário em linha de apoio), situação, saldo por mês, horas abertas por semana, folha extra, data de criação (com "por quem") e o link "Abrir".
2. **Given** o título e o subtítulo da lista, **When** são lidos, **Then** dizem "Simulações da loja" e "Cenários que você salvou. Rascunho pode ser ajustado. Simulação gravada só pode ser copiada.", com "Mostrar descartadas" e o botão "Nova simulação" à direita.
3. **Given** um saldo positivo, **When** é mostrado, **Then** aparece em verde, com o sinal "+" e o formato "R$ 4.900"; um saldo negativo aparece em vermelho, com o sinal "−" (por exemplo "−R$ 2.299").
4. **Given** a situação de uma simulação, **When** é mostrada, **Then** é um destes selos: Rascunho, Gravada ou Desatualizada (que pode vir junto com Gravada), e "Desatualizada" tem a dica "Os dados da loja mudaram depois que esta simulação foi gravada. Abra e confira antes de usar."
5. **Given** uma simulação cujo cenário mantém, reduz ou amplia os horários da loja, **When** a linha é mostrada, **Then** a linha de apoio abaixo do nome diz "Mantém horários", "Reduz horários" ou "Amplia horários", o que separa cenários com o mesmo nome.
6. **Given** a coluna "Criada", **When** é mostrada, **Then** traz a data (dd/mm/aaaa) e, em linha de apoio, "por" seguido do nome legível de quem criou, nunca um código interno como TENANT_ADMIN.
7. **Given** uma loja sem nenhuma simulação, **When** a lista é aberta, **Then** mostra "Nenhuma simulação salva ainda. Crie uma nova para ver o resultado por mês." e o botão "Nova simulação".
8. **Given** a lista, **When** é aberta, **Then** as simulações aparecem da mais recente para a mais antiga, e não existe nenhuma menção a "cenário em uso", chip "Em uso" ou destaque verde de linha.

---

### User Story 2 - Escolher de 2 a 4 simulações e comparar (Priority: P1)

A pessoa marca duas ou mais simulações na lista (até quatro) e, numa barra que aparece no pé da tabela, clica em "Comparar". A primeira simulação escolhida vira a base da comparação.

**Why this priority**: É o jeito de passar da lista para a comparação, e a regra "a primeira escolhida é a base" substitui a antiga simulação "em uso".

**Independent Test**: Marcar duas simulações, ver a barra "2 simulações selecionadas. A primeira escolhida é a base da comparação.", clicar em "Comparar" e cair na comparação com a primeira marcada como base.

**Acceptance Scenarios**:

1. **Given** nenhuma ou uma simulação marcada, **When** a lista é vista, **Then** a barra de comparar não aparece.
2. **Given** duas ou mais simulações marcadas, **When** a lista é vista, **Then** aparece uma barra escura no pé da tabela com "N simulações selecionadas. A primeira escolhida é a base da comparação.", o link "Limpar" e o botão "Comparar".
3. **Given** quatro simulações já marcadas, **When** a pessoa tenta marcar uma quinta, **Then** a quinta não é marcada e a tela explica que o máximo é quatro.
4. **Given** simulações marcadas, **When** a pessoa clica em "Limpar", **Then** todas as marcas saem e a barra some.
5. **Given** uma linha marcada, **When** é vista, **Then** tem fundo destacado, e cada seleção tem o rótulo acessível "Selecionar <nome da simulação>".
6. **Given** uma simulação descartada, **When** a lista a mostra, **Then** ela não pode ser marcada para comparar.

---

### User Story 3 - Comparação em tabela com a diferença frente à base (Priority: P1)

A comparação mostra as simulações escolhidas em colunas, com as métricas em linhas agrupadas, e uma coluna de diferença de cada simulação frente à base, em cor que indica se a mudança é boa ou ruim para o resultado.

**Why this priority**: É o objetivo da tela: dizer, em reais e em horas, o que muda de uma simulação para a base.

**Independent Test**: Comparar o Cenário 1 (base) com o Cenário 3 e ver o saldo, a folha extra e as horas com as diferenças certas e nas cores certas.

**Acceptance Scenarios**:

1. **Given** a comparação aberta, **When** o cabeçalho é visto, **Then** mostra "Comparação de simulações", o subtítulo "As diferenças são frente à base (nome da base). N de M itens mudaram." com os números reais, o toggle "Mostrar só o que mudou" (desligado) e o botão "+ Adicionar simulação".
2. **Given** a tabela, **When** é vista, **Then** a primeira coluna traz o rótulo da métrica, depois uma coluna por simulação e, no fim, a coluna "Diferença" (uma por simulação não base quando há mais de duas), e o cabeçalho das colunas fica fixo ao rolar.
3. **Given** o cabeçalho de cada coluna, **When** é visto, **Then** mostra o nome da simulação e selos: a base tem o selo "Base"; todas mostram a situação e o tipo do cenário.
4. **Given** as métricas, **When** são vistas, **Then** estão nos grupos Resultado por mês (Saldo, Folha extra, Venda estimada, Venda que deixa de entrar, Horas abertas por semana), Conformidade (Erros nas regras, Avisos, Farmacêutico em todo o horário), Atendimento (Cobertura das horas exigidas, Horas que faltam, Horas que sobram) e Pessoas (Pessoas no quadro, Horas planejadas por semana, Horas contratadas por semana, Folgas por pessoa na semana).
5. **Given** a linha "Saldo", **When** é vista, **Then** é destacada, com os valores maiores e em negrito, verde se positivo e vermelho se negativo.
6. **Given** uma linha em que o valor mudou frente à base, **When** é vista, **Then** o rótulo fica em negrito, a linha tem leve destaque e a coluna "Diferença" mostra "▲ +…" ou "▼ −…" em negrito; numa linha igual, o rótulo fica normal e a coluna mostra "igual".
7. **Given** a cor de uma diferença, **When** é mostrada, **Then** depende do efeito no resultado e não do sinal: para Saldo e Venda estimada, aumento é verde e queda é vermelha; para Folha extra, Venda que deixa de entrar, Erros nas regras, Avisos e Horas que faltam, aumento é vermelho e queda é verde; para as demais (Horas abertas, Pessoas, Horas planejadas e contratadas, Horas que sobram, Folgas, Cobertura), a diferença é neutra.
8. **Given** o toggle "Mostrar só o que mudou" ligado, **When** a tabela é vista, **Then** somem as linhas "igual" e os grupos que ficarem vazios, e a contagem "N de M itens mudaram" continua certa.
9. **Given** qualquer valor com sinal, **When** é mostrado, **Then** a cor nunca é o único sinal: valem também o triângulo ▲/▼ e o "+"/"−".

---

### User Story 4 - Mudar a base e montar a comparação (Priority: P2)

Na comparação, a pessoa troca a base com "Usar como base", tira uma simulação com "Remover da comparação" e acrescenta outra com "+ Adicionar simulação", até quatro colunas.

**Why this priority**: Sem uma simulação fixa de referência, trocar a base é o jeito de ver as diferenças sob outra ótica sem voltar à lista.

**Independent Test**: Numa comparação de três simulações, usar a segunda como base e ver todas as diferenças e cores recalculadas; remover uma coluna; adicionar outra.

**Acceptance Scenarios**:

1. **Given** uma coluna que não é a base, **When** a pessoa escolhe "Usar como base", **Then** ela passa a ser a base (selo "Base"), a antiga base vira uma coluna comum e todas as diferenças, as cores, a contagem e o subtítulo são recalculados.
2. **Given** uma coluna que não é a base, **When** a pessoa escolhe "Remover da comparação", **Then** a coluna some; se restar menos de duas, a tela volta à lista com a explicação.
3. **Given** menos de quatro colunas, **When** a pessoa clica em "+ Adicionar simulação", **Then** escolhe entre as simulações da loja que ainda não estão na comparação e ela entra como nova coluna; com quatro colunas, o botão fica desabilitado.
4. **Given** a base, **When** a coluna dela é vista, **Then** não oferece "Usar como base" nem "Remover da comparação" enquanto for a base (para remover, antes se troca a base).

---

### User Story 5 - Valores em reais só para o dono e a mesma conta do saldo (Priority: P1)

Saldo por mês, folha extra, venda estimada e venda que deixa de entrar são valores em reais e só o dono do grupo os vê. O saldo é o mesmo cálculo da Simulação, na lista e na comparação.

**Why this priority**: É uma regra de acesso já existente e uma exigência de coerência: o mesmo saldo não pode aparecer com dois valores.

**Independent Test**: Abrir uma simulação e ver o saldo no painel de resultado; abrir a lista e a comparação e conferir o mesmo valor; repetir como gestor e ver que os valores em reais não aparecem.

**Acceptance Scenarios**:

1. **Given** o dono do grupo, **When** vê a lista e a comparação, **Then** vê saldo, folha extra, venda estimada e venda que deixa de entrar, iguais aos do painel de resultado da própria simulação.
2. **Given** o gestor de escala ou quem só consulta, **When** vê a lista e a comparação, **Then** as colunas e as linhas em reais não aparecem, e os demais dados (horas, situação, erros, pessoas, cobertura) continuam visíveis.
3. **Given** uma simulação sem salário médio informado ou sem venda hora a hora, **When** o saldo seria calculado, **Then** aparece "—" (e uma dica do que falta), e nunca zero por engano.
4. **Given** a fórmula do saldo, **When** é aplicada, **Then** é "venda estimada menos folha extra, menos hora extra e menos venda que deixa de entrar", sem mudança.

---

### Edge Cases

- Rascunho sem resultado calculado: mostra os dados que existem e "—" no que depende do cálculo.
- Simulação gravada antes de existir o resultado na lista: o resultado é obtido da própria simulação, sem pedir nova gravação.
- Todas as simulações escolhidas iguais à base: a contagem diz "0 de 15 itens mudaram" e o toggle mostra uma mensagem de que nada mudou.
- Loja com mais de quatro simulações marcadas por engano em outra sessão: a barra respeita o limite de quatro.
- Simulação descartada que estava na comparação: sai da comparação com aviso.
- Tela estreita: a tabela rola na horizontal, com a primeira coluna fixa à esquerda.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A lista MUST mostrar, por simulação, nome com tipo do cenário, situação, saldo por mês, horas abertas por semana, folha extra, data de criação com o nome de quem criou e o link "Abrir", na ordem da mais recente para a mais antiga.
- **FR-002**: A situação MUST ser Rascunho, Gravada ou Desatualizada; "Desatualizada" MUST mostrar a dica "Os dados da loja mudaram depois que esta simulação foi gravada. Abra e confira antes de usar." e MUST valer para toda simulação gravada cujos dados da loja mudaram depois da gravação.
- **FR-003**: O tipo do cenário MUST ser "Mantém horários", "Reduz horários" ou "Amplia horários", conforme as horas abertas da simulação frente às da loja.
- **FR-004**: O saldo MUST usar o sinal "+" ou "−", o formato "R$ 2.299", a cor verde (positivo) ou vermelha (negativo) e o triângulo/sinal em qualquer valor de diferença.
- **FR-005**: A pessoa MUST poder marcar de 2 a 4 simulações (não descartadas) e, ao ter duas ou mais, ver a barra "N simulações selecionadas. A primeira escolhida é a base da comparação." com "Limpar" e "Comparar".
- **FR-006**: A comparação MUST usar a primeira simulação marcada como base e MUST mostrar a diferença de cada simulação frente à base.
- **FR-007**: A comparação MUST trazer os quatro grupos e as quinze métricas descritas, com a linha "Saldo" destacada.
- **FR-008**: A cor da diferença MUST seguir o efeito no resultado, conforme a regra por métrica descrita na história 3, e nunca ser o único sinal.
- **FR-009**: O toggle "Mostrar só o que mudou" MUST esconder as linhas iguais e os grupos vazios, e a contagem "N de M itens mudaram" MUST estar certa com ele ligado ou desligado.
- **FR-010**: A comparação MUST permitir "Usar como base", "Remover da comparação" e "+ Adicionar simulação" (até quatro colunas), recalculando tudo ao trocar a base.
- **FR-011**: Saldo, folha extra, venda estimada e venda que deixa de entrar MUST ser vistos só pelo dono do grupo; os demais perfis MUST ver o resto da lista e da comparação sem esses valores.
- **FR-012**: O saldo MUST ser o mesmo da Simulação (venda estimada menos folha extra, hora extra e venda que deixa de entrar), na lista, na comparação e no painel de resultado; sem salário ou sem venda por hora, MUST mostrar "—".
- **FR-013**: A interface MUST NOT conter "em uso", chip "Em uso" nem destaque verde de linha.
- **FR-014**: O cabeçalho da tabela da comparação MUST ficar fixo ao rolar, com cabeçalhos de coluna e de linha marcados para leitores de tela; cada seleção MUST ter o rótulo "Selecionar <nome>".
- **FR-015**: Os textos MUST usar "Horas que faltam" e "Horas que sobram" (no lugar de "horas-pessoa em falta e em sobra") e "Venda que deixa de entrar" (no lugar de "venda que sai").
- **FR-016**: O nome de quem criou MUST aparecer em linguagem legível (por exemplo, "Administrador da conta"), e nunca como código interno do perfil.

### Key Entities *(include if feature involves data)*

- **Simulação**: nome, loja, situação (rascunho ou gravada, e se está desatualizada), tipo do cenário, quem e quando criou, resultado (saldo por mês, horas abertas, folha extra, venda estimada, venda que deixa de entrar) e indicadores (erros, avisos, cobertura, pessoas, horas).
- **Comparação**: de 2 a 4 simulações da mesma loja, uma delas como base, com a diferença de cada uma frente à base em cada métrica.
- **Métrica comparada**: nome, grupo, valor por simulação, diferença e o sentido bom da mudança (aumento bom, aumento ruim ou neutro).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A pessoa descobre qual de várias simulações tem o melhor saldo só olhando a lista, sem abrir nenhuma, em menos de 10 segundos.
- **SC-002**: Em 100% das simulações com salário e venda por hora informados, o saldo da lista e da comparação é igual ao do painel de resultado da própria simulação (diferença zero).
- **SC-003**: Em 100% das comparações, a cor de cada diferença corresponde ao efeito no resultado definido para a métrica, e nenhuma diferença depende só da cor.
- **SC-004**: Trocar a base recalcula todas as diferenças, as cores, a contagem de itens e o subtítulo em menos de 1 segundo.
- **SC-005**: Nenhum valor em reais aparece para quem não é o dono do grupo, na lista e na comparação.
- **SC-006**: Nenhuma tela da lista e da comparação contém "em uso" ou um código interno de perfil.

## Assumptions

- Decisão: **"Desatualizada" volta**, agora como uma situação de qualquer simulação gravada (e não só da "em uso", que deixou de existir): vale quando mudaram, depois da gravação, o quadro de pessoas, o horário de funcionamento, o mínimo de pessoas por função ou a convenção da loja. Por quê: o board pede o selo e a dica; a checagem existia e foi retirada junto com o "em uso", mas fazia sentido para qualquer simulação gravada.
- Decisão: o **tipo do cenário** vem da comparação das horas abertas por semana da simulação com as da loja: mais horas é "Amplia horários", menos é "Reduz horários" e igual é "Mantém horários". Por quê: é o que o board descreve e separa cenários com o mesmo nome.
- Decisão: "Criada por" mostra um nome legível do perfil que criou ("Administrador da conta" para o dono do grupo e nomes equivalentes para os demais), até existir login com nome de pessoa. Por quê: o sistema ainda não tem o nome da pessoa; o board sugere esse texto e pede para confirmar com o produto.
- Decisão: quem não é dono vê a lista e a comparação sem as linhas e colunas em reais (saldo, folha extra, venda estimada, venda que deixa de entrar); o resto continua. Por quê: é a regra de acesso que já existe para valores em reais.
- Decisão: a comparação continua exigindo ao menos duas simulações da mesma loja e aceita até quatro; descartadas não entram. Por quê: é o limite do board e da comparação de hoje.
- Fora do escopo: ordenar a lista por coluna, filtros, salvar comparações, e mudar o cálculo do saldo ou o painel de resultado da Simulação.
- Dependência: as simulações já gravadas, que hoje guardam o resultado da gravação, continuam a ser a fonte dos números da lista; os valores em reais dos exemplos do board são ilustrativos.
