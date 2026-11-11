# Feature Specification: Peso do custo de pessoal no faturamento

**Feature Branch**: `feat/peso-no-faturamento`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description (reunião de revisão com a VP, item 3): Substituir "+X% sobre a folha" pelo peso no faturamento. Folha atual ÷ faturamento mensal = % atual. Folha nova ÷ faturamento mensal = % nova. O aumento é a folha nova menos a folha atual, mostrado em pontos percentuais do faturamento e em R$ (valor pequeno entre parênteses). Exemplo: folha de R$ 36.000 e faturamento de R$ 450.000 → 8,0% do faturamento. A folha é salários + encargos pelo regime tributário da loja + provisões (quando ativas); premiação paga fora da folha não entra. Aplicar no resumo, nos cenários e na visão de grupo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O cenário mostra o peso no faturamento, em vez de "% sobre a folha" (Priority: P1)

Na coluna "Custo de pessoal" de cada cenário, no lugar de "▲ +21,3%" (que é % sobre a folha), o dono vê:

- a **folha atual** e a **folha nova** como % do faturamento mensal da loja: "8,0% → 9,7% do faturamento";
- o **aumento em pontos percentuais**: "+1,7 p.p.";
- o **aumento em reais**, entre parênteses e em tamanho menor: "(R$ 7.659/mês)".

**Why this priority**: O dono decide pelo peso no faturamento, e o "+21,3%" sobre a folha confunde (foi lido como % do faturamento).

**Independent Test**: Em Cosmópolis (folha R$ 36.037,60, faturamento R$ 450.567), o cenário "Manter horários" mostra "8,0% → 9,7% do faturamento", "+1,7 p.p." e "(R$ 7.659/mês)".

**Acceptance Scenarios**:

1. **Given** um cenário com contratação, **When** o dono vê o cartão, **Then** vê % atual, % nova, p.p. e R$ por mês, e não vê mais "+X% sobre a folha".
2. **Given** um cenário sem custo adicional, **When** o dono vê o cartão, **Then** a % nova é igual à atual, o aumento é "0 p.p." e o R$ é zero.
3. **Given** a loja sem faturamento mensal conhecido, **When** o cartão é visto, **Then** aparece "Informe o faturamento para ver o peso da folha" no lugar dos números.
4. **Given** a loja sem salários informados, **When** o cartão é visto, **Then** aparece "Informe os salários para calcular".

---

### User Story 2 - Quem não é dono não recebe valores de custo (Priority: P1)

Gestor e consulta **não recebem** a folha, o faturamento, os p.p. nem o R$. Na coluna "Custo de pessoal", eles veem só o sentido da mudança, sem número: "Aumenta", "Igual" ou "Diminui".

**Why this priority**: O custo e o faturamento são dado do dono; hoje o % sobre a folha vai para todos, e o novo cálculo revelaria a folha.

**Independent Test**: Como gestor, abrir o Diagnóstico e ver "Aumenta" no cenário com contratação, sem nenhum número de custo; a resposta da API não tem `custoPct` nem o novo campo.

**Acceptance Scenarios**:

1. **Given** o perfil gestor ou consulta, **When** o cartão é visto, **Then** a coluna mostra só "Aumenta", "Igual" ou "Diminui".
2. **Given** a resposta da API para esses perfis, **When** é lida, **Then** não há campo de custo, folha, faturamento nem p.p.

---

### User Story 3 - O resumo do Diagnóstico mostra o mesmo critério (Priority: P2)

No quadro do Diagnóstico, as células "Folha mensal atual" e "Faturamento mensal da loja" continuam como estão (folha atual em R$ e em % do faturamento), e o rótulo "% do faturamento" é o mesmo que os cenários usam.

**Why this priority**: Um único critério em todas as telas.

**Independent Test**: O resumo mostra "8,0% do faturamento" e o cenário "Manter" mostra "8,0% →"; os dois valores são iguais.

**Acceptance Scenarios**:

1. **Given** o resumo e o cenário abertos, **When** os valores da folha atual são comparados, **Then** são iguais.

---

### Edge Cases

- Faturamento de referência: o do Cadastro; senão a soma dos dias × 52 ÷ 12; senão a base comercial × 52 ÷ 12 (como já é hoje).
- Cenário que muda a venda (Sem contratações, com horas cortadas): a % nova usa o faturamento depois da variação da venda estimada, como hoje (spec do custo no faturamento).
- Folha = salários + encargos do regime tributário da loja + provisões (13º, férias e 1/3, que já fazem parte do encargo do regime) + provisão de rescisão quando ligada na loja; premiação paga fora da folha não entra.
- Valores arredondados: p.p. e % com uma casa; R$ inteiro.
- Visão de grupo: hoje não existe tela de grupo com folha e faturamento; a soma das lojas sobre o faturamento do grupo **fica para uma entrega própria**, quando essa tela existir.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Para o dono, cada cenário DEVE mostrar a folha atual e a folha nova como % do faturamento mensal, o aumento em pontos percentuais (nova − atual) e o aumento em reais por mês (nova − atual), com o R$ entre parênteses.
- **FR-002**: O "+X% sobre a folha" DEVE sair da tela do cenário para todos os perfis.
- **FR-003**: Gestor e consulta NÃO DEVEM receber folha, faturamento, p.p., R$ nem % de custo; DEVEM ver só "Aumenta", "Igual" ou "Diminui".
- **FR-004**: O faturamento mensal de referência DEVE seguir a mesma ordem que o resumo (Cadastro, soma dos dias, base comercial).
- **FR-005**: Sem faturamento ou sem salários, o cartão DEVE dizer o que falta, em vez de mostrar número errado.
- **FR-006**: A folha usada DEVE ser a mesma do resumo (salários + encargos do regime + provisões quando ativas).
- **FR-007**: O resumo do Diagnóstico e os cenários DEVEM mostrar o mesmo valor de folha atual em % do faturamento.
- **FR-008**: Os textos DEVEM estar em português do Brasil, simples, sem emoji, só a primeira letra maiúscula.
- **FR-009**: O cálculo DEVE ser conferido em Cosmópolis e Paulínia, com a conta aberta.

### Key Entities

- **Peso da folha no faturamento**: folha ÷ faturamento mensal, em %.
- **Aumento da folha**: folha nova − folha atual, em p.p. do faturamento e em R$ por mês.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em Cosmópolis, "Manter horários" mostra 8,0% → 9,7%, +1,7 p.p. e R$ 7.659 por mês, e esses números batem com a conta à mão.
- **SC-002**: Em Paulínia, "Manter horários" mostra 10,3% → 14,7%, +4,4 p.p. e R$ 11.112 por mês.
- **SC-003**: Nenhuma tela mostra "% sobre a folha" nos cenários.
- **SC-004**: Gestor e consulta não recebem nenhum campo de custo nos cenários.
- **SC-005**: Em 100% das lojas, a folha atual em % do faturamento do resumo é igual à do cenário.

## Assumptions

- **Quem vê**: só o dono vê custo (como já é hoje para R$); os outros perfis recebem só o sentido da mudança. Isso muda a spec 037, que mostrava a variação em % para todos.
- **Visão de grupo**: não existe hoje; entra numa entrega própria.
- **Salário médio**: o custo vem do salário médio cadastrado de cada função (em Cosmópolis, R$ 4.722 para o farmacêutico); o sistema não assume outro valor.
- **Decisão técnica**: o servidor já calcula o faturamento de referência e o custo adicional; o campo `custoPctFaturamento` (feito na branch anterior) passa a carregar também `aumentoPp` e `aumentoMensal`, e `custoPct` deixa de ser exposto no cartão. Por quê: reaproveita a conta que o resumo já usa.
