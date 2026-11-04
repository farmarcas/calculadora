# Feature Specification: Cenário 3 com horário estendido

**Feature Branch**: `feat/cenario-3-estender-horario`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "O Cenário 3 (Equilíbrio) passa a poder também estender o horário de funcionamento, usando as horas ociosas de quem foi contratado, para ganhar vendas. Primeiro só sábado e domingo; depois os dias da semana de melhor venda."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver quando contratar e abrir mais horas compensa (Priority: P1)

O dono olha o Diagnóstico de uma loja em que o Cenário 1 contrata gente e deixa horas ociosas. Hoje o Cenário 3 só sabe **cortar** horário e acaba igual ao Cenário 1. Com esta mudança ele também testa **estender** o fim de semana (abrir mais cedo ou fechar mais tarde no sábado e no domingo) para vender mais com a equipe contratada. Se isso compensa, o Cenário 3 passa a ser diferente do 1 e pode ter impacto **positivo**.

**Why this priority**: É a única forma de o dono ver um cenário que dá ganho, e não só custo ou economia.

**Independent Test**: Em uma loja com contratação e horas ociosas no Cenário 1 e venda registrada perto do horário de fechamento, o Cenário 3 mostra o fim de semana estendido e um impacto maior que o do Cenário 1.

**Acceptance Scenarios**:

1. **Given** uma loja cujo Cenário 1 contrata e deixa horas ociosas, **When** estender o sábado ou o domingo gera mais margem que a folha extra, **Then** o Cenário 3 mostra a extensão ("Sábado fecha às 22h, antes 20h"), a contratação necessária e um impacto melhor que o do Cenário 1.
2. **Given** uma loja em que nenhuma extensão compensa, **When** o Diagnóstico abre, **Then** o Cenário 3 segue as regras atuais (igual ao 1 ou ao 2, recolhido).
3. **Given** que estender obriga a contratar mais gente além do Cenário 1, **When** o Cenário 3 é calculado, **Then** o custo dessa folha entra na conta e a extensão só aparece se ainda compensar.

---

### User Story 2 - Entender que a venda das horas novas é estimativa (Priority: P1)

O dono precisa saber que a venda das horas novas nunca foi medida: é uma suposição. O cartão deixa isso claro e não promove o cenário a "sugerido" por causa dela.

**Why this priority**: Evita decisão de investimento em cima de um número que parece dado real.

**Independent Test**: Em uma loja com extensão, o cartão mostra o aviso de estimativa; o selo "Cenário sugerido" só vai para o Cenário 3 se o ganho continuar positivo com a venda das horas novas pela metade.

**Acceptance Scenarios**:

1. **Given** um Cenário 3 com horas estendidas, **When** o cartão aparece, **Then** há o aviso "Venda das horas novas é estimada" e a origem da estimativa (venda registrada fora do horário ou fração das horas vizinhas).
2. **Given** um ganho que some se a venda das horas novas for metade do estimado, **When** o selo é decidido, **Then** o Cenário 3 não recebe "Cenário sugerido".
3. **Given** um Cenário 3 com ganho positivo, **When** o selo de melhor resultado é decidido, **Then** o selo "Melhor resultado" aparece no lugar de "Menor custo".

---

### User Story 3 - Estender também nos dias da semana de maior venda (Priority: P3, segunda fase)

Depois de validado o fim de semana, o mesmo cálculo passa a considerar os dias de segunda a sexta com maior venda.

**Why this priority**: Ampliação natural, mas só vale depois que a primeira fase estiver aprovada com dados reais.

**Independent Test**: Fora do escopo desta entrega; será especificado e testado em spec própria.

---

### Edge Cases

- Loja sem venda fora do horário cadastrado: a venda das horas novas vem da fração das horas vizinhas, com o aviso de estimativa.
- Loja sem margem ou sem custos: o Cenário 3 mostra "Não calculado: faltam dados", como hoje.
- Loja 24 horas ou que já abre o máximo permitido no dia: nada a estender naquele dia.
- Extensão que ultrapassa a jornada da equipe: precisa de contratação adicional ou não é oferecida.
- Gerente: vê a extensão e as horas, sem valores em reais.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Cenário 3 MUST considerar, além dos cortes de fim de semana, a extensão do horário de sábado e domingo (abrir mais cedo ou fechar mais tarde), combinada com a contratação.
- **FR-002**: A extensão MUST usar as horas ociosas da contratação e MUST somar ao custo qualquer folha adicional que ela exija.
- **FR-003**: A venda das horas novas MUST ser estimada pela venda registrada fora do horário cadastrado, quando existir; sem ela, por uma fração (50% como ponto de partida) da venda das horas vizinhas do mesmo dia.
- **FR-004**: A margem ganha com as horas novas MUST usar a margem da base comercial ou a média cadastrada na loja.
- **FR-005**: O cartão MUST avisar que a venda das horas novas é estimada e MUST indicar a origem da estimativa.
- **FR-006**: O selo "Cenário sugerido" MUST só ir ao Cenário 3 com extensão quando o ganho continuar positivo com a venda das horas novas reduzida à metade.
- **FR-007**: O selo "Menor custo" MUST passar a "Melhor resultado" quando o melhor cenário tiver impacto positivo.
- **FR-008**: Quando nenhuma extensão compensa, o Cenário 3 MUST seguir as regras atuais, sem mudança para as lojas de hoje.
- **FR-009**: Segunda a sexta MUST continuar sem mudança nesta fase.
- **FR-010**: A extensão MUST respeitar a jornada legal e o horário máximo permitido da loja.
- **FR-011**: Valores em R$ MUST continuar só para o dono.

### Key Entities

- **Horas estendidas**: dia, horário de antes e de depois, horas novas por semana, origem da estimativa de venda.
- **Cenário 3**: passa a poder trazer cortes, extensões e contratações juntos, com o impacto líquido (margem ganha ou perdida menos folha).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em lojas onde a extensão compensa, o Cenário 3 mostra impacto maior que o do Cenário 1 e a extensão em texto claro.
- **SC-002**: Em lojas onde nada compensa, o resultado do Cenário 3 é idêntico ao de hoje.
- **SC-003**: Nenhum Cenário 3 com extensão recebe "Cenário sugerido" quando o ganho depende de a venda estimada se confirmar por inteiro.
- **SC-004**: Todo cartão com horas estendidas traz o aviso de estimativa.

## Assumptions

- Business: fase 1 estende só sábado e domingo; segunda a sexta ficam para a fase 2, pedida pela pessoa ("depois nos dias da semana com melhor venda").
- Business: a fração de 50% da venda das horas vizinhas fica fixa nesta fase, sem painel para editar.
- Business: a extensão não passa do máximo de horas por dia permitido pela regra da loja nem do horário de funcionamento permitido; limites exatos entram no plano.
- Decision: o cálculo entra na busca do Cenário 3, que já compara combinações de fim de semana e escolhe a de melhor resultado. Why: é a mesma premissa ("melhor combinação entre contratar e ajustar horários") e evita um cenário novo.
- Decision: o teste de robustez do selo usa metade da venda estimada das horas novas. Why: o ganho só sustenta uma recomendação se resistir a uma estimativa pessimista.
- Fora do escopo: dias de semana de maior venda, painel para editar a fração, reabrir dias hoje fechados, mudar os cenários 1 e 2.
- Depende da spec 019 (premissas, recolhimento e selos), que deve estar publicada antes.
