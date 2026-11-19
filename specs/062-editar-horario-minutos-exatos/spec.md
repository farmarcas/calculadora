# Feature Specification: Editar o horário de cada pessoa com minutos exatos na Simulação

**Feature Branch**: `feat/folgas-evitar-segunda-e-livres` (os ajustes se acumulam nesta branch até a pessoa mandar abrir o PR)

**Created**: 2026-11-19

**Status**: Draft

**Input**: Hoje, na Escala por hora da Simulação, o horário de uma pessoa só muda arrastando a barra, e tudo anda de 15 em 15 minutos. Pedido: poder digitar o horário exato de cada pessoa, com qualquer minuto (ex.: entrada 07:32, intervalo 12:17 às 13:17, saída 16:24), por um lápis ao fim da barra do dia. Arrastar continua como é. Não mexe no horário de funcionamento da loja. Evolui as specs 039 (escala por hora) e 047 (minutos inteiros).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Digitar o horário exato de uma pessoa num dia (Priority: P1)

Numa simulação editável, ao fim da barra de uma pessoa que trabalha naquele dia aparece um **lápis**. Ao clicar, abre uma janela pequena com o nome da pessoa e o dia, e quatro campos de horário: **entrada**, **início do intervalo**, **fim do intervalo** e **saída**, todos em HH:mm com qualquer minuto de 00 a 59. O intervalo é opcional. Ao salvar, o horário vale exatamente o digitado, e a cobertura, os avisos e o resultado da simulação se atualizam como acontece depois de arrastar.

**Why this priority**: É o pedido principal: hoje não há como informar 07:32 ou 16:24 sem depender de arrastar de 15 em 15 minutos.

**Independent Test**: Numa simulação editável, clicar no lápis de uma pessoa, digitar 07:32, 12:17, 13:17 e 16:24 e salvar: a barra mostra 07h32–16h24 com o intervalo 12h17–13h17, e o valor continua ali depois de recarregar a simulação.

**Acceptance Scenarios**:

1. **Given** uma pessoa com turno na terça numa simulação editável, **When** a pessoa clica no lápis dessa linha, **Then** abre a janela com o nome, o dia e os campos já preenchidos com o horário de hoje.
2. **Given** a janela aberta, **When** digita entrada 07:32, intervalo 12:17–13:17 e saída 16:24 e clica "Salvar", **Then** a janela fecha, o turno passa a ser exatamente esse e a cobertura/resultado são recalculados.
3. **Given** a janela aberta, **When** deixa os dois campos de intervalo vazios e salva, **Then** o turno fica sem intervalo.
4. **Given** a janela aberta, **When** clica "Cancelar" ou aperta Esc, **Then** nada muda e o foco volta ao lápis.
5. **Given** uma pessoa de folga naquele dia, ou uma simulação gravada (somente leitura), **When** a pessoa olha a linha, **Then** não há lápis.

---

### User Story 2 - A janela avisa o que está errado, em linguagem simples (Priority: P1)

A janela não deixa salvar horário impossível e diz o motivo ao lado do campo, sem jargão: horário inválido; saída antes ou igual à entrada; intervalo fora do turno; início do intervalo depois do fim; horário fora do funcionamento da loja naquele dia; um campo de intervalo preenchido e o outro vazio.

**Why this priority**: Digitar à mão aceita qualquer coisa; sem validação o cenário ficaria inconsistente.

**Independent Test**: Digitar uma saída às 06:00 com entrada às 07:32: o campo mostra "A saída precisa ser depois da entrada." e "Salvar" não grava.

**Acceptance Scenarios**:

1. **Given** um horário que não existe (ex.: 25:70), **When** tenta salvar, **Then** o campo mostra "Use um horário válido, como 07:32." e nada é gravado.
2. **Given** saída igual ou antes da entrada, **When** tenta salvar, **Then** aparece "A saída precisa ser depois da entrada.".
3. **Given** início do intervalo fora do turno, ou início depois do fim, **When** tenta salvar, **Then** aparecem mensagens próprias ("O intervalo precisa ficar dentro do turno." / "O início do intervalo precisa ser antes do fim.").
4. **Given** a loja abre às 07:00 e fecha às 22:00 naquele dia, **When** digita entrada 06:30 ou saída 22:15, **Then** aparece "A loja funciona das 07:00 às 22:00 neste dia.".
5. **Given** só um dos dois campos do intervalo preenchido, **When** tenta salvar, **Then** aparece "Preencha o início e o fim do intervalo, ou deixe os dois vazios.".

---

### User Story 3 - O horário exato aparece em todo lugar (Priority: P1)

O horário com minutos aparece certo em todas as telas da simulação: na barra, no nome acessível da barra (leitor de tela), no texto do turno e do intervalo, na Escala da semana e na lista do celular. Hoje a barra e a lista já mostram minutos; o pedido garante que continuem exatos (ex.: 07h32–16h24, intervalo 12h17–13h17).

**Why this priority**: Digitar 07:32 e ver 07h30 seria pior do que não ter a edição.

**Independent Test**: Gravar 07:32–16:24 com intervalo 12:17–13:17 e conferir o mesmo horário exato na barra, na Escala da semana e na lista do celular.

**Acceptance Scenarios**:

1. **Given** um turno 07:32–16:24, **When** a barra é mostrada, **Then** o texto é "07h32–16h24" e o total de horas da semana soma os minutos reais.
2. **Given** a visão do celular, **When** a lista é mostrada, **Then** o horário exato aparece e há como abrir a mesma janela de edição.

---

### User Story 4 - O lápis no celular (Priority: P2)

Na lista do celular, onde não se arrasta, cada pessoa com turno no dia tem o lápis com área de toque confortável (pelo menos 44 × 44 px) que abre a mesma janela.

**Independent Test**: No celular, tocar no lápis de uma pessoa com turno e editar o horário.

**Acceptance Scenarios**:

1. **Given** a visão do celular numa simulação editável, **When** a pessoa toca no lápis, **Then** abre a mesma janela, utilizável com teclado do celular.

---

### Edge Cases

- **Arrastar continua igual:** o lápis é um complemento; arrastar e as setas do teclado seguem andando de 15 em 15 minutos e preservam os minutos quebrados que o turno já tem.
- **Contratação simulada (vaga):** também tem o lápis, igual à equipe.
- **Janela aberta e a simulação muda:** a janela fecha sem gravar se a pessoa deixou de ter turno naquele dia.
- **Horário que passa da jornada da regra (8h/dia, teto semanal):** não impede salvar; os avisos de regra que a avaliação já mostra aparecem, como acontece ao arrastar.
- **Sem alteração:** salvar com os mesmos valores não grava de novo.
- **Horário de funcionamento da loja:** continua só com hora cheia; não muda.
- **Folha e custo:** não mudam por causa dos minutos (a folha vem da carga contratada); o total de horas da semana mostra os minutos.
- **Teclado:** campos acessíveis, Enter salva, Esc cancela; erros lidos por leitor de tela.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Numa simulação editável, a linha de cada pessoa com turno no dia MUST mostrar um lápis ao fim da barra; sem turno no dia, ou em simulação somente leitura, MUST NOT mostrar.
- **FR-002**: O lápis MUST ter nome acessível com a pessoa e o dia (ex.: "Editar horário de Maria na terça"), ser alcançável e acionável pelo teclado e ter área de toque de pelo menos 44 × 44 px.
- **FR-003**: Ao acionar o lápis, o sistema MUST abrir uma janela com o nome da pessoa e o dia, os campos entrada, início do intervalo, fim do intervalo e saída preenchidos com o horário atual, e as ações "Salvar" e "Cancelar".
- **FR-004**: Os campos MUST aceitar horário no formato HH:mm com qualquer minuto de 00 a 59; o intervalo MUST ser opcional (os dois campos vazios removem o intervalo).
- **FR-005**: A janela MUST validar, com mensagem em linguagem simples ao lado do campo: horário inválido; saída depois da entrada; intervalo dentro do turno; início do intervalo antes do fim; horário dentro do funcionamento da loja naquele dia; intervalo com os dois campos ou nenhum. Com erro, "Salvar" MUST NOT gravar.
- **FR-006**: Ao salvar, o sistema MUST gravar o turno pelo mesmo caminho do arrastar, de modo que cobertura, avisos, resultado e a simulação gravada atualizem igual.
- **FR-007**: A janela MUST fechar com Esc ou "Cancelar" sem gravar e devolver o foco ao lápis.
- **FR-008**: O horário exato com minutos MUST aparecer na barra, no nome acessível da barra, no texto do turno e do intervalo, na Escala da semana e na visão do celular.
- **FR-009**: Arrastar a barra e o uso do teclado na barra MUST continuar como hoje.
- **FR-010**: A visão do celular MUST oferecer a mesma edição, com o lápis na lista.
- **FR-011**: O horário de funcionamento da loja MUST NOT mudar: continua só com hora cheia.
- **FR-012**: A regra de contagem da cobertura por hora MUST permanecer a mesma (ver Assumptions); o resultado, as horas da semana e os avisos MUST responder corretamente aos minutos.

### Key Entities

- **Turno de uma pessoa num dia**: entrada, saída e, opcionalmente, início e fim do intervalo, em horas e minutos exatos (spec 047). Pertence à simulação, não ao Cadastro.
- **Horário de funcionamento do dia**: hora em que a loja abre e fecha naquele dia (hora cheia, vem do Cadastro); limita o que se pode digitar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa consegue definir um horário como 07:32–16:24 com intervalo 12:17–13:17 em menos de 30 segundos, sem arrastar.
- **SC-002**: 100% dos horários digitados e salvos aparecem idênticos (com minutos) na barra, na Escala da semana e no celular, e permanecem depois de recarregar a simulação.
- **SC-003**: Nenhum horário inválido (saída antes da entrada, intervalo fora do turno, fora do funcionamento da loja) chega a ser gravado pela janela.
- **SC-004**: Salvar um horário atualiza a cobertura e o resultado da simulação em menos de 2 segundos.
- **SC-005**: Todo o fluxo (abrir, preencher, corrigir erro, salvar, cancelar) é possível só com o teclado.

## Assumptions

- **Cobertura por hora (decisão técnica já verificada no código):** hoje uma pessoa só conta numa hora quando cobre a **hora cheia** (quem entra 07:32 passa a contar a partir das 08h; quem sai 16:24 conta até as 15h–16h) e o intervalo de até 2 h não a tira da cobertura. É a mesma regra no servidor e na tela. **Decision: manter essa regra sem arredondar nada.** **Why:** mudá-la alteraria todos os resultados de todas as simulações; o horário exato fica guardado e visível, e a regra de contagem é a que a equipe já conhece. A janela mostra, em texto, quais horas cheias o turno cobre, para a pessoa não se surpreender (ex.: "Cobre as horas de 08h a 16h").
- **Formato de exibição:** **Decision: manter o formato do sistema ("07h32–16h24")** nas barras e textos, e usar HH:mm só nos campos da janela. **Why:** é o formato usado em todo o produto; já mostra os minutos exatos.
- **Servidor:** já aceita minutos inteiros em entrada, saída e intervalo (spec 047); o comentário de código que diz "só 15 em 15" está desatualizado e será corrigido. Nenhuma mudança de banco.
- **Duração mínima:** **Decision: só exigir que a saída seja depois da entrada**, sem um mínimo de horas. **Why:** é o que foi pedido; as regras de jornada e intervalo já avisam o que fugir da regra.
- **Regras de jornada:** a janela não bloqueia por jornada de 8h/dia, teto semanal ou intervalo mínimo; os avisos existentes mostram o efeito, igual ao arrastar.
- **Quem usa:** quem pode editar a simulação (mesma permissão de arrastar).
- **Fora de escopo:** horário de funcionamento da loja, o Cadastro, a folha (que vem da carga contratada), mover o intervalo por arraste e edição em lote de vários dias.
