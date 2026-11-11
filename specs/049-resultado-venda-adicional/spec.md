# Feature Specification: Resultado da venda adicional no Personalizar (com CMV)

**Feature Branch**: `feat/peso-no-faturamento` (mesma entrega, junto da spec 048)

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description (reunião de revisão com a VP, item 5): Quando o associado estende horário no Personalizar, mostrar a venda adicional estimada; o CMV da venda adicional (venda adicional × CMV% real da loja, por hora se houver, senão a média mensal); o lucro bruto (venda adicional − CMV); e o resultado (lucro bruto − aumento de folha). Azul e "Recomendado" se o resultado for maior ou igual a zero; vermelho e "Não recomendado" se for menor que zero. Mostrar a conta aberta num modal "como calculamos". Teste obrigatório: venda adicional de R$ 9.000, CMV de 57,8% e aumento de folha de R$ 4.680 → CMV ≈ R$ 5.202, lucro bruto ≈ R$ 3.798, resultado ≈ −R$ 882 (vermelho). Resultado negativo aqui é o correto, não é bug.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O resultado da venda adicional, com o CMV, aparece no painel (Priority: P1)

No painel de resultado da Simulação (Personalizar), quando o horário simulado **abre horas a mais** que o da loja hoje, o dono vê um bloco "Resultado do horário estendido" com: venda adicional estimada, CMV da venda adicional, lucro bruto, aumento de folha e **resultado**. O resultado é destacado em azul com "Recomendado" quando é maior ou igual a zero, e em vermelho com "Não recomendado" quando é menor que zero.

**Why this priority**: Estender horário só compensa se o lucro bruto da venda nova pagar a folha a mais; hoje o painel mostra venda e custo separados.

**Independent Test**: Numa Simulação com 3 horas a mais no sábado, com venda adicional de R$ 9.000, CMV de 57,8% e aumento de folha de R$ 4.680, o painel mostra CMV R$ 5.202, lucro bruto R$ 3.798 e resultado −R$ 882, em vermelho com "Não recomendado".

**Acceptance Scenarios**:

1. **Given** uma Simulação que abre horas a mais, **When** o painel é visto pelo dono, **Then** aparece o bloco com os cinco valores e o selo.
2. **Given** venda adicional R$ 9.000, CMV 57,8% e aumento de folha R$ 4.680, **When** o bloco é calculado, **Then** CMV ≈ R$ 5.202, lucro bruto ≈ R$ 3.798, resultado ≈ −R$ 882, vermelho e "Não recomendado".
3. **Given** um resultado maior ou igual a zero, **When** o bloco é visto, **Then** o selo é azul e diz "Recomendado".
4. **Given** uma Simulação que não abre horas a mais, **When** o painel é visto, **Then** o bloco não aparece.
5. **Given** o perfil gestor ou consulta, **When** o painel é visto, **Then** o bloco não aparece (valores em reais são do dono).

---

### User Story 2 - O CMV usado é o real da loja (Priority: P1)

O CMV da venda adicional usa o **CMV% real da loja**: por hora, quando a base comercial tem o CMV daquela hora; senão, a média mensal (o CMV médio informado no Cadastro da loja). Sem nenhum dos dois, o bloco diz "Informe o CMV da loja para calcular o lucro bruto" e não mostra resultado.

**Why this priority**: Usar um CMV errado muda o sinal do resultado.

**Independent Test**: Numa loja com CMV médio de 57,8% e sem CMV por hora, o CMV da venda adicional é 57,8% da venda adicional; numa loja com CMV por hora, é a soma das horas novas.

**Acceptance Scenarios**:

1. **Given** CMV por hora disponível nas horas novas, **When** o CMV é calculado, **Then** cada hora usa o CMV% da própria hora (ou o da hora vizinha de borda, como a venda das horas novas).
2. **Given** só o CMV médio, **When** o CMV é calculado, **Then** usa o percentual médio.
3. **Given** nenhum CMV, **When** o bloco é visto, **Then** pede para informar o CMV.

---

### User Story 3 - "Como calculamos" abre a conta (Priority: P2)

Um link "Como calculamos" abre um modal com a conta passo a passo, em linguagem simples: as horas novas, a venda estimada de cada uma, o CMV usado e de onde veio (por hora ou média), o lucro bruto, o aumento de folha (contratações e horas) e o resultado, com a mesma fórmula do bloco.

**Why this priority**: O dono precisa confiar no número.

**Independent Test**: Abrir o modal e ver a conta de R$ 9.000 − R$ 5.202 − R$ 4.680 = −R$ 882, com as fontes.

**Acceptance Scenarios**:

1. **Given** o bloco visível, **When** o dono clica em "Como calculamos", **Then** abre o modal com a conta aberta e um botão de fechar.
2. **Given** o modal aberto, **When** o dono aperta Esc ou fecha, **Then** o modal fecha sem mudar a Simulação.

---

### Edge Cases

- Venda adicional zero: bloco mostra "Sem venda adicional estimada" e resultado = −aumento de folha.
- Aumento de folha zero: resultado = lucro bruto.
- Horas novas sem venda registrada: a venda usa 50% da hora vizinha (como hoje) e o bloco avisa que a venda é estimada.
- Resultado exatamente zero: "Recomendado" (maior ou igual a zero).
- Horários reduzidos (menos horas): o bloco mostra a venda que sai, não a adicional, e não usa o selo (fora desta entrega).
- Valores em R$ inteiros; percentuais com uma casa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Quando o horário simulado abre horas a mais, o painel DEVE mostrar, para o dono: venda adicional estimada, CMV da venda adicional, lucro bruto, aumento de folha e resultado.
- **FR-002**: CMV da venda adicional = venda adicional × CMV% real (por hora quando houver; senão a média mensal); lucro bruto = venda adicional − CMV; resultado = lucro bruto − aumento de folha.
- **FR-003**: Resultado maior ou igual a zero DEVE aparecer em azul com "Recomendado"; menor que zero, em vermelho com "Não recomendado".
- **FR-004**: O caso de teste (R$ 9.000, 57,8%, R$ 4.680) DEVE dar CMV ≈ R$ 5.202, lucro bruto ≈ R$ 3.798 e resultado ≈ −R$ 882, vermelho; o resultado negativo é o correto.
- **FR-005**: Sem CMV da loja (nem por hora nem médio), o bloco DEVE pedir o CMV e não mostrar resultado.
- **FR-006**: O modal "Como calculamos" DEVE mostrar a conta aberta, com a origem do CMV e a mesma fórmula do bloco.
- **FR-007**: O bloco e o modal NÃO DEVEM aparecer para gestor e consulta, nem na API desses perfis.
- **FR-008**: O bloco DEVE recalcular a cada mudança de horário, contratação ou desligamento da Simulação.
- **FR-009**: Os textos DEVEM estar em português do Brasil, simples, sem emoji, só a primeira letra maiúscula.

### Key Entities

- **Resultado do horário estendido**: lucro bruto da venda adicional − aumento de folha.
- **CMV da venda adicional**: custo da mercadoria vendida nas horas novas, pelo CMV% real da loja.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O caso de teste dá exatamente CMV R$ 5.202, lucro bruto R$ 3.798 e resultado −R$ 882, em vermelho.
- **SC-002**: Em 100% das Simulações que abrem horas a mais e têm CMV, o dono vê o bloco com selo e conta aberta.
- **SC-003**: O modal mostra a mesma conta do bloco, com a origem do CMV.
- **SC-004**: Gestor e consulta não recebem nenhum valor do bloco.

## Assumptions

- **Aumento de folha**: o da própria Simulação (contratações e horas extras que o painel já calcula).
- **Venda adicional**: a que o sistema já estima para as horas novas (venda registrada da hora ou 50% da hora vizinha de borda, spec 020).
- **CMV por hora**: vem da base comercial quando ela traz o CMV; o CMV médio é o do Cadastro da loja.
- **Só dono**: valores em R$ são do dono, como no resto do sistema.
- **Decisão técnica**: o servidor calcula o bloco junto do resultado da Simulação (mesma fonte da venda estimada), e a tela só desenha e abre o modal. Por quê: o painel e o modal usam a mesma conta e os perfis sem permissão nem recebem o dado.
