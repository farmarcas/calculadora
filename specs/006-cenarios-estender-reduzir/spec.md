# Feature Specification: Cenários "Estender horário" e "Reduzir equipe"

**Feature Branch**: `feat/escala-cenarios-extras`
**Created**: 2026-10-27
**Status**: Draft
**Input**: User description: "Dois novos cenários de decisão no Diagnóstico da Escala, vindos da reunião com o especialista (27/10/2026): (4) Estender horário aproveitando a ociosidade: quando a contratação necessária para manter os horários deixa horas ociosas, sugerir abrir mais horas onde a venda compensa, usando a capacidade já paga; mostrar horas a estender, novo horário, venda e margem ganhas estimadas e custo. (5) Reduzir o quadro quando há gente subutilizada: quando a equipe atual tem mais horas do que a loja precisa, sugerir quantas pessoas por cargo poderiam sair mantendo a cobertura legal, com a economia mensal de folha. Ambos adaptáveis a 42h e 40h, só estimativa, sem alterar cadastro, custo só para o dono."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cenário 4: estender o horário usando a capacidade ociosa (Priority: P1)

Hoje o Cenário 1 diz quantas pessoas contratar para manter os horários e quanto dessa contratação fica ociosa. O Cenário 4 responde: "já que essas horas vão ser pagas de qualquer jeito, onde vale abrir mais?". Mostra **quantas horas por semana a loja pode estender** sem contratar mais ninguém, **como fica o horário** dia a dia (abrir mais cedo, fechar mais tarde ou abrir um dia hoje fechado), a **venda e a margem estimadas** que isso pode trazer e o **custo** (o mesmo da contratação do Cenário 1, sem acréscimo).

**Why this priority**: foi o insight do especialista: quem vai contratar não deve deixar gente parada se pode vender mais nas horas que já paga. Só depende de dados que a plataforma já tem.

**Independent Test**: com uma loja cuja contratação do Cenário 1 deixa horas ociosas, conferir que as horas estendidas cabem na ociosidade (a cobertura continua passando sem nova contratação) e que a margem estimada confere com a conta manual.

**Acceptance Scenarios**:

1. **Given** uma contratação com horas ociosas, **When** abre o Cenário 4, **Then** vê as horas a estender por semana, o novo horário de cada dia e a margem estimada ganha por mês.
2. **Given** o horário estendido, **Then** a equipe do Cenário 1 (atual mais contratações) continua cobrindo todo o horário, nas horas e nos turnos, e o farmacêutico em todo o horário aberto.
3. **Given** custos informados (só o dono), **Then** vê o custo adicional (igual ao do Cenário 1) e o impacto líquido (custo menos margem ganha).
4. **Given** nenhuma hora ociosa (ou nenhuma contratação), **Then** o cenário diz que não há capacidade sobrando para estender.
5. **Given** o seletor 42h/40h, **When** troca a regra, **Then** o cenário recalcula.
6. **Given** nenhuma base comercial, **Then** o cenário mostra as horas e o horário possíveis, avisa que a margem não pôde ser estimada e não sugere abrir por valor de venda.

---

### User Story 2 - Cenário 5: reduzir a equipe quando há gente sobrando (Priority: P2)

O Cenário 5 responde: "minha equipe é maior do que a loja precisa?". Para cada cargo, mostra **quantas pessoas excedem** o necessário para cobrir o horário atual na regra escolhida (42h ou 40h), mantendo a cobertura legal, e a **economia mensal de folha** que isso representaria. É uma informação de capacidade excedente para apoiar a decisão da gestão, não uma recomendação de desligamento.

**Why this priority**: complementa a visão de "faltam pessoas" mostrando também o outro lado; o especialista relatou que lojas subutilizadas aparecem com frequência. Depende só do quadro, do horário e dos custos.

**Independent Test**: com uma loja com mais pessoas do que o horário exige, conferir que, retirando o excedente indicado, a cobertura continua passando e que retirar uma pessoa a mais já deixaria falta.

**Acceptance Scenarios**:

1. **Given** um cargo com mais horas e turnos do que a loja precisa, **When** abre o Cenário 5, **Then** vê quantas pessoas excedem nesse cargo.
2. **Given** o excedente indicado, **When** o quadro é recalculado sem essas pessoas, **Then** a cobertura legal continua passando; com uma pessoa a menos ainda, deixaria de passar.
3. **Given** custos informados (só o dono), **Then** vê a economia mensal de folha por cargo e total, e o percentual sobre a folha atual.
4. **Given** um cargo que já está justo ou em falta, **Then** o cenário não sugere retirar ninguém dele.
5. **Given** uma função obrigatória com uma única pessoa, **Then** esse cargo nunca aparece com excedente.
6. **Given** nenhum cargo com excedente, **Then** o cenário diz que não há gente sobrando.
7. **Given** o seletor 42h/40h, **When** troca a regra, **Then** o excedente recalcula (a regra mais curta tende a mostrar menos excedente).

---

### User Story 3 - Encaixe no quadro de cenários (Priority: P3)

Os dois cenários aparecem abaixo dos três atuais, com o mesmo formato (foco, direcionamento, números grandes), seguem o seletor 42h/40h e respeitam as mesmas permissões e avisos de dado faltando. Ficam **fora** da comparação do selo "Menor impacto financeiro" dos cenários 1 a 3, mas mostram o próprio impacto.

**Why this priority**: consistência da experiência; nada de lógica nova.

**Independent Test**: abrir o Diagnóstico como dono, gestor e consulta, nas duas regras, e conferir presença, valores de custo e avisos.

**Acceptance Scenarios**:

1. **Given** o Diagnóstico de uma loja com escala, **Then** vê os cenários 4 e 5 abaixo do 3, com frase de direcionamento cada.
2. **Given** perfil de gestor ou consulta, **Then** vê horas, horários e pessoas, sem nenhum valor de custo, economia ou impacto em reais.
3. **Given** custos ausentes, **Then** o cenário mostra o que não pôde ser calculado em reais e explica o que informar.

---

### Edge Cases

- Loja sem escala atual importada: os cenários não aparecem (o diagnóstico já pede a escala).
- Loja 24 horas: não há o que estender no dia; só dias fechados poderiam abrir.
- Loja com todos os dias abertos e sem folga na capacidade: nada a estender.
- Estender um dia hoje fechado só é sugerido se couber inteiro nas horas ociosas e nos turnos disponíveis.
- Venda de referência para horas hoje fechadas: ver Assumptions (é uma referência, não uma previsão).
- Quadro que tem falta em um cargo e excesso em outro: o Cenário 5 trata só os cargos com excedente e avisa que a falta dos outros segue no Cenário 1.
- Quadro com pessoa de função fora do cálculo: continua fora, como no diagnóstico.
- Cenários não alteram o cadastro da loja nem criam, desligam ou movem funcionário.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Diagnóstico MUST mostrar, abaixo dos três cenários atuais, o Cenário 4 (estender horário) e o Cenário 5 (reduzir equipe).
- **FR-002**: Os dois cenários MUST seguir o seletor 42h/40h e recalcular ao trocá-lo.
- **FR-003**: O Cenário 4 MUST partir da equipe do Cenário 1 (atual mais as contratações necessárias) e só sugerir horas que essa equipe cubra, em horas e em turnos, sem nova contratação.
- **FR-004**: O Cenário 4 MUST estender o horário nas pontas de cada dia (abrir mais cedo ou fechar mais tarde) ou abrir dia hoje fechado, uma hora por vez, escolhendo primeiro a hora de maior margem estimada, até a capacidade ociosa acabar.
- **FR-005**: O Cenário 4 MUST mostrar as horas a estender por semana, o novo horário dia a dia, e, com base comercial, a venda e a margem estimadas por semana e por mês.
- **FR-006**: Em todo o horário estendido, o farmacêutico MUST continuar coberto nas contas.
- **FR-007**: O Cenário 4 MUST rotular a venda das horas hoje fechadas como referência (não previsão) e avisar quando ela se baseia só na hora vizinha.
- **FR-008**: O Cenário 5 MUST calcular, por cargo, quantas pessoas excedem o necessário para cobrir o horário atual na regra escolhida, de modo que, retirando o excedente, a cobertura (horas e turnos) continue passando.
- **FR-009**: O Cenário 5 MUST NOT indicar excedente em cargo que esteja em falta ou justo, nem em função obrigatória que ficaria sem ninguém.
- **FR-010**: O Cenário 5 MUST mostrar a economia mensal de folha por cargo e total, e o percentual sobre a folha atual, com o salário médio e os encargos já informados.
- **FR-011**: Valores de custo, economia, margem em reais e impacto MUST ser visíveis só para o dono do grupo; os demais perfis veem horas, horários e número de pessoas.
- **FR-012**: Cenário sem os dados necessários (custos, base comercial) MUST explicar o que falta em vez de mostrar número parcial.
- **FR-013**: Cada cenário MUST trazer uma frase de direcionamento de quando faz sentido seguir por ele, e o Cenário 5 MUST deixar claro que é capacidade excedente para decisão da gestão, e que depende de validação trabalhista e do contrato de cada pessoa.
- **FR-014**: Os cenários 4 e 5 MUST NOT alterar o cadastro da loja nem criar, desligar ou mover funcionário.
- **FR-015**: Os cenários 4 e 5 MUST ficar fora da escolha do selo "Menor impacto financeiro" dos cenários 1 a 3, mostrando o próprio impacto (só para o dono).
- **FR-016**: Todo valor monetário MUST ser rotulado como estimativa gerencial.

### Key Entities

- **Cenário 4 (estender)**: regra, horário semanal estendido, horas a estender, cortes ao contrário (extensões: dia, faixa, venda de referência e margem), custo (o do Cenário 1) e impacto líquido.
- **Cenário 5 (reduzir equipe)**: regra, excedente por cargo (pessoas), economia mensal por cargo e total, percentual sobre a folha.
- **Venda de referência de hora fechada**: venda e margem usadas como estimativa para uma hora em que a loja hoje não abre.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Os cenários 4 e 5 aparecem junto com os outros em menos de 2 segundos depois do diagnóstico.
- **SC-002**: Em 100% dos casos de teste, o horário estendido do Cenário 4 continua coberto pela equipe do Cenário 1 (nenhuma função em falta) e uma hora a mais já deixaria falta.
- **SC-003**: Em 100% dos casos de teste, retirar o excedente do Cenário 5 mantém a cobertura, e retirar mais uma pessoa de qualquer cargo a quebra.
- **SC-004**: Margem ganha, economia de folha e horas conferem com a conta manual em 100% dos casos de teste.
- **SC-005**: 0 valores de custo, economia ou margem em reais visíveis para quem não é dono do grupo.
- **SC-006**: Trocar entre 42h e 40h atualiza os dois cenários sem recarregar a página.

## Assumptions

- Decision: o Cenário 4 parte da **equipe do Cenário 1** (quadro atual mais as contratações já calculadas). Why: é o que o especialista pediu, aproveitar a ociosidade de quem será contratado; sem contratação, só há ociosidade se a equipe atual já tiver horas e turnos sobrando.
- Decision: a base comercial só tem venda das horas em que a loja já abre, então a venda de uma hora **hoje fechada** é estimada pela da **hora vizinha aberta** (a primeira hora antes da abertura usa a primeira hora aberta; o mesmo no fechamento; dia fechado usa a média dos dias abertos de mesmo perfil) e é mostrada como **referência**, não previsão. Why: não existe dado real dessas horas; inventar um número maior seria enganoso, e igualar à vizinha é conservador.
- Decision: estender é feito nas pontas de cada dia, uma hora por vez, pela maior margem de referência, como o corte do Cenário 2 só que ao contrário. Why: mantém a mesma lógica já conhecida e evita horário picotado.
- Decision: o custo do Cenário 4 é o custo adicional do Cenário 1; estender não acrescenta contratação. Why: o ponto da ideia é usar a capacidade já paga. O impacto líquido é esse custo menos a margem ganha.
- Decision: o Cenário 5 conta o excedente **em pessoas inteiras por cargo**, sobre o horário atual da loja, usando a mesma regra de cobertura do diagnóstico (horas e turnos) e mantendo ao menos o mínimo de pessoas da função obrigatória. Why: é a mesma conta que decide se "falta", aplicada ao contrário.
- Decision: **reduzir carga** de uma pessoa (em vez de retirar) fica fora desta entrega. Why: na regra de 42h/40h a jornada já limita as horas por pessoa e redução de jornada com redução de salário envolve questão trabalhista que não temos validada.
- Decision: a economia do Cenário 5 usa o salário médio da função × (1 + encargos) por pessoa, o mesmo da folha atual. Why: coerência com o custo da comparação de simulações.
- Decision: os cenários 4 e 5 não entram no selo "Menor impacto financeiro". Why: o selo compara caminhos que cobrem toda a necessidade de pessoas; o 5 só trata sobra e o 4 depende de uma referência de venda, então misturá-los distorceria a comparação.
- Decision: o Cenário 5 usa linguagem de **capacidade excedente**, nunca "demitir". Why: é uma decisão da gestão com implicações trabalhistas que o sistema não valida.
- Dependência: diagnóstico, cenários 1 a 3 (spec 005), custos, base comercial e horário por dia já existentes.
- Fora do escopo: levar o cenário para uma simulação editável, reaproveitar pessoas entre lojas, folguista como alternativa de contratação, estender no meio do dia, previsão de crescimento de vendas, hora extra, aprovação do cenário.
