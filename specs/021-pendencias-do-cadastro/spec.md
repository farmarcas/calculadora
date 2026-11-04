# Feature Specification: Painel "O que falta preencher" no Cadastro de loja

**Feature Branch**: `feat/pendencias-do-cadastro`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "Implementar no Cadastro de loja o painel 'O que falta preencher' (variação B, faixa compacta com expansão), conforme o design do Claude Design: lista de todas as pendências de uma vez, contador nas abas, destaque nos campos, botão Preencher que leva ao campo, e a lista de lojas mostrando 'N pendências'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver tudo o que falta de uma vez (Priority: P1)

Quem abre uma loja em "Revisar" vê, no topo do detalhe, uma faixa amarela "Faltam N itens para o cadastro ficar completo", com "X de Y feitos" e uma barra de progresso. Hoje só aparece o primeiro motivo, e a pessoa descobre o próximo só depois de corrigir o anterior.

**Why this priority**: É o problema central: não dá para saber o tamanho do que falta nem onde preencher.

**Independent Test**: Abrir uma loja sem nenhum dado e conferir que a faixa lista todas as pendências agrupadas por aba, com a contagem correta.

**Acceptance Scenarios**:

1. **Given** uma loja em "Revisar", **When** o detalhe abre, **Then** a faixa amarela aparece aberta, com o título, "X de Y feitos" e os itens agrupados por aba (Dados e funcionamento, Equipe, Regras e custos), cada um com uma linha de texto e o botão "Preencher".
2. **Given** uma loja completa, **When** o detalhe abre, **Then** não há faixa amarela; aparece só uma confirmação discreta: "Cadastro completo. Todas as informações foram preenchidas."
3. **Given** o painel aberto, **When** a pessoa usa "Esconder", **Then** ele vira a faixa compacta com "Ver o que falta" e o estado fica anunciado a leitores de tela.
4. **Given** qualquer perfil, **When** o painel mostra um item, **Then** nenhum valor em reais aparece, só o que falta.

---

### User Story 2 - Ir direto ao campo que falta (Priority: P1)

Cada item tem "Preencher" (no faturamento do mês divergente, "Conferir"). O clique troca para a aba certa, rola até o campo, dá foco nele e recolhe o painel para o campo aparecer sem rolar. Os campos pendentes ficam destacados em amarelo, com o selo "Preencher" e uma frase curta do porquê.

**Why this priority**: Sem isso o aviso diz o que falta, mas não onde.

**Independent Test**: Clicar em "Salário médio · Farmacêutico" e conferir que abre "Regras e custos" com o foco no campo certo.

**Acceptance Scenarios**:

1. **Given** um item pendente, **When** a pessoa clica em "Preencher", **Then** a aba certa abre, o campo fica centralizado e com foco visível, o painel recolhe e o leitor de tela anuncia o nome do campo e o motivo.
2. **Given** um campo pendente, **When** a pessoa digita um valor válido, **Then**, antes de salvar, o selo vira "✓ Preenchido" (verde), o motivo some, o item vira "Feito" no painel e a contagem cai ("Faltam 2 itens" é anunciado).
3. **Given** que a pessoa apaga de novo o valor, **When** o campo fica vazio, **Then** o destaque amarelo volta e a pendência reaparece.
4. **Given** pendências de faturamento por dia, **When** o painel e a aba aparecem, **Then** só as linhas dos dias sem valor ficam destacadas; nos salários, só as funções que faltam.

---

### User Story 3 - Saber quais abas têm pendência (Priority: P2)

Cada aba com pendência mostra um contador amarelo ao lado do nome ("Equipe (5) 1"), lido como "1 pendência". O contador some quando a aba não tem pendência.

**Why this priority**: Orienta antes de abrir o painel.

**Independent Test**: Loja com uma pendência só em Equipe mostra o contador só nessa aba.

**Acceptance Scenarios**:

1. **Given** pendências em abas diferentes, **When** o detalhe abre, **Then** cada aba mostra o seu número, não só uma cor.
2. **Given** que uma pendência é resolvida, **When** o campo fica válido, **Then** o contador da aba cai na hora.

---

### User Story 4 - A lista de lojas mostra quantas pendências (Priority: P2)

Na lista, a loja em "Revisar" mostra uma segunda linha "N pendências · principal motivo" (principal = primeira pendência na ordem de verificação). A etiqueta Completo/Revisar e o filtro "Cadastro: a revisar" continuam.

**Why this priority**: Dá a dimensão do trabalho por loja antes de abrir.

**Independent Test**: Duas lojas com 3 e 1 pendências mostram "3 pendências · …" e "1 pendência · …".

**Acceptance Scenarios**:

1. **Given** uma loja em "Revisar", **When** a lista é exibida, **Then** a linha mostra a contagem e o principal motivo em texto curto, em uma linha, com reticências se não couber.
2. **Given** uma loja completa, **When** a lista é exibida, **Then** nada muda além da etiqueta verde.
3. **Given** que o cadastro é salvo e fica completo, **When** a lista atualiza, **Then** a etiqueta passa a Completo e a linha de pendências some.

---

### User Story 5 - Quem não pode preencher vê quem pode (Priority: P2)

Itens que dependem de faturamento, margem ou salários só podem ser preenchidos pelo dono do grupo. Para os demais perfis, esses itens aparecem com "Só o dono do grupo preenche", sem botão. O título acrescenta "1 você pode preencher · 2 só o dono do grupo", e os contadores das abas contam só o que a pessoa pode resolver.

**Why this priority**: Evita um botão que leva a um campo que a pessoa nem vê.

**Independent Test**: Como gestor, a loja sem margem e sem farmacêutico mostra o item da margem sem botão e o do farmacêutico com botão.

**Acceptance Scenarios**:

1. **Given** o perfil gestor, **When** o painel abre, **Then** os itens de faturamento, margem e salários aparecem com "Só o dono do grupo preenche" e sem botão.
2. **Given** o perfil Somente consulta, **When** o painel abre, **Then** nenhum item tem botão e o texto diz que não há permissão para editar.
3. **Given** o gestor, **When** vê as abas, **Then** nada é escondido do que ele vê hoje (incluindo "Regras e custos", com Convenção coletiva e Mínimo de pessoas); a seção de custos continua sendo só do dono.

---

### User Story 6 - Uso no celular (Priority: P3)

Em 360 px o painel começa recolhido numa faixa de 56 px com o título e "X de Y feitos"; expande numa lista empilhada, com botão "Preencher" de largura total e alvos de toque de pelo menos 44 px; as abas rolam na horizontal com o contador visível.

**Independent Test**: Em 360 px, a faixa recolhida cabe sem rolagem lateral e o botão tem 44 px.

### Edge Cases

- **Item que não se aplica:** sem divergência de faturamento ou sem pessoas em Atendimento/Caixa, o item não existe e não entra na conta (o total pode ser menor que 9).
- **Loja sem nenhum dia aberto:** o faturamento por dia não é cobrado enquanto o funcionamento não estiver definido.
- **Mais de uma coisa faltando no mesmo item:** "Dados da loja" lista só o que falta (nome, cidade, UF, regime).
- **Cadastro com alterações não salvas:** o aviso padrão de sair sem salvar continua.
- **Salvar com pendência que sobrou:** o painel e a lista mostram o que ainda falta.
- **Equipe vazia ou só com função fora do cálculo:** o item do farmacêutico fica pendente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST calcular a lista de pendências de uma loja por uma única regra, com itens estáveis: dados da loja, funcionamento, faturamento por dia, faturamento do mês divergente, margem bruta, farmacêutico na equipe, salário do Farmacêutico, e o salário de Atendimento e de Caixa quando há pessoas nessas funções.
- **FR-002**: A mesma regra MUST alimentar o painel, os contadores das abas, a linha da lista de lojas e a etiqueta Completo/Revisar, de modo que nunca divirjam.
- **FR-003**: O painel MUST mostrar todas as pendências de uma vez, agrupadas por aba, com contagem, "X de Y feitos" e barra de progresso, aberto por padrão em lojas em "Revisar" e recolhível.
- **FR-004**: Cada item MUST ter uma linha de texto curta e o botão "Preencher" (ou "Conferir" no faturamento divergente); o clique MUST abrir a aba, rolar até o campo, dar foco e recolher o painel.
- **FR-005**: As abas com pendência MUST mostrar um contador numérico; o texto lido por leitor de tela MUST dizer "N pendência(s)".
- **FR-006**: Os campos pendentes MUST ter destaque amarelo, selo "Preencher" e motivo curto; ao ficar válidos MUST virar "✓ Preenchido" antes de salvar, e voltar ao amarelo se esvaziados.
- **FR-007**: A lista de lojas MUST mostrar, nas lojas em Revisar, "N pendências · principal motivo" em uma linha; a etiqueta e o filtro "Cadastro: a revisar" MUST continuar.
- **FR-008**: Os itens de faturamento, margem e salários MUST aparecer como "Só o dono do grupo preenche", sem botão, para quem não é dono; o resumo do painel MUST dizer quantos a pessoa pode preencher e quantos só o dono.
- **FR-009**: Nenhuma aba, seção ou valor hoje visível a um perfil MUST ficar escondido por causa desta mudança; salários, faturamento e margem seguem ocultos de quem não é dono, como hoje.
- **FR-010**: Nenhum valor em reais MUST aparecer nos avisos.
- **FR-011**: Ao salvar, o sistema MUST recalcular; completo vira a confirmação "Cadastro completo. Todas as informações foram preenchidas.", e a etiqueta e o contador das abas se atualizam.
- **FR-012**: O painel MUST ser acessível: região com nome "O que falta preencher", contagem anunciada de forma educada, botão de expandir com estado, barra de progresso, foco visível, estado nunca só por cor.
- **FR-013**: Em 360 px o painel MUST começar recolhido (faixa de 56 px) e os alvos de toque MUST ter pelo menos 44 px.
- **FR-014**: O sistema MUST NOT alterar os blocos de diagnóstico e cenários nem os cálculos; só lê os dados do cadastro.

### Key Entities

- **Pendência**: item identificado (dados, funcionamento, faturamento por dia, faturamento do mês, margem, farmacêutico, salário por função), com a aba, o texto curto, o motivo do campo, se foi feita e quem pode preencher.
- **Situação do cadastro**: Completo ou Revisar, definida pela lista de pendências (Completo = nenhuma pendente).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em uma loja sem nenhum dado, a pessoa vê todas as pendências (até 9) em uma única tela, sem precisar corrigir uma para ver a próxima.
- **SC-002**: A partir de qualquer pendência, a pessoa chega ao campo certo, com foco, em um clique.
- **SC-003**: A contagem de pendências é a mesma no painel, nas abas e na lista em 100% dos casos testados.
- **SC-004**: O destaque do campo some no mesmo instante em que ele fica válido, sem salvar.
- **SC-005**: Para o gestor, nenhum botão leva a um campo que ele não pode ver ou editar.

## Assumptions

- Business (resposta da pessoa): **"não oculte nada"**. O gestor continua vendo todas as abas que vê hoje, inclusive "Regras e custos" com Convenção coletiva e Mínimo de pessoas; a seção de custos, o faturamento e a margem seguem só do dono, como hoje. O desenho que esconde a aba inteira não é seguido nesse ponto.
- Business: o Operador da plataforma segue as mesmas permissões que tem hoje (edita dados da loja e equipe; custos, faturamento e margem só o dono); Somente consulta não edita nada e os itens aparecem sem botão.
- Business: a etiqueta Completo/Revisar e o número "N pendências" na lista são os mesmos para todos os perfis; só o painel e os contadores das abas separam o que a pessoa pode resolver.
- Business: o faturamento do mês divergente continua impedindo "Completo", como hoje; no painel é um alerta com o botão "Conferir".
- Decision: a regra de pendências existe no servidor (para a lista, a etiqueta e o painel) e é reproduzida na tela para reagir ao que se digita antes de salvar; os mesmos testes com os mesmos casos garantem que as duas deem o mesmo resultado. Why: a lista precisa da conta de lojas que não estão abertas, e o painel precisa reagir na hora.
- Decision: a ordem das pendências é a ordem de verificação de hoje, e o "principal motivo" é a primeira. Why: mantém o comportamento atual da etiqueta.
- Decision: o envio é feito pela pessoa (push e PR), como nas outras entregas; esta feature não abre PR por conta própria.
- Fora do escopo: novas regras de cadastro, mudanças nos cálculos, permissões novas, e qualquer alteração no diagnóstico ou nos cenários.
