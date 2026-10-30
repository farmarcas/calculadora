# Feature Specification: Farmacêutico como único mínimo e contratação por horas (integral ou parcial)

**Feature Branch**: `feat/farmaceutico-contratacao-por-horas`
**Created**: 2026-10-30
**Status**: Draft
**Input**: User description: "Ajustar duas lógicas da calculadora do fim da escala 6x1. (1) Mínimo por turno: só o farmacêutico é obrigatório e precisa estar presente em todo o horário de funcionamento; para os demais cargos não existe mínimo, e o ponto de partida é aproveitar o quadro que a loja já tem, mantendo o nível de cobertura de hoje, redistribuindo as pessoas dentro das regras (teto de 42 h e depois 40 h, 2 folgas por semana, uma preferencialmente no domingo, até 8 h por dia). (2) Contratação: depois de esgotar o quadro, gap de até 30 h semanais vira contrato de tempo parcial (CLT art. 58-A), mostrando as horas, os dias e os horários; gap maior vira contrato integral, ou integral mais parcial se reduzir as horas ociosas; mostrar horas contratadas, usadas, ociosas e custo; aviso do CRF para farmacêutico parcial. Validar com a loja Porto Feliz."

## Situação de hoje

- Todos os cargos têm um **mínimo de pessoas** (padrão: Farmacêutico 1, Atendimento 1, Caixa 1, Apoio 0, Perfumaria 0). Cada cargo "falta" quando a capacidade (horas e turnos) não cobre esse mínimo. Por isso uma loja sem Caixa ou sem Atendimento aparece com falta, e cenários ficam inviáveis ("Não há Caixa no quadro").
- A contratação sugerida é calculada **por turnos**: turnos faltantes ÷ dias da fase = contratações inteiras; resto de até 3 turnos (24 h) vira 1 parcial; resto maior vira mais uma inteira; depois confere as horas.
- O parcial hoje não mostra dias e horários, não respeita o limite legal do art. 58-A (30 h, ou 26 h + 6 h extras) e não traz o aviso do CRF.
- Não existe a regra de folga dominical, nem restrição de horário por funcionário.
- Exemplo (Porto Feliz, regra de 42 h): o farmacêutico precisa de 94 h, o quadro cobre 40 h (gap de 54 h, 9 turnos) e o sistema sugere **2 contratações inteiras** (80 h, 10% ociosas, R$ 14.930,51 por mês); o Atendimento, com 4 pessoas, aparece com folga.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Farmacêutico: único mínimo legal, todo o horário (Priority: P1)

O farmacêutico precisa estar presente durante **100% das horas de funcionamento da loja, todos os dias**. A calculadora diz quantas horas semanais de farmacêutico a loja precisa, quanto os farmacêuticos atuais conseguem cobrir dentro das regras (teto de 42 h e depois 40 h, até 8 h por dia, folgas) e qual é o **gap em horas semanais**.

**Why this priority**: é a única exigência legal e a base de toda a contratação.

**Independent Test**: loja que abre 94 h por semana com 1 farmacêutico: necessidade de 94 h, capacidade de 40 h, gap de 54 h, nas duas fases (42 h e 40 h).

**Acceptance Scenarios**:

1. **Given** uma loja de 94 h por semana e 1 farmacêutico de 44 h, **When** abro o diagnóstico na regra de 42 h, **Then** vejo necessidade 94 h, capacidade 40 h e gap 54 h.
2. **Given** a mesma loja, **When** troco para a regra de 40 h, **Then** os números são calculados do mesmo jeito (as duas fases sempre calculáveis).
3. **Given** uma loja 24 horas, **Then** a necessidade de farmacêutico é de 168 h por semana.
4. **Given** uma loja sem nenhum farmacêutico, **Then** o gap é a necessidade inteira.
5. **Given** a convenção coletiva marcada (8h24), **Then** o limite diário usado é o permitido por ela.

---

### User Story 2 - Demais cargos: sem mínimo, meta é o nível de hoje (Priority: P1)

Atendimento, Caixa, Perfumaria, Apoio e outros **não têm mínimo obrigatório**. O ponto de partida é o quadro que a loja já tem, e a meta de cobertura de cada cargo é **manter o nível que a loja tem hoje** (as horas semanais que esse cargo cobre hoje, a partir do cadastro ou da escala importada). O gap é a parte dessa meta que a capacidade, nas regras novas, deixa descoberta. O campo "mínimo por função", se continuar, vira **meta opcional do dono**, nunca obrigação.

**Why this priority**: tira os alertas falsos de "falta de atendente/caixa" e dá o gap real de cada cargo.

**Independent Test**: loja sem nenhum atendente: nenhuma falta de atendente é acusada por mínimo. Loja com 4 atendentes de 44 h: meta de 176 h; na regra de 40 h a capacidade é 160 h, e o gap é de 16 h.

**Acceptance Scenarios**:

1. **Given** uma loja sem atendente nem caixa, **When** abro o diagnóstico, **Then** nenhum desses cargos aparece com falta e nenhuma contratação é sugerida para eles.
2. **Given** 4 atendentes de 44 h (176 h hoje) e a regra de 40 h (limite de 40 h por pessoa), **Then** a meta do cargo é 176 h, a capacidade 160 h e o gap 16 h.
3. **Given** a regra de 44 h (atual), **Then** o gap dos demais cargos é zero (o quadro mantém o nível de hoje).
4. **Given** que o dono informou uma meta própria para um cargo, **Then** ela vale no lugar do nível de hoje, sem ser obrigatória.
5. **Given** um cargo que ninguém ocupa, **Then** a meta é zero e nada é sugerido.

---

### User Story 3 - Contratação por horas: parcial até 30 h, integral acima (Priority: P1)

Depois de esgotar o quadro, para cada cargo com gap:
- **Gap de até 30 h semanais**: sugere 1 contrato de **tempo parcial** com essas horas ("faltam 10 h → parcial de 10 h por semana").
- **Gap acima de 30 h**: sugere contrato **integral** (a jornada cheia da fase) ou **integral mais parcial**, escolhendo a combinação com menos horas ociosas.
- O parcial nunca passa do limite legal: até 30 h por semana sem horas extras (a variante de 26 h com até 6 h extras fica como opção secundária, marcada "com hora extra").
- Cada sugestão mostra **horas contratadas, horas usadas, horas ociosas (%) e custo mensal**; o custo do parcial é o salário médio da função proporcional às horas, mais os encargos da loja.

**Why this priority**: é o que o dono usa para decidir quem contratar e quanto custa.

**Independent Test**: gap de 10 h de farmacêutico → parcial de 10 h; gap de 35 h → integral; gap de 54 h (Porto Feliz) → 1 integral de 40 h + 1 parcial de 14 h, sem ociosidade.

**Acceptance Scenarios**:

1. **Given** um gap de 10 h de farmacêutico, **Then** a sugestão é 1 parcial de 10 h por semana.
2. **Given** um gap de 30 h exatos, **Then** a sugestão é 1 parcial de 30 h.
3. **Given** um gap de 35 h, **Then** a sugestão é contrato integral.
4. **Given** um gap de 54 h com jornada cheia de 40 h, **Then** a sugestão é 1 integral + 1 parcial de 14 h, e a ociosidade é 0%.
5. **Given** que duas combinações cobrem o gap, **Then** vale a de menos horas ociosas e, em empate, a de menor custo.
6. **Given** o salário médio e os encargos informados, **Then** o custo do parcial de N horas é o salário × N × 5 ÷ o divisor da fase × (1 + encargos); o do integral, o da jornada cheia.
7. **Given** salários não informados, **Then** as horas e a ociosidade aparecem e o custo fica como "—" com o aviso do que falta.
8. **Given** qualquer sugestão, **Then** nenhum parcial passa de 30 h por semana.

---

### User Story 4 - Parcial com dias, horários e aviso do CRF (Priority: P2)

Para cada contrato parcial sugerido, o sistema mostra **em quais dias e horários** ele cobre o descoberto (nos dias de maior déficit). Para **farmacêutico parcial**, aparece o aviso: "O horário do farmacêutico parcial precisa ser registrado no CRF e não pode coincidir com o horário em que ele atua em outra farmácia."

**Why this priority**: torna a sugestão acionável e cumpre a exigência do conselho; pode vir depois do cálculo.

**Independent Test**: parcial de 14 h de farmacêutico mostra os dias e as faixas que cobre e o aviso; parcial de atendente mostra os dias e as faixas, sem o aviso.

**Acceptance Scenarios**:

1. **Given** um parcial de farmacêutico, **Then** o aviso do CRF aparece junto da sugestão.
2. **Given** um parcial de outro cargo, **Then** o aviso não aparece.
3. **Given** um parcial sugerido, **Then** os dias e os horários cobrem exatamente as horas do parcial dentro do horário de funcionamento.

---

### User Story 5 - Redistribuir as pessoas existentes antes de contratar (Priority: P2)

Antes de sugerir contratação, o sistema **redistribui as pessoas que a loja já tem** em escalas compatíveis com as regras (até 5 dias por semana, ou seja 2 folgas, uma preferencialmente no domingo; até 8 h por dia, ou o que a convenção permitir; teto de 42 h e depois 40 h) para cobrir o horário, e só então calcula o que sobra descoberto por cargo. Funcionário com **horário fixo** (flag no cadastro) não é remanejado e o cálculo avisa, sem bloquear.

**Why this priority**: aproveita o quadro ao máximo; entra depois de o cálculo por horas estar pronto.

**Independent Test**: quadro cujas horas somadas cobrem o horário, mas mal distribuídas, é redistribuído sem contratar; funcionário de horário fixo é mantido e avisado.

**Acceptance Scenarios**:

1. **Given** um quadro que cabe se for redistribuído, **Then** o gap é zero e nada é sugerido.
2. **Given** um funcionário marcado com horário fixo, **Then** o horário dele não muda e o resultado mostra o aviso.
3. **Given** a folga dominical, **Then** a escala montada dá, sempre que possível, uma folga no domingo por pessoa, revezando.
4. **Given** que a redistribuição não cobre tudo, **Then** o descoberto por cargo (horas e faixas) aparece e alimenta a contratação.

---

### User Story 6 - Cenários e simulações seguem funcionando (Priority: P1)

Os cenários de decisão (manter horários, economia, equilíbrio, abrir um dia, reduzir equipe), o comparativo, as simulações e as vagas sugeridas continuam calculando, agora com a nova lógica: só o farmacêutico obrigatório, metas nos demais cargos e contratação por horas.

**Why this priority**: o sistema não pode quebrar o que já existe.

**Independent Test**: os cenários da Porto Feliz continuam abrindo, com números coerentes com o gap de farmacêutico e as metas; os testes dos cenários seguem verdes depois das expectativas refeitas à mão.

**Acceptance Scenarios**:

1. **Given** a Porto Feliz, **Then** o Cenário 1 usa a contratação nova (integral + parcial) e o custo correspondente.
2. **Given** os cenários 2 e 3 (travas do fim de semana), **Then** o horário reduzido ou fechado também reduz a necessidade de farmacêutico e a meta dos demais cargos, proporcionalmente às horas abertas.
3. **Given** uma loja sem Caixa nem Atendimento, **Then** o Cenário 2 deixa de ser inviável por falta desses cargos.
4. **Given** uma simulação em rascunho, **Then** as vagas sugeridas seguem a contratação nova.

---

### Edge Cases

- Gap entre 30 h e a jornada cheia (ex.: 35 h): integral, com ociosidade; a variante de 26 h + 6 h extras só aparece se reduzir a ociosidade e vem marcada.
- Gap que é múltiplo exato da jornada cheia: só integrais, sem parcial.
- Loja que não abre num dia: esse dia não entra na necessidade.
- Farmacêutico com carga menor que a jornada cheia: a capacidade é a que ele cumpre.
- Salário médio ausente para o cargo: sem custo, com aviso.
- Meta informada pelo dono maior que a capacidade possível: o gap é a diferença, sem erro.
- Regra de 42 h sem convenção (jornada efetiva de 40 h por causa do limite de 8 h por dia): usa a jornada efetiva.
- Horário de funcionamento sem horário cadastrado: o diagnóstico pede o horário, como hoje.
- Gestor e consulta: veem horas, gaps e sugestões; custos em reais só para o dono.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O farmacêutico MUST ser o único cargo com cobertura obrigatória, igual a 100% das horas de funcionamento da loja em todos os dias.
- **FR-002**: O sistema MUST calcular, por regra (42 h e 40 h) e também para a regra atual, as horas semanais de farmacêutico necessárias, a capacidade dos farmacêuticos atuais dentro das regras e o gap em horas semanais.
- **FR-003**: Os demais cargos MUST NOT ter mínimo obrigatório; a falta de um cargo (ex.: ninguém no Atendimento) MUST NOT gerar alerta de falta nem inviabilizar cenário por si só.
- **FR-004**: A meta padrão de cada cargo (exceto farmacêutico) MUST ser o nível de cobertura de hoje: as horas semanais que o cargo cobre hoje, pelo cadastro ou pela escala importada.
- **FR-005**: O campo "mínimo por função" MUST continuar existindo apenas como **meta opcional** do dono, que substitui a meta padrão quando informada.
- **FR-006**: O gap de cada cargo MUST ser a parte da meta que a capacidade (limitada pelas regras de teto semanal, dias e horas por dia) deixa descoberta.
- **FR-007**: A contratação MUST ser sugerida por horas: gap até 30 h semanais vira 1 contrato parcial com essas horas; gap acima de 30 h vira contrato integral ou combinação integral mais parcial de menos horas ociosas.
- **FR-008**: Nenhum contrato parcial sugerido MUST passar de 30 h por semana; a variante de 26 h + até 6 h extras MUST aparecer só como opção secundária e identificada.
- **FR-009**: Cada sugestão MUST mostrar horas contratadas, horas usadas, horas ociosas (%) e custo mensal; o custo do parcial MUST ser o salário médio da função proporcional às horas, mais os encargos da loja.
- **FR-010**: O sistema MUST mostrar, para cada parcial, os dias e os horários que ele cobre.
- **FR-011**: Para parcial de farmacêutico, o aviso do CRF MUST aparecer; para os outros cargos, não.
- **FR-012**: O sistema MUST redistribuir as pessoas existentes em escalas compatíveis com as regras (dias por semana, horas por dia, convenção, folga dominical) antes de calcular o gap e sugerir contratação.
- **FR-013**: O funcionário com **horário fixo** MUST NOT ser remanejado; o cálculo MUST avisar e continuar.
- **FR-014**: As regras já parametrizáveis (jornada por fase, dias de trabalho, horas por dia, convenção) MUST continuar vindo da tabela de parâmetros legais.
- **FR-015**: Os cenários de decisão, o comparativo, as simulações e as vagas sugeridas MUST continuar funcionando e usar a nova lógica; a necessidade de farmacêutico e a meta dos demais cargos MUST acompanhar as horas abertas do cenário.
- **FR-016**: Custos em reais MUST seguir visíveis só para o dono; gestor e consulta MUST receber horas, gaps e sugestões sem valores em reais.
- **FR-017**: O resultado MUST seguir a ordem: (1) cobrir o horário com o farmacêutico existente, (2) redistribuir os demais funcionários, (3) só então sugerir contratações, (4) mostrar o custo adicional na folha e o comparativo com o cenário atual.

### Key Entities

- **Gap de cargo**: horas semanais da meta que a capacidade não cobre, por cargo e por regra.
- **Meta de cobertura**: nível de cobertura desejado de um cargo (padrão: o de hoje; opcional: informada pelo dono).
- **Sugestão de contratação**: tipo (integral, parcial, integral + parcial), horas contratadas, horas usadas, horas ociosas, dias e horários, custo e avisos.
- **Horário fixo**: marca opcional do funcionário que o exclui da redistribuição.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em **100%** das lojas, a única falta obrigatória possível é a do farmacêutico; nenhuma loja aparece com "falta de atendente, caixa, perfumaria ou apoio" por mínimo.
- **SC-002**: Um gap de 10 h de farmacêutico sugere parcial de 10 h; de 30 h, parcial de 30 h; de 35 h, integral; nenhum parcial sugerido passa de 30 h.
- **SC-003**: Na Porto Feliz (regra de 42 h), o gap de 54 h de farmacêutico vira **1 integral de 40 h + 1 parcial de 14 h**, com ociosidade de 0% e custo adicional menor que os R$ 14.930,51 de hoje.
- **SC-004**: Uma loja sem atendente nem caixa deixa de ter o Cenário 2 inviável por esses cargos.
- **SC-005**: O diagnóstico abre em até 2 segundos nas duas fases (42 h e 40 h).
- **SC-006**: Os testes de cenários, comparativo e simulações continuam passando depois de refeitos à mão, com o motivo de cada mudança anotado.

## Assumptions

- Decision: a meta padrão dos demais cargos é o **nível de hoje em horas semanais** (a leitura literal do pedido). Efeito aceito: com 40 h por pessoa, Atendimento (4 × 44 h = 176 h) passa a ter gap de 16 h e Apoio (3 × 44 h = 132 h) gap de 12 h, e o sistema sugere parcial para manter o nível de hoje. Why: foi a resposta aprovada pela pessoa.
- Decision: os **encargos** seguem como o percentual único por loja; encargos por regime tributário ficam para depois. Why: aprovado; o regime tributário ainda não entra em nenhum cálculo.
- Decision: a contratação parcial **até 30 h** é a regra principal; a variante de 26 h + 6 h extras entra como opção secundária (custo de hora extra com adicional). Why: o pedido cita as duas e proíbe passar disso.
- Decision: o integral usa a jornada efetiva da fase (40 h na regra de 42 h sem convenção, por causa do teto de 8 h por dia). Why: é o que o motor já usa.
- Decision: a redistribuição (US5) vem depois do cálculo por horas (US1 a US3) e do parcial com dias e horários (US4). Why: é a parte mais pesada; as anteriores já entregam valor.
- Decision: "horário fixo" é um campo novo e opcional no funcionário; sem ele, todos podem ser remanejados. Why: a restrição de horário não existe hoje.
- Fora do escopo: encargos por regime tributário, férias e absenteísmo, hora extra além da variante de 26 h, adicional noturno, validação jurídica das regras e dos limites.
- Depende das specs 009 a 012 (cenários, comparativo, travas do fim de semana); a fatia 4 da spec 012 (Cenário 3 com as travas) pode ser entregue antes ou depois.
