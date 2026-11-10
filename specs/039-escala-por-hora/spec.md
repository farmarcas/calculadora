# Feature Specification: Escala por hora, com venda e contratação por função

**Feature Branch**: `feat/escala-por-hora`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Adicionar a visão 'Escala por hora': escalar a equipe hora a hora, com a venda e os clientes de cada hora no topo, a cobertura por função e a opção de contratar na linha de cada função, com turnos arrastáveis. Board: 'Diagnóstico · Escala por hora com venda e contratação por função'. Fica dentro da Simulação, e a entrega é uma só."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a escala do dia hora a hora (Priority: P1)

Dentro da Simulação, uma nova seção **Escala por hora** mostra, para o dia escolhido (abas Seg a Sáb, e Dom quando a loja abre), uma grade com uma coluna por hora de funcionamento: no topo a **Venda por hora** (R$, só o dono) e os **Clientes por hora** ("cupons vendidos"), com quatro tons do mais claro ao mais escuro conforme o movimento do dia; depois, para cada função (Farmacêutico, Atendimento, Caixa), uma linha-resumo com o número de pessoas escaladas em cada hora e o mínimo da função, e abaixo uma linha por pessoa com o turno em barra e o total da semana ("40h · 5 dias"). Dia de folga mostra "Folga".

**Why this priority**: É o coração do pedido: enxergar quem está na loja em cada hora, ao lado do movimento de vendas.

**Independent Test**: Abrir uma simulação de uma loja com base comercial, escolher a segunda-feira e ver a venda, os clientes, o número de pessoas por hora de cada função e o turno de cada pessoa.

**Acceptance Scenarios**:

1. **Given** uma simulação aberta, **When** a seção Escala por hora é vista, **Then** aparecem o cabeçalho das horas, a linha de clientes por hora e, para o dono, a de venda por hora, nas cores do quartil do dia.
2. **Given** uma função com 3 pessoas, **When** o dia é escolhido, **Then** a linha-resumo mostra quantas pessoas estão em cada hora e o mínimo da função ("mín. 1").
3. **Given** uma pessoa de folga no dia, **When** a linha dela é vista, **Then** mostra a barra "Folga".
4. **Given** uma função com chevron, **When** a pessoa recolhe, **Then** as linhas das pessoas dela somem e a linha-resumo continua.

---

### User Story 2 - Saber onde falta gente e por quê (Priority: P1)

A cobertura de cada hora aparece por função: verde claro quando atinge o mínimo e rosa com "N !" e borda vermelha quando fica abaixo (nunca só a cor). Quando alguma hora do dia escolhido fica abaixo do mínimo, uma **faixa amarela** acima da grade diz, por exemplo, "Faltam 3 h de farmacêutico no sábado, das 19h às 21h. Contratar na linha da função resolve." A faixa some quando a cobertura fecha.

**Why this priority**: É o motivo de olhar a escala: achar o buraco e resolver.

**Independent Test**: No sábado, com uma hora sem farmacêutico, ver a célula rosa com "0 !" e a faixa amarela; ao cobrir, as duas somem.

**Acceptance Scenarios**:

1. **Given** uma hora abaixo do mínimo, **When** a grade é vista, **Then** a célula é rosa, mostra "N !" e tem borda vermelha.
2. **Given** horas abaixo do mínimo no dia, **When** a tela é vista, **Then** a faixa amarela diz quantas horas faltam, de qual função e em que faixa.
3. **Given** a cobertura fecha, **When** a grade é revalidada, **Then** a faixa amarela some.

---

### User Story 3 - Contratar na linha da função e ver o efeito (Priority: P1)

Cada função tem o botão de texto **+ Contratar**, ao lado de "N pessoas". Ele abre, logo abaixo da linha da função (um por vez), o formulário **Contratar <função>**: "A contratação entra só na simulação. O Cadastro não muda.", com **Tipo** (Integral ou Parcial por semana), **Dias** (chips Seg a Sáb, vários), **Entra** e **Sai**, uma **sugestão automática** já preenchida (horário e dias que cobrem as horas sem cobertura, por exemplo "16h–22h na sexta e no sábado cobre as horas sem farmacêutico (19h às 21h)") e o **efeito na semana** ("cobre 3h sem farmacêutico · horário da loja sem mudança"; para o dono, também o custo de pessoal e a venda em %). **Adicionar à simulação** fecha o formulário, mostra a linha azul **Contratação simulada** ("Função · 16h parcial", botão "Remover" em vermelho, barra tracejada azul) e atualiza a cobertura, que marca com borda tracejada azul as horas reforçadas. **Cancelar** descarta.

**Why this priority**: É o que transforma a visão em ferramenta: resolver a falta sem sair da grade.

**Independent Test**: No sábado sem farmacêutico, abrir "+ Contratar" no Farmacêutico, aceitar a sugestão, adicionar e ver a falta fechar, a faixa amarela sumir e o total da semana crescer; remover e ver tudo voltar.

**Acceptance Scenarios**:

1. **Given** uma falta de cobertura, **When** o formulário abre, **Then** os campos já vêm com a sugestão que cobre as horas sem cobertura.
2. **Given** o formulário preenchido, **When** a pessoa mexe nos campos, **Then** o efeito na semana é recalculado antes de adicionar.
3. **Given** "Adicionar à simulação", **When** confirmado, **Then** a contratação aparece como linha azul sob a função, a cobertura atualiza e nada é gravado no Cadastro.
4. **Given** uma contratação simulada, **When** a pessoa clica em "Remover", **Then** a linha some e a cobertura volta ao estado anterior.
5. **Given** dois botões "+ Contratar", **When** a pessoa abre o segundo, **Then** o primeiro formulário fecha (um aberto por vez).

---

### User Story 4 - Arrastar e redimensionar turnos (Priority: P2)

Em cada linha de pessoa, a barra do turno pode ser **arrastada** para mover o turno e ter as **bordas** puxadas para mudar o início e o fim (de 15 em 15 minutos); a contratação simulada se comporta igual. A cobertura e a faixa de aviso são revalidadas em tempo real, e a mudança vale só para esta simulação.

**Why this priority**: Dá controle fino sobre a escala, depois de a visão e a contratação existirem.

**Independent Test**: Arrastar o turno de uma farmacêutica duas horas para a frente e ver a cobertura de cada hora e a faixa amarela mudarem na hora.

**Acceptance Scenarios**:

1. **Given** um turno, **When** é arrastado, **Then** o início e o fim mudam juntos e a cobertura é recalculada.
2. **Given** uma borda, **When** é puxada, **Then** só o início ou só o fim muda.
3. **Given** uma mudança que gera erro de regra (jornada, intervalo), **When** acontece, **Then** o sistema avisa como a Simulação já faz e não deixa gravar com erro.

---

### User Story 5 - O que cada perfil vê e faz (Priority: P2)

O **dono** vê a linha Venda por hora (R$) e o efeito em % de custo de pessoal e venda no formulário. O **gestor** não vê a linha de venda nem custo e venda no efeito: vê clientes por hora, cobertura e horas, e pode contratar e arrastar. O **visualizador** só lê: sem "+ Contratar", sem arrastar e sem "Remover". Nenhum R$ aparece para gestor e visualizador.

**Why this priority**: Garante a regra de que valores em reais são só do dono.

**Independent Test**: Abrir a mesma simulação como dono, gestor e visualizador e comparar o que cada um vê e pode fazer.

**Acceptance Scenarios**:

1. **Given** o gestor, **When** a grade é vista, **Then** não há linha de venda por hora e o efeito mostra só cobertura e horas.
2. **Given** o visualizador, **When** a grade é vista, **Then** não há "+ Contratar", nem arrastar, nem "Remover".

---

### User Story 6 - Sem dados, sem seleção e celular (Priority: P3)

Sem venda por hora na base, a linha de clientes mostra "Sem clientes por hora nesta base" (e a de venda não aparece). Sem turno selecionado, a faixa de contexto mostra "Nenhum turno selecionado"; com um turno selecionado, mostra a contratação ou o turno em azul-claro. Dia sem dados ou fechado mostra uma mensagem simples. No **celular**, a grade vira uma lista por função com o turno de cada pessoa em texto ("07h–15h"), a cobertura por hora em uma faixa horizontal com rolagem e o "+ Contratar" como botão de cada função.

**Why this priority**: Evita telas vazias e leva a visão ao celular.

**Independent Test**: Abrir uma loja sem base comercial e ver a mensagem de clientes; abrir no celular e ver a lista por função.

**Acceptance Scenarios**:

1. **Given** uma loja sem base comercial, **When** a seção é vista, **Then** a mensagem de dados aparece no lugar das linhas de venda e clientes, e a cobertura segue funcionando.
2. **Given** o celular de 375 px, **When** a seção é vista, **Then** não há rolagem para o lado da página e cada função mostra seus turnos em texto.

---

### Edge Cases

- Dia fechado na simulação: aparece "Fechado" no lugar da grade; a aba do dia fica visível.
- Hora fora do turno da loja (turno que começa antes da abertura): só as horas abertas contam para a cobertura.
- Contratação sem horas válidas (entra depois do sai): o formulário não deixa adicionar e explica.
- Contratação parcial acima do limite de 30 horas por semana: o formulário avisa e não deixa adicionar.
- Função sem ninguém no quadro e sem mínimo: a linha mostra "0 pessoas" e só tem o "+ Contratar".
- Mudança em outro passo da simulação (horário da loja): a grade acompanha o novo horário.
- Simulação gravada (não editável): a grade é só leitura, como para o visualizador.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST mostrar, dentro da Simulação, a seção "Escala por hora" com abas dos dias abertos (Seg a Sáb e Dom quando a loja abre), cabeçalho das horas e uma coluna por hora de funcionamento do dia.
- **FR-002**: O sistema MUST mostrar a linha "Clientes por hora" (cupons vendidos) e, só para o dono, a linha "Venda por hora" (R$), com quatro tons por quartil do dia e a média do dia à direita.
- **FR-003**: O sistema MUST mostrar, por função, a linha-resumo com o número de pessoas escaladas por hora, o mínimo da função ("mín. N") e o botão "+ Contratar", e uma linha por pessoa com o turno e o total da semana.
- **FR-004**: A cobertura MUST marcar em verde as horas que atingem o mínimo e, abaixo do mínimo, em rosa com "N !" e borda vermelha; nunca depender só da cor.
- **FR-005**: O sistema MUST mostrar uma faixa amarela quando alguma hora do dia escolhido fica abaixo do mínimo, dizendo quantas horas faltam, de qual função e em que faixa, e MUST escondê-la quando a cobertura fecha.
- **FR-006**: "+ Contratar" MUST abrir, abaixo da linha da função (um por vez), um formulário com Tipo, Dias, Entra, Sai, a sugestão automática preenchida e o efeito na semana.
- **FR-007**: O efeito na semana MUST mostrar as horas cobertas e se o horário da loja muda; para o dono, MUST acrescentar o custo de pessoal e a venda em %; gestor e visualizador MUST NOT ver custo nem venda.
- **FR-008**: "Adicionar à simulação" MUST criar a contratação simulada (linha azul, "Função · Nh parcial" e botão "Remover"), atualizar a cobertura, marcar as horas reforçadas com borda tracejada azul e atualizar o total da semana, sem gravar nada no Cadastro.
- **FR-009**: Os turnos, inclusive o da contratação simulada, MUST poder ser arrastados e ter as bordas redimensionadas (de 15 em 15 minutos), com a cobertura e a faixa de aviso revalidadas em tempo real.
- **FR-010**: O visualizador MUST só ler: sem "+ Contratar", sem arrastar e sem "Remover"; a simulação gravada também é só leitura.
- **FR-011**: O sistema MUST mostrar os estados vazios: sem base comercial ("Sem clientes por hora nesta base"), sem turno selecionado ("Nenhum turno selecionado") e dia fechado ou sem dados.
- **FR-012**: No celular, a seção MUST virar uma lista por função, com o turno de cada pessoa em texto, a cobertura por hora em faixa horizontal com rolagem e "+ Contratar" por função, sem rolagem lateral da página.
- **FR-013**: O sistema MUST usar textos em português, curtos, em sentence case, sem emoji e com o sinal "−" tipográfico, e MUST usar só cores do Design System (propondo token novo onde faltar).
- **FR-014**: O sistema MUST NOT gravar a contratação simulada nem mudanças de turno no Cadastro; elas valem só para a simulação em edição e entram no cálculo do resultado dela.
- **FR-015**: O sistema MUST NOT mostrar valores em reais para gestor e visualizador, e MUST NOT mexer nas outras seções do Diagnóstico nem nos outros passos da Simulação.

### Key Entities

- **Escala do dia**: as pessoas da simulação (do quadro e as vagas) com o turno de cada uma no dia escolhido.
- **Cobertura por hora e função**: quantas pessoas de cada função estão na loja em cada hora, contra o mínimo exigido.
- **Contratação simulada**: uma vaga da simulação, com função, dias, horário e tipo (integral ou parcial), que existe só na simulação.
- **Efeito da contratação**: horas cobertas, mudança no horário da loja e, para o dono, a variação em % do custo de pessoal e da venda.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa acha a hora com falta de cobertura e a função em até 5 segundos.
- **SC-002**: Uma pessoa resolve uma falta de cobertura adicionando a contratação sugerida em até 3 cliques.
- **SC-003**: A cobertura e a faixa de aviso atualizam em menos de 1 segundo depois de arrastar, redimensionar, adicionar ou remover.
- **SC-004**: Nenhum "R$" aparece para gestor e visualizador em nenhuma parte da seção.
- **SC-005**: 100% das horas abaixo do mínimo têm "N !" e borda vermelha.
- **SC-006**: No celular de 375 px, a página não rola para o lado e todas as funções têm seu "+ Contratar".

## Assumptions

- Decision: a visão fica dentro da Simulação (passo da tela Personalizar), onde já existem vagas, horário e cobertura; o Diagnóstico não ganha seção nova. Why: a contratação simulada só existe dentro de uma simulação, e o Diagnóstico não tem rascunho (resposta do dono).
- Decision: a entrega é uma só (visão, contratar e arrastar turnos), conduzida em fatias internas. Why: pedido do dono.
- Decision: a "contratação simulada" é uma vaga da simulação (as mesmas vagas do passo Contratações); adicionar ou remover aqui e lá é a mesma coisa. Why: um só conceito de vaga.
- Decision: no formulário, "Integral" usa a jornada cheia da regra e "Parcial" usa as horas dos dias escolhidos, até 30 horas por semana; as horas semanais da vaga vêm da soma dos turnos. Why: é o limite e o cálculo que o sistema já tem.
- Decision: o efeito em venda mostra o que o sistema já calcula (a venda só muda com o horário da loja, então cobrir uma falta sem mudar o horário mostra ● 0%). O "+0,9% (estimado)" do board não tem regra no sistema e não será inventado. Why: não existe hoje um cálculo do efeito de uma contratação na venda.
- Decision: o mínimo da função é o do turno do dia; "mín. N + reforço" aparece quando o mínimo muda ao longo do dia. Why: o sistema já guarda mínimos por turno.
- Decision: o celular segue a sugestão do board (lista por função, faixa de cobertura com rolagem, botão por função), já que o board diz "confirmar com o design". Why: não travar a entrega.
- Fora do escopo: seção nova no Diagnóstico, mudar a regra do cálculo da cobertura, gravar escala no Cadastro, e os outros passos da Simulação.
