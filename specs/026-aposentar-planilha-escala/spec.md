# Feature Specification: Aposentar a planilha de escala

**Feature Branch**: `feat/aposentar-planilha-escala`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Aposentar a planilha de escala atual e manter tudo na planilha de funcionários do Cadastro: o Diagnóstico e a Simulação passam a usar só o que está no Cadastro (função, carga, dias, entrada, saída e, novo, intervalo), sem perder o que já foi importado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Diagnóstico e Simulação usando só o Cadastro (Priority: P1)

O dono (ou o gestor) cadastra os funcionários da loja pela planilha do Cadastro ou pela tela de Equipe, com função, carga, dias, horário de entrada e saída e o intervalo. O Diagnóstico e a Simulação usam só isso para saber quem trabalha, quando e em que função. Não existe mais uma segunda fonte (a planilha de escala).

**Why this priority**: É o objetivo do pedido: uma fonte só, sem duas planilhas que podem discordar.

**Independent Test**: Numa loja sem escala importada e com funcionários com horário no Cadastro, abrir o Diagnóstico e ver as mesmas contas de antes (cobertura, contratações sugeridas, equipe toda).

**Acceptance Scenarios**:

1. **Given** uma loja com funcionários e horários no Cadastro, **When** o Diagnóstico é aberto, **Then** a equipe, as horas por função e a cobertura vêm só do Cadastro.
2. **Given** um funcionário com intervalo cadastrado, **When** a cobertura por hora é calculada, **Then** ele não conta como presente durante o intervalo.
3. **Given** um funcionário sem horário no Cadastro, **When** o Diagnóstico é aberto, **Then** ele fica fora da cobertura por hora e a pendência diz que falta o horário dele.
4. **Given** uma loja sem nenhum horário cadastrado, **When** o Diagnóstico é aberto, **Then** o aviso diz para cadastrar o horário dos funcionários no Cadastro (não para importar uma escala).
5. **Given** o cartão "Personalizar" de um cenário, **When** a simulação é criada, **Then** ela parte da equipe do Cadastro e não mostra aviso de "loja sem escala importada".

---

### User Story 2 - Intervalo na planilha de funcionários e na tela de Equipe (Priority: P1)

A planilha de funcionários do Cadastro ganha duas colunas opcionais, **início do intervalo** e **fim do intervalo** (formato HH:MM). O modelo para baixar traz essas colunas, e a tela de Equipe permite ver e editar o intervalo de cada funcionário junto da entrada e da saída.

**Why this priority**: O intervalo era a única informação da planilha de escala que afetava o cálculo e que o Cadastro não tinha; sem ele a cobertura por hora ficaria mais folgada do que é.

**Independent Test**: Importar uma planilha de funcionários com intervalo e ver o valor aparecer na tela de Equipe e a cobertura descontar o horário de almoço.

**Acceptance Scenarios**:

1. **Given** uma planilha com início e fim de intervalo, **When** é importada, **Then** o intervalo é gravado no funcionário e aparece na Equipe.
2. **Given** uma planilha sem as colunas de intervalo, **When** é importada, **Then** funciona como hoje e o funcionário fica sem intervalo.
3. **Given** um intervalo inválido (fim antes do início, ou fora do horário de trabalho), **When** é importado ou digitado, **Then** a linha é recusada com uma mensagem em português, sem estragar as outras.
4. **Given** o botão de baixar modelo, **When** o modelo é baixado, **Then** traz as colunas de intervalo com um exemplo.

---

### User Story 3 - Quem já tem escala importada não perde nada (Priority: P1)

Para as lojas que hoje têm uma planilha de escala importada, os dados dela (função, carga, dias, entrada, saída e intervalo) são copiados para o funcionário correspondente do Cadastro, pela matrícula, **só onde o Cadastro está vazio**, uma única vez. O Diagnóstico dessas lojas continua com os mesmos números.

**Why this priority**: Sem isso, tirar a planilha mudaria o resultado de lojas que já dependem dela.

**Independent Test**: Numa loja com escala importada e Cadastro sem horários, depois da migração, o Diagnóstico mostra os mesmos números de antes.

**Acceptance Scenarios**:

1. **Given** uma loja com escala importada e funcionário no Cadastro com a mesma matrícula e sem horário, **When** a migração roda, **Then** o funcionário passa a ter dias, entrada, saída, intervalo, função e carga da escala.
2. **Given** um funcionário que já tem horário no Cadastro, **When** a migração roda, **Then** nada dele é alterado.
3. **Given** uma pessoa da escala importada sem funcionário correspondente no Cadastro (matrícula nova), **When** a migração roda, **Then** ela é registrada num relatório da migração e não é criada sozinha no Cadastro; a pessoa responsável decide.
4. **Given** a migração concluída, **When** ela roda de novo, **Then** não altera nada (é segura para repetir).
5. **Given** uma loja migrada, **When** o Diagnóstico é aberto, **Then** os números (equipe no cálculo, contratações sugeridas, horas que faltam) são iguais aos de antes da migração.

---

### User Story 4 - Sumir a planilha de escala do envio de planilhas (Priority: P2)

No envio de planilhas, "Escala atual" deixa de existir; sobra só a **Base comercial** (venda por hora). Os textos, avisos e pendências que falavam de importar a escala também saem ou passam a falar do Cadastro.

**Why this priority**: Acabamento; depende das histórias anteriores para ser seguro.

**Independent Test**: Abrir "Importar" e ver só a Base comercial; abrir o Diagnóstico sem pendência de "linhas rejeitadas na importação da escala".

**Acceptance Scenarios**:

1. **Given** o botão Importar, **When** abre, **Then** só aparece o envio da Base comercial e o texto explica isso.
2. **Given** o Diagnóstico, **When** é aberto, **Then** não existe a pendência "linhas rejeitadas na importação da escala" nem a fonte "escala importada".
3. **Given** a Simulação, **When** a loja não tem funcionários com horário, **Then** o aviso fala do Cadastro de funcionários.

---

### Edge Cases

- **Dados antigos da escala importada:** ficam guardados (como histórico no banco), mas nenhuma tela nem cálculo os usa depois da migração; nada é apagado.
- **Funcionário com função fora do cálculo (Apoio, Perfumaria):** continua fora do cálculo, como hoje.
- **Matrícula repetida ou em outra loja:** a migração só casa funcionário da mesma loja; sem casamento, vai para o relatório.
- **Intervalo parcial** (só o início, ou só o fim): recusado com mensagem, para não gravar metade.
- **Horário sem dias da semana:** o funcionário continua fora da cobertura e a pendência diz o que falta.
- **Quem é só consulta:** vê os dados, mas não importa nem edita (como hoje).
- **Planilha de funcionários antiga (sem as colunas novas):** continua válida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Diagnóstico MUST calcular a equipe, as horas por função, a cobertura por hora e as contratações sugeridas usando somente os funcionários do Cadastro (função, carga, dias, entrada, saída e intervalo).
- **FR-002**: A cobertura por hora MUST descontar o intervalo do funcionário quando ele estiver cadastrado, e MUST contá-lo presente o turno inteiro quando não estiver.
- **FR-003**: A planilha de funcionários do Cadastro MUST aceitar as colunas opcionais de início e fim do intervalo (HH:MM), gravá-las no funcionário e validá-las (os dois juntos, fim depois do início, dentro do horário de trabalho do dia), recusando só a linha com erro e dizendo o motivo em português.
- **FR-004**: O modelo de planilha de funcionários para baixar MUST trazer as colunas de intervalo e um exemplo.
- **FR-005**: A tela de Equipe MUST mostrar e permitir editar o intervalo de cada funcionário, com as mesmas validações da planilha.
- **FR-006**: Uma migração única MUST copiar, para cada loja com escala importada ativa, os dados da escala (função, carga, dias, entrada, saída e intervalo) para o funcionário do Cadastro de mesma matrícula e loja, apenas nos campos vazios, sem sobrescrever nada que já exista.
- **FR-007**: A migração MUST ser segura para repetir, MUST NOT criar funcionários sozinha e MUST gerar um relatório (quantos funcionários foram preenchidos, quantos já tinham dados, quantas pessoas da escala ficaram sem correspondente, por loja).
- **FR-008**: O envio de planilhas MUST deixar de oferecer a planilha de escala atual (o envio e o modelo para baixar); a Base comercial continua.
- **FR-009**: O Diagnóstico MUST deixar de mostrar a pendência de linhas rejeitadas na importação da escala e a fonte "escala importada"; os avisos que citavam a importação da escala MUST passar a orientar o cadastro dos funcionários.
- **FR-010**: A criação de uma Simulação a partir de um cenário MUST partir do Cadastro, sem exigir nem mencionar escala importada.
- **FR-011**: Nenhum dado das escalas já importadas MUST ser apagado; elas ficam guardadas e deixam de ser lidas.
- **FR-012**: Para uma loja migrada, o Diagnóstico MUST mostrar os mesmos números de antes da migração.

### Key Entities *(include if feature involves data)*

- **Funcionário (Cadastro)**: matrícula, nome, loja, função de escala, carga semanal, dias, entrada, saída e, novo, início e fim do intervalo.
- **Escala importada (histórico)**: as cargas e turnos antigos; guardados, sem uso.
- **Relatório da migração**: por loja, o que foi preenchido, o que já existia e o que ficou sem correspondente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das lojas com escala importada têm os mesmos números no Diagnóstico antes e depois da migração (equipe no cálculo, contratações sugeridas, horas que faltam de farmacêutico).
- **SC-002**: O envio de planilhas não oferece mais a planilha de escala, e nenhuma tela ou aviso manda "importar a escala".
- **SC-003**: Uma planilha de funcionários com intervalo é importada de uma vez, e a cobertura por hora desconta o horário de almoço de cada pessoa.
- **SC-004**: A migração é repetível sem alterar nada na segunda execução, e nenhum dado existente do Cadastro é sobrescrito.
- **SC-005**: Nenhuma escala importada é apagada (as tabelas continuam com o mesmo número de linhas).

## Assumptions

- **Decisão (migração)**: automática, uma vez, só nos campos vazios, por matrícula e loja; pessoas sem correspondente vão para o relatório e não são criadas. *Por quê*: preserva os números das lojas que hoje dependem da planilha, sem inventar cadastro nem sobrescrever o que a pessoa digitou. O levantamento local achou 2 lojas com escala ativa e Cadastro sem horários, que seriam as afetadas.
- **Decisão (intervalo)**: duas colunas opcionais na planilha de funcionários e dois campos na tela de Equipe. *Por quê*: era a única informação da escala que afetava o cálculo (cobertura por hora) e que o Cadastro não tinha.
- **Decisão (tipo de escala e folga)**: não migram nem são colunas novas. *Por quê*: eram lidos, mas não entravam em nenhum cálculo; a folga já é o inverso dos dias.
- **Decisão (dados antigos)**: as tabelas das escalas importadas ficam como histórico, sem uso e sem apagar. *Por quê*: a constituição exige cuidado com dados; apagar pode vir depois, com confirmação.
- **Decisão (envio da escala)**: a rota de envio e o modelo da escala saem; a Base comercial fica. *Por quê*: ninguém mais usa o envio e mantê-lo reabriria a segunda fonte.
- **Fora desta entrega**: apagar as tabelas antigas, mudar o formato da Base comercial, e a Visão do grupo.
