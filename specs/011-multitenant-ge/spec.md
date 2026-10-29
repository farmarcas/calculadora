# Feature Specification: Sistema multiempresário por Grupo Econômico (GE)

**Feature Branch**: `feat/multitenant-ge`
**Created**: 2026-10-29
**Status**: Draft
**Input**: User description: "Esse sistema será usado por diversos empresários e cada um tem seu grupo de lojas, reconhecido por GE (Grupo Econômico). O sistema deve ser multitenant: cada empresário é um GE e tem o seu cadastro de lojas. A plataforma envia um Excel com todos os CNPJs e as informações das lojas, que pré-preenche os dados de cada loja. O empresário preenche somente os funcionários."

## Situação de hoje

- O sistema tem **um único grupo**: todas as lojas e funcionários ficam misturados, e quem entra vê tudo. O próprio banco registra isso ("um único grupo por enquanto").
- Cada loja é cadastrada à mão ou por planilha, **pelo mesmo usuário** que cadastra os funcionários. Não existe a figura de quem cuida da plataforma (que prepara as lojas) separada do empresário (que cuida da equipe).
- O CNPJ da loja é opcional e não é usado para identificar a loja.
- As regras legais (42h, 40h) valem para todos, e continuam assim.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cada empresário enxerga só o seu grupo (Priority: P1)

Cada empresário pertence a **um GE**. Tudo o que ele vê e faz (lojas, funcionários, diagnóstico, simulações, configuração, importações) acontece **só dentro do seu GE**. Dois GEs podem ter lojas com o mesmo código ou o mesmo funcionário (mesma matrícula) sem se misturar. Os dados que já existem hoje passam a pertencer a um GE inicial, sem perder nada.

**Why this priority**: sem separação, o sistema não pode ser usado por mais de um empresário; é a base de tudo.

**Independent Test**: criar dois GEs com lojas diferentes; entrar como o GE A e confirmar que nenhuma loja, funcionário, simulação ou número do GE B aparece em nenhuma tela, nem ao tentar abrir um endereço do GE B direto.

**Acceptance Scenarios**:

1. **Given** dois GEs com lojas, **When** entro no GE A, **Then** vejo só as lojas, funcionários e simulações do GE A.
2. **Given** que estou no GE A, **When** tento abrir ou alterar uma loja ou funcionário do GE B (por endereço direto), **Then** o sistema responde como se não existisse.
3. **Given** dois GEs, **When** ambos têm uma loja de código "001", **Then** os dois cadastros convivem sem conflito.
4. **Given** os dados que já existem hoje, **When** o sistema passa a ter GEs, **Then** tudo fica num GE inicial, com os mesmos números de diagnóstico de antes.
5. **Given** os totais, relatórios, comparativos e auditoria, **Then** cada um conta só o GE de quem olha.

---

### User Story 2 - A plataforma cadastra o GE e carrega as lojas por Excel (Priority: P1)

Quem cuida da plataforma (o **operador**) envia **o Excel da plataforma** (o relatório de lojas, com a coluna "Grupo Econômico"), que pode trazer **vários GEs de uma vez**. Cada linha é uma loja, identificada pelo CNPJ, com nome, cidade e UF, bandeira, regime tributário, status e horário de funcionamento por dia da semana. GEs que ainda não existem são criados na confirmação; os que já existem são atualizados. Só entram lojas com status **Ativado**; as demais são ignoradas e contadas. O sistema confere o arquivo **antes de gravar**, mostra o que vai ser criado, atualizado ou rejeitado (com a linha e o motivo) e só grava depois da confirmação. Reenviar o Excel **atualiza** as lojas pelo CNPJ, sem duplicar.

**Why this priority**: é o ganho central do pedido: o empresário não precisa preencher a loja.

**Independent Test**: enviar um Excel com 5 CNPJs ativos de 2 GEs novos e 2 linhas desativadas: 2 GEs e 5 lojas aparecem pré-preenchidos, as 2 desativadas ficam de fora e contadas; reenviar o mesmo arquivo com uma cidade alterada atualiza a loja, sem criar a 6ª; um CNPJ inválido aparece na lista de rejeitados com a linha e o motivo, e o resto é gravado.

**Acceptance Scenarios**:

1. **Given** um Excel válido com lojas de GEs novos, **When** o operador envia e confirma, **Then** cada GE é criado (identificação = número do grupo, nome = responsável pelo GE) e cada CNPJ ativo vira uma loja do seu GE com os dados da planilha.
1b. **Given** linhas com status Desativado, Montando ou Transição, **Then** elas não viram loja, não criam GE só por causa delas e aparecem no resumo como "ignoradas por status", por status.
2. **Given** o mesmo arquivo reenviado, **Then** as lojas existentes são atualizadas pelo CNPJ e nenhuma é duplicada.
3. **Given** um CNPJ inválido (dígitos errados) ou repetido no arquivo, **Then** a linha é rejeitada com o motivo e as demais seguem.
4. **Given** um CNPJ que já pertence a **outro GE**, **Then** a linha é rejeitada com o aviso de que o CNPJ já está em outro grupo, sem revelar qual (no operador, mostra qual, pois ele vê todos).
5. **Given** o arquivo conferido, **Then** nada é gravado até o operador confirmar; cancelar não muda nada.
6. **Given** um modelo de Excel, **Then** o operador consegue baixá-lo já com as colunas e as instruções.

---

### User Story 3 - O empresário preenche só os funcionários (Priority: P1)

Dentro do seu GE, o empresário encontra as lojas **já preenchidas** e cadastra a **equipe** de cada uma: pessoa a pessoa ou por planilha de funcionários (nome, cargo, carga horária, CPF, horários de entrada e saída). Os dados da loja que vieram do Excel ele **pode corrigir, qualquer um deles** (exceto o CNPJ, que identifica a loja). Ele não consegue criar ou excluir lojas nem outros GEs.

**Why this priority**: é o outro lado do pedido: o empresário só cuida do que só ele sabe, a equipe.

**Independent Test**: como empresário do GE A, abrir uma loja pré-preenchida, corrigir a cidade e o horário de funcionamento, cadastrar 3 funcionários e ver o diagnóstico da loja já usar a equipe.

**Acceptance Scenarios**:

1. **Given** lojas pré-preenchidas pelo operador, **When** o empresário abre Cadastros, **Then** vê as lojas do seu GE e a lista de funcionários de cada uma, pronta para preencher.
2. **Given** a mesma tela, **When** ele corrige um dado da loja (horário, faturamento, regime, turnos etc.), **Then** a correção é gravada e vale no diagnóstico; "Nova loja", "Remover loja" e a importação de lojas não existem para ele, e o CNPJ aparece só para leitura.
3. **Given** que ele cadastra um funcionário, **Then** o funcionário fica ligado a uma loja do **seu** GE; escolher loja de outro GE não é possível.
4. **Given** a importação de planilha de funcionários, **Then** linhas de lojas que não são do seu GE são rejeitadas com o motivo.
5. **Given** que a equipe foi preenchida, **Then** o diagnóstico e as simulações da loja funcionam como hoje.

---

### User Story 4 - O operador acompanha todos os GEs (Priority: P2)

O operador vê a **lista de GEs** (nome, quantas lojas, quantas lojas já com equipe preenchida) para saber quem já completou o cadastro, e pode **entrar em um GE** para conferir ou ajudar, sempre com o GE visível na tela para não confundir de qual está olhando.

**Why this priority**: dá visão do andamento da carga, mas a separação e a carga (histórias 1 a 3) já entregam valor sozinhas.

**Independent Test**: com 3 GEs em andamentos diferentes, a lista mostra o progresso de cada um; entrar num GE mostra o nome dele no topo e só os dados dele.

**Acceptance Scenarios**:

1. **Given** vários GEs, **When** o operador abre a lista, **Then** vê, por GE, o número de lojas e o de lojas com equipe cadastrada.
2. **Given** que ele entra no GE B, **Then** o nome do GE B fica sempre visível e as telas mostram só o GE B.
3. **Given** que ele troca de GE, **Then** nada do GE anterior permanece na tela.

---

### Edge Cases

- Excel com CNPJ com ou sem pontuação (`12.345.678/0001-90` ou `12345678000190`): ambos valem e ficam guardados do mesmo jeito.
- Excel com cabeçalhos faltando ou fora de ordem: o arquivo inteiro é recusado, dizendo quais colunas faltam.
- Horário no formato "07 - 20" (hora de abertura e de fechamento): "07 - 00" significa fecha à meia-noite; "00 - 00" e célula vazia no dia significam **fechado**; horários vindos com minutos e segundos ("07:00:58 - 20:00:58") usam só a hora cheia; horário incompleto ("08 - ") deixa o dia sem horário e avisa; loja sem nenhum horário entra, marcada "horário pendente".
- Regime tributário vazio: a loja entra, marcada "regime pendente". Regime vem como Simples, Presumido ou Real.
- Linhas sem CNPJ só aparecem entre as que não são ativas; se uma ativa vier sem CNPJ, é rejeitada.
- Loja que estava no GE e agora vem com status diferente de Ativado: não é apagada nem desativada sozinha; aparece num aviso para o operador decidir.
- Loja existente que **sumiu** do Excel reenviado: não é apagada; o operador é avisado de que há lojas fora do arquivo.
- Empresário tenta ver dado de outro GE trocando o endereço: resposta "não encontrado", igual a um registro que não existe.
- Funcionário com a mesma matrícula em GEs diferentes: permitido; no mesmo GE, continua a regra atual.
- Auditoria registra o GE de cada ação.
- Remover um GE com lojas: não é possível; o operador precisa desativá-lo (os dados ficam guardados).
- Perfis atuais (dono, gestor, somente consulta) continuam valendo **dentro** de um GE; quem edita a loja é o dono e o gestor, nunca a consulta.
- Operador reenvia o Excel depois de o empresário corrigir uma loja: nada é substituído sem a decisão dele na conferência.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir cadastrar GEs (nome e identificação) e manter cada loja, funcionário, simulação, importação e auditoria ligados a exatamente um GE.
- **FR-002**: Toda consulta, listagem, total, relatório e exportação MUST considerar só o GE de quem está logado; acesso a registro de outro GE MUST responder como "não encontrado".
- **FR-003**: Códigos de loja e matrículas MUST ser únicos **dentro do GE**, podendo repetir entre GEs.
- **FR-004**: A loja MUST passar a ter CNPJ obrigatório e válido (dígitos verificadores), único no sistema inteiro; a identificação da loja na carga e nas atualizações é o CNPJ.
- **FR-005**: O operador MUST poder enviar o Excel da plataforma (relatório de lojas: bandeira, CNPJ, apelido, status, regime tributário, cidade e UF, grupo econômico, responsável pelo GE e horário de segunda a domingo), com um ou vários GEs no mesmo arquivo, e poder baixar um modelo no mesmo formato. Faturamento é opcional na planilha e, quando ausente, a loja entra sem faturamento.
- **FR-006**: O envio do Excel MUST ter duas etapas, conferir e depois confirmar, listando linhas a criar, a atualizar e a rejeitar, com linha e motivo; nada é gravado antes da confirmação.
- **FR-019**: Só linhas com status **Ativado** MUST virar loja; Desativado, Montando e Transição MUST ser ignoradas e contadas por status no resumo da conferência.
- **FR-007**: Reenviar o Excel MUST atualizar as lojas pelo CNPJ, sem duplicar, e avisar sobre lojas do GE que não constam no arquivo, sem apagá-las. Na conferência, MUST apontar as lojas cujos dados o empresário corrigiu depois da última carga, mostrando o valor atual e o do arquivo, para o operador decidir (substituir ou manter) antes de confirmar.
- **FR-008**: Um CNPJ já existente em outro GE MUST ser rejeitado na carga, sem revelar a qual GE pertence.
- **FR-009**: O empresário MUST poder cadastrar, editar e remover funcionários das lojas do seu GE (um a um ou por planilha) e alterar qualquer dado das lojas do seu GE, exceto o CNPJ; MUST NOT poder criar nem remover lojas.
- **FR-010**: A planilha de funcionários MUST rejeitar linhas de lojas fora do GE do usuário, com o motivo.
- **FR-011**: O sistema MUST ter o perfil de **operador da plataforma**, que gerencia GEs e lojas de todos os GEs, e MUST manter os perfis atuais (dono, gestor, somente consulta) valendo dentro de um GE.
- **FR-012**: O operador MUST ver a lista de GEs com número de lojas e de lojas com equipe cadastrada, e MUST poder entrar em um GE, com o nome do GE sempre visível.
- **FR-013**: Os dados atuais MUST ser migrados para um GE inicial sem perda, e os diagnósticos e simulações existentes MUST dar os mesmos resultados de antes.
- **FR-014**: As regras legais (42h, 40h, EC 141/2026) MUST continuar iguais para todos os GEs; os custos (salário médio, encargos, regime) e os valores em reais continuam visíveis só ao dono, agora dentro do seu GE.
- **FR-015**: Um GE MUST poder ser desativado (sem apagar dados); GE desativado não consegue entrar nem alterar nada.
- **FR-016**: A Auditoria MUST registrar o GE e o perfil de cada ação relevante.
- **FR-017**: Nesta entrega o sistema MUST continuar sem login: perfil e GE são escolhidos em tela, e o servidor MUST aplicar a separação por GE em toda consulta, de modo que a entrada por SSO (etapa futura) apenas informe qual é o GE e o perfil de quem entrou, sem mudar as regras de separação.
- **FR-018**: Os dados da loja que vêm do Excel MUST poder ser corrigidos pelo empresário, com a regra de reenvio da Assumption 2.

### Key Entities

- **GE (Grupo Econômico)**: o empresário e o seu conjunto de lojas. Tem nome, identificação e situação (ativo ou desativado). É a fronteira de tudo.
- **Loja**: pertence a um GE; identificada pelo CNPJ (único no sistema) e por um código (único no GE); traz os dados vindos do Excel.
- **Funcionário**: pertence a uma loja e, por isso, a um GE; é a parte que o empresário preenche.
- **Carga de lojas**: um envio de Excel do operador para um GE, com data, resultado (criadas, atualizadas, rejeitadas) e quem enviou.
- **Operador da plataforma**: quem cria GEs e carrega lojas; vê todos os GEs.
- **Usuário do GE**: dono, gestor ou somente consulta; enxerga só o seu GE.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em testes com dois ou mais GEs, **100%** das telas, totais e relatórios mostram só dados do GE de quem olha; nenhum caso de dado de outro GE aparece.
- **SC-002**: O Excel da plataforma (cerca de **2.800 linhas**, **1.800 lojas ativas** em **490 GEs**) é conferido em até **60 segundos** e gravado em até **2 minutos** depois da confirmação.
- **SC-003**: Reenviar o mesmo Excel **sem mudanças** cria **0** lojas novas e altera **0** dados.
- **SC-004**: Um empresário com as lojas já preenchidas cadastra a equipe de uma loja e vê o diagnóstico em **menos de 5 minutos**, sem digitar nenhum dado de loja.
- **SC-005**: Depois da mudança, os diagnósticos e simulações existentes dão **exatamente os mesmos números** de antes e **nenhum** dado é perdido.
- **SC-006**: **100%** das linhas rejeitadas na carga mostram a linha e o motivo em linguagem simples.

## Assumptions

- **1 (login)**: *Decidido pelo usuário*: o login fica **fora desta entrega** e virá depois, por **SSO com outra plataforma**. Por ora, perfil e GE são escolhidos em tela. A separação de dados já é garantida no servidor, mas, sem login, não protege contra quem mexa no navegador de propósito; isso precisa ser resolvido pelo SSO antes de usar com dados reais.
- **2 (dados da loja)**: *Decidido pelo usuário*: o empresário pode **editar qualquer dado da loja** (exceto o CNPJ). O Excel do operador pré-preenche e pode ser reenviado; como o empresário pode ter corrigido dados, a conferência do reenvio mostra o que seria substituído e o operador escolhe, loja a loja ou para todas, entre substituir e manter. Decision: manter por padrão o que o empresário corrigiu. Why: evita apagar uma correção sem querer. A configuração de simulação (turnos, mínimos, custos) segue o que já existe hoje (custos só para o dono).
- Decision: GE novo recebe como identificação o número do "Grupo Econômico" do Excel e como nome o "Nome do responsável pelo GE" (único em cada grupo no arquivo atual). Why: não pedem nada ao operador e dá para reconhecer o grupo.
- Decision: o "Anjo responsável" do Excel não entra nesta entrega (varia entre lojas do mesmo GE). Why: não muda a Escala.
- Decision: status Montando e Transição também ficam de fora, junto de Desativado. Why: ainda não operam normalmente; entram quando virarem Ativado em um reenvio.
- Dados reais: o Excel traz CNPJs e nomes de pessoas reais. Ele fica **só na máquina**, fora do git; os testes usam uma cópia **anonimizada** com o mesmo formato.
- Decision: o CNPJ vira a identificação da loja na carga. Why: é o que o operador já tem em mãos e não muda.
- Decision: um empresário pertence a um só GE nesta entrega. Why: é o caso descrito; vários GEs por pessoa pode vir depois.
- Decision: o GE inicial recebe os dados atuais; os registros atuais sem CNPJ recebem uma marca para o operador completar. Why: não perder dado e não travar o que já funciona.
- As tabelas de ponto (AFD) seguem guardadas sem uso e também passam a ter GE.
- Fora do escopo: login, senha e SSO (etapa futura), cobrança por GE, encargos (fica para depois), edição em massa de funcionários pelo operador, relatórios entre GEs.
- Dados continuam fictícios enquanto o parecer de proteção de dados não existir.
