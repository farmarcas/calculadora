# Feature Specification: Vagas simuladas e custo na comparação

**Feature Branch**: `feat/escala-ponto-custo`
**Created**: 2026-10-27
**Status**: Draft
**Input**: User description: "Criar o custo na comparação de simulações (módulo M4 — Escala, documento v2.2, seções 5.3 e 7)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Simular contratações e desligamentos (Priority: P1)

Hoje a simulação só trabalha com as pessoas que já existem, então "e se eu contratar mais um farmacêutico de meio período?" não tem resposta, e o custo seria igual em todas as simulações. O gestor passa a poder **adicionar vagas simuladas** (função e carga semanal) e **marcar desligamentos simulados** dentro de uma simulação em rascunho. As vagas aparecem na grade como pessoas ("Vaga 1 · Atendimento"), recebem turnos como qualquer pessoa e entram em todas as regras e na cobertura. Vaga simulada nunca cria funcionário no cadastro.

**Why this priority**: sem isso o custo não diferencia as alternativas, e o diagnóstico já aponta "faltam N contratações" sem como testar a resposta.

**Independent Test**: abrir um rascunho, adicionar uma vaga de Atendimento de 24h, dar turnos a ela, ver a cobertura melhorar e o cadastro continuar igual.

**Acceptance Scenarios**:

1. **Given** um rascunho, **When** adiciona uma vaga de uma função com carga semanal, **Then** ela aparece na tabela da semana e na grade e pode receber turnos.
2. **Given** uma vaga com turnos, **When** remove a vaga, **Then** os turnos dela somem e a avaliação recalcula.
3. **Given** uma pessoa do quadro, **When** marca desligamento simulado, **Then** ela sai da cobertura e do custo desta simulação, sem mudar o cadastro.
4. **Given** uma simulação gravada, **Then** vagas e desligamentos ficam congelados junto com as premissas.
5. **Given** o diagnóstico que sugere contratações, **When** clica em "simular esta contratação", **Then** cria um rascunho já com as vagas sugeridas.

---

### User Story 2 - Informar o custo por função (Priority: P2)

O dono do grupo informa, por loja, o **salário médio mensal por função**, o **percentual de encargos** e o **regime tributário** (informativo). O sistema não guarda salário individual. Sem esses dados, a tela mostra "informe os custos para ver o valor" em vez de números.

**Why this priority**: é o insumo do custo; barato de fazer e já útil sozinho.

**Independent Test**: preencher os valores de uma loja e ver o custo mensal da simulação aparecer; apagar e ver o aviso.

**Acceptance Scenarios**:

1. **Given** a aba Configuração, **When** o dono informa salário médio por função e encargos, **Then** os valores ficam salvos para a loja.
2. **Given** um gestor de escala, **Then** não vê nem edita valores de custo (só o dono, por padrão).
3. **Given** custos não informados, **When** abre a comparação, **Then** vê o aviso e nenhuma linha de custo com valor.

---

### User Story 3 - Ver o custo na comparação (Priority: P3)

Na comparação de 2 a 3 simulações, o dono vê **custo mensal e anual estimado** de cada uma e a **diferença frente à simulação em uso**, além do custo por função. A síntese da simulação passa a citar o custo ("custa R$ X a mais por mês e exige contratar 1 farmacêutico parcial").

**Why this priority**: é o pedido original; depende das duas histórias anteriores.

**Independent Test**: comparar uma simulação sem vagas com outra com uma vaga de 24h e conferir que a diferença mensal bate com o cálculo manual.

**Acceptance Scenarios**:

1. **Given** custos informados e duas simulações, **When** compara, **Then** vê custo mensal, anual e diferença frente à em uso.
2. **Given** uma simulação com uma vaga parcial, **Then** o custo dela é proporcional à carga da vaga.
3. **Given** um perfil sem permissão de custo, **Then** a comparação aparece sem as linhas de custo.
4. **Given** a em uso comparada com ela mesma, **Then** a diferença é zero.

---

### Edge Cases

- Função sem salário médio informado: avisa qual função falta e não mostra total enganoso.
- Vaga sem nenhum turno: permitida, mas gera aviso ("vaga sem turnos custa e não cobre nada").
- Simulação antiga (gravada antes desta entrega): continua válida, sem vagas.
- Regra de 40h reduz o divisor de hora: o custo da vaga muda conforme a regra da simulação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir adicionar e remover vagas simuladas (função e carga semanal) em simulação em rascunho.
- **FR-002**: O sistema MUST permitir marcar e desmarcar desligamento simulado de pessoa do quadro em rascunho.
- **FR-003**: Vagas e desligamentos MUST entrar na avaliação das regras, na cobertura e na comparação, e MUST NOT alterar o cadastro.
- **FR-004**: Vagas e desligamentos MUST ser congelados ao gravar.
- **FR-005**: O sistema MUST guardar, por loja, salário médio mensal por função, percentual de encargos e regime tributário, sem salário individual.
- **FR-006**: Somente o dono do grupo MUST ver e editar valores de custo.
- **FR-007**: O sistema MUST calcular custo mensal e anual estimados por simulação e por função, e a diferença frente à simulação em uso.
- **FR-008**: A comparação MUST mostrar o aviso de custos não informados em vez de valores parciais.
- **FR-009**: Todo valor de custo MUST ser rotulado "estimativa gerencial por média de função".
- **FR-010**: A síntese da comparação MUST citar a diferença de custo e as vagas necessárias.
- **FR-011**: O diagnóstico MUST oferecer criar um rascunho com as contratações sugeridas.

### Key Entities

- **Vaga simulada**: função, carga semanal, identificação ("Vaga 1"), pertence a uma simulação.
- **Desligamento simulado**: marca numa pessoa do quadro dentro de uma simulação.
- **Custo da loja**: salário médio mensal por função, encargos (%), regime tributário.
- **Custo da simulação**: total mensal e anual, por função, diferença frente à em uso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O gestor cria um rascunho com uma contratação simulada e vê o efeito na cobertura em menos de 1 minuto.
- **SC-002**: Duas simulações que diferem por uma vaga mostram custos diferentes, e a diferença confere com o cálculo manual em 100% dos casos de teste.
- **SC-003**: 0 vagas simuladas aparecem no cadastro de funcionários.
- **SC-004**: 0 valores de custo visíveis para quem não é dono do grupo.
- **SC-005**: Sem custos informados, 0 totais exibidos (só o aviso).

## Assumptions

- Decision: o salário médio refere-se à jornada cheia de hoje (44h) e quem já é contratado mantém o salário (a EC 141 não permite reduzir salário). Vaga nova custa proporcional à carga, pelo valor-hora da regra da simulação (divisores 220, 210 e 200). Why: segue o documento M4 (E5) e é o que o protótipo mostra.
- Decision: não há hora extra prevista no custo, porque turno acima da carga contratada já é bloqueado como erro. Why: evita um número que o próprio sistema proíbe.
- Decision: encargos e salário médio não têm valor padrão: o dono precisa informar. Why: um percentual inventado enganaria a decisão.
- Decision: só o dono do grupo vê custo; conceder a outros perfis fica para depois (documento E-D9).
- Fora do escopo: salário individual, folha, encargos por pessoa, banco de horas, benefícios.
- Dependência: simulações e comparação já existentes (specs/001-escala).
