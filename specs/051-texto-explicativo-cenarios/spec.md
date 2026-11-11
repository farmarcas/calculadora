# Feature Specification: Texto explicativo em cada cenário

**Feature Branch**: `feat/coluna-folha-no-faturamento` (os ajustes se acumulam nesta branch até a pessoa mandar abrir o PR)

**Created**: 2026-11-11

**Status**: Draft

**Input**: Item 2 da reunião com a VP. Abaixo da linha de cada cenário da comparação, uma frase curta em linguagem simples conduz a decisão: o que acontece se a pessoa mantiver os horários e o que acontece se ela não contratar ninguém. Dono vê o peso da folha e os reais; gestor e consulta veem a mesma ideia sem números. Nunca "p.p." nem "pontos". O botão se chama **Analisar**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O dono entende o caminho de "Manter horários" (Priority: P1)

Abaixo da linha do cenário **Manter horários**, o dono lê uma frase que diz quanto a folha precisa crescer para manter todos os horários e a venda de hoje.

**Why this priority**: É o cenário que cobre a loja inteira, e o dono precisa saber o preço dele sem abrir mais nada.

**Independent Test**: Em Cosmópolis, a frase é "Para manter todos os seus horários e a venda de hoje, a folha sobe de 8,0% para 9,7% do faturamento (R$ 7.659 por mês). Este é o caminho recomendado."

**Acceptance Scenarios**:

1. **Given** Manter horários cobre a loja e a folha aumenta, **When** o dono vê o cenário, **Then** a frase traz o peso de hoje, o peso depois e os reais por mês, e termina com "Este é o caminho recomendado."
2. **Given** a folha fica igual, **When** o dono vê o cenário, **Then** a frase diz "a folha não muda" no lugar do aumento, sem valores.
3. **Given** a folha diminui, **When** o dono vê o cenário, **Then** a frase diz "a folha cai de X% para Y% do faturamento (R$ Z por mês)".
4. **Given** Manter horários não cobre toda a falta, **When** o dono vê o cenário, **Then** a frase não diz "caminho recomendado" e diz o que ainda falta.

---

### User Story 2 - O dono entende o que acontece sem contratar (Priority: P1)

Abaixo da linha de **Sem contratações**, a frase explica que será preciso fechar a loja em alguns horários e, quando for o caso, que **mesmo assim ainda faltam horas** de uma função. A parte "Mesmo assim, ainda faltariam N h de farmacêutico por semana." aparece em **preto e negrito**, sem vermelho.

**Why this priority**: É a decisão difícil: sem contratar, a loja pode seguir sem farmacêutico.

**Independent Test**: Em Cosmópolis, a frase é "Sem contratar ninguém, você vai precisar fechar a loja em alguns horários. **Mesmo assim, ainda faltariam 17 h de farmacêutico por semana.** Entre em Analisar para escolher quais horários fechar."

**Acceptance Scenarios**:

1. **Given** sem contratar ainda falta farmacêutico, **When** a frase é vista, **Then** o trecho "Mesmo assim, ainda faltariam N h de farmacêutico por semana." está em preto e negrito.
2. **Given** a falta é de outra função, **When** a frase é vista, **Then** o trecho diz a função e as horas: "…ainda faltariam N h de atendente por semana."
3. **Given** sem contratar a loja é coberta, **When** a frase é vista, **Then** ela diz "Sem contratar ninguém, é possível cobrir tudo fechando em alguns horários. Entre em Analisar para escolher quais."

---

### User Story 3 - Gestor e consulta leem a mesma ideia, sem números (Priority: P2)

Gestor e consulta leem as mesmas frases, sem reais e sem percentuais: "…a folha precisa aumentar. Este é o caminho recomendado." A API deles não traz nenhum campo de custo.

**Independent Test**: Como gestor, a frase de Manter horários não tem "R$" nem "%".

**Acceptance Scenarios**:

1. **Given** o perfil gestor ou consulta, **When** a frase de Manter horários é vista, **Then** ela diz "a folha precisa aumentar", "não muda" ou "diminui", sem números.
2. **Given** a resposta da API desses perfis, **When** é lida, **Then** não há reais, percentuais, folha nem faturamento.

---

### Edge Cases

- **Faltam salários ou faturamento (dono):** a frase de Manter horários omite a parte do custo e não repete a frase de dados faltando, que já aparece na coluna Folha.
- **Cenário indisponível:** continua sem frase.
- **Cenário Equilíbrio:** continua oculto, sem frase.
- **Falta de mais de uma função:** a frase cita a função com mais horas faltando e as demais entram como "e mais N h de outras funções".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada cenário visível (Manter horários e Sem contratações) mostra uma frase explicativa abaixo da linha. A frase **substitui** a frase curta de causa que existe hoje nesses cenários.
- **FR-002**: O texto é em linguagem simples, sem "p.p." nem "pontos", e cita o botão como **Analisar**.
- **FR-003**: Manter horários, para o dono: "Para manter todos os seus horários e a venda de hoje, a folha sobe de [hoje]% para [depois]% do faturamento (R$ [valor] por mês)." Pesos com uma casa decimal, os mesmos que a coluna Folha mostra.
- **FR-004**: "Este é o caminho recomendado." só aparece quando Manter horários cobre toda a necessidade da loja.
- **FR-005**: Sem contratações segue o texto da User Story 2, com o trecho de falta em preto e negrito, na cor de texto normal.
- **FR-006**: Valores em reais e percentuais só para o dono; gestor e consulta recebem a frase sem números, e o servidor não envia dados de custo a esses perfis.
- **FR-007**: A coluna Folha no faturamento continua mostrando os números; o texto não a substitui.
- **FR-008**: Os valores citados na frase são os mesmos da coluna Folha e do resumo (mesma fonte, sem segunda conta).
- **FR-009**: A frase é lida por leitor de tela como texto normal, e o trecho em negrito continua legível com contraste AA.

### Key Entities

- **Frase do cenário**: texto curto por cenário, formado pela situação (cobre, não cobre, falta de função, resolve sem contratar) e, para o dono, pelos pesos e reais já calculados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em Cosmópolis e em Paulínia, o dono lê a frase de cada cenário e os números dela batem com a coluna Folha.
- **SC-002**: Em 100% das telas de gestor e consulta, nenhuma frase contém "R$" ou "%".
- **SC-003**: Nenhuma frase contém "p.p.", "pontos" nem "Personalizar".
- **SC-004**: A frase cabe em até 3 linhas na largura de 1236 px.

## Assumptions

- **Cenário sem custo para o dono:** Decision: se faltar salário ou faturamento, a frase de Manter horários omite o custo. Why: a coluna Folha já pede a informação.
- **"Caminho recomendado":** Decision: só aparece quando Manter horários cobre toda a necessidade. Why: o selo "cenário sugerido" saiu das telas e a frase não deve recomendar um cenário que não resolve.
- **Falta de várias funções:** Decision: a frase cita a de mais horas e agrupa o resto. Why: mantém o texto curto.
- **Onde fica a frase:** Decision: abaixo da linha do cenário, em texto normal, no lugar da frase de causa. Why: evita duas frases competindo.
- **Fora do escopo:** mudar a conta, a coluna Folha, o cenário Equilíbrio, e os itens 7 e 10 da reunião.
