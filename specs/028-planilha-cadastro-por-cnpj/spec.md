# Feature Specification: Planilha do Cadastro pelo CNPJ e encargos só pelo regime

**Feature Branch**: `feat/planilha-cadastro-por-cnpj`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Simplificar a planilha de importação do Cadastro (modelo para baixar e importação). Lojas passam a ser identificadas pelo CNPJ, e não mais pelo código da loja (que só a operadora da plataforma conhece e que já está cadastrado em todas as lojas). Na aba Lojas: sai a coluna 'Código da loja'; 'Nome da loja' passa a se chamar 'Nome da loja / Apelido'; o RAT, o FAP e a provisão de rescisão saem da planilha, do Cadastro e do cálculo (os encargos passam a ser só os do regime tributário). Na aba Funcionários: sai a coluna 'Código da loja de lotação', o vínculo com a loja passa a ser pelo CNPJ da loja; sai a coluna 'Cargo' (texto livre) e a 'Função de escala' passa a se chamar 'Cargo', com uma lista de opções para escolher (Farmacêutico, Atendimento, Caixa). Planilhas antigas continuam sendo aceitas. Depois: encargos só pelo regime (sem RAT, FAP e rescisão por loja)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lojas reconhecidas pelo CNPJ (Priority: P1)

Quem preenche a planilha (operadora, dono ou gestor) identifica cada loja pelo CNPJ, que todo mundo conhece, e não mais por um código interno. A aba Lojas deixa de ter a coluna "Código da loja", e o CNPJ passa a ser a coluna que diz de qual loja é a linha. A coluna "Nome da loja" vira "Nome da loja / Apelido".

**Why this priority**: Só a operadora sabe o código das lojas, e todas já estão cadastradas. Sem esta mudança, quem não é operadora não consegue preencher a planilha.

**Independent Test**: Baixar o modelo, preencher uma loja já cadastrada só com o CNPJ e o faturamento, importar e ver o faturamento atualizado na loja certa, sem informar código algum.

**Acceptance Scenarios**:

1. **Given** o modelo para baixar, **When** a aba Lojas é aberta, **Then** não existe "Código da loja", o CNPJ está entre as primeiras colunas e a coluna de nome se chama "Nome da loja / Apelido".
2. **Given** uma linha com o CNPJ de uma loja já cadastrada (com ou sem pontuação), **When** a planilha é importada, **Then** os dados da linha atualizam essa loja.
3. **Given** uma linha com um CNPJ que não pertence a nenhuma loja do grupo, **When** a planilha é importada, **Then** a linha é recusada com a mensagem "CNPJ não encontrado entre as lojas do grupo", sem estragar as outras linhas.
4. **Given** uma linha sem CNPJ, **When** a planilha é importada, **Then** a linha é recusada com a mensagem "CNPJ da loja vazio" (ou, em planilha antiga, usa o código da loja, ver história 3).
5. **Given** dois CNPJs iguais na mesma planilha, **When** é importada, **Then** a segunda linha é recusada informando que o CNPJ está repetido.
6. **Given** um CNPJ com número inválido (dígitos a menos ou verificador errado), **When** é importado, **Then** a linha é recusada com uma mensagem em português.

---

### User Story 2 - Funcionários ligados à loja pelo CNPJ e cargo em lista (Priority: P1)

Na aba Funcionários, a coluna "Código da loja de lotação" dá lugar a "CNPJ da loja", e o vínculo é feito por ele. A coluna "Cargo" de texto livre sai, e a antiga "Função de escala" passa a se chamar **"Cargo"** e vira uma lista de opções (Farmacêutico, Atendimento, Caixa) no Excel, para ninguém digitar "vendedor" ou "balconista".

**Why this priority**: O vínculo por código deixa de funcionar para quem não o conhece, e o cargo digitado à mão é a maior fonte de função errada, que tira o funcionário do cálculo.

**Independent Test**: Baixar o modelo, abrir a coluna "Cargo" e ver a lista com as três opções; importar funcionários com o CNPJ da loja e ver cada um ligado à loja certa, com a função correta.

**Acceptance Scenarios**:

1. **Given** o modelo para baixar, **When** a aba Funcionários é aberta, **Then** não existem "Código da loja de lotação" nem o antigo "Cargo", existe "CNPJ da loja", e a coluna "Cargo" oferece uma lista com Farmacêutico, Atendimento e Caixa.
2. **Given** um funcionário com o CNPJ de uma loja cadastrada, **When** a planilha é importada, **Then** ele fica ligado a essa loja.
3. **Given** um funcionário com CNPJ que não é de nenhuma loja do grupo, **When** é importado, **Then** a linha é recusada com "CNPJ não encontrado entre as lojas do grupo", sem afetar as demais.
4. **Given** um cargo preenchido com um valor fora da lista (por exemplo "balconista" ou "vendedor"), **When** a planilha é importada, **Then** o sistema deduz a função pelo nome como já faz hoje (balconista e vendedor viram Atendimento), e o que não puder ser deduzido fica como "Outros cargos", fora do cálculo, com o aviso de sempre.
5. **Given** o modelo para baixar, **When** a aba "Como preencher" é aberta, **Then** explica que a loja é identificada pelo CNPJ e que o Cargo deve ser escolhido na lista.

---

### User Story 3 - Planilhas antigas continuam funcionando (Priority: P1)

Planilhas já preparadas com o formato antigo (código da loja, código da loja de lotação, "Função de escala" e "Cargo" em texto livre) continuam sendo importadas sem erro.

**Why this priority**: Ninguém deve perder uma planilha pronta nem refazer o trabalho por causa do novo modelo.

**Independent Test**: Importar uma planilha do modelo antigo e conferir que as lojas e os funcionários entram como antes.

**Acceptance Scenarios**:

1. **Given** uma planilha antiga com "Código da loja" e sem CNPJ, **When** é importada, **Then** a loja é reconhecida pelo código, como hoje.
2. **Given** uma planilha com CNPJ e com código da loja ao mesmo tempo, **When** é importada, **Then** vale o CNPJ; se o código divergir do cadastrado, a linha segue o CNPJ e o código cadastrado não muda.
3. **Given** uma planilha antiga com "Função de escala" e "Cargo" separados, **When** é importada, **Then** a função de escala vale; se estiver vazia, o cargo digitado é usado para deduzir a função, como hoje.
4. **Given** uma planilha de funcionários antiga com "Código da loja de lotação", **When** é importada, **Then** os funcionários são ligados pelo código, como hoje.

---

### User Story 4 - Encargos só pelo regime tributário (Priority: P1)

O custo de folha usa apenas os encargos do regime tributário da loja (Simples Nacional, Lucro Presumido ou Lucro Real). O RAT, o FAP e a "Provisão de rescisão" por loja saem da planilha, da tela de Regras do Cadastro da loja e do cálculo. Os percentuais de cada regime continuam sendo mantidos pela operadora em "Parâmetros legais".

**Why this priority**: RAT e FAP mexem no custo em no máximo cerca de −1% a +3%, e a provisão de rescisão em cerca de 3%, enquanto o regime muda o custo em cerca de 20%. Pedir esses ajustes por loja complica o preenchimento sem mudar a decisão.

**Independent Test**: Abrir o Cadastro de uma loja, ver que a tela de Regras e o modelo da planilha não têm RAT, FAP nem rescisão, e conferir que o custo de contratação usa exatamente o total de encargos do regime da loja.

**Acceptance Scenarios**:

1. **Given** o modelo para baixar, **When** a aba Lojas é aberta, **Then** não existem "RAT (%)", "FAP" nem "Provisão de rescisão (Sim/Não)", e a ajuda diz que os encargos vêm do regime tributário.
2. **Given** o Cadastro de uma loja aberto pelo dono, **When** a tela de Regras é vista, **Then** não há campos de RAT, FAP nem provisão de rescisão, e a tela mostra apenas o total de encargos do regime.
3. **Given** uma loja de qualquer regime, **When** o custo de contratação é calculado, **Then** os encargos são o total do regime vigente em "Parâmetros legais", sem ajuste por loja.
4. **Given** uma loja que já tinha RAT, FAP ou rescisão guardados, **When** o custo é calculado, **Then** esses valores são ignorados, mas continuam guardados (não são apagados).
5. **Given** uma planilha antiga com as colunas RAT, FAP ou rescisão (com qualquer valor, até inválido), **When** é importada, **Then** a importação conclui sem erro e as colunas são ignoradas.
6. **Given** os "Parâmetros legais" da operadora, **When** o regime é visto, **Then** continua mostrando e permitindo versionar os percentuais do regime como hoje.

---

### Edge Cases

- Loja do Simples Nacional: o RAT por loja já valia zero; sem o ajuste, nada muda nela além de remover o campo.
- CNPJ com pontos, barra e traço, ou só com dígitos, ou com zeros à esquerda perdidos pelo Excel (número em vez de texto): todos reconhecem a mesma loja.
- Loja inativa ou apagada com o mesmo CNPJ: não é usada; a linha é recusada como "não encontrado".
- Quem importa só a equipe (gestor): o CNPJ só vale se a loja for do grupo dele; de outro grupo é "não encontrado".
- Linha de funcionário cuja loja aparece na própria planilha de Lojas com CNPJ: o vínculo funciona do mesmo jeito.
- Planilha sem a coluna CNPJ e sem código: nenhuma linha de loja é aceita e a mensagem explica que falta o CNPJ.
- Loja nova (CNPJ ainda não cadastrado) enviada pela operadora: ver Assumptions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O modelo para baixar MUST trazer na aba Lojas o CNPJ e MUST NOT trazer "Código da loja"; a coluna de nome MUST chamar-se "Nome da loja / Apelido".
- **FR-002**: A importação MUST identificar a loja de cada linha da aba Lojas pelo CNPJ, aceitando o número com ou sem pontuação e com zeros à esquerda perdidos.
- **FR-003**: Linha de loja com CNPJ ausente, inválido, repetido na planilha ou não encontrado entre as lojas do grupo MUST ser recusada com uma mensagem em português, sem impedir as demais linhas.
- **FR-004**: O modelo para baixar MUST trazer na aba Funcionários a coluna "CNPJ da loja" no lugar de "Código da loja de lotação", e a importação MUST ligar o funcionário à loja por esse CNPJ.
- **FR-005**: Funcionário cujo CNPJ não é de uma loja do grupo MUST ser recusado com "CNPJ não encontrado entre as lojas do grupo", sem afetar as demais linhas.
- **FR-006**: O modelo MUST NOT trazer o antigo "Cargo" de texto livre, e a antiga "Função de escala" MUST chamar-se "Cargo" e oferecer, no Excel, uma lista fechada com Farmacêutico, Atendimento e Caixa.
- **FR-007**: A importação MUST continuar deduzindo a função quando o cargo vier digitado fora da lista (por exemplo, balconista ou vendedor viram Atendimento), e o que não puder ser deduzido MUST ficar como "Outros cargos", fora do cálculo, com o aviso de sempre.
- **FR-008**: Planilhas antigas (com "Código da loja", "Código da loja de lotação", "Função de escala" e "Cargo" em texto livre) MUST continuar sendo importadas: sem CNPJ, vale o código; com os dois, vale o CNPJ.
- **FR-009**: O código da loja já cadastrado MUST NOT ser alterado, apagado nem exigido por esta importação.
- **FR-010**: O modelo MUST NOT trazer "RAT (%)", "FAP" nem "Provisão de rescisão (Sim/Não)", e a importação MUST ignorar essas colunas em planilhas antigas, sem erro e sem alterar o que está guardado.
- **FR-011**: A aba "Como preencher" MUST explicar que a loja é identificada pelo CNPJ e que o Cargo deve ser escolhido na lista, e MUST deixar de citar o código da loja.
- **FR-012**: Quem pode gravar cada dado MUST continuar como hoje.
- **FR-013**: A tela de Regras do Cadastro da loja MUST NOT ter campos de RAT, FAP nem provisão de rescisão.
- **FR-014**: O custo de folha MUST usar apenas o total de encargos do regime tributário vigente da loja (sem ajuste por loja e sem provisão de rescisão), e os valores de RAT, FAP e rescisão já guardados nas lojas MUST continuar guardados e ser ignorados.
- **FR-015**: A manutenção dos percentuais de cada regime pela operadora em "Parâmetros legais" MUST continuar como hoje.

### Key Entities *(include if feature involves data)*

- **Loja**: tem CNPJ (único no sistema, já cadastrado), nome/apelido e um código interno que continua guardado e invisível para a importação.
- **Funcionário**: ligado a uma loja do grupo; seu cargo é uma das três funções que entram no cálculo (ou "Outros cargos").
- **Linha recusada**: loja ou funcionário que não pôde ser importado, com a linha e o motivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa sem conhecer nenhum código interno consegue preencher e importar lojas e funcionários só com o CNPJ, na primeira tentativa, sem ajuda.
- **SC-002**: Em 100% das linhas de teste com CNPJ de loja cadastrada (com ou sem pontuação), a loja certa é reconhecida.
- **SC-003**: Em 100% dos casos de CNPJ inválido, repetido ou desconhecido, a linha é recusada com mensagem clara e as demais linhas da mesma planilha são importadas normalmente.
- **SC-004**: 100% das planilhas no formato antigo importam com o mesmo resultado de antes.
- **SC-005**: Para qualquer loja, o custo de contratação usa exatamente o total de encargos do regime dela (diferença zero entre o que a tela mostra e o que o cálculo aplica).
- **SC-006**: Funcionários importados com o cargo escolhido na lista entram no cálculo da escala em 100% dos casos (nenhum fica em "Outros cargos" por erro de digitação).

## Assumptions

- Decisão: a planilha **atualiza lojas já cadastradas** pelo CNPJ. CNPJ que não existe no grupo é recusado, não cria loja. Por quê: o código da loja, que ainda é obrigatório no cadastro, só a operadora conhece; a criação de loja nova continua pela tela (ou por planilha antiga que traga o código).
- Decisão: o código da loja continua existindo no cadastro e continua sendo aceito como coluna em planilhas antigas, mas deixa de ser pedido no modelo novo. Por quê: não apaga nada e mantém compatibilidade.
- Decisão: o cargo fora da lista continua sendo deduzido pelo texto (como hoje), em vez de recusar a linha. Por quê: não perde planilhas antigas nem funcionários por causa de um nome diferente.
- Decisão: a lista de opções do cargo é uma lista do Excel no modelo; a importação não depende dela. Por quê: quem usa outro programa de planilha ainda consegue importar.
- Decisão: a provisão de rescisão por loja também sai (junto com RAT e FAP). Por quê: é o mesmo tipo de ajuste por loja que complica o preenchimento, e ela já vinha desligada por padrão; sem o botão, ela nunca entra no cálculo. Os valores já guardados não são apagados.
- Decisão: as lojas que tinham ajuste guardado passam a ter o custo do regime puro, o que muda o valor em reais por uma fração pequena (no máximo cerca de −1% a +3%, ou +3% se a rescisão estava ligada). Por quê: é a consequência direta do pedido de usar só o regime.
- Fora do escopo: a planilha da base comercial (venda por hora) e a tela de Cadastro; o CNPJ continua sendo alterado só pela operadora, como hoje.
