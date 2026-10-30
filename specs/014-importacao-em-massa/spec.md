# Feature Specification: Importação em massa do cadastro de loja

**Feature Branch**: `feat/importacao-em-massa`
**Created**: 2026-10-30
**Status**: Draft
**Input**: User description: "Em Cadastro, trocar o título para Cadastro de Loja. Para importação, deixar só um botão principal 'Importar em massa' com ícone de upload; ao clicar abre o modal para fazer o upload, e lá fica o botão de baixar a planilha modelo. Verificar se a planilha está adequada ao que precisa ser preenchido hoje no cadastro (a função foi feita antes das mudanças); se for preciso, deixar a planilha com duas abas." Decisões do dono do pedido: o dono do grupo também atualiza lojas em massa; a configuração da loja entra na planilha, na aba Lojas.

## Situação de hoje

- A tela mostra o título "Cadastros" e **dois botões** lado a lado: "Baixar planilha modelo" e "Importar equipe por planilha" (para o operador: "Importar planilha").
- A planilha modelo já tem **duas abas de dados** (Lojas e Funcionários) mais uma aba "Como preencher". Cobre: dados da loja (código, nome, CNPJ, cidade, UF, marca, regime tributário), horário por dia da semana, loja 24 horas, faturamento por dia e mensal, margem bruta; e, para funcionários, matrícula, nome, loja, CPF, cargo, função de escala, carga semanal e mensal, entrada, saída e dias.
- **Falta na planilha** o que o cadastro passou a pedir depois: o **horário fixo** do funcionário e a **configuração da loja** (convenção de 8h24, metas por função, salário médio por função e encargos).
- Quem cuida de um grupo (dono, gestor) importa **só a equipe**; a aba Lojas só vale para o operador. Por isso o dono não consegue atualizar horário e faturamento das lojas em massa.
- O fluxo é: enviar o arquivo, conferir o que o sistema entendeu (mapeamento de colunas) e só então gravar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Um botão "Importar em massa" que abre o modal com o modelo (Priority: P1)

Na tela, o título passa a ser **Cadastro de Loja** e as ações de planilha ficam num **único botão principal, "Importar em massa"**, com ícone de upload. Ao clicar, abre o modal de importação; **dentro dele** está o botão "Baixar planilha modelo" e o campo para enviar o arquivo.

**Why this priority**: simplifica a tela e deixa o caminho de importação em um só lugar.

**Independent Test**: abrir Cadastro de Loja e ver título novo e um só botão; abrir o modal e baixar o modelo de dentro dele.

**Acceptance Scenarios**:

1. **Given** a tela de cadastro, **Then** o título é "Cadastro de Loja" e existe um único botão de planilha, "Importar em massa", com ícone de upload; os botões "Baixar planilha modelo" e "Importar equipe por planilha" não aparecem mais na tela.
2. **Given** que clico em "Importar em massa", **Then** abre o modal com o botão "Baixar planilha modelo" e o envio do arquivo (.xlsx ou .csv).
3. **Given** o modal aberto, **When** clico em "Baixar planilha modelo", **Then** o arquivo é baixado sem fechar o modal.
4. **Given** um perfil sem permissão de importar (somente consulta), **Then** o botão não aparece.

---

### User Story 2 - A planilha modelo cobre tudo que o cadastro pede hoje (Priority: P1)

O modelo continua com **duas abas de dados**, **Lojas** e **Funcionários**, mais a aba de ajuda "Como preencher". Cada campo que o cadastro de loja e de funcionário tem hoje existe como coluna do modelo, e uma planilha preenchida grava o que a edição da loja grava.

- **Aba Lojas**: tudo o que já existe (dados, horário por dia, 24 horas, faturamento, margem) **mais** a configuração: convenção 8h24 (Sim/Não), **metas por função** (pessoas por hora de Farmacêutico, Atendimento, Caixa, Apoio, Perfumaria; sem valor = nível de hoje, farmacêutico sempre ao menos 1), **salário médio por função** e **encargos (%)**.
- **Aba Funcionários**: tudo o que já existe **mais** "Horário fixo (Sim/Não)".
- A aba "Como preencher" explica cada coluna nova em linguagem simples, diz quem pode preencher o quê e que a linha 2 é só exemplo.

**Why this priority**: sem isso a importação em massa deixa a loja incompleta e a pessoa ainda tem de abrir loja por loja.

**Independent Test**: preencher uma linha de loja e uma de funcionário com todas as colunas, importar, e ver na edição da loja os mesmos valores (dados, horário, faturamento, convenção, metas, custos e horário fixo).

**Acceptance Scenarios**:

1. **Given** o modelo baixado, **Then** ele tem as abas Lojas, Funcionários e Como preencher, e a aba Lojas traz as colunas de convenção, metas, salários e encargos.
2. **Given** uma linha de funcionário com "Horário fixo = Sim", **When** importo, **Then** o funcionário fica com horário fixo no cadastro.
3. **Given** metas e convenção preenchidas numa linha de loja, **When** importo, **Then** a configuração da loja mostra esses valores e o diagnóstico usa eles.
4. **Given** salário médio e encargos preenchidos por um dono, **When** importo, **Then** os custos da loja ficam gravados; preenchidos por quem não é dono, **Then** essas colunas são ignoradas e o resumo avisa.
5. **Given** uma planilha antiga (sem as colunas novas), **When** importo, **Then** funciona como antes e não apaga o que já estava cadastrado.
6. **Given** coluna vazia numa loja que já existe, **Then** o valor atual da loja é mantido (vazio não apaga).

---

### User Story 3 - O dono também atualiza as lojas em massa (Priority: P1)

Quem cuida do grupo (dono) passa a importar, na aba Lojas, os dados das lojas **que já existem**: horário, faturamento, margem, convenção, metas e custos. **Loja nova continua sendo criada só pelo operador**, e código e CNPJ continuam sendo só do operador. O operador mantém tudo o que faz hoje.

**Why this priority**: é a necessidade real: dezenas de lojas por grupo e hoje é preciso editar uma a uma.

**Independent Test**: dono importa uma aba Lojas com 3 lojas existentes e 1 inexistente: 3 são atualizadas, 1 vira erro com o motivo.

**Acceptance Scenarios**:

1. **Given** um dono e uma loja existente na planilha, **When** importo, **Then** o horário, o faturamento, a margem e a configuração da loja são atualizados.
2. **Given** um dono e um código de loja que não existe no grupo, **Then** a linha não entra e o resumo diz "Loja não cadastrada: só o operador cria lojas".
3. **Given** um dono e uma planilha com CNPJ ou nome diferentes do cadastro, **Then** o CNPJ é ignorado (só o operador altera) e o aviso aparece no resumo.
4. **Given** um gestor de escala, **Then** ele importa só a equipe (como hoje); a aba Lojas é ignorada com aviso.
5. **Given** o operador, **Then** nada muda no que ele já faz (criar e atualizar lojas).

---

### User Story 4 - Resumo claro depois de importar (Priority: P2)

Depois de confirmar, o modal mostra quantas lojas e funcionários foram criados e atualizados, o que foi **ignorado por falta de permissão** e a lista de linhas que não entraram, com aba, linha e motivo em português simples. Nada é gravado antes da confirmação.

**Acceptance Scenarios**:

1. **Given** uma importação com erros, **Then** o resumo lista cada linha com aba, número da linha e motivo.
2. **Given** colunas ignoradas por permissão, **Then** o resumo as cita (ex.: "Salário médio e encargos: só o dono grava").

---

### Edge Cases

- Valor inválido em coluna nova (Sim/Não que não é, percentual fora de 0–100, meta negativa): a linha da loja não entra e o motivo cita a coluna.
- Salário preenchido só para algumas funções: grava as informadas e mantém as demais.
- Convenção 8h24 vazia: mantém o que a loja já tem (padrão: não).
- Arquivo grande (centenas de lojas): continua importando de uma vez, com o mesmo resumo.
- Colunas fora do modelo: o fluxo atual de conferir o mapeamento continua valendo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de cadastro MUST ter o título "Cadastro de Loja".
- **FR-002**: A tela MUST mostrar um único botão de planilha, "Importar em massa", com ícone de upload; os botões "Baixar planilha modelo" e "Importar equipe por planilha" saem da tela.
- **FR-003**: O botão MUST abrir o modal de importação; o botão "Baixar planilha modelo" MUST ficar dentro dele.
- **FR-004**: O modelo MUST ter as abas Lojas, Funcionários e Como preencher, e cada campo do cadastro de loja e de funcionário de hoje MUST existir como coluna.
- **FR-005**: A aba Lojas MUST incluir convenção 8h24, metas por função, salário médio por função e encargos; a aba Funcionários MUST incluir horário fixo.
- **FR-006**: A importação MUST gravar essas colunas no mesmo lugar em que a edição da loja grava (configuração, custos, horário fixo).
- **FR-007**: Salário médio, encargos, faturamento e margem MUST ser gravados só por quem é dono; para os outros perfis MUST ser ignorados com aviso no resumo.
- **FR-008**: O dono MUST poder atualizar em massa lojas que já existem (horário, faturamento, margem, convenção, metas, custos); criar loja, código e CNPJ MUST continuar só do operador.
- **FR-009**: Célula vazia MUST manter o valor atual; planilha antiga, sem as colunas novas, MUST continuar importando.
- **FR-010**: O resumo MUST mostrar criados, atualizados, ignorados por permissão e as linhas com erro (aba, linha, motivo); nada é gravado antes da confirmação.
- **FR-011**: Perfil sem permissão de importar MUST não ver o botão.

### Key Entities

- **Planilha modelo**: arquivo com as abas Lojas, Funcionários e Como preencher.
- **Loja**: dados, horário, faturamento, margem, convenção 8h24, metas por função e custos.
- **Funcionário**: dados da equipe e marca de horário fixo.

## Success Criteria *(mandatory)*

- **SC-001**: Em 100% dos campos do cadastro de loja e de funcionário de hoje, existe a coluna correspondente no modelo (conferido por teste).
- **SC-002**: Um dono atualiza as 37 lojas de um grupo com **uma** planilha, em menos de 1 minuto, sem abrir loja por loja.
- **SC-003**: Uma planilha preenchida e importada deixa a loja com os mesmos valores que a edição manual (dados, horário, faturamento, configuração, custos e horário fixo).
- **SC-004**: Planilhas antigas continuam importando sem apagar dados.
- **SC-005**: Quem só quer baixar o modelo ou importar encontra tudo com **um clique** no botão "Importar em massa".

## Assumptions

- Decision: "título" é o título da página (Cadastro de Loja); o item do menu lateral continua "Cadastros". Why: foi o que o pedido citou; trocar o menu é outra decisão.
- Decision: a aba "Como preencher" é de ajuda e não entra na contagem das "duas abas" de dados. Why: o pedido fala em duas abas para preencher.
- Decision: metas por função usam o mesmo formato da configuração da loja (pessoas por hora), com Farmacêutico sempre ao menos 1. Why: é o que a loja já grava hoje.
- Decision: o horário por turno e os turnos da loja NÃO entram na planilha. Why: são montados na tela e não cabem numa linha; ficam para a edição da loja.
- Decision: o ícone de upload é um ícone de traço (estilo Lucide), no padrão do design system. Why: o DS não traz ícone de upload e usa Lucide.
- Decision: valores fictícios enquanto o parecer de proteção de dados não existir (aviso que já existe).
