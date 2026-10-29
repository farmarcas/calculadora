# Feature Specification: Cenários de horário decididos por dia da semana

**Feature Branch**: `feat/cenarios-por-dia`
**Created**: 2026-10-29
**Status**: Draft
**Input**: User description: "Sem a venda hora a hora (a volumetria não permite), só há a média por dia da semana e a média mensal. Os cenários de reduzir e estender horário, que hoje cortam e estendem hora a hora, não refletem bem a realidade. Vamos decidir por dia da semana: sugerir fechar um dia, manter ou abrir um dia hoje fechado. Sem percentual de venda por turno (fica complexo)."

## Situação de hoje

Os cenários 2 (foco em economia), 3 (equilíbrio) e 4 (estender horário) mexem no horário **uma hora por vez**, nas pontas do dia. Sem a venda hora a hora, o sistema divide o faturamento do dia igualmente entre as horas, então as pontas empatam e o valor em reais de "uma hora cortada" é só uma média: não é confiável. Além disso, fechar 1 hora mais cedo quase nunca economiza folha, porque a pessoa trabalha em turnos de até 8 horas: a economia só aparece quando o corte reduz o número de turnos, ou quando um dia inteiro deixa de funcionar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cenário 2: fechar dias para não contratar (Priority: P1)

O cenário "Foco em economia" passa a sugerir **quais dias da semana fechar** para que a equipe atual cubra o horário, sem contratar ninguém. Mostra os dias a fechar, o novo horário da semana, a **margem que deixa de entrar** por mês e a **folha que deixa de ser contratada**.

**Why this priority**: é o cenário em que a decisão por dia faz mais sentido, e usa o dado que a loja já tem (faturamento por dia da semana).

**Independent Test**: loja em que faltam pessoas para os sete dias; o cenário fecha o(s) dia(s) de menor margem até a equipe atual caber; conferir que a cobertura passa sem contratação e que a margem perdida confere com a conta à mão.

**Acceptance Scenarios**:

1. **Given** uma equipe que não cobre todos os dias, **When** abro o Cenário 2, **Then** vejo quais dias fechar, o horário novo e a margem mensal perdida (margem do dia × 52 ÷ 12 de cada dia fechado).
2. **Given** o horário com os dias fechados, **Then** a equipe atual cobre todo o horário restante (horas e turnos) e o farmacêutico em todas as horas abertas.
3. **Given** que fechar qualquer dia não resolve, ou só resolve fechando um dos dias protegidos (ver história 4), **Then** o cenário diz que não é possível sem contratar e aponta o Cenário 1.
4. **Given** que a equipe já cobre tudo, **Then** o cenário diz que não há nada a fechar.
5. **Given** o seletor 42h/40h, **When** troco a regra, **Then** o cenário recalcula.

---

### User Story 2 - Cenário 3: o melhor equilíbrio entre contratar e fechar dias (Priority: P1)

O cenário "Equilíbrio" testa **todas as combinações de dias abertos e fechados** (são poucas: sete dias) e, para cada uma, calcula quantas pessoas ainda precisam ser contratadas. Escolhe a combinação de **maior resultado**: margem dos dias abertos menos o custo adicional de folha. Mostra os dias fechados, as contratações, o resultado por mês e uma frase que explica a lógica.

**Why this priority**: com decisão por dia, a busca completa fica simples e dá o melhor resultado de verdade, no lugar da aproximação de hoje.

**Independent Test**: loja com um dia de pouca venda e contratação cara; conferir, por conta à mão sobre todas as combinações, que o escolhido é o de maior resultado.

**Acceptance Scenarios**:

1. **Given** custos e faturamento por dia informados, **When** abro o Cenário 3, **Then** vejo os dias fechados (se houver), as contratações por cargo, o resultado líquido mensal e uma frase como "Fechando o domingo você economiza R$ X por mês na folha e perde R$ Y de margem".
2. **Given** que a melhor combinação é manter todos os dias, **Then** o cenário diz "o equilíbrio para esta loja é contratar tudo", em vez de repetir o Cenário 1.
3. **Given** que a melhor combinação é a do Cenário 2, **Then** o cenário diz que o equilíbrio é fechar os dias, em vez de repetir o Cenário 2.
4. **Given** empate de resultado, **Then** vence a combinação com menos contratações e, depois, com menos dias fechados.
5. **Given** falta de custos (salário médio) ou de faturamento, **Then** o cenário diz o que falta informar e não mostra número parcial.

---

### User Story 3 - Cenário 4: abrir um dia hoje fechado (Priority: P2)

O cenário "Estender horário" passa a sugerir **abrir um dia da semana hoje fechado** (ex.: domingo), quando a equipe, com as contratações do Cenário 1, tem sobra de capacidade para cobri-lo sem contratar mais, e a margem estimada do dia compensa. Não sugere mais "1 hora a mais" nas pontas.

**Why this priority**: mantém a ideia de usar a ociosidade que a loja já vai pagar, agora no tamanho em que a decisão é real.

**Independent Test**: loja fechada aos domingos com ociosidade na equipe do Cenário 1; conferir que o domingo aberto cabe sem nova contratação e que a margem de referência confere com a conta à mão.

**Acceptance Scenarios**:

1. **Given** um dia fechado e capacidade sobrando, **When** abro o Cenário 4, **Then** vejo o dia a abrir, o horário sugerido e a margem mensal estimada para o dia.
2. **Given** que não há dia fechado, ou não há sobra de capacidade, **Then** o cenário diz o motivo.
3. **Given** que o faturamento do dia fechado não é conhecido (nunca vendeu), **Then** a margem do dia é uma estimativa a partir dos dias abertos e vem avisada como referência, não como previsão.
4. **Given** o dia sugerido, **Then** a equipe cobre o dia (horas, turnos e farmacêutico) sem nova contratação.

---

### User Story 4 - Dias protegidos e honestidade sobre a estimativa (Priority: P1)

O sistema **não sugere fechar os três dias de maior faturamento**; se o único jeito de o cenário fechar é cortar um deles, ele é marcado como "não recomendado" e diz qual dia seria atingido. Toda venda mostrada vem com a origem: faturamento do cadastro por dia da semana, base comercial somada por dia da semana ou estimativa (quando só há o mensal).

**Why this priority**: evita sugerir o que derruba a loja e deixa claro o quanto o número é firme.

**Independent Test**: loja em que só fechar o dia de maior venda resolve: o cenário aparece como "não recomendado"; loja só com faturamento mensal: o cenário avisa que o dia é uma estimativa.

**Acceptance Scenarios**:

1. **Given** que o corte atinge um dos três dias de maior faturamento, **Then** o cenário fica "não recomendado" e informa o dia.
2. **Given** faturamento por dia da semana informado, **Then** a venda de cada dia é esse valor, sem divisão por hora.
3. **Given** só o faturamento mensal, **Then** o sistema divide igualmente entre os dias abertos, avisa que é estimativa e pede o faturamento por dia da semana para sugerir fechar um dia.
4. **Given** base comercial enviada, **Then** a venda de cada dia da semana é a soma da base por dia da semana, e a origem aparece como "base comercial".

---

### User Story 5 - Recaptura da venda (Priority: P3)

Quem avalia pode informar a **parte da venda de um dia fechado que migra para os outros dias** (0% a 30%; padrão 0%) e ver os cenários recalculados. Fechar o domingo com 20% de recaptura reduz a margem perdida em 20%.

**Why this priority**: o documento de regras pede, e é um ajuste simples; mas não bloqueia o resto.

**Acceptance Scenarios**:

1. **Given** recaptura de 20%, **When** recalculo, **Then** a margem perdida de cada dia fechado cai 20% e o resultado dos cenários acompanha.
2. **Given** um valor fora de 0% a 30%, **Then** o sistema recusa com aviso.

---

### Edge Cases

- Loja 24 horas aberta todos os dias: fechar um dia inteiro continua sendo uma decisão válida.
- Loja que abre só alguns dias: só os dias abertos são candidatos a fechar e só os fechados a abrir.
- Fechar um dia que reduz a necessidade, mas a equipe continua sem cobrir outro dia: o cenário avalia a combinação completa, não um dia isolado.
- Nenhum dia pode ser fechado se isso deixar a loja sem nenhum dia aberto.
- Faturamento de um dia igual a zero ou em branco com outros dias preenchidos: o dia vale a média dos informados, avisado como estimativa.
- Sem custos informados, os cenários mostram os dias e a margem, mas sem valores de folha (e dizem o que falta).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A venda de cada dia da semana MUST vir, nesta ordem, da base comercial somada por dia da semana, do faturamento do cadastro por dia ou, na falta dos dois, da divisão igual do faturamento mensal pelos dias abertos (avisada como estimativa).
- **FR-002**: A margem mensal de um dia MUST ser `venda média do dia × margem bruta % × 52 ÷ 12`; sem margem informada, os cenários avisam que falta.
- **FR-003**: O Cenário 2 MUST fechar dias, escolhendo o de menor margem mensal a cada passo, até a equipe atual cobrir o horário sem contratação (horas, turnos e farmacêutico), ou declarar que não é possível.
- **FR-004**: O Cenário 3 MUST avaliar todas as combinações de dias abertos e fechados que mantenham ao menos um dia aberto e respeitem a cobertura do farmacêutico, calculando para cada uma as contratações necessárias, e escolher a de maior `margem dos dias abertos − custo adicional de folha`.
- **FR-005**: O Cenário 3 MUST desempatar por menos contratações e depois por menos dias fechados, e MUST informar quando o melhor resultado coincide com o Cenário 1 ou o Cenário 2.
- **FR-006**: O Cenário 4 MUST sugerir abrir um dia fechado somente quando a equipe do Cenário 1 o cobrir sem nova contratação; a margem do dia, quando sem histórico, MUST ser estimada pela média dos dias abertos e avisada como referência.
- **FR-007**: Os cenários MUST NOT sugerir fechar os três dias de maior faturamento; quando só isso resolveria, MUST marcar o cenário como "não recomendado" e dizer qual dia.
- **FR-008**: Os cenários MUST NOT propor cortes ou extensões de uma hora nas pontas do dia.
- **FR-009**: Cada cenário MUST mostrar a origem da venda (cadastro, base comercial ou estimativa) e MUST trazer uma frase-resumo da lógica.
- **FR-010**: Custos, economia, margem e resultado em R$ MUST aparecer só para o dono; gestor e consulta veem os dias sugeridos e as horas, sem valores (como hoje).
- **FR-011**: O Cenário 1, o Cenário 5, o selo "Menor impacto financeiro" (que compara os cenários 1 a 3), o quadro por turno e a exigência por turno MUST continuar funcionando; o selo passa a usar os números novos dos cenários 2 e 3.
- **FR-012**: O sistema MUST permitir informar a recaptura (0% a 30%, padrão 0%) e recalcular os cenários 2, 3 e 4.
- **FR-013**: Lojas sem turnos definidos e lojas com turnos MUST ser tratadas igualmente (a decisão é por dia).

### Key Entities

- **Venda do dia da semana**: valor médio por dia (segunda a domingo) e a origem (cadastro, base ou estimativa).
- **Margem do dia**: derivada da venda do dia e da margem bruta, por mês.
- **Combinação de dias**: conjunto de dias abertos e fechados avaliado pelo Cenário 3, com contratações, folha e resultado.
- **Dia protegido**: um dos três dias de maior faturamento da loja.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em casos de teste calculados à mão, o Cenário 3 escolhe a combinação de maior resultado em 100% dos casos, conferido contra a enumeração manual.
- **SC-002**: Nenhum cenário sugere corte ou extensão de uma hora; todos os horários novos só diferem do atual por dias inteiros abertos ou fechados.
- **SC-003**: Em 100% dos casos, a equipe do cenário cobre o horário sugerido (horas, turnos e farmacêutico) sem nova contratação (cenários 2 e 4) ou com as contratações informadas (cenário 3).
- **SC-004**: Nenhum cenário fecha um dia protegido sem ser marcado como "não recomendado".
- **SC-005**: Gestor e consulta não recebem nenhum valor em reais; o dono vê todos.
- **SC-006**: Lojas em que o resultado dos cenários 2 e 3 muda em relação à versão por hora têm a diferença explicada na tela (o horário agora é por dia).

## Assumptions

- **Decisão por dia, sem percentual de venda por turno**, conforme combinado: a complexidade do percentual por turno fica fora desta entrega.
- **Economia = contratação evitada.** Fechar um dia só economiza folha quando reduz as contratações que o Cenário 1 pediria; quem já está no quadro continua sendo pago (isso é tratado pelo Cenário 5, "reduzir equipe").
- **Dias protegidos = os 3 de maior faturamento**, valor fixo nesta entrega (o documento chama de "horas protegidas" e permite parametrizar; aqui é por dia e fica sem tela de edição).
- **Recaptura padrão 0%** (conservador), editável de 0% a 30% na própria tela dos cenários.
- **Horário sugerido para abrir um dia fechado** = o horário do dia aberto mais curto da loja, como já ocorre hoje.
- **Fora do escopo**: percentual de venda por turno, corte de turnos de ponta dentro do dia, curva padrão por hora, regra do domingo, custo completo (encargos por regime, provisões), horas extras e o comparativo em tabela. Estão no relatório de gap.
- **Os valores dos cenários 2, 3 e 4 mudam** em relação à versão por hora (o selo da loja 001, hoje em "Foco em economia" com R$ 8.710, pode mudar); isso é esperado e será explicado na tela.
- Decisões técnicas (algoritmo, estrutura) ficam para o plano.
