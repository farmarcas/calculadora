# Feature Specification: Cartões de cenário B2 e painel "Dias e horários"

**Feature Branch**: `feat/cartoes-de-cenario-b2`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Refazer os cartões de Cenários sugeridos conforme os quadros 'Cenários · B2 · Custo e venda iguais, saldo em destaque' e 'Ver todos os dias (painel de detalhe)': sempre três cenários (Manter horários, Sem contratações, Equilíbrio), faixa de resultado com saldo em destaque e custo de folha e venda do mesmo tamanho, contratações com barras de horas, horas ociosas, faixa da semana com os dias alterados e painel 'Dias e horários' aberto por 'Ver todos os dias'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comparar os três cenários de relance (Priority: P1)

O dono vê três cartões lado a lado, sempre nesta ordem: **1 Manter horários**, **2 Sem contratações**, **3 Equilíbrio**. Cada cartão traz, em destaque, o **saldo da operação por mês** (folha e venda somadas) e, logo abaixo, dois blocos do mesmo tamanho: o que acontece com a **folha** e o que acontece com a **venda**. Abaixo vêm o status do cenário, a comparação com o Cenário 1, a descrição, as contratações, as horas ociosas e o horário da semana. O cartão do cenário sugerido tem borda azul, o selo "Cenário sugerido" e o botão principal; os outros trazem "Alternativa" e o botão de contorno.

**Why this priority**: É a tela de decisão do produto; o resto do pedido depende dela.

**Independent Test**: Abrir o Diagnóstico de uma loja com os três cenários e ver os cartões alinhados, o saldo como maior elemento da faixa, custo de folha e venda com o mesmo tamanho e cada valor colorido com sinal ou palavra.

**Acceptance Scenarios**:

1. **Given** uma loja com cenários calculados, **When** os cartões aparecem, **Then** são exatamente três, com os nomes "Manter horários", "Sem contratações" e "Equilíbrio", nessa ordem, e nunca um quarto.
2. **Given** um cenário com saldo positivo, **When** o cartão é mostrado, **Then** o saldo aparece como "+ R$ 29.280" em verde; com saldo negativo, "− R$ 6.480" em vermelho; com saldo zero, "R$ 0" em preto.
3. **Given** um cenário que acrescenta folha e perde venda, **When** a faixa de resultado é mostrada, **Then** a coluna da folha traz "CUSTO DE FOLHA" em vermelho com "a mais por mês" e a coluna da venda traz "VENDA QUE DEIXA DE ENTRAR" em vermelho com o percentual por mês, as duas com o mesmo tamanho.
4. **Given** um cenário que amplia horários, **When** a coluna da venda é mostrada, **Then** traz "VENDA ESTIMADA" em verde com "+x% por mês".
5. **Given** um cenário sem custo de folha nem perda de venda, **When** as colunas são mostradas, **Then** trazem "R$ 0" com "sem custo extra" e "Nenhuma" com "sem perda de venda", em preto.
6. **Given** três cartões com 0 a 4 contratações e 0, 3 ou 6 dias alterados, **When** a linha é mostrada, **Then** os blocos de cada cartão ficam alinhados (faixa de resultado, status, contratações, horas ociosas e horário na mesma altura).
7. **Given** um cenário que pode reduzir ou ampliar horários, **When** o Cenário 3 é mostrado, **Then** o nome e a posição continuam os mesmos; só mudam o texto e as cores da venda e do horário.

---

### User Story 2 - Ver o que muda em cada dia da semana (Priority: P1)

No bloco **Horário** do cartão há uma faixa de sete dias (Seg a Dom) que mostra quantas horas cada dia perde ou ganha, a legenda "N dias alterados" e o link **Ver todos os dias ›**. Ao clicar, abre o painel **Dias e horários** com o novo horário, o horário de antes e a diferença de cada dia, e o total da semana.

**Why this priority**: É o detalhe que o dono precisa para confiar num cenário que mexe em horário.

**Independent Test**: Num cenário com dias alterados, clicar em "Ver todos os dias", conferir a tabela e os totais, fechar com Esc e ver o foco voltar ao link.

**Acceptance Scenarios**:

1. **Given** um cenário que reduz horas em 3 dias, **When** o bloco Horário é mostrado, **Then** a faixa marca esses dias em amarelo com a diferença ("−5h") em vermelho, os demais em cinza com "–", e a legenda diz "3 dias alterados".
2. **Given** um cenário que amplia horas, **When** o bloco é mostrado, **Then** os dias ampliados ficam em verde com "+1h" em verde.
3. **Given** o cenário "Manter horários", **When** o bloco Horário é mostrado, **Then** traz só "Mantido, sem alterações", sem faixa e sem link.
4. **Given** o link "Ver todos os dias", **When** é clicado, **Then** abre um painel lateral pela direita (440 px) no computador, ou uma folha pela parte de baixo no celular, com título "Dias e horários", subtítulo "Cenário N · nome · reduzindo|ampliando horários" e o resumo "6 dias alterados · 75h por semana (−15h)".
5. **Given** o painel aberto, **When** a tabela é mostrada, **Then** traz as colunas "Dia", "Novo horário", "Antes" e "Diferença", dias alterados em negrito sobre fundo suave, dias iguais em cor secundária, "Fechado" para dia sem funcionamento, e o total "Total | 75h | 90h | −15h".
6. **Given** o painel aberto, **When** a pessoa clica em Fechar, no X, aperta Esc ou clica fora, **Then** ele fecha e o foco volta ao link "Ver todos os dias".
7. **Given** o painel aberto, **When** a pessoa clica em "Personalizar horários", **Then** abre a mesma tela do botão Personalizar do cartão.

---

### User Story 3 - Entender o que cada cenário contrata e o que sobra de ociosidade (Priority: P2)

O cartão lista **uma linha por contratação** (letra da função, nome, barra de horas e "42h integral" ou "16h parcial"), com o total "86h por semana", e uma linha de **horas ociosas da equipe** com as horas por semana e o percentual, e o custo por mês.

**Why this priority**: Explica o custo de folha, mas a decisão já cabe nos dois primeiros blocos.

**Independent Test**: Ver cartões com 0, 2 e 4 contratações; conferir a barra proporcional às horas e o "Nenhuma contratação" quando não há.

**Acceptance Scenarios**:

1. **Given** um cenário com contratações, **When** o bloco é mostrado, **Then** cada linha traz a letra da função (F Farmacêutico, A Atendente, C Caixa), o nome, a barra de horas e "Nh integral" ou "Nh parcial", e o cabeçalho traz o total por semana.
2. **Given** um cenário sem contratação, **When** o bloco é mostrado, **Then** traz "Nenhuma contratação" e o total some.
3. **Given** horas ociosas, **When** a linha é mostrada, **Then** traz "48h por semana (11%)" e abaixo "custam R$ 3.780 por mês", só para o dono (o valor em reais).

---

### Edge Cases

- **Loja sem venda hora a hora:** a venda que deixa de entrar e o saldo não são estimados (nunca R$ 0): o cartão mostra o aviso "Sem venda hora a hora, não é possível estimar a venda perdida", como hoje.
- **Quem não é dono:** os valores em reais não aparecem para gestor, consulta e operador; o saldo e as colunas mostram o aviso de que os valores são do dono, e o resto do cartão (contratações em horas, horário, painel de dias) continua visível.
- **Cenário inviável ou que não resolve sozinho:** mantém os avisos de hoje na linha de status.
- **Cenário 1 e comparação:** o Cenário 1 mostra "Referência para comparar os outros" no lugar da comparação.
- **Mudança de horário só em horas parciais (meia hora):** a diferença por dia e os totais aceitam meia hora ("−1,5h").
- **Dia fechado hoje e aberto no cenário (ou o contrário):** o painel mostra "Fechado" no lado correspondente e a diferença em horas inteiras do dia.
- **Painel aberto em tela pequena:** vira folha pela parte de baixo, com alça, botões em largura total e o principal em cima.
- **Movimento reduzido nas preferências do sistema:** o painel abre sem animação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela MUST mostrar sempre três cartões, na ordem Manter horários, Sem contratações e Equilíbrio, sem nunca criar um quarto.
- **FR-002**: Cada cartão MUST seguir esta ordem: selo e título com número, faixa de resultado, status e comparação com o Cenário 1, descrição, contratações, horas ociosas, horário da semana e botão Personalizar.
- **FR-003**: O cartão do cenário sugerido MUST ter borda azul, selo "CENÁRIO SUGERIDO" e botão principal; os demais "ALTERNATIVA" e botão de contorno. O cenário sugerido segue a regra de hoje (melhor saldo que resiste à metade da venda estimada).
- **FR-004**: A faixa de resultado MUST ter altura fixa e mostrar, nesta ordem: o rótulo "SALDO DA OPERAÇÃO POR MÊS", o saldo em tamanho maior que qualquer outro valor da faixa, "folha e venda somadas", e duas colunas de mesmo tamanho (folha e venda).
- **FR-005**: O saldo MUST ser calculado numa única função: `saldo = (economia de folha − custo de folha) + (venda estimada − venda que deixa de entrar)`, sempre contra a folha atual da loja. Soma faturamento com folha, não margem.
- **FR-006**: A coluna da folha MUST mostrar "CUSTO DE FOLHA" (vermelho, "a mais por mês"), "ECONOMIA DE FOLHA" (verde, "a menos por mês") ou "R$ 0" (preto, "sem custo extra"); a coluna da venda MUST mostrar "VENDA QUE DEIXA DE ENTRAR" (vermelho, percentual por mês), "VENDA ESTIMADA" (verde, "+x% por mês") ou "Nenhuma" (preto, "sem perda de venda").
- **FR-007**: Todo valor colorido MUST trazer sinal (+ ou −) ou palavra; cor nunca é a única indicação. Usa-se o sinal tipográfico "−" (U+2212), moeda "R$ 6.480", horas "75h" e faixas "08h–20h".
- **FR-008**: O texto verde MUST usar um tom mais escuro (token `--text-success-strong`, #3E7500) em todo texto verde, no lugar do verde atual do design system, que não tem contraste suficiente. Fundo de selo verde continua como é.
- **FR-009**: O bloco de contratações MUST ter altura fixa para quatro linhas, com uma linha por contratação (letra da função, nome, barra proporcional a horas ÷ 42 com máximo de 100%, e "Nh integral" quando são 42h ou "Nh parcial" quando menos), total por semana no cabeçalho e "Nenhuma contratação" quando vazio.
- **FR-010**: A linha de horas ociosas MUST mostrar as horas por semana e o percentual, e abaixo o custo por mês (este só para o dono).
- **FR-011**: O bloco Horário MUST mostrar as horas por semana do cenário e a diferença entre parênteses ("(−15h)" vermelho, "(+8h)" verde, sem parênteses se não mudou), a faixa de sete dias com a diferença de cada um, a legenda "N dias alterados" e o link "Ver todos os dias ›"; sem alteração mostra só "Mantido, sem alterações".
- **FR-012**: O painel "Dias e horários" MUST abrir pelo link, trazer título, subtítulo, resumo, tabela de sete dias com Novo horário, Antes e Diferença, o total e os botões "Fechar" e "Personalizar horários" (o mesmo fluxo do Personalizar do cartão).
- **FR-013**: O painel MUST fechar com o botão Fechar, o X, Esc e clique fora; o foco MUST ficar preso no painel enquanto aberto e voltar ao link ao fechar; MUST ter semântica de janela de diálogo; o link MUST anunciar que abre um diálogo.
- **FR-014**: A diferença de horas por dia e os totais MUST ser derivados da lista de dias do cenário (novo horário e horário de antes), sem guardar duas cópias.
- **FR-015**: Os valores em reais MUST aparecer só para o dono; as horas, o horário e o painel de dias aparecem para todos os perfis.
- **FR-016**: Os textos MUST usar só o vocabulário do produto ("Custo de folha", "Economia de folha", "Venda que deixa de entrar", "Venda estimada"); a palavra "margem" não aparece.
- **FR-017**: Esta entrega MUST NOT mudar as regras de cálculo dos cenários (quais horários fecham, quem contrata, o que é sugerido); só como o resultado é mostrado e o saldo absoluto contra a folha atual.

### Key Entities *(include if feature involves data)*

- **Cenário (cartão)**: nome, se é o sugerido, custo de folha com sinal, venda (perda ou estimada, com valor e percentual) ou ausente, status, comparação com o Cenário 1, descrição, contratações, horas ociosas, horário.
- **Contratação**: função (Farmacêutico, Atendente, Caixa), horas por semana; integral quando 42h, parcial quando menos.
- **Horas ociosas**: horas por semana, percentual e custo por mês.
- **Horário do cenário**: horas por semana novas e de antes e, por dia (Seg a Dom), o novo horário e o horário de antes (ou fechado); as diferenças e os totais saem daí.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nos três cartões, a faixa de resultado, o status, as contratações, as horas ociosas e o horário ficam alinhados com 0 a 4 contratações e com 0, 3 ou 6 dias alterados.
- **SC-002**: Em cada cartão, o custo de folha e a venda têm exatamente o mesmo tamanho, e o saldo é o maior elemento da faixa.
- **SC-003**: Nenhum texto verde usa o tom antigo de baixo contraste, e nenhum valor depende só de cor para ser entendido.
- **SC-004**: O painel "Dias e horários" abre, fecha com Esc, clique fora, Fechar e X, e devolve o foco ao link em 100% das vezes, e funciona a 1440 px e a 360 px sem rolagem horizontal.
- **SC-005**: Para os dados de exemplo do desenho (cenários 1, 2, 3 reduzindo e 3 ampliando), o saldo, a diferença por dia e os totais batem exatamente com os números do desenho.
- **SC-006**: Os cálculos e a escolha do cenário sugerido não mudam em relação à versão anterior: as lojas que tinham um cenário sugerido continuam com o mesmo.

## Assumptions

- **Decisão (saldo)**: o saldo é absoluto contra a folha atual, como no desenho (Cenário 1 mostra seu custo, por exemplo "− R$ 6.480"). *Por quê*: confirmado com a pessoa. A ordem dos cenários pelo saldo não muda, só o ponto de partida.
- **Decisão (sugerido)**: o selo "Cenário sugerido" segue a regra de hoje (melhor saldo que resiste à metade da venda estimada), e não fica fixo no Cenário 1. *Por quê*: confirmado com a pessoa; mantém o que o sistema já decide.
- **Decisão (funções)**: as contratações mostram só Farmacêutico, Atendente e Caixa. *Por quê*: Apoio e Perfumaria saíram do sistema inteiro, apesar de o desenho de exemplo mostrar uma linha de Apoio.
- **Decisão (integral)**: contratação "integral" é a de 42h; menos que isso é "parcial". *Por quê*: é a definição do pedido; precisa de validação com o produto e com a regra de jornada do servidor.
- **Decisão (verde)**: o verde de texto passa a #3E7500 por um token novo; o verde de fundo dos selos continua o do design system. *Por quê*: o verde atual de texto fica abaixo de 3:1 de contraste.
- **Decisão (valores)**: valores em reais só para o dono, como hoje. *Por quê*: regra existente de privacidade.
- **Decisão (campos novos)**: o que a tela precisa e o servidor ainda não entrega (horário de antes e novo por dia, horas ociosas por cenário) é acrescentado como campos opcionais, sem mudar os existentes. *Por quê*: nenhum outro consumidor depende do formato.
- **Fora desta entrega**: a regra de qual cenário é sugerido, o cálculo dos horários e das contratações, a tela de Personalizar e a Visão do grupo.
