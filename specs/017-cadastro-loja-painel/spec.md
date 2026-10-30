# Feature Specification: Cadastro de loja em painel único (lista + detalhe)

**Feature Branch**: `feat/cadastro-loja-painel`
**Created**: 2026-10-30
**Status**: Draft
**Input**: Refatorar o Cadastro de loja da Escala: uma tela só, com a lista de lojas à esquerda e a loja selecionada à direita (abas Dados e funcionamento, Equipe e Regras e custos), um único "Salvar alterações" e novas regras de turnos. Detalhes completos no texto e nos 4 quadros enviados pela pessoa.

## Situação de hoje

- O Cadastro é uma **lista** de lojas; "Editar" abre outra página com 2 abas ("Dados da loja" e "Funcionários e configuração") e **vários botões de salvar** espalhados (dados, configuração, custos).
- O faturamento por dia e o horário de funcionamento são blocos separados. O mínimo de pessoas aparece em dois lugares ("Turnos e mínimo por turno" e "Mínimo e metas por função").
- Os turnos precisam **cobrir o horário da loja sem sobrepor e sem buraco**, e não podem começar antes da abertura nem terminar depois do fechamento.
- Não há filtro por situação do cadastro nem por UF, nem indicação de quais lojas precisam de revisão.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Achar e conferir lojas numa tela só (Priority: P1)

A pessoa vê, no mesmo cartão, a lista de lojas (esquerda) e os dados da loja escolhida (direita). Busca por nome, código ou CNPJ, filtra por situação do cadastro (Completo ou Revisar) e por UF, e troca de loja sem recarregar a página. Cada loja mostra se está **Completo** ou em **Revisar**, e o motivo aparece no detalhe.

**Why this priority**: com centenas de lojas, achar e conferir rápido é o ganho central.

**Independent Test**: filtrar por "Revisar" e UF, escolher uma loja e ver o motivo da revisão em texto; recarregar a página e voltar à mesma loja e aba.

**Acceptance Scenarios**:
1. **Given** a lista, **When** a pessoa digita parte do nome, do código ou do CNPJ, **Then** a lista mostra só as lojas que combinam, junto com os filtros escolhidos.
2. **Given** filtros sem resultado, **Then** aparece "Nenhuma loja encontrada. Limpe os filtros ou busque outro nome." com o link "Limpar filtros".
3. **Given** uma loja selecionada, **When** a página é recarregada ou o link é copiado, **Then** abre a mesma loja e a mesma aba.
4. **Given** a lista, **Then** cada linha mostra nome, "Código · UF · N funcionários" e uma marca em texto (Completo ou Revisar); a selecionada fica destacada; setas e Enter funcionam.
5. **Given** uma loja em Revisar, **Then** o detalhe diz o motivo (por exemplo, "Falta faturamento de quarta").
6. **Given** muitas lojas, **Then** a lista pagina ("1–6 de 37 lojas", "Ver mais") e a altura do painel não muda com o tamanho do detalhe.
7. **Given** uma tela estreita (abaixo de ~1100 px), **Then** a lista e o detalhe viram duas telas, com "← Voltar para a lista".

---

### User Story 2 - Dados e funcionamento numa tabela por dia (Priority: P1)

Na aba "Dados e funcionamento": os dados da loja (ID, nome, CNPJ, cidade, UF, bandeira, regime tributário) e a tabela "Funcionamento e faturamento da semana", com **uma linha por dia**: situação (aberta ou fechada), abre, fecha, 24 horas, faturamento médio do dia (só o dono) e horas do dia. Abaixo, o resumo por mês: faturamento mensal informado, soma dos dias por mês (soma semanal × 52 ÷ 12) e margem bruta média, com alerta quando o mensal informado difere mais de 10% da soma.

**Independent Test**: preencher a semana, ver "77h abertas por semana" e a soma semanal; informar um mensal 10% acima e ver o alerta e o botão "Usar R$ …".

**Acceptance Scenarios**:
1. **Given** 08:00 a 21:00, **Then** o dia mostra 13h; sábado 08:00 a 20:00 mostra 12h; o rodapé soma as horas da semana e o faturamento semanal.
2. **Given** um dia fechado, **Then** abre, fecha e faturamento ficam desabilitados e mostram "—"; não se aceita faturamento de dia fechado.
3. **Given** "24 horas" num dia, **Then** abre 00:00, fecha 00:00 (meia-noite) e 24h; "Loja 24 horas" marca os 7 dias e depois cada um pode ser ajustado.
4. **Given** "Copiar horário da segunda para os outros dias", **Then** copia só o horário (aberta, abre, fecha, 24h), nunca o faturamento.
5. **Given** o mensal informado mais de 10% acima ou abaixo da soma dos dias, **Then** aparece o alerta com "Usar R$ …" (preenche o mensal) sem bloquear o salvamento.
6. **Given** um perfil que não é o dono, **Then** a coluna de faturamento, o resumo por mês e a margem não existem (não ficam só desabilitados).
7. **Given** mudança do regime tributário, **Then** aparece "Os encargos foram recalculados pelo novo regime".
8. **Given** ID da loja e CNPJ, **Then** são só leitura ("Só o operador altera") para quem não é operador.
9. **Given** fecha menor ou igual a abre (exceto 00:00 como meia-noite) ou faturamento negativo, **Then** o erro aparece em texto abaixo do campo.

---

### User Story 3 - Um só caminho de salvar (Priority: P1)

As abas Dados e funcionamento e Regras e custos compartilham o mesmo rascunho. Um único **"Salvar alterações"** grava tudo, ao lado do contador "N alterações não salvas" e de "Cancelar". Trocar de aba não perde nada; sair da loja com alterações pergunta "Descartar alterações?". Os botões antigos de salvar deixam de existir. A equipe é a exceção: grava na hora.

**Acceptance Scenarios**:
1. **Given** alterações em duas abas, **When** a pessoa salva, **Then** tudo é gravado de uma vez e aparece "Alterações salvas".
2. **Given** nenhuma alteração, **Then** o contador diz "Nenhuma alteração" e "Salvar alterações" fica desabilitado.
3. **Given** "Cancelar", **Then** os valores voltam aos salvos.
4. **Given** erro de validação ao salvar, **Then** a tela rola até o primeiro campo com erro, com a mensagem em texto ligada ao campo.
5. **Given** a aba Equipe, **Then** o rodapé só informa que nada fica pendente ali.

---

### User Story 4 - Equipe da loja, salva na hora (Priority: P2)

A aba "Equipe (N)" tem busca, "Importar equipe", "Adicionar funcionário" (formulário no topo: nome, CPF, cargo, carga mensal, entrada, saída e dias de trabalho) e a tabela de funcionários com editar e remover. Cada ação grava na hora e mostra um aviso; remover pede confirmação e dá para desfazer. O CPF aparece mascarado.

**Acceptance Scenarios**:
1. **Given** o formulário, **When** nome e cargo estão preenchidos e o CPF é válido, **Then** "Salvar funcionário" grava na hora e a lista atualiza com "Funcionário salvo".
2. **Given** CPF inválido, nome ou cargo vazio, ou saída igual à entrada, **Then** erro em texto.
3. **Given** a lista, **Then** o CPF aparece como "•••.964.725-••" e só aparece inteiro na edição, para quem pode.
4. **Given** remover, **Then** pede "Remover Fulano? Ele sai do cálculo da escala desta loja.", remove ao confirmar e oferece "Desfazer".
5. **Given** um funcionário que não entra no cálculo, **Then** aparece "Fora do cálculo" com a explicação.

---

### User Story 5 - Regras e custos, com o mínimo de pessoas por turno ou por dia (Priority: P1)

A aba "Regras e custos", nesta ordem: **Custos** (salário médio por função e encargos recolhidos, só o dono), **Convenção coletiva** (chave "Não permite / Permite" para 8h24) e **Mínimo de pessoas**. O mínimo tem dois modos: **Por turnos** (barra de turnos e um cartão por turno com o mínimo de cada cargo) e **Mínimo único do dia** (uma lista por função). O quadro antigo "Mínimo e metas por função" some como bloco à parte.

**Acceptance Scenarios**:
1. **Given** os encargos, **Then** vêm recolhidos ("Encargos: 62,2% (Lucro Real)", resumo de RAT, FAP e rescisão) e expandem para ajustar RAT (1 a 3), FAP (0,5 a 2,0) e a provisão de rescisão; o total vem do regime tributário.
2. **Given** a convenção, **Then** a chave mostra os dois estados escritos e o ativo em negrito; padrão "Não permite".
3. **Given** turnos, **Then** podem **se sobrepor** e **começar antes da abertura ou terminar depois do fechamento**; o mínimo conta só dentro do horário de funcionamento da loja.
4. **Given** a barra de turnos, **Then** mostra o horário da loja, cada turno, a sobreposição (com legenda em texto) e a parte de cada turno fora do horário da loja (listrada, com legenda).
5. **Given** cada turno, **Then** o farmacêutico está sempre presente com mínimo 1 (não dá para baixar), e outros cargos entram por "+ Atendimento", "+ Caixa", "+ Apoio", "+ Perfumaria".
6. **Given** horas de funcionamento sem nenhum turno, **Then** aparece um aviso que não bloqueia ("Sem turno entre 17:00 e 18:00") dizendo que nessas horas vale 1 farmacêutico e os demais cargos mantêm o nível de hoje; quando tudo está coberto aparece "Horário da loja coberto".
7. **Given** o modo "Mínimo único do dia", **Then** mostra Farmacêutico (1, fixo) e as outras funções com meta opcional (0 = manter o nível de hoje); trocar de modo não apaga o outro e avisa antes se algo for descartado.
8. **Given** valores em reais (salários, encargos), **Then** só o dono vê.

---

### User Story 6 - Cadastrar loja (Priority: P2)

"Cadastrar loja" abre o painel em modo "Nova loja": ID e CNPJ editáveis (operador); as abas Equipe e Regras e custos ficam desabilitadas até a primeira gravação.

### User Story 7 - Telas pequenas e acessibilidade (Priority: P3)

Abaixo de ~1100 px lista e detalhe são telas separadas; tudo funciona por teclado; nada depende só de cor; totais calculados são anunciados ao mudar.

### Edge Cases

- Loja com horário diferente por dia: a janela de cada turno é avaliada por dia.
- Horário de turno que vira a noite (fim antes do início ou 00:00): vale como meia-noite.
- Trocar de loja com alterações não salvas pede confirmação.
- Dois perfis editando a mesma loja: vale o último que salvou (como hoje).
- Loja sem funcionamento definido: fica em Revisar com o motivo.
- Faturamento preenchido em dia depois fechado: o valor do dia é descartado ao salvar, com aviso.
- Falha de rede: mensagem com "Tentar de novo"; lista e detalhe têm carregamento sem a tela pular.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Cadastro de loja é uma tela única: cabeçalho ("Cadastro de loja", subtítulo, "Importar em massa" secundário), abas de página "Lojas" e "Parâmetros legais" (esta não muda), aviso fixo de dados fictícios (controlado por uma chave) e um cartão com lista (400 px) e detalhe.
- **FR-002**: A lista tem busca (nome, código, CNPJ, com atraso), filtros "Cadastro" (todos, Completo, Revisar) e "UF", paginação com contagem, estado vazio com "Limpar filtros", seleção sem recarregar e endereço que guarda loja e aba.
- **FR-003**: Cada loja tem situação Completo ou Revisar calculada por uma regra única e o detalhe mostra o motivo em texto.
- **FR-004**: O detalhe tem cabeçalho (nome, situação, "Código · CNPJ · UF") e 3 abas: Dados e funcionamento, Equipe (N) e Regras e custos.
- **FR-005**: As abas Dados e funcionamento e Regras e custos compartilham um rascunho; um único "Salvar alterações", contador de alterações, "Cancelar" e confirmação ao sair com alterações; os botões antigos de salvar saem.
- **FR-006**: Dados e funcionamento seguem as regras da História 2, incluindo o faturamento por dia na mesma linha do horário, o cálculo "× 52 ÷ 12" e o alerta de 10%.
- **FR-007**: A Equipe segue a História 4: grava na hora, CPF mascarado, confirmação e desfazer ao remover.
- **FR-008**: Regras e custos seguem a História 5, na ordem Custos, Convenção coletiva, Mínimo de pessoas.
- **FR-009**: Turnos podem se sobrepor e ultrapassar o horário da loja; o mínimo conta só dentro do horário de funcionamento; farmacêutico sempre com ao menos 1.
- **FR-010**: Onde turnos se sobrepõem, vale, por cargo e por hora, o **maior** mínimo entre os turnos ativos naquela hora (não soma).
- **FR-011**: Horas de funcionamento sem turno geram aviso que não bloqueia; nelas vale 1 farmacêutico e os demais cargos mantêm o nível de hoje.
- **FR-012**: O mínimo tem os modos "Por turnos" e "Mínimo único do dia"; trocar de modo não apaga o outro.
- **FR-013**: "Cadastrar loja" abre o painel em modo "Nova loja", como na História 6.
- **FR-014**: Valores em reais (faturamento, margem, custos, encargos) só para o dono; ID e CNPJ só o operador altera.
- **FR-015**: Formatos pt-BR (R$ 20.000, 77h, 08:00, CPF e CNPJ com máscara) e CPF nunca em endereço nem em mensagem de erro.
- **FR-016**: Os cálculos de diagnóstico, cenários e simulações continuam funcionando e passam a usar as novas regras de turno.

### Key Entities

- **Loja**: dados cadastrais, funcionamento por dia, faturamento por dia, mensal e margem, regime, configuração (convenção, custos, encargos, mínimos, turnos) e situação do cadastro.
- **Turno**: nome, início, fim e mínimo por cargo; pode sobrepor outros e passar do horário da loja.
- **Situação do cadastro**: Completo ou Revisar, com o motivo.
- **Funcionário**: nome, CPF, cargo, carga mensal, entrada, saída, dias.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Achar uma loja pelo nome, código ou CNPJ e abri-la leva até 10 segundos, com qualquer volume de lojas.
- **SC-002**: Alterar dados, horário e regras de uma loja e salvar exige um único clique em "Salvar alterações".
- **SC-003**: Uma loja em "Revisar" diz o motivo em até um olhar (texto no cabeçalho do detalhe).
- **SC-004**: Cadastrar um funcionário leva menos de 1 minuto, sem sair da loja.
- **SC-005**: Nenhuma largura entre 360 e 1920 px tem rolagem horizontal da página.
- **SC-006**: As contas de horas do dia, soma semanal, mensal calculado, divergência, janela do mínimo, sobreposição e cobertura batem com exemplos conferidos à mão.

## Assumptions

- **Decision A (situação do cadastro)**: **Completo** quando há nome, cidade, UF e regime; funcionamento definido; ao menos 1 farmacêutico na equipe; faturamento em todos os dias abertos; e mensal dentro de 10% da soma dos dias. Caso contrário **Revisar** com o primeiro motivo. **Why**: é a definição do pedido, marcada "a confirmar"; fica numa única função.
- **Decision B (sobreposição de turnos)**: por hora, vale o **maior** mínimo por cargo entre os turnos ativos. **Why**: o mínimo é uma exigência da loja por hora aberta, não da soma dos turnos; numa única função.
- **Decision C (cobertura)**: aviso informativo de horas sem turno, nunca bloqueia o salvamento.
- **Decision D (horário diferente por dia)**: a janela do mínimo e a cobertura são avaliadas **dia a dia**, com os turnos iguais em todos os dias (como hoje).
- **Decision E (modo do mínimo)**: os dois modos guardam seus próprios valores; o modo em uso é o último salvo.
- **Decision F (Nova loja)**: painel com os dados da loja; Equipe e Regras e custos desabilitadas até a primeira gravação; só o operador cria loja (como hoje).
- **Decision G (rótulo)**: "ID loja" nesta tela; o restante do produto continua dizendo "Código" e isso será avisado.
- Fora do escopo: aba "Parâmetros legais", cálculos de simulação e cenários e o fluxo do "Importar em massa" (só o botão passa a ser secundário).
- Preserva as regras e os cálculos que já funcionam; muda só o que está descrito aqui.
