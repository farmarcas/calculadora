# Feature Specification: Diagnóstico da escala com tabela por cargo (versão A1)

**Feature Branch**: `feat/coluna-folha-no-faturamento` (os ajustes se acumulam nesta branch até a pessoa mandar abrir o PR)

**Created**: 2026-11-12

**Status**: Draft

**Input**: Board "Diagnóstico da escala · tabela por cargo · versões compactas (A1 a A4)". Implementa só a **versão A1**; as versões A2, A3 e A4 ficam como referência futura. **Não muda o cálculo da cobertura**: muda a apresentação, a leitura por cargo e os textos do card do Diagnóstico.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver, por cargo, quem falta e quem se contrata (Priority: P1)

O card "Diagnóstico da escala" passa a ser **um card só, mais baixo** (cerca de 340 px em tela de 1440 px), com duas colunas alinhadas ao topo e uma linha de rodapé.

**Coluna esquerda**
1. Chip: rosa "Falta cobertura na regra de {42h}" ou, quando não falta nada, verde "Cobre o horário na regra de {42h}".
2. Título: "Faltam {21h} de farmacêutico por semana".
3. Parágrafo: "A partir de {16/12/2026}, daqui a {35} dias, a loja deixa de cobrir todo o horário com farmacêutico. Hoje, na regra de {44h}, já faltam {11h} por semana."
4. Gráfico "FALTAM DE FARMACÊUTICO POR SEMANA" com três linhas: "Hoje · 44h" (cinza), "42h" (vermelho, em negrito, é a regra do diagnóstico) e "40h" (cinza), valor à direita e barras proporcionais ao maior valor.

**Coluna direita**
1. "CONTRATAÇÕES SUGERIDAS" e "{2} pessoas".
2. Tabela **Cargo | Pessoas | Horas por semana | Falta por semana**, números à direita:
   - Linha de referência no alto, em fundo suave: "Loja aberta na semana" com "{105h}" em negrito (total de horas de funcionamento da semana, vindo do Cadastro da loja).
   - Uma linha por cargo, com a tag do cargo e o status ao lado ("Obrigatório" em pílula escura para o farmacêutico, "Desejável" em pílula só com contorno, ou "Sem falta" em texto secundário). Cada linha mostra **hoje → com a sugestão** em Pessoas, Horas por semana e Falta por semana (a falta final em "0h" fica numa pílula verde; sem falta, "—"). O farmacêutico traz também "{4} turnos a cobrir"; o cargo sem falta pode mostrar "sobram {6}h".
   - Linha final **"Equipe toda"**, em negrito e com borda superior de 2 px: pessoas, horas por semana e "−24h → +60h" (o "+60h" em verde).
3. Nota: "Obrigatório: a loja precisa de farmacêutico em todo o horário. Desejável: mantém o serviço de hoje. Cada pessoa nova dá {42h} por semana."

**Rodapé do card:** à esquerda "FOLHA MENSAL ATUAL" (com o ícone "i") e "R$ 32.584 · 7,2% do faturamento", e "FATURAMENTO MENSAL DA LOJA" com "R$ 450.567 · Cadastro da loja"; à direita a pílula âmbar "1 pendência" + "3 colaboradores sem função de escala, fora do cálculo." + link "Definir função" (sem pendência: "Sem pendências em cobertura e metas." + link "Atualizar base comercial").

**Why this priority**: O dono vê numa olhada o que falta de farmacêutico e o que a sugestão muda em cada cargo, sem rolar a página.

**Independent Test**: Em Cosmópolis, na aba da regra de 42h, o card mostra a falta de farmacêutico da regra, a tabela com um cargo por linha e a "Equipe toda", e muda quando a aba muda para 44h ou 40h.

**Acceptance Scenarios**:

1. **Given** a aba da regra de 42h, **When** o card é visto, **Then** o título, o parágrafo, o gráfico (com a barra de 42h em vermelho e negrito) e a tabela se referem a essa regra.
2. **Given** a troca de aba para 44h ou 40h, **When** o card é visto, **Then** todas as horas e faltas se recalculam para a regra escolhida.
3. **Given** a tabela, **When** é lida, **Then** os números de cada linha são "hoje → com a sugestão", e as contratações sugeridas somam as mesmas pessoas e horas do cálculo de "Contratações sugeridas" que já existe.
4. **Given** uma função com colaboradores sem função de escala, **When** o rodapé é visto, **Then** a pendência aparece e essas pessoas ficam fora do cálculo.

---

### User Story 2 - Obrigatório, desejável e sem falta (Priority: P1)

- O **farmacêutico é sempre "Obrigatório"**.
- Os demais cargos só aparecem como **"Desejável"** quando faltam horas para manter o nível de serviço de hoje; quando não faltam, aparecem como **"Sem falta"**.
- Tags de cargo: Farmacêutico em verde, Atendimento em azul, Caixa em âmbar e os outros cargos na cor neutra do sistema.
- O status nunca depende só de cor: a pílula tem texto.

**Acceptance Scenarios**:

1. **Given** um atendente com horas faltando para manter o serviço de hoje, **When** a linha é vista, **Then** mostra "Desejável".
2. **Given** um cargo sem falta, **When** a linha é vista, **Then** mostra "Sem falta" em texto secundário e a coluna Falta em "—".

---

### User Story 3 - Gestor e consulta sem valores em reais (Priority: P1)

Para gestor e consulta, o restante do card é igual (são horas e pessoas), mas "Folha mensal atual" mostra **só "Aumenta", "Igual" ou "Diminui"** quando houver variação, sem R$ nem %, e o "Faturamento mensal da loja" **some**. A checagem é feita **no servidor**, não só na tela: a resposta para esses perfis não traz folha nem faturamento.

**Acceptance Scenarios**:

1. **Given** o perfil gestor ou consulta, **When** o card é visto, **Then** não há "R$" nem "%" de folha ou faturamento e o bloco de faturamento não aparece.
2. **Given** a resposta do servidor para esses perfis, **When** é lida, **Then** não contém valores de folha nem de faturamento.

---

### User Story 4 - Estados e acessibilidade (Priority: P2)

- **Carregando:** esqueleto das duas colunas, sem números.
- **Sem falta de cobertura:** chip verde "Cobre o horário na regra de {42h}", título "A loja cobre todo o horário com farmacêutico", coluna Falta em "0h" e "Contratações sugeridas" escondida.
- **Sem dados de custo:** "Dados do custo ainda não informados." no lugar do valor.
- **Tabela semântica** com cabeçalhos visíveis; **barras do gráfico** com texto alternativo ("42h: faltam 21h por semana"); o **ícone "i"** da folha é alcançável pelo teclado, abre com Enter e Espaço e tem o rótulo "Como a folha é calculada"; contraste suficiente nas pílulas.

### Edge Cases

- **Cargo que não existe na loja:** não aparece linha (por exemplo, sem Caixa, sem a linha de Caixa).
- **Cargo sem mínimo:** a meta é manter o nível de hoje; a coluna Falta mostra a falta ou "—".
- **Loja sem horário cadastrado:** a linha "Loja aberta na semana" mostra "—" e o card avisa o que falta.
- **Regra sem cálculo disponível:** o card mostra o que já mostra hoje ("Sem cálculo para esta regra").
- **Muitos cargos:** as linhas aumentam e o card cresce só em altura.
- **Tela estreita:** as colunas empilham sem perder informação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O card tem a coluna esquerda (chip, título, parágrafo e gráfico de faltas por regra) e a coluna direita (contratações sugeridas e a tabela por cargo), mais o rodapé, com os textos definidos nesta spec.
- **FR-002**: O gráfico mostra a falta de farmacêutico em "Hoje · 44h", "42h" e "40h", com a regra do diagnóstico em vermelho e negrito, barras proporcionais ao maior valor e texto alternativo com o valor.
- **FR-003**: A tabela tem as colunas Cargo, Pessoas, Horas por semana e Falta por semana, com a linha de referência "Loja aberta na semana" (horas de funcionamento do Cadastro) e uma linha por cargo existente na loja.
- **FR-004**: Cada linha de cargo mostra "hoje → com a sugestão" para pessoas, horas e falta, a tag do cargo e o status (Obrigatório, Desejável ou Sem falta), conforme a User Story 2.
- **FR-005**: A linha "Equipe toda" mostra pessoas, horas e "capacidade menos necessidade (ou meta)" de hoje → com a sugestão, pelo mesmo cálculo que já existe.
- **FR-006**: Os números mudam conforme a regra da aba selecionada (44h, 42h, 40h), e cada pessoa nova soma as horas semanais da regra.
- **FR-007**: A sugestão usada nas setas é a mesma de "Contratações sugeridas" que já existe; o cálculo da cobertura não muda.
- **FR-008**: O rodapé mostra a folha mensal atual (com o "i" explicativo) e o faturamento mensal, e a pendência (ou "Sem pendências…" com o link correto).
- **FR-009**: Dono vê R$ e %; gestor e consulta veem só Aumenta/Igual/Diminui na folha, sem faturamento; o servidor não envia valores em reais a esses perfis.
- **FR-010**: Estados de carregamento, sem falta, sem dados de custo e sem cálculo, conforme a User Story 4.
- **FR-011**: Acessibilidade: tabela semântica com cabeçalhos, alternativas de texto nas barras, ícone "i" por teclado (Enter e Espaço) e contraste AA.
- **FR-012**: Cores fora do sistema de design (tags de cargo, pílula rosa, vermelho da barra) usam o token mais próximo, com comentário no código.
- **FR-013**: Nenhum texto usa "p.p.", "pontos" nem "CMV".

### Key Entities

- **Linha de cargo**: cargo, status, pessoas hoje e com a sugestão, horas por semana hoje e com a sugestão, falta por semana hoje e com a sugestão.
- **Equipe toda**: totais de pessoas e horas, e a folga (capacidade menos necessidade) hoje e com a sugestão.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O card fica com cerca de 340 px de altura em 1440 px (hoje cerca de 590 px) nos casos com três cargos.
- **SC-002**: Em Cosmópolis, os números por cargo da tabela somam exatamente as contratações sugeridas e a "Equipe toda" do cálculo atual, nas três regras.
- **SC-003**: Em 100% das respostas e telas de gestor e consulta, não há valores de folha nem de faturamento.
- **SC-004**: A tabela pode ser navegada por leitor de tela, com cabeçalho de coluna e de linha anunciados, e o "i" funciona só com o teclado.
- **SC-005**: Trocar de aba de regra atualiza o card em até 1 segundo, sem recarregar a página.

## Assumptions

- **Versão:** Decision: só a A1. Why: pedido do board.
- **Dados por cargo:** Decision: o cálculo atual já tem pessoas, horas e falta por cargo na regra; o card passa a mostrá-los por linha, sem mudar a conta. Why: a pessoa pediu para não mudar o cálculo.
- **Exemplos do board:** Decision: os números do board (2 farmacêuticos, 3 atendentes, 2 caixas, 42h) são só exemplo; vale a base real e a conferência com ela. Why: a pessoa pediu para confirmar com a base real.
- **"Desejável":** Decision: um cargo que não é farmacêutico é "Desejável" quando a sugestão precisa de horas dele para manter o nível de hoje; senão "Sem falta". Why: é a regra pedida e bate com o que já mostramos nos cenários.
- **Fora do escopo:** as versões A2, A3 e A4, e qualquer mudança no cálculo da cobertura.
