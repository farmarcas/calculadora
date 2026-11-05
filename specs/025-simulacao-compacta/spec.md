# Feature Specification: Simulação compacta (Horário e vendas + Resultado)

**Feature Branch**: `feat/simulacao-compacta`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Tela de Simulação conforme o quadro 'Simulação · A compacta (reduzindo e abrindo mais a loja)': abertura e fechamento com − e +, lista de horários mais larga com o gráfico ao lado, Resultado sempre na coluna da direita, linha 'Venda estimada' no Resultado, horas novas no gráfico quando o horário aumenta, e 'Venda que sai' passa a se chamar 'Venda que deixa de entrar'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ajustar o horário de cada dia com + e − (Priority: P1)

Na Simulação, a pessoa vê uma lista com os sete dias. Em cada dia há o horário de **abertura** e o de **fechamento**, cada um com botões **+** e **−** que mexem de 30 em 30 minutos; também é possível digitar. O dia que difere do Cadastro ganha o selo "Alterado". Há o link "Fechar dia" em cada dia e, no rodapé, "N h abertas por semana · antes M h" e "Restaurar do Cadastro".

**Why this priority**: É a ação principal da tela; hoje só o fechamento tem os botões e a abertura exige digitar.

**Independent Test**: Abrir uma Simulação, aumentar o fechamento de sábado com "+", diminuir a abertura de segunda com "−", digitar um horário e ver o total de horas e o selo "Alterado" atualizarem.

**Acceptance Scenarios**:

1. **Given** um dia aberto das 08:00 às 21:00, **When** a pessoa clica em "+" na abertura, **Then** a abertura passa para 08:30 e o selo "Alterado" aparece.
2. **Given** o fechamento em 22:00, **When** a pessoa clica em "+" duas vezes, **Then** ele chega a 23:00 e nunca passa de 24:00; o "+" fica sem efeito em 24:00.
3. **Given** a abertura 08:00 e o fechamento 09:00, **When** a pessoa tenta fechar mais cedo ou abrir mais tarde que o limite, **Then** o horário não passa do outro (a abertura é sempre antes do fechamento).
4. **Given** um campo de horário, **When** a pessoa digita um valor inválido (ex.: "25:99" ou fechamento antes da abertura), **Then** o campo volta ao último valor válido.
5. **Given** um campo de horário com foco, **When** a pessoa aperta as setas ↑ ou ↓, **Then** o horário muda de 30 em 30 minutos.
6. **Given** vários dias alterados, **When** a pessoa clica em "Restaurar do Cadastro", **Then** todos os dias voltam ao horário do Cadastro e o selo "Alterado" some.
7. **Given** um dia aberto, **When** a pessoa clica em "Fechar dia", **Then** o dia passa a "Fechado nesta simulação" com a opção de reabrir.

---

### User Story 2 - Ver no gráfico o que o horário muda na venda (Priority: P1)

Ao lado da lista, o gráfico "Venda por hora" mostra o dia escolhido (abas Seg a Dom). Horas **fechadas na simulação** aparecem listradas em cinza (venda que deixa de entrar). Horas **novas** (fechadas no Cadastro e abertas na simulação) aparecem em verde tracejado, com a venda estimada ("+0,3") e a hora em verde. Três resumos do dia ficam abaixo do gráfico.

**Why this priority**: É o que mostra o efeito do horário na venda, a razão da tela.

**Independent Test**: Fechar as horas finais de sábado e ver as barras listradas; abrir 07h e 21h e ver as barras verdes tracejadas e o resumo "Venda estimada nas horas novas".

**Acceptance Scenarios**:

1. **Given** um horário que fecha mais cedo que o do Cadastro, **When** o gráfico do dia é mostrado, **Then** as horas fechadas aparecem listradas em cinza e o resumo mostra "Venda que deixa de entrar no dia" em vermelho, "nas horas fechadas".
2. **Given** um horário que abre mais cedo ou fecha mais tarde que o do Cadastro, **When** o gráfico é mostrado, **Then** as horas novas aparecem em verde tracejado com o rótulo "+0,3" em verde, a hora em verde e a legenda "Hora nova · venda estimada" aparece.
3. **Given** um dia sem hora nova, **When** os resumos aparecem, **Then** trazem "Horas abertas, {dia}" ("sem alteração" ou "antes N h"), "Venda estimada no dia" e "Venda que deixa de entrar no dia".
4. **Given** um dia com hora nova, **When** os resumos aparecem, **Then** trazem "Horas abertas, {dia}" ("antes N h") e "Venda estimada nas horas novas" em verde ("+R$ …, por abrir mais neste dia").
5. **Given** o gráfico, **When** o pico do dia é calculado, **Then** a barra de maior valor entre as horas abertas é destacada em azul, com rótulo em negrito; horas fechadas e novas nunca são o pico.
6. **Given** um dia fechado no Cadastro e aberto na simulação, **When** o gráfico é mostrado, **Then** todas as horas abertas são "horas novas".

---

### User Story 3 - Resultado sempre à vista na direita (Priority: P1)

O card "Resultado da simulação" fica sempre na coluna da direita e acompanha a rolagem. Mostra o **saldo por mês** em destaque e as linhas, nesta ordem: **Folha extra · Hora extra · Venda que deixa de entrar · Venda estimada · Economia de folha · Horas abertas**, e o botão "Salvar como cenário N".

**Why this priority**: É a resposta da simulação; precisa estar visível enquanto a pessoa mexe nos horários.

**Independent Test**: Rolar a página e ver o Resultado acompanhando; aumentar um horário e ver "Venda estimada" ganhar valor e o saldo recalcular; reduzir e ver "Venda que deixa de entrar" ganhar valor.

**Acceptance Scenarios**:

1. **Given** uma simulação que reduz horários, **When** o Resultado é mostrado, **Then** "Venda que deixa de entrar" traz o valor por mês ("nas horas fechadas") e "Venda estimada" fica "R$ 0".
2. **Given** uma simulação que abre mais a loja, **When** o Resultado é mostrado, **Then** "Venda estimada" traz "+R$ …" em verde ("por mês, nas horas abertas a mais") e o saldo soma essa venda.
3. **Given** um saldo negativo, **When** o bloco é mostrado, **Then** o valor aparece em vermelho com o sinal "−" e "Esta simulação custa mais do que economiza."; com saldo positivo, em verde com "+" e "Esta simulação rende mais do que custa."
4. **Given** o saldo, **When** é calculado, **Then** vale `(economia de folha − folha extra − hora extra) + (venda estimada − venda que deixa de entrar)`; mostra também o valor por ano e o percentual do faturamento mensal.
5. **Given** uma tela larga, **When** a página rola, **Then** o Resultado continua visível à direita e não passa para baixo do conteúdo em nenhuma largura de computador.
6. **Given** uma loja sem venda hora a hora, **When** o Resultado é mostrado, **Then** a venda que deixa de entrar e o saldo não são estimados (nunca R$ 0) e o texto diz o que falta.

---

### User Story 4 - Lista e gráfico equilibrados (Priority: P2)

A lista de horários (largura fixa) e o gráfico (ocupa o resto) ficam lado a lado, com alturas equilibradas e sem espaço vazio visível embaixo do gráfico.

**Why this priority**: Acabamento visual; a tela funciona sem ele.

**Independent Test**: Abrir a Simulação a 1440 px e ver a lista e o gráfico alinhados, sem buraco embaixo do gráfico.

**Acceptance Scenarios**:

1. **Given** uma tela de 1440 px, **When** a Simulação abre, **Then** lista e gráfico aparecem lado a lado e o gráfico preenche a coluna ao lado, sem espaço vazio embaixo.
2. **Given** a dica de edição, **When** a tela é mostrada, **Then** fica embaixo: "+ e − mudam de 30 em 30 minutos. Também dá para digitar o horário."

---

### Edge Cases

- **Horas novas sem venda registrada:** a venda estimada vale 50% da venda da hora vizinha mais próxima do mesmo dia; sem nenhuma hora vizinha com venda, fica 0 e a barra mostra "0,0".
- **Dia fechado no Cadastro:** pode ser aberto na simulação (o Cenário 3 já abre o domingo); enquanto fechado, a linha mostra "Fechado" com a opção de abrir.
- **Dia que a simulação fecha:** fica "Fechado nesta simulação", com a opção de reabrir no horário do Cadastro; todas as horas do dia aparecem listradas.
- **Horário em 24:00:** aceito como fechamento (nunca como abertura).
- **Valores em reais:** só para o dono; os demais perfis veem horas, gráfico (sem R$) e os textos de apoio.
- **Loja sem base comercial por hora:** o gráfico mostra o aviso de hoje e o Resultado não estima venda.
- **Simulação gravada ou em uso (não editável):** campos e botões ficam bloqueados; o gráfico e o Resultado continuam visíveis.
- **Movimento reduzido nas preferências do sistema:** nenhuma animação nova.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada dia MUST ter abertura e fechamento com botões "+" e "−" (30 minutos por clique) e campo digitável, com limites de 00:00 a 24:00 e abertura sempre antes do fechamento; valor digitado inválido MUST voltar ao último válido; as setas ↑ e ↓ no campo MUST mudar o horário.
- **FR-002**: Os botões MUST ter nome acessível por dia e por campo (ex.: "Aumentar abertura de segunda", "Diminuir fechamento de sábado").
- **FR-003**: Cada linha de dia MUST mostrar a sigla e as horas abertas do dia, os dois campos, o selo "Alterado" (só se difere do Cadastro) em cima do link "Fechar dia", ambos centralizados; o rodapé MUST mostrar "N h abertas por semana · antes M h" e "Restaurar do Cadastro".
- **FR-004**: Um dia fechado MUST poder ser aberto, e um dia fechado pela simulação MUST poder ser reaberto; o dia fechado mostra "Fechado" (ou "Fechado nesta simulação") com a ação de abrir.
- **FR-005**: O gráfico MUST mostrar o dia escolhido (abas Seg a Dom, com semântica de abas), as horas de 06h a 21h e, se houver horário fora dessa faixa, as horas necessárias, com rótulos em R$ mil com uma casa decimal.
- **FR-006**: Cada barra MUST ter um destes estados: aberta, pico, fechada na simulação (listrada em cinza) ou hora nova (verde claro com borda tracejada verde, rótulo "+x,y" e hora em verde); a diferença nunca depende só de cor (textura e sinal "+" acompanham).
- **FR-007**: A legenda MUST trazer Pico, Demais horas, "Fechada na simulação" e, só se houver hora nova, "Hora nova · venda estimada"; a linha de apoio do gráfico MUST acrescentar "horas novas em verde, com venda estimada" quando houver hora nova.
- **FR-008**: Os três resumos do dia MUST seguir as regras das cenas 3 e 4 da História 2, com "Venda que deixa de entrar" em vermelho quando maior que zero e "Venda estimada nas horas novas" em verde.
- **FR-009**: O card Resultado MUST ficar à direita (360 px), fixo ao rolar, com o chip do modo, o saldo por mês em destaque e as linhas na ordem Folha extra, Hora extra, Venda que deixa de entrar, Venda estimada, Economia de folha, Horas abertas, mais o botão "Salvar como cenário N" e o texto de apoio.
- **FR-010**: A "Venda estimada" MUST ser a soma, por mês, da venda estimada das horas novas de todos os dias (50% da venda da hora vizinha onde não há venda registrada), sem valor para quem não é dono, e MUST ser "R$ 0" quando nenhum horário aumenta.
- **FR-011**: O saldo MUST ser calculado numa única função: `(economia de folha − folha extra − hora extra) + (venda estimada − venda que deixa de entrar)`; mostra o valor por ano e o percentual do faturamento mensal; sem dado, não é estimado (nunca R$ 0).
- **FR-012**: Os textos MUST usar só o vocabulário Folha extra, Hora extra, Venda que deixa de entrar, Venda estimada, Economia de folha, Horas abertas e Saldo por mês; "Venda que sai" e "margem" MUST sair da tela inteira.
- **FR-013**: A lista (400 px fixa) e o gráfico (restante) MUST ficar lado a lado, com a dica "+ e − mudam de 30 em 30 minutos. Também dá para digitar o horário." embaixo.
- **FR-014**: Verde de texto MUST usar o token `--text-success-strong` (#3E7500).
- **FR-015**: Esta entrega MUST NOT mudar as contratações, a hora extra, a folha extra nem a regra de qual cenário é sugerido; a Simulação continua gravando e comparando como hoje.

### Key Entities *(include if feature involves data)*

- **Horário simulado**: os sete dias com abertura e fechamento (ou fechado), contra o horário do Cadastro.
- **Hora da venda**: valor médio de venda de cada hora de cada dia da semana (já existe), mais a venda estimada de cada hora nova.
- **Resultado da simulação**: folha extra, hora extra, venda que deixa de entrar, venda estimada, economia de folha, horas abertas, saldo por mês e por ano, peso no faturamento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A abertura e o fechamento de qualquer dia mudam de 30 em 30 minutos com "+" e "−" e por digitação, em 100% dos dias, sem permitir horário inválido.
- **SC-002**: Ao reduzir um horário, as horas fechadas aparecem listradas e "Venda que deixa de entrar" ganha valor; ao aumentar, a hora nova aparece em verde, "Venda estimada" ganha valor e o saldo recalcula, tudo em menos de 1 segundo após o clique.
- **SC-003**: O Resultado fica visível à direita em todas as larguras de computador (1280 a 1920 px) durante toda a rolagem.
- **SC-004**: Para os dois exemplos do desenho (reduzindo: folha extra R$ 0, venda que deixa de entrar R$ 41.916, economia de folha R$ 1.641, saldo −R$ 40.275; abrindo mais: folha extra R$ 4.200, venda estimada R$ 9.100, saldo +R$ 4.900), a conta do saldo bate exatamente.
- **SC-005**: Nenhum texto da tela usa "Venda que sai" nem "margem", e nenhum texto verde usa o tom antigo de baixo contraste.
- **SC-006**: A lista e o gráfico ficam alinhados a 1440 px, sem espaço vazio visível embaixo do gráfico.

## Assumptions

- **Decisão (venda estimada)**: calculada no servidor, com a mesma regra dos cenários (50% da venda da hora vizinha onde não há venda registrada), para a tela e os cenários nunca mostrarem números diferentes. *Por quê*: hoje a Simulação não tem venda estimada; o servidor já tem a regra.
- **Decisão (saldo)**: a fórmula do pedido, isolada numa função. *Por quê*: o próprio pedido diz que ainda precisa de confirmação com o produto e quer a troca fácil.
- **Decisão (dia fechado)**: "Fechar dia" leva a "Fechado nesta simulação" com "Reabrir"; um dia fechado no Cadastro mostra "Fechado" com "Abrir". Será mostrado no plano antes de implementar. *Por quê*: o quadro não desenha esse estado.
- **Decisão (limites do gráfico)**: de 06h a 21h por padrão, ampliando para cobrir qualquer hora aberta. *Por quê*: lojas abrem antes das 8h ou depois das 20h.
- **Decisão (toque)**: botões de 32×20 px no computador, sem mudar para 44 px agora. *Por quê*: o pedido deixa a versão em toque para depois.
- **Decisão (vocabulário)**: "Venda que sai" vira "Venda que deixa de entrar" em toda a Simulação. *Por quê*: pedido.
- **Fora desta entrega**: versão para celular, o estado "dia fechado" desenhado, qualquer mudança em contratações, hora extra e folha extra.
- **Dependência**: usa o token de verde e os textos dos cartões de cenário (spec 024); esta branch parte da branch daquela entrega.
