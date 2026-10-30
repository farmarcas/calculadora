# Feature Specification: Cadastro de loja completo (dados, faturamento e equipe)

**Feature Branch**: `feat/cadastro-loja-completo`
**Created**: 2026-10-28
**Status**: Draft
**Input**: User description: "Em Cadastro, a configuração de loja deve ter: nome, CNPJ, cidade e UF, bandeira, horário de funcionamento (como na imagem em anexo). Também preencher o faturamento diário por dia da semana e o faturamento médio mensal (ajuste posterior: isso deve tirar a necessidade de subir a base comercial). Na configuração de loja deve ter também a lista de funcionários que trabalham nela, com nome, carga horária mensal, cargo, CPF e horário de entrada e saída atual."

## Situação de hoje

O Cadastro já tem: nome, código, CNPJ, UF, marca (a "bandeira") e o horário dia a dia (segunda a domingo, aberta/fechada, 24 horas). Funcionário tem matrícula, nome, CPF, cargo, função de escala e carga **semanal**, mas é cadastrado numa tela separada da loja, e o horário de entrada e saída só vem da planilha de escala. **Faltam:** cidade, faturamento por dia da semana, faturamento médio mensal, carga horária mensal, horário de entrada/saída digitável e a lista de funcionários dentro da própria loja.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dados da loja completos, com cidade e bandeira (Priority: P1)

Quem cadastra a loja informa nome, CNPJ, **cidade**, UF, **bandeira**, **regime tributário** (Simples Nacional, Lucro Presumido ou Lucro Real) e o horário de funcionamento dia a dia (incluindo "24 horas" e dias fechados), tudo na mesma tela de configuração da loja.

**Why this priority**: é a base de tudo; sem a loja bem descrita o resto não faz sentido.

**Independent Test**: criar uma loja preenchendo todos os campos, reabrir e conferir que tudo foi gravado e aparece na listagem.

**Acceptance Scenarios**:

1. **Given** a tela de nova loja, **When** preencho nome, CNPJ, cidade, UF, bandeira e horários e salvo, **Then** a loja aparece com esses dados ao reabrir.
2. **Given** um CNPJ inválido ou UF fora da lista de estados, **When** tento salvar, **Then** o sistema avisa em português e não grava.
3. **Given** lojas já cadastradas sem cidade, **When** abro o cadastro, **Then** elas continuam funcionando e a cidade fica em branco até ser preenchida.
4. **Given** uma planilha de importação com coluna de cidade, **When** importo, **Then** a cidade é aproveitada.
5. **Given** a tela da loja, **When** escolho o regime tributário, **Then** só aparecem as três opções (ou "não informado") e a escolha fica gravada.
6. **Given** uma loja que já tinha o regime informado no painel de Custos do Diagnóstico, **Then** o valor aparece no cadastro da loja sem a pessoa precisar digitar de novo, e o painel de Custos passa a mostrar o mesmo valor.

---

### User Story 2 - Faturamento por dia da semana e médio mensal (Priority: P1)

Na configuração da loja a pessoa informa o **faturamento médio de cada dia da semana** (segunda a domingo) e o **faturamento médio mensal**. O sistema mostra a soma estimada dos dias ao lado do mensal informado, para a pessoa perceber se há diferença grande.

**Why this priority**: é a fonte de venda da loja. Com ela, o Diagnóstico deixa de exigir a base comercial (ver história 4).

**Independent Test**: preencher os sete valores e o mensal, salvar, reabrir e conferir; deixar em branco e conferir que nada quebra.

**Acceptance Scenarios**:

1. **Given** a configuração da loja, **When** informo o faturamento de cada dia e o mensal e salvo, **Then** os valores ficam gravados e aparecem ao reabrir.
2. **Given** valores preenchidos, **Then** o sistema mostra a soma semanal × 52/12 ao lado do mensal informado, como conferência, sem bloquear o salvamento.
3. **Given** um valor negativo ou texto, **When** salvo, **Then** o sistema recusa com aviso claro.
4. **Given** um dia fechado, **Then** o faturamento desse dia pode ficar em branco.
5. **Given** o perfil gestor ou consulta, **Then** só vê o faturamento se for o dono (mesma regra de valores em reais dos custos).
6. **Given** que a pessoa informa também a **margem bruta média (%)**, **Then** o sistema consegue estimar a margem dos cenários; sem ela, os cenários que dependem de margem avisam que falta esse dado.

---

### User Story 3 - Equipe da loja dentro da configuração da loja (Priority: P1)

Dentro da configuração da loja há a **lista de funcionários** que trabalham nela. Cada um tem: nome, **carga horária mensal**, cargo, CPF e **horário de entrada e saída atual**. A pessoa adiciona, edita e remove funcionários ali mesmo, sem ir a outra tela.

**Why this priority**: hoje o cadastro de equipe é separado e sem horário digitável; o pedido é ter tudo num lugar só.

**Independent Test**: abrir uma loja, adicionar dois funcionários com todos os campos, salvar, reabrir e conferir; remover um e conferir que some da lista e da escala.

**Acceptance Scenarios**:

1. **Given** a configuração de uma loja, **When** adiciono um funcionário com nome, carga mensal, cargo, CPF e entrada/saída, **Then** ele aparece na lista da loja e na tela de Cadastros.
2. **Given** a carga mensal (ex.: 220 h), **Then** o sistema usa a carga semanal equivalente (mensal ÷ 5, ex.: 44 h) nos cálculos já existentes (diagnóstico, regras 42h/40h).
3. **Given** um CPF inválido ou repetido na mesma loja, **When** salvo, **Then** o sistema avisa e não grava.
4. **Given** um horário de saída igual ou anterior à entrada (sem virada de dia), **When** salvo, **Then** o sistema avisa e não grava.
5. **Given** um funcionário removido, **Then** ele sai da lista e deixa de contar nos cálculos (exclusão lógica, o histórico é preservado).
6. **Given** a lista de uma loja grande, **Then** dá para buscar por nome ou cargo.
7. **Given** funcionários já cadastrados por planilha com horário vindo da carga de escala, **Then** o horário aparece preenchido e pode ser corrigido na mão.

---

### User Story 4 - Diagnóstico sem precisar subir a base comercial (Priority: P1)

Com o faturamento informado no cadastro da loja, o Diagnóstico e os cenários (2, 3 e 4, que dependem de venda) funcionam **sem** base comercial. Como o cadastro só tem o valor do dia, e não de cada hora, o sistema distribui o faturamento de cada dia **igualmente entre as horas em que a loja está aberta** e avisa, na tela, que é uma estimativa. Quem quiser mais precisão ainda pode enviar a base comercial (opcional): nesse caso ela vale no lugar do cadastro.

**Why this priority**: é o ajuste pedido: tirar a obrigação de subir a base.

**Independent Test**: loja sem base comercial e com faturamento no cadastro: o Diagnóstico mostra os cenários 2, 3 e 4 com venda estimada e o aviso; enviar a base muda a origem para "base comercial".

**Acceptance Scenarios**:

1. **Given** uma loja com faturamento por dia e sem base, **When** abro o Diagnóstico, **Then** os cenários usam o faturamento do cadastro e mostram "estimativa a partir do faturamento cadastrado (distribuído igualmente nas horas abertas)".
2. **Given** só o faturamento mensal, **Then** o sistema o divide igualmente entre os dias abertos da semana.
3. **Given** uma loja com base comercial enviada, **Then** a base vale e o aviso diz que a origem é a base comercial.
4. **Given** nenhum faturamento nem base, **Then** a tela diz "informe o faturamento da loja no Cadastro" (em vez de "envie a base comercial").
5. **Given** o faturamento vindo só do cadastro, **Then** o aviso "horário de maior venda" não é mostrado, porque a distribuição por hora é igual por suposição.
6. **Given** gestor ou consulta, **Then** nada de valores em reais aparece (como hoje).

---

### Edge Cases

- Loja 24 horas: entrada/saída do funcionário aceita virada de dia (ex.: 22:00 às 06:00).
- Carga mensal que não bate com nenhuma regra conhecida (ex.: 150 h): aceita, mostra a carga semanal equivalente e avisa que ela fica fora das regras 42h/40h do diagnóstico.
- Funcionário com CPF em branco: permitido (hoje já é opcional); só valida quando preenchido.
- Dois usuários editando a mesma loja: vale a última gravação, com aviso se a loja mudou desde que a tela foi aberta.
- Faturamento mensal em branco com dias preenchidos: o sistema sugere o valor estimado, mas não o grava sozinho.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A loja MUST ter os campos nome, CNPJ, cidade, UF, bandeira e horário de funcionamento dia a dia (aberta/fechada, abre/fecha, 24 horas), editáveis na mesma tela.
- **FR-001a**: A loja MUST ter o regime tributário, com exatamente três valores possíveis (Simples Nacional, Lucro Presumido, Lucro Real) ou não informado; o valor MUST existir em um só lugar (o cadastro da loja), e o painel de Custos do Diagnóstico passa a lê-lo de lá.
- **FR-002**: O sistema MUST validar CNPJ (dígitos verificadores) e UF (estados brasileiros) com mensagens em português.
- **FR-003**: Lojas existentes sem cidade MUST continuar funcionando; a cidade é opcional.
- **FR-004**: A loja MUST guardar o faturamento médio por dia da semana (sete valores, cada um opcional) e o faturamento médio mensal (opcional), em reais, não negativos.
- **FR-005**: O sistema MUST mostrar, ao lado do mensal informado, a soma estimada dos dias (semanal × 52/12), sem bloquear divergência.
- **FR-006**: O faturamento MUST ser visível e editável só para o dono (TENANT_ADMIN); para os demais perfis o campo não existe na resposta.
- **FR-007**: A tela de configuração da loja MUST listar os funcionários da loja, com busca por nome ou cargo, e permitir adicionar, editar e remover ali.
- **FR-008**: Cada funcionário MUST ter nome, carga horária mensal, cargo, CPF e horário de entrada e saída atual.
- **FR-009**: O sistema MUST converter a carga mensal em carga semanal (mensal ÷ 5) para os cálculos existentes, sem mudar o resultado de quem já tem carga semanal cadastrada.
- **FR-010**: O sistema MUST validar CPF (dígitos verificadores, único por loja entre funcionários ativos) quando informado, e que a saída seja diferente da entrada.
- **FR-011**: Remover funcionário MUST ser exclusão lógica, com registro em auditoria, como já ocorre no resto do módulo.
- **FR-012**: O horário de entrada/saída digitado MUST ser o "horário atual" usado pela escala atual do Diagnóstico quando não houver carga de escala importada para aquele funcionário; quando houver, a importação continua mandando e a divergência é sinalizada.
- **FR-013**: A planilha modelo e a importação MUST aceitar as colunas novas (cidade, carga mensal, entrada, saída, faturamento por dia e mensal) e continuar aceitando planilhas antigas.
- **FR-014**: CPF é dado pessoal: MUST aparecer mascarado (***.123.456-**) para quem não é dono ou gestor, e não aparecer em logs.

- **FR-015**: O Diagnóstico MUST usar a base comercial quando existir; senão o faturamento do cadastro (distribuído igualmente nas horas abertas de cada dia); senão avisar que falta informar o faturamento.
- **FR-016**: O sistema MUST mostrar a origem da venda (base comercial ou estimativa do cadastro) no Diagnóstico e nos cenários.
- **FR-017**: A loja MUST aceitar margem bruta média (%) opcional (0 a 100), só dono, usada para a margem estimada quando não há base.
- **FR-018**: Enviar a base comercial MUST ser opcional e não bloquear nenhum cenário.

### Key Entities

- **Loja**: passa a ter cidade, regime tributário e faturamento (por dia da semana e médio mensal); mantém nome, CNPJ, UF, bandeira e horários.
- **Funcionário**: passa a ter carga mensal e horário de entrada/saída atual; mantém nome, cargo, CPF, função de escala; pertence a uma loja.
- **Faturamento da loja**: sete valores diários opcionais mais um mensal opcional, restritos ao dono.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cadastrar uma loja completa (dados, horário, faturamento e três funcionários) leva menos de 5 minutos, sem sair da tela de configuração da loja.
- **SC-002**: 100% das lojas e funcionários já cadastrados continuam abrindo e calculando o diagnóstico com os mesmos resultados de antes da mudança.
- **SC-003**: Nenhum valor de faturamento aparece para gestor ou consulta em nenhuma tela ou resposta.
- **SC-004**: Dados inválidos (CNPJ, UF, CPF, horário) nunca são gravados e sempre geram aviso em português compreensível.
- **SC-005**: Planilhas importadas antes desta mudança continuam sendo aceitas sem ajuste.

## Assumptions

- **"Bandeira" é o campo "Marca" que já existe**; só muda o rótulo na tela para "Bandeira (marca)". Why: evita dois campos para a mesma coisa.
- **Horário de funcionamento "como na imagem em anexo"**: a imagem não chegou nesta conversa. Usamos o editor que já existe (dia a dia, 24 horas, dia fechado). Se a imagem mostra outro formato, ajustamos na etapa do plano.
- **Faturamento do cadastro é a fonte de venda do Diagnóstico**; a base comercial vira opcional e, quando enviada, tem prioridade por ter o dado hora a hora. Why: pedido de tirar a obrigação de subir a base.
- **Distribuição por hora = igual entre as horas abertas** (única suposição honesta sem dado por hora); sempre sinalizada como estimativa.
- **Margem**: campo opcional "margem bruta média (%)" no faturamento da loja, só dono; margem = faturamento × %. Sem ela, os cenários que precisam de margem avisam. A base comercial, quando enviada, traz a margem real.
- **Dias que o funcionário trabalha**: para o horário de entrada/saída entrar na escala atual é preciso saber em quais dias; o formulário ganha "dias da semana" (padrão segunda a sexta). Sem os dias, o horário digitado é só informativo.
- **Carga mensal ÷ 5 = carga semanal** (220 h = 44 h, 210 h = 42 h, 200 h = 40 h), igual à convenção que o motor de regras já usa.
- **Horário atual do funcionário**: mesmo turno em todos os dias trabalhados, com intervalo opcional; escala por dia da semana diferente fica fora (continua vindo da planilha de escala).
- **Perfis**: dono e gestor cadastram; consulta só vê. Faturamento só dono.
- **Regime tributário é informativo**: não altera nenhum cálculo do Diagnóstico nesta entrega; visível para quem vê a loja e editável por quem edita a loja (não é valor em reais). Hoje ele já existe como texto informativo no painel de Custos; passa a morar no cadastro da loja. Why: um só lugar, e é dado da loja, não do custo.
- **Fora do escopo**: rede de lojas, folguista, integração com a plataforma Farmarcas, curva de venda por hora padrão de mercado (usamos distribuição igual).
- Decisões técnicas (tabelas, validação, telas) ficam para o plano.
