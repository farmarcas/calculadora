# Feature Specification: Três cenários de decisão no Diagnóstico

**Feature Branch**: `feat/escala-cenarios`
**Created**: 2026-10-27
**Status**: Draft
**Input**: User description: "Abaixo do quadro central do Diagnóstico, criar três cenários de simulação já prontos, para a plataforma dar direcionamento claro de como seguir com a mudança (42h ou 40h): 1) manter os horários de funcionamento; 2) foco em economia financeira (manter a equipe atual e reduzir horário); 3) mix dos dois. Cada cenário traz o foco principal e os impactos que diferem da forma atual."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cenário 1: manter os horários de funcionamento (Priority: P1)

Abaixo do quadro central, o primeiro cenário responde: "e se a loja continuar aberta exatamente como hoje?". Mostra quantas pessoas é preciso contratar **por cargo** para cobrir todo o horário, o **custo mensal adicional** (em reais e em % sobre a folha atual), a **% de ociosidade** das horas dessas contratações (quando a pessoa contratada só é necessária para parte do turno) e o **horário de funcionamento total** da semana.

**Why this priority**: é o caminho que não muda a operação e responde direto ao diagnóstico ("faltam N pessoas"); já existe a base de cálculo.

**Independent Test**: com a escala atual da loja de exemplo, ver o cenário listar a contratação por cargo e conferir o custo adicional e a ociosidade contra a conta manual, nas regras de 42h e de 40h.

**Acceptance Scenarios**:

1. **Given** um quadro que não cobre o horário, **When** abre o Cenário 1, **Then** vê a contratação por cargo (ex.: "Farmacêutico: 1 parcial de 16h"), o horário semanal total e o impacto frente à situação atual.
2. **Given** custos informados (só o dono do grupo), **Then** vê o custo mensal adicional e o percentual de acréscimo sobre a folha atual.
3. **Given** uma contratação de jornada cheia que só preenche parte do turno, **Then** a ociosidade mostra a fatia de horas pagas sem uso.
4. **Given** o seletor 42h/40h do quadro central, **When** troca a regra, **Then** o cenário recalcula.
5. **Given** um quadro que já cobre tudo, **Then** o cenário diz que não há contratação necessária.

---

### User Story 2 - Cenário 2: foco em economia financeira (Priority: P2)

O segundo cenário responde: "e se eu não contratar ninguém?". Mantém a equipe atual e **remaneja o máximo de horário**: mostra quantas **horas por semana** a loja precisa reduzir, **como fica o horário semanal** (dia a dia) e, com a base comercial, o **valor de vendas estimado que deixa de entrar** (e a margem) ao fechar nesses horários. Os horários cortados são os de menor venda, nas pontas de cada dia.

**Why this priority**: é a alternativa de custo zero de pessoal e a que mais mexe no negócio; precisa dos dados de venda.

**Independent Test**: reduzir o horário até a equipe atual cobrir tudo e conferir que as horas cortadas são as de menor venda e que o valor cortado confere com a soma das vendas médias desses horários.

**Acceptance Scenarios**:

1. **Given** um quadro que não cobre o horário, **When** abre o Cenário 2, **Then** vê quantas horas por semana reduzir e o novo horário de cada dia.
2. **Given** base comercial importada, **Then** vê a venda estimada que deixa de entrar por semana e por mês, e a margem correspondente.
3. **Given** a equipe cobrir só se o farmacêutico for reduzido, **Then** o horário reduzido respeita o farmacêutico em todo o horário que continua aberto.
4. **Given** nenhuma base comercial, **Then** o cenário mostra as horas e o novo horário (cortando o fim do dia) e avisa que o valor de vendas não pôde ser estimado.
5. **Given** uma função com ninguém no quadro (ex.: sem farmacêutico), **Then** o cenário explica que, sem contratar, não existe horário possível.
6. **Given** um quadro que já cobre tudo, **Then** não há redução.

---

### User Story 3 - Cenário 3: equilíbrio entre contratar e vender (Priority: P3)

O terceiro cenário combina os dois: **fecha os horários que não se pagam** (a margem de venda daquele horário é menor que o custo de ter gente nele) e **contrata** para o restante. Mostra as horas cortadas e o novo horário, as contratações por cargo, o custo adicional, a margem de venda perdida e a ociosidade, e o impacto frente à situação atual.

**Why this priority**: é a recomendação equilibrada, mas depende dos dois anteriores e de custos e vendas informados.

**Independent Test**: com custos e vendas, conferir que só são cortados os horários cuja margem mensal é menor que o custo mensal de cobri-los, e que o restante da necessidade vira contratação.

**Acceptance Scenarios**:

1. **Given** custos e base comercial, **When** abre o Cenário 3, **Then** vê o que corta, quanto contrata e o saldo financeiro.
2. **Given** todos os horários se pagam, **Then** o cenário diz que coincide com manter os horários.
3. **Given** custos ou base comercial ausentes, **Then** o cenário explica o que falta para ser calculado.
4. **Given** perfil sem permissão de custo, **Then** vê as horas e as contratações, sem valores de custo.

---

### User Story 4 - Direcionamento claro (Priority: P4)

Cada cenário traz uma frase de direcionamento ("siga este cenário se…") e os impactos frente à situação atual em números grandes. Quando custos e vendas existem (dono do grupo), o cenário de **menor impacto financeiro mensal** (custo adicional + margem perdida) recebe o destaque "Menor impacto financeiro". Os três cenários mudam juntos com o seletor 42h/40h.

**Why this priority**: é o que transforma números em decisão; depende dos três cenários.

**Independent Test**: com dados completos, o destaque cai no cenário de menor soma de custo adicional e margem perdida.

**Acceptance Scenarios**:

1. **Given** dados completos, **Then** exatamente um cenário aparece com o destaque.
2. **Given** dados incompletos, **Then** nenhum destaque aparece e a tela diz o que falta.
3. **Given** a troca de 42h para 40h, **Then** os três cenários e o destaque recalculam.

---

### Edge Cases

- Loja sem escala atual importada: os cenários não aparecem (o diagnóstico já pede a escala).
- Loja 24 horas ou com vários dias de horários diferentes: os cortes são feitos por dia, nas pontas.
- Cortar tudo de um dia equivale a fechar o dia; o cenário mostra o dia como fechado.
- Vendas só de poucos dias: a média por dia da semana e hora usa os dias que existem e avisa a quantidade de dias.
- Hora sem venda na base: conta como zero.
- Cenários não alteram o cadastro da loja nem criam funcionário.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Diagnóstico MUST mostrar, abaixo do quadro central, três cenários: manter horários, foco em economia financeira e equilíbrio (mix).
- **FR-002**: Os três cenários MUST seguir o seletor 42h/40h do quadro central e recalcular ao trocá-lo.
- **FR-003**: Cada cenário MUST mostrar seu foco principal e os impactos que diferem da situação atual (horas de funcionamento, equipe, custo, vendas).
- **FR-004**: O Cenário 1 MUST mostrar a contratação por cargo, a ociosidade das horas contratadas, o horário de funcionamento total da semana e, com custos, o custo mensal adicional em reais e em % sobre a folha atual.
- **FR-005**: O Cenário 2 MUST manter a equipe atual, mostrar as horas a reduzir por semana e o horário semanal resultante, dia a dia, cortando as horas de menor venda nas pontas de cada dia.
- **FR-006**: O Cenário 2 MUST estimar, com a base comercial, a venda e a margem que deixam de entrar (por semana e por mês).
- **FR-007**: Em qualquer horário que continue aberto, o farmacêutico MUST continuar coberto nas contas dos cenários.
- **FR-008**: O Cenário 3 MUST fechar apenas os horários cuja margem mensal é menor que o custo mensal de cobri-los e contratar para o restante, mostrando cortes, contratações, custo adicional, margem perdida e ociosidade.
- **FR-009**: Valores de custo MUST ser visíveis só para o dono do grupo; os demais perfis veem horas, contratações e ociosidade.
- **FR-010**: Cenário sem os dados necessários (custos, base comercial, farmacêutico no quadro) MUST explicar o que falta em vez de mostrar número parcial.
- **FR-011**: Com dados completos, o sistema MUST destacar o cenário de menor impacto financeiro mensal (custo adicional + margem perdida), só para o dono.
- **FR-012**: Cada cenário MUST trazer uma frase de direcionamento de quando faz sentido seguir por ele.
- **FR-013**: Os cenários MUST NOT alterar o cadastro da loja nem criar funcionário.
- **FR-014**: Todo valor monetário MUST ser rotulado como estimativa gerencial.

### Key Entities

- **Cenário**: tipo (manter, economia, equilíbrio), regra (42h ou 40h), horário semanal resultante, contratações por cargo, horas reduzidas, ociosidade, custo adicional, venda e margem cortadas, direcionamento.
- **Venda média por dia da semana e hora**: média das vendas da base comercial para cada dia da semana e hora do dia.
- **Corte de horário**: dia, faixa de horas cortada, venda e margem estimadas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Os três cenários aparecem em menos de 2 segundos depois do diagnóstico.
- **SC-002**: Em todos os casos de teste, o cenário de economia deixa a equipe atual cobrindo 100% do horário que sobra (nenhuma função em falta).
- **SC-003**: Venda cortada, custo adicional e ociosidade conferem com a conta manual em 100% dos casos de teste.
- **SC-004**: 0 valores de custo visíveis para quem não é dono do grupo.
- **SC-005**: Trocar entre 42h e 40h atualiza os três cenários sem recarregar a página.

## Assumptions

- Decision: a **contratação** do Cenário 1 segue o que o diagnóstico já calcula: uma vaga parcial quando basta uma pessoa (16, 24, 32 ou jornada cheia) e vagas de jornada cheia quando falta mais. Why: é o que a plataforma já mostra em "Déficit e contratações".
- Decision: **ociosidade** = (horas contratadas − horas que de fato faltavam) ÷ horas contratadas. Why: mede quanto da contratação sobra além da necessidade.
- Decision: no Cenário 2 só se cortam horas **nas pontas de cada dia** (abertura e fechamento), uma hora por vez, sempre a de menor venda, até a equipe atual cobrir o que sobra. Dia fechado só acontece se todas as horas dele forem cortadas. Why: horário picotado no meio do dia não existe em loja.
- Decision: sem base comercial, o Cenário 2 corta o fim do dia primeiro e não estima vendas. Why: é o corte menos agressivo e o sistema não inventa número.
- Decision: no Cenário 3, **uma hora se paga quando a margem bruta mensal dela é maior que o custo mensal de ter as pessoas mínimas nela**; as que não se pagam fecham, o resto é coberto por contratação. Why: é o único critério objetivo de equilíbrio entre contratar e não perder venda.
- Decision: vendas por mês = média semanal × 52÷12; custo por hora de uma função = salário médio ÷ divisor da regra × (1 + encargos), como já é calculado nas vagas. Why: mantém coerência com o custo da comparação de simulações.
- Decision: cenários são **só leitura** nesta entrega: levar um cenário para uma simulação (com horário simulado) fica para depois; a contratação do Cenário 1 reaproveita o atalho "Simular esta contratação". Why: simulação ainda não tem horário próprio, diferente do cadastro da loja.
- Dependência: diagnóstico, custos, base comercial e horário por dia já existentes (specs 001 a 004).
- Fora do escopo: cortes no meio do dia, fechar dias da semana inteiros por critério próprio, projeção de crescimento de vendas, impacto em hora extra, aprovação do cenário.
