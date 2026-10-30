# Feature Specification: Simulação do cenário em 3 passos

**Feature Branch**: `feat/simulacao-em-3-passos`
**Created**: 2026-10-30
**Status**: Draft
**Input**: Refatorar a tela de simulação (que abre em "Personalizar" nos Cenários sugeridos) em 3 passos numerados, com um painel fixo de resultado, e permitir testar outros horários de funcionamento com o impacto recalculado.

## Situação de hoje

- "Personalizar" cria uma simulação a partir do cenário escolhido. A tela atual mostra o quadro de turnos, as vagas simuladas, a grade por hora, a cobertura e uma lista de erros, tudo ao mesmo tempo, e só estima o custo mensal da folha.
- Não dá para testar outro horário de funcionamento (abrir mais tarde, fechar mais cedo, fechar um dia) e ver quanto de venda e de margem se perde. Esse cálculo existe hoje apenas nos cenários sugeridos.
- O impacto em reais aparece espalhado e repetido; a pessoa precisa somar de cabeça.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o resultado num painel único, ao lado dos passos (Priority: P1)

Ao clicar em "Personalizar", a pessoa vê a simulação em três passos numerados (Horário e vendas, Contratações por função, Escala da semana) e, ao lado, um painel fixo "Resultado da simulação" com o **impacto por mês** uma única vez, e abaixo dele as linhas: folha extra, hora extra, venda que sai, margem perdida e horas abertas por semana.

**Why this priority**: é o ganho central do redesenho: menos informação ao mesmo tempo e um número só para decidir.

**Independent Test**: abrir "Personalizar" num cenário com contratações; o painel mostra o impacto, as cinco linhas e o botão de salvar, sem repetir o valor em outro bloco.

**Acceptance Scenarios**:
1. **Given** um cenário que só contrata, **When** a simulação abre, **Then** o painel mostra o impacto igual ao do cenário, folha extra com a soma das contratações, hora extra, venda que sai e margem perdida zeradas e as horas abertas atuais.
2. **Given** a tela aberta, **When** a pessoa rola os passos, **Then** o painel continua visível ao lado (em telas largas).
3. **Given** uma tela estreita (abaixo de ~1100 px), **When** a simulação abre, **Then** o painel aparece abaixo do passo 3, sem ficar fixo.
4. **Given** qualquer alteração na regra, no horário ou nas contratações, **When** o cálculo termina, **Then** o painel e a tabela se atualizam sem a tela pular de lugar.

---

### User Story 2 - Testar outro horário de funcionamento sem mexer no Cadastro (Priority: P1)

No topo, o seletor "Horário" tem "Manter horários" (padrão, lista só de leitura, igual ao Cadastro) e "Mudar horários" (lista editável: abertura e fechamento de cada dia). Ao mudar, o painel recalcula: horas abertas, venda que sai, margem perdida e as horas de farmacêutico e das demais funções necessárias. Voltar para "Manter" descarta as edições.

**Why this priority**: é a pergunta de negócio que hoje não tem resposta na simulação: "e se eu fechar mais cedo?".

**Independent Test**: em "Mudar horários", fechar a loja às 20h de segunda; o painel passa a mostrar venda e margem que saem e menos horas abertas, e o Cadastro continua igual.

**Acceptance Scenarios**:
1. **Given** "Manter horários", **When** a pessoa olha a lista, **Then** ela é só de leitura, com "Igual ao Cadastro" e o rodapé "X h abertas por semana · antes Y h".
2. **Given** "Mudar horários", **When** a pessoa muda o fechamento de um dia, **Then** o total do dia e o rodapé recalculam, a linha ganha a marca "Alterado" e o painel recalcula.
3. **Given** "Mudar horários" sem nenhuma alteração, **Then** o painel mostra "Nenhuma alteração de horário ainda. Edite a lista para recalcular o impacto."
4. **Given** um fechamento menor ou igual à abertura, **Then** aparece erro ao lado do campo, em texto e ícone (não só cor), e o cálculo não muda até a correção.
5. **Given** edições feitas, **When** a pessoa volta para "Manter horários", **Then** o sistema pede confirmação e, aceita, descarta as edições.
6. **Given** "Restaurar do Cadastro", **When** clicado, **Then** todos os dias voltam ao horário do Cadastro.
7. **Given** o domingo fechado no Cadastro, **Then** ele aparece como "Fechado" desabilitado; se o Cadastro permitir abrir domingo, aparece com dois campos como os demais dias.
8. **Given** um horário que corta horas com venda, **Then** essas horas aparecem como "Fechada na simulação" no gráfico e a venda e a margem delas entram em "Venda que sai" e "Margem perdida".

---

### User Story 3 - Ver a venda por hora do dia (Priority: P2)

No passo 1, ao lado da lista de horários, um gráfico mostra a venda (R$) ou os clientes por hora, de um dia da semana escolhido. As horas de maior venda ficam em destaque, só o maior pico leva rótulo, e as demais mostram o valor ao passar o mouse. O gráfico tem altura fixa para a tela não pular ao trocar de dia ou métrica.

**Independent Test**: trocar o dia e a métrica; as barras mudam e a legenda "Pico / Demais horas / Fechada na simulação" aparece.

**Acceptance Scenarios**:
1. **Given** uma loja com base comercial, **Then** o gráfico mostra 15 barras (07h a 21h) do dia escolhido e a frase "ticket médio ... dados do sistema de vendas".
2. **Given** uma loja sem base comercial, **Then** o gráfico mostra um aviso claro de que falta a base, e a venda e margem que saem ficam como "sem dado", nunca como zero.
3. **Given** o valor em reais, **Then** só o dono o vê; os demais perfis veem clientes e horas.

---

### User Story 4 - Contratações por função com resultado e custo (Priority: P1)

O passo 2 lista as funções (Farmacêutico, Atendimento, Caixa). Para cada uma: a situação de hoje ("Faltam 10h por semana", "2 dias de trabalho"), as contratações simuladas (cada uma com valor e "Remover"), os botões "+ Integral 40h", "+ Parcial 16h" e "+ Parcial 24h", o resultado ("Coberto, sobram 6h por semana" ou "Ainda falta, faltam Xh") e o custo por mês. O rodapé mostra o total por mês e o número de contratações simuladas, e diz se há hora extra.

**Independent Test**: adicionar e remover contratações; resultado, custo, rodapé e painel mudam juntos.

**Acceptance Scenarios**:
1. **Given** uma função com falta de horas, **When** a pessoa adiciona "+ Parcial 16h", **Then** o resultado e o custo por mês dessa função atualizam, e o total do rodapé e o painel acompanham.
2. **Given** "Mudar horários" que reduz as horas abertas, **Then** as horas necessárias por função, "Situação hoje" e "Resultado" recalculam.
3. **Given** a explicação "Custo = salário médio da função × carga × (1 + encargos de X%)", **Then** X é o total de encargos do regime da loja.
4. **Given** perfil sem acesso a valores, **Then** os custos em reais não aparecem; ficam as horas e o resultado.

---

### User Story 5 - Escala da semana por pessoa (Priority: P2)

O passo 3 mostra a escala em grade (colaborador × segunda a domingo), agrupada por função ("Farmacêutico · 3 pessoas"), com a cor da função, "Folga" tracejada e "Fechada" quando a loja não abre. Mostra as primeiras pessoas e o link "Ver mais N pessoas". Clicar num dia permite ajustar por hora (o ajuste de turnos que existe hoje continua disponível).

**Acceptance Scenarios**:
1. **Given** uma função com mais pessoas que o limite exibido, **Then** aparece "Ver mais N pessoas".
2. **Given** um dia fechado na simulação, **Then** as células desse dia mostram "Fechada".

---

### User Story 6 - Salvar como cenário e marcar como em uso (Priority: P1)

O painel tem um botão principal "Salvar como cenário N" (N aumenta a cada cenário salvo da loja) com a ajuda "Guarde este cenário e continue ajustando para comparar." No cabeçalho, só "Marcar como em uso" (para o dono), além de "Voltar" para os cenários. Não existe botão "Gravar" no cabeçalho.

**Acceptance Scenarios**:
1. **Given** erros que impedem a gravação, **When** a pessoa tenta salvar, **Then** o botão fica desabilitado com o motivo ao alcance.
2. **Given** "Salvar como cenário 1", **When** salvo, **Then** a simulação fica guardada como cenário 1 e o próximo botão passa a dizer cenário 2.
3. **Given** o perfil que não é dono, **Then** "Marcar como em uso" não aparece.
4. **Given** "Voltar", **Then** a pessoa retorna aos cenários sugeridos.

### Edge Cases

- Loja sem base comercial: sem gráfico de vendas; venda que sai e margem perdida aparecem como "sem dado" (não zero).
- Loja sem margem bruta informada: margem perdida como "não informada".
- Todos os dias fechados na simulação, ou fechamento antes da abertura: bloqueia o cálculo e mostra erro.
- Dois ajustes seguidos rápidos: vale o último; a tela mostra carregamento só nos valores.
- Simulação já em uso ou substituída: abre só para leitura (clonar para ajustar), como hoje.
- Troca de regra (42h/40h): recalcula tudo, mantendo as contratações e horários editados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de simulação tem cabeçalho (Voltar, título "Simulação" com o nome da loja, "Marcar como em uso" para o dono), uma barra de parâmetros e o corpo em duas colunas: três passos à esquerda e o painel de resultado à direita.
- **FR-002**: A barra de parâmetros traz Regra (42h | 40h), Horário (Manter horários | Mudar horários), o regime e o percentual de encargos da loja, as marcas do perfil da loja e "Maior venda" (dias e horas de maior venda).
- **FR-003**: O painel mostra o impacto por mês uma única vez e as linhas folha extra, hora extra, venda que sai, margem perdida e horas abertas por semana, cada uma com seu subtexto.
- **FR-004**: "Mudar horários" permite editar abertura e fechamento de cada dia, com validação (fechamento maior que abertura), total do dia, rodapé "X h abertas por semana · antes Y h", marca "Alterado" e "Restaurar do Cadastro". Nada disso altera o Cadastro da loja.
- **FR-005**: Ao mudar o horário, o sistema recalcula horas abertas, venda e margem que saem (pela base comercial), horas necessárias por função e o impacto total.
- **FR-006**: O gráfico de vendas por hora (venda R$ ou clientes) do dia escolhido tem altura fixa, destaque de pico, legenda e horas "Fechada na simulação".
- **FR-007**: O passo 2 permite adicionar e remover contratações (Integral 40h, Parcial 16h, Parcial 24h) por função e mostra situação de hoje, resultado, custo por mês e total.
- **FR-008**: O passo 3 mostra a escala semanal agrupada por função, com "Ver mais N pessoas" e ajuste por hora ao clicar no dia.
- **FR-009**: "Salvar como cenário N" guarda a simulação com numeração sequencial por loja; "Marcar como em uso" é só do dono; não há "Gravar" no cabeçalho.
- **FR-010**: Valores em reais (impacto, folha, margem, venda) só aparecem para o dono, como no restante do módulo.
- **FR-011**: Todo valor tem unidade e período explícitos ("por semana", "por mês"); formato pt-BR e sinal de menos "−".
- **FR-012**: Ao recalcular, o layout e o painel ficam no lugar; só os valores mostram carregamento.
- **FR-013**: Acessibilidade: nada só por cor; seletores com estado anunciado; campos de hora e botões com alvo de pelo menos 40 px e teclado; foco visível; o valor do impacto é anunciado ao mudar.
- **FR-014**: Em telas estreitas o painel desce para depois do passo 3 e deixa de ser fixo.
- **FR-015**: Os números mostrados vêm sempre do cálculo do sistema (nenhum valor de exemplo do desenho).

### Key Entities

- **Simulação**: parte de um cenário da loja; guarda a regra, o horário (do Cadastro ou editado), as contratações simuladas e os turnos; tem número de cenário quando salva.
- **Horário simulado**: abertura e fechamento por dia da semana usados só na simulação.
- **Resultado da simulação**: impacto por mês, folha extra, hora extra, venda que sai, margem perdida, horas abertas.
- **Contratação simulada**: função, tipo (integral 40h, parcial 16h ou 24h) e custo mensal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O impacto em reais aparece uma única vez na tela.
- **SC-002**: Mudar o fechamento de um dia mostra o novo impacto em até 2 segundos, sem a tela pular.
- **SC-003**: Sem edição de horário, o impacto da simulação é igual ao do cenário de origem.
- **SC-004**: A tela não tem rolagem horizontal em nenhuma largura entre 360 e 1920 px.
- **SC-005**: Uma pessoa testa "e se fechar mais cedo?" e salva o resultado como cenário em até 1 minuto.

## Assumptions

- **Decision**: "Salvar como cenário N" reaproveita o "gravar" que já existe; "Marcar como em uso" reaproveita a aprovação do dono. **Why**: evita criar outro fluxo de estados.
- **Decision**: a venda e a margem perdidas usam a base comercial por hora da loja (já carregada) e a margem bruta do cadastro. **Why**: é a mesma conta dos cenários sugeridos; mantém um só cálculo.
- **Decision**: o horário editado fica guardado na simulação, nunca no Cadastro. **Why**: pedido explícito.
- Quem edita e salva: gestor e dono; consulta só lê. Valores em reais só para o dono.
- Fora desta entrega: mudar o Cadastro a partir da simulação, simular substituição de pessoas e comparar dois cenários lado a lado (a comparação atual continua como está).
- Dado não encontrado no código e que depende de definição: o "ticket médio" do gráfico só aparece quando a base traz clientes; a base por hora carregada recentemente não traz clientes, então a frase aparece sem ticket médio nesses casos.
