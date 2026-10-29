# Feature Specification: Cenário 1 em turnos e comparativo de cenários

**Feature Branch**: `feat/cenario1-comparativo`
**Created**: 2026-10-29
**Status**: Draft
**Input**: User description: "Seguir o documento de regras: (1) Cenário 1, manter horário e contratar, com a conta do documento (contratações inteiras = turnos faltantes ÷ dias de trabalho; resto de até 3 turnos vira contrato parcial; mostrar o necessário já para a fase de 42h e o adicional para a de 40h; custo mensal e anual e % do faturamento); (2) Cenário 3, equilíbrio, seguindo a sugestão (busca completa, já na spec 009); (3) comparativo dos cenários em tabela lado a lado. Encargos ficam para depois."

## Situação de hoje

- O Cenário 1 conta quantas pessoas faltam **por horas e turnos** e só sugere contrato parcial quando basta uma única pessoa (16, 24 ou 32 horas). Não existe o limite de "até 3 turnos de sobra vira parcial".
- As duas fases (42h e 40h) aparecem no seletor, mas não há a visão "o que contratar já, e o que se acrescenta depois".
- O custo aparece por mês e como % da folha atual; faltam o custo anual e o % do faturamento (que já está no cadastro).
- Os cenários aparecem como **cartões empilhados**, não lado a lado, e não há um status único (viável, não recomendado, inviável) nem premissas editáveis.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cenário 1 com a conta do documento (Priority: P1)

Para cada cargo e fase, o sistema calcula os **turnos faltantes** (necessidade em turnos menos a capacidade da equipe). As **contratações inteiras** são os turnos faltantes ÷ os dias de trabalho da fase (arredondado para baixo). Se sobram turnos, e o resto é de até **3 turnos**, sugere **1 contrato de jornada parcial** com esses turnos; se o resto é maior, vira mais 1 contratação inteira. O farmacêutico é resolvido antes dos demais cargos. Depois de contratar, o sistema confere de novo se o horário fecha; se não fechar, acrescenta contratação até fechar.

**Why this priority**: é a regra do documento para o cenário principal; a conta de hoje, por horas, pode pedir uma pessoa inteira onde um contrato parcial bastaria.

**Independent Test**: com 7 turnos faltantes de farmacêutico e 5 dias de trabalho, o cenário sugere 1 contratação inteira e 1 parcial de 2 turnos (16 horas); com 9 faltantes (resto 4), sugere 2 inteiras.

**Acceptance Scenarios**:

1. **Given** 7 turnos faltantes de um cargo na fase de 40h (5 dias), **When** abro o Cenário 1, **Then** vejo 1 contratação inteira e 1 contrato parcial de 2 turnos.
2. **Given** 9 turnos faltantes (resto 4, acima do limite de 3), **Then** vejo 2 contratações inteiras e nenhum parcial.
3. **Given** 10 turnos faltantes (resto 0), **Then** vejo 2 contratações inteiras.
4. **Given** menos de 5 turnos faltantes (resto até 3, sem inteiras), **Then** vejo só 1 contrato parcial; com resto 4, 1 contratação inteira.
5. **Given** mais de um cargo em falta, **Then** o farmacêutico aparece primeiro e é resolvido antes dos outros.
6. **Given** as contratações calculadas, **Then** a equipe (atual mais as vagas) cobre o horário em horas, turnos e farmacêutico; se não cobrir, o sistema acrescenta contratação até cobrir e diz que ajustou.
7. **Given** o contrato parcial, **Then** ele nunca passa de 24 horas por semana (3 turnos de 8 horas), dentro do limite de 30 horas da jornada parcial.

---

### User Story 2 - Etapas por fase e custo completo do cenário (Priority: P1)

O Cenário 1 mostra a contratação em **duas etapas**: o que é necessário **já para a fase de 42h** (a partir de 16/12/2026) e o **adicional para a fase de 40h** (a partir de 12/2027). Para o dono, mostra o custo adicional **por mês e por ano** e o impacto em **% do faturamento mensal**.

**Why this priority**: o dono precisa planejar a contratação no tempo e ver o peso no faturamento.

**Independent Test**: loja em que a fase de 42h pede 1 inteira e a de 40h pede 2: o cenário mostra "já 1; adicional depois +1"; o custo anual é o mensal × 12; o percentual confere com a conta à mão sobre o faturamento mensal.

**Acceptance Scenarios**:

1. **Given** contratações diferentes nas duas fases, **When** abro o Cenário 1, **Then** vejo a etapa 1 (fase de 42h) e o adicional da etapa 2 (fase de 40h) por cargo.
2. **Given** a fase de 40h pedindo menos ou igual à de 42h, **Then** o adicional é zero.
3. **Given** custos informados (só dono), **Then** vejo o custo mensal e anual adicionais e o % do faturamento mensal.
4. **Given** faturamento sem valor mensal mas com os sete dias, **Then** o faturamento mensal é a soma dos dias × 52 ÷ 12; sem nenhum faturamento, o percentual não aparece e o sistema diz o que falta.
5. **Given** gestor ou consulta, **Then** veem as contratações e as etapas, sem nenhum valor em reais.

---

### User Story 3 - Comparativo dos cenários lado a lado (Priority: P1)

Uma **tabela única** põe os Cenários 1, 2 e 3 lado a lado para a fase escolhida (42h ou 40h), com linhas fixas: contratações por cargo, horas abertas por semana, custo de folha mensal, margem perdida ou ganha, resultado líquido mensal em relação a hoje, impacto em % do faturamento, **status** (viável, não recomendado, inviável) e alertas. O cenário de **maior resultado líquido** é destacado, sem esconder os outros. Os cenários 4 (abrir um dia) e 5 (reduzir equipe) continuam como cartões à parte.

**Why this priority**: é o que permite escolher entre os caminhos de uma vez.

**Independent Test**: loja com os três cenários calculados: a tabela mostra os três lado a lado, com o status de cada um e o destaque no de maior resultado; trocar 42h/40h recalcula.

**Acceptance Scenarios**:

1. **Given** os três cenários calculados, **When** abro o Diagnóstico, **Then** vejo a tabela com uma coluna por cenário e as linhas fixas.
2. **Given** um cenário que cobre o horário sem fechar dia protegido, **Then** o status é "viável".
3. **Given** um cenário que só fecha um dia protegido (spec 009), **Then** o status é "não recomendado" e o alerta diz qual dia.
4. **Given** um cenário que não consegue cobrir o horário (ex.: Cenário 2 sem equipe), **Then** o status é "inviável" e o alerta aponta o Cenário 1.
5. **Given** os resultados, **Then** a coluna de maior resultado líquido é destacada, e as demais continuam visíveis.
6. **Given** gestor ou consulta, **Then** a tabela mostra contratações, horas, status e alertas, sem nenhuma linha em reais.
7. **Given** falta de custos ou de faturamento, **Then** a célula diz o que falta informar, sem número parcial.

---

### User Story 4 - Premissas editáveis, só para simular (Priority: P2)

Acima da tabela, as **premissas** do comparativo aparecem e podem ser alteradas para recalcular, sem gravar nada: margem bruta, recaptura da venda (0% a 30%), fator de venda de um dia novo, quantos dias ficam protegidos e o limite de turnos para contrato parcial (0 a 3).

**Why this priority**: o documento pede, e permite testar "e se" sem mexer no cadastro.

**Independent Test**: mudar a margem de 28% para 20% e ver a margem perdida e o resultado recalculados; fechar a página e voltar: os valores do cadastro estão de volta.

**Acceptance Scenarios**:

1. **Given** as premissas na tela, **When** altero uma e recalculo, **Then** os cenários e o comparativo refletem o novo valor.
2. **Given** uma alteração, **Then** nada é gravado no cadastro ou nos parâmetros; ao recarregar a página valem os valores originais.
3. **Given** um valor fora da faixa (recaptura acima de 30%, limite de parcial acima de 3), **Then** o sistema recusa com aviso.
4. **Given** gestor ou consulta, **Then** veem as premissas que não revelam valores em reais (recaptura, dias protegidos, limite de parcial) e não veem a margem.

---

### Edge Cases

- Cargo sem salário médio informado: o cenário mostra as contratações, mas diz qual salário falta e não mostra custo nem percentual.
- Loja com todos os cargos cobertos: o Cenário 1 diz "a equipe atual já cobre", sem contratações; o status fica "viável".
- Resto que aparece em um cargo com mínimo por turno (spec 008): os turnos faltantes já consideram a exigência por turno.
- O contrato parcial de farmacêutico existe como opção e continua obrigando a cobertura de todo o horário (a conferência final acrescenta contratação se precisar).
- Loja 24 horas e dias de 24 horas: a conta de turnos segue a mesma regra.
- Cenário 4 e Cenário 5 não entram na tabela nem no destaque, como hoje não entram no selo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Os turnos faltantes de um cargo em uma fase MUST ser `necessidade em turnos − capacidade em turnos`, com mínimo zero, usando a exigência por turno da loja.
- **FR-002**: As contratações inteiras MUST ser o piso de `turnos faltantes ÷ dias de trabalho da fase`; o resto MUST virar 1 contrato parcial quando for de 1 até o limite de turnos (padrão 3, de 0 a 3), com `resto × duração do turno` horas por semana, ou +1 contratação inteira quando passar do limite.
- **FR-003**: O cálculo MUST resolver o farmacêutico antes dos demais cargos e MUST validar a equipe final (horas, turnos e farmacêutico), acrescentando contratação inteira até fechar e registrando o ajuste.
- **FR-004**: A mesma regra de contratação MUST valer em todo lugar que sugere contratações: Cenário 1, Cenário 3 (spec 009), quadro central do Diagnóstico ("contratações para passar") e vagas sugeridas das simulações.
- **FR-005**: O Cenário 1 MUST mostrar a contratação em duas etapas (fase de 42h e adicional para a fase de 40h), por cargo e por tipo (inteira ou parcial).
- **FR-006**: Para o dono, o Cenário 1 MUST mostrar custo adicional mensal e anual (mensal × 12) e o impacto em % do faturamento mensal; o faturamento mensal MUST ser o informado, ou a soma dos dias × 52 ÷ 12, ou o da base comercial.
- **FR-007**: O comparativo MUST ser uma tabela com os cenários 1, 2 e 3 em colunas e as linhas: contratações por cargo, horas abertas por semana, custo de folha mensal, margem perdida ou ganha, resultado líquido mensal em relação a hoje, impacto em % do faturamento, status e alertas.
- **FR-008**: O status MUST ser "viável", "não recomendado" (fecha dia protegido) ou "inviável" (não cobre o horário), com o alerta que explica.
- **FR-009**: O comparativo MUST destacar o cenário de maior resultado líquido sem esconder os outros; MUST seguir o seletor 42h/40h.
- **FR-010**: As premissas (margem, recaptura, fator de dia novo, dias protegidos, limite de parcial) MUST poder ser alteradas para recalcular, sem gravar nada e dentro das faixas permitidas.
- **FR-011**: Valores em reais MUST aparecer só para o dono; gestor e consulta veem o comparativo sem as linhas de valor e sem a margem nas premissas.
- **FR-012**: O Cenário 3 (equilíbrio, spec 009) MUST usar a regra de contratação deste cenário e entrar no comparativo; a busca completa por combinações vem da spec 009.

### Key Entities

- **Contratação**: por cargo e etapa, número de inteiras e, quando houver, 1 parcial com seus turnos e horas.
- **Etapa**: fase de 42h (necessário já) e fase de 40h (adicional).
- **Linha do comparativo**: um indicador (contratações, horas, custo, margem, resultado, %, status, alertas) com um valor por cenário.
- **Premissas do comparativo**: margem, recaptura, fator de dia novo, dias protegidos e limite de parcial, só para a simulação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em casos de teste feitos à mão (7, 9 e 10 turnos faltantes; 1 a 4 turnos), a contratação sugerida bate com a regra em 100% dos casos.
- **SC-002**: Em 100% dos casos, a equipe do Cenário 1 cobre o horário (horas, turnos e farmacêutico) depois das contratações.
- **SC-003**: O quadro central, o Cenário 1, o Cenário 3 e as vagas sugeridas das simulações mostram sempre o mesmo número de contratações para a mesma loja e fase.
- **SC-004**: A tabela comparativa mostra os três cenários lado a lado e o de maior resultado destacado em todos os casos com dados completos.
- **SC-005**: Nenhum valor em reais aparece para gestor e consulta em nenhuma linha do comparativo.
- **SC-006**: Alterar uma premissa e recalcular leva menos de 2 segundos e não grava nada.

## Assumptions

- **Duração do turno = a da regra** (8 h, ou 8h24 com convenção na fase de 42h); o parcial de N turnos tem `N × duração` horas por semana, no máximo 3 turnos, ou seja, dentro do limite de 30 horas da jornada parcial.
- **O limite de turnos do parcial é 3** por padrão e só pode ficar entre 0 e 3; 0 desliga o parcial.
- **Capacidade em turnos** é a que o motor já calcula por pessoa (dias de trabalho da fase, limitados pelas horas da pessoa).
- **Resultado líquido em relação a hoje** = menos (custo adicional de folha + margem perdida) mais a margem ganha, no mesmo critério do selo de menor impacto; portanto o cenário de maior resultado é o de menor impacto e o destaque coincide com o selo.
- **Fase de 42h = etapa 1 e fase de 40h = etapa 2**, como no documento (dez/2026 e dez/2027); as datas vêm da tabela de parâmetros legais (spec 008).
- **Faturamento mensal de referência**: o informado no cadastro; senão a soma dos sete dias × 52 ÷ 12; senão o total da base comercial; senão não há percentual.
- **Ordem de entrega**: a nova regra de contratação (história 1) entra primeiro porque a spec 009 (Cenário 3 por combinação de dias) depende dela; o comparativo entra depois que os cenários 2 e 3 por dia existirem.
- **Fora do escopo**: encargos por regime tributário e provisões (ficam para depois, a pedido), cenário de hora extra, regra do domingo, custo com adicionais e comissão.
- Decisões técnicas (função, estrutura, tela) ficam para o plano.
