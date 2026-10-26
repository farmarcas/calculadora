# Feature Specification: Escala (módulo M4)

**Feature Branch**: `001-escala`
**Created**: 2026-10-26
**Status**: Draft
**Input**: User description: "Sistema da ESCALA (módulo M4 — Escala) conforme protótipo em Proj. Suíte.zip (Tenant.dc.html, uploads/M4-escala.md v2.2)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar lojas e funcionários por planilha (Priority: P1)

O gestor baixa a **planilha modelo** (uma aba "Lojas" e uma aba "Funcionários"), preenche e envia. O sistema cadastra as lojas e os funcionários (com a loja onde cada um trabalha). Se a planilha vier num formato diferente (colunas com outros nomes ou em outra ordem, abas com outros títulos), o sistema tenta entender sozinho qual coluna é qual, mostra o que entendeu e pede confirmação antes de gravar; o que não entender, pergunta ou deixa de fora com aviso.

**Why this priority**: sem lojas e funcionários não há escala. Como o Cadastros não existe aqui, este é o ponto de partida.

**Independent Test**: baixar o modelo, preencher com dados fictícios e importar; depois importar uma planilha com colunas renomeadas e conferir que o sistema reconhece e pede confirmação.

**Acceptance Scenarios**:

1. **Given** a tela de Cadastros, **When** clica em baixar modelo, **Then** recebe uma planilha com as abas Lojas e Funcionários, colunas explicadas e uma linha de exemplo.
2. **Given** a planilha do modelo preenchida, **When** envia, **Then** vê o resumo (lojas e funcionários novos, atualizados, com erro) e confirma a gravação.
3. **Given** uma planilha fora do modelo, **When** envia, **Then** o sistema sugere a correspondência das colunas e abas, o gestor corrige se quiser e confirma.
4. **Given** linhas com problema (loja inexistente, função vazia, duplicado), **Then** são listadas com o motivo, e as demais podem ser gravadas.
5. **Given** a mesma planilha reenviada, **Then** atualiza os registros sem duplicar.

---

### User Story 2 - Importar a escala atual e ver o diagnóstico da loja (Priority: P2)

O gestor (ou o dono do grupo) envia a planilha da escala atual dos colaboradores e a base comercial (vendas por hora). O sistema mostra, por loja, a situação: quem trabalha quando, quantas pessoas estão presentes em cada faixa de horário, quantas horas e turnos faltam para cumprir as regras de 42h e 40h (EC 141/2026) e quantas contratações por função seriam necessárias.

**Why this priority**: é o que o protótipo entrega hoje e responde à urgência do marco de 42h (≈ 15/12/2026). Sem dado pessoal além do necessário, entrega valor sozinho.

**Independent Test**: enviar uma planilha de exemplo (dados fictícios) e conferir que a tela da loja mostra quadro por função, cobertura por faixa, déficit e contratações, e que linhas com erro são apontadas.

**Acceptance Scenarios**:

1. **Given** uma loja sem escala enviada, **When** abre a Escala, **Then** vê "Importe escala e base comercial" e nenhum diagnóstico.
2. **Given** uma planilha válida, **When** a envia, **Then** vê o quadro por colaborador, a cobertura da escala atual e o resultado por regra (42h/40h).
3. **Given** uma planilha com linhas inválidas (horário vazio, função desconhecida), **When** a envia, **Then** essas linhas são listadas com o motivo; colaborador sem função de escala fica "fora do cálculo".
4. **Given** nova planilha da mesma loja, **When** é enviada, **Then** substitui a anterior e o histórico guarda a carga antiga.

---

### User Story 3 - Montar e ajustar a Escala da Semana por hora (Priority: P3)

O gestor vê a grade da semana (entrada, saída e intervalo de cada pessoa), arrasta um turno para movê-lo ou puxa as bordas para mudar a duração, e o sistema recalcula na hora a cobertura e as verificações das regras. Pode gravar a escala como simulação com nome.

**Why this priority**: transforma o diagnóstico em decisão: testar alternativas antes de adotar.

**Independent Test**: mover um turno e ver a cobertura e as regras mudarem; gravar e reabrir a simulação.

**Acceptance Scenarios**:

1. **Given** a grade da semana, **When** move ou redimensiona um turno, **Then** cobertura, horas e verificações atualizam.
2. **Given** um ajuste que viola regra objetiva (teto de jornada, interjornada, ausência de farmacêutico), **When** tenta confirmar, **Then** o sistema bloqueia e explica a regra.
3. **Given** uma simulação sem erros, **When** grava, **Then** ela entra no histórico com as premissas congeladas e pode ser clonada.

---

### User Story 4 - Comparar simulações e aprovar a escala em uso (Priority: P4)

O dono compara de 2 a 3 simulações da mesma loja lado a lado (cobertura, vagas a contratar, custo) e aprova uma, que passa a ser a "em uso". Só há uma em uso por loja; a anterior fica como "substituída".

**Why this priority**: fecha o ciclo Planejar; depende das histórias 1 e 2.

**Independent Test**: gravar duas simulações, compará-las e aprovar uma; confirmar que a outra em uso deixa de ser a vigente.

**Acceptance Scenarios**:

1. **Given** duas simulações gravadas, **When** compara, **Then** vê indicadores lado a lado incluindo a em uso como referência.
2. **Given** simulação sem erros, **When** o dono aprova, **Then** registra quem, quando e início da vigência.
3. **Given** um gestor sem permissão de aprovar, **When** tenta aprovar, **Then** a ação não está disponível.

---

### Edge Cases

- Loja sem horário de funcionamento cadastrado: diagnóstico pede o dado antes de calcular.
- Colaborador em mais de uma loja: usa disponibilidade declarada; sem checagem cruzada de jornada.
- Planilha duplicada ou com loja inexistente: rejeitada com mensagem clara.
- Inviabilidade (não dá para cobrir o horário com o quadro): explica o motivo e alternativas, nunca gera escala que viole regra objetiva.
- Mudança de quadro no Cadastros: a simulação em uso é marcada "desatualizada", sem alteração automática.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir importar a escala atual (planilha) e a base comercial, por loja ou em massa, com relatório de linhas aceitas e rejeitadas.
- **FR-002**: O sistema MUST mostrar, por loja, quadro por função, cobertura por faixa de horário e horários de maior venda.
- **FR-003**: O sistema MUST verificar as regras de 42h e 40h (horas e turnos) e mostrar déficit e contratações por função.
- **FR-004**: O sistema MUST exigir ao menos um farmacêutico em todo o horário de funcionamento e bloquear violação de regra objetiva.
- **FR-005**: Usuários MUST poder mover e redimensionar turnos na grade da semana com recálculo imediato.
- **FR-006**: Usuários MUST poder gravar simulações (premissas congeladas), cloná-las, descartá-las e consultar o histórico.
- **FR-007**: O sistema MUST comparar de 2 a 3 simulações da mesma loja.
- **FR-008**: Apenas perfis autorizados MUST aprovar uma simulação; há no máximo uma em uso por loja.
- **FR-011**: O sistema MUST registrar em auditoria gravação, aprovação, ajuste, exportação e importações de planilha.
- **FR-012**: O sistema MUST exportar a escala aprovada para impressão e Excel; NÃO exporta para sistema de ponto.
- **FR-013**: O sistema MUST usar apenas dados fictícios enquanto o parecer de proteção de dados (LGPD) não existir.
- **FR-014**: O sistema MUST disponibilizar para download uma planilha modelo com as abas Lojas e Funcionários.
- **FR-015**: O sistema MUST importar planilhas fora do modelo, sugerindo a correspondência de abas e colunas, mostrando o que entendeu e pedindo confirmação antes de gravar.
- **FR-016**: O sistema MUST permitir cadastrar e editar lojas e funcionários (inclusive loja de lotação, função de escala e carga contratual) e manter a importação sem duplicar.

### Key Entities

- **Loja**: código, nome, horário de funcionamento por tipo de dia.
- **Colaborador**: identificação, função de escala, carga contratual, loja de lotação.
- **Carga de escala**: arquivo recebido, data, origem, linhas aceitas/rejeitadas.
- **Base comercial**: vendas por loja, dia e hora.
- **Simulação**: loja, nome, status (rascunho, gravada, em uso, substituída, descartada), premissas, resultado.
- **Turno**: pessoa, dia, entrada, intervalo, saída.
- **Regra**: perfil (atual, 42h, 40h) com vigência.
- **Importação de cadastro**: planilha recebida, correspondência de colunas confirmada, resultado.
- **Aprovação / Auditoria**: quem, quando, vigência, ação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Gestor importa a planilha de uma loja e vê o diagnóstico em menos de 1 minuto.
- **SC-002**: Importação em massa de 100 lojas termina em até 5 minutos com relatório de erros.
- **SC-003**: Ao mover um turno, a cobertura e as regras atualizam em menos de 1 segundo.
- **SC-004**: 0 simulações aprovadas com violação de regra objetiva e 0 horários abertos sem farmacêutico.
- **SC-005**: 90% dos gestores montam e gravam uma simulação na primeira tentativa, sem ajuda.
- **SC-006**: Reenviar a mesma planilha de cadastro gera 0 duplicidades.
- **SC-007**: Em planilhas fora do modelo, o sistema reconhece corretamente ao menos 90% das colunas sem ajuda.

## Assumptions

- Usuários: dono do grupo (aprova, vê custo) e gestor de loja (cria, ajusta, importa). O operador Farmarcas não vê conteúdo, só uso.
- Decision: a tela segue o protótipo (layout fluido, Alquimia DS); Why: é o desenho aprovado.
- Decision: stack padrão do projeto (React, Node, PostgreSQL); Why: constituição.
- Decision: login e perfis simplificados nesta fase (perfis fixos de demonstração); Why: autenticação é lacuna conhecida do projeto.
- Dados fictícios apenas; regras 42h/40h conforme o documento M4 v2.2, sujeitas à validação jurídica.
- Esta entrega cobre o cadastro por planilha e o pilar Planejar. O pilar Gerenciar (importar ponto AFD, planejado × realizado) fica para a próxima entrega.
- Fora do escopo: exportar para ponto, folha, multi-loja simultânea, 12x36, previsão de demanda.
- Custo é estimativa por média de função, sem salário individual.
