# Feature Specification: Margem nos cenários e na Simulação (principalmente no Cenário 3)

**Feature Branch**: `feat/margem-nos-cenarios`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Voltar a usar a margem bruta por hora da base comercial nas contas, principalmente no Cenário 3 (Equilíbrio), e também no cálculo da Simulação. Hoje os cenários medem o que a loja perde e ganha ao mudar horários em venda (faturamento) e comparam com a folha. A margem já é importada e guardada hora a hora na base comercial, mas não entra em nenhuma conta desde a spec 027."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cenário 3 decide pela margem, não pela venda (Priority: P1)

Ao escolher quais horas fechar ou estender, o Cenário 3 passa a pesar cada hora pela **margem bruta** que ela rende, e não pela venda. Uma hora que vende muito mas rende pouca margem deixa de ser protegida; uma hora de pouca venda e muita margem passa a pesar mais.

**Why this priority**: É o motivo do pedido. Perder R$ 1.000 de venda com margem de 10% custa R$ 100 à loja, e não R$ 1.000. Comparar a folha com a venda superestima a perda de fechar uma hora e o ganho de abrir outra.

**Independent Test**: Numa loja com base que traz margem por hora, montar duas horas de sábado, uma com venda alta e margem baixa e outra com venda menor e margem alta, e conferir que o Cenário 3 prefere cortar a de margem menor, o que não aconteceria se decidisse pela venda.

**Acceptance Scenarios**:

1. **Given** uma loja com base comercial que traz margem por hora, **When** o Cenário 3 é calculado, **Then** a perda por fechar horas e o ganho por abrir ou estender horas são medidos em margem, e o impacto é "custo adicional + margem perdida − margem ganha".
2. **Given** duas horas de venda parecida e margens diferentes, **When** o Cenário 3 precisa cortar uma, **Then** corta a de menor margem.
3. **Given** horas novas sem venda registrada, **When** o ganho é estimado, **Then** vale a mesma fração (50%) da hora vizinha, só que da margem dela.
4. **Given** o cartão do Cenário 3 mostrado ao dono, **When** é lido, **Then** os rótulos dizem "margem" onde a conta usa margem, nunca "venda" ou "lucro".

---

### User Story 2 - Os três cenários e o sugerido na mesma régua (Priority: P1)

O Cenário 1 (Manter horários), o Cenário 2 (Sem contratações), o Cenário 3 (Equilíbrio) e a escolha do cenário sugerido usam a margem como régua. Assim o saldo de cada cartão e a comparação entre eles falam da mesma coisa.

**Why this priority**: O cenário sugerido compara o impacto dos três. Se só um usar margem e os outros venda, a comparação mistura números diferentes e sugere o cenário errado.

**Independent Test**: Numa loja com margem por hora, abrir os três cartões e conferir que saldo, venda/margem perdida e ganha estão na mesma base e que o cenário destacado é o de menor impacto nessa base.

**Acceptance Scenarios**:

1. **Given** uma loja com margem por hora, **When** os três cartões são vistos, **Then** perda, ganho e saldo da operação de cada um são em margem, e os rótulos dizem "margem".
2. **Given** os três cenários calculados, **When** o sugerido é escolhido, **Then** é o de menor impacto em margem, com as mesmas salvaguardas de hoje (cobrir a necessidade, ganho robusto para horas estendidas).
3. **Given** o Cenário 1, que não muda horários, **When** é visto, **Then** continua sem perda nem ganho de margem, e seu saldo é o custo da contratação.
4. **Given** o dono olhando a comparação, **When** a conta usa margem, **Then** a tela diz, em uma frase, que a margem é o que sobra da venda depois do custo do produto e que o saldo compara margem com folha.

---

### User Story 3 - Loja sem margem na base continua funcionando (Priority: P1)

Se a base comercial da loja não tem margem (coluna ausente ou zerada), os cenários continuam calculando como hoje, em venda, e dizem isso com clareza.

**Why this priority**: Nem toda base traz margem; ninguém pode ficar sem cenário nem receber um número de margem inventado.

**Independent Test**: Numa loja cuja base não tem margem, abrir os cenários e conferir que os números são os de hoje, com os rótulos em "venda", e um aviso explicando que, com a margem na base, a conta passa a usá-la.

**Acceptance Scenarios**:

1. **Given** uma base sem margem (ausente ou toda zerada), **When** os cenários são calculados, **Then** usam a venda, como hoje, e os rótulos dizem "venda".
2. **Given** uma base com margem em parte das horas, **When** os cenários são calculados, **Then** a conta usa a margem só se ela cobre as horas relevantes; do contrário volta à venda e avisa o motivo, sem misturar as duas.
3. **Given** a loja só com faturamento no Cadastro (sem base hora a hora), **When** os cenários são calculados, **Then** nada muda.

---

### User Story 4 - A Simulação também calcula em margem (Priority: P1)

O saldo da Simulação (venda estimada das horas novas, venda que deixa de entrar, saldo por mês e por ano) passa a usar a margem quando a base a traz. A lista de simulações e a comparação mostram o mesmo saldo, na mesma régua.

**Why this priority**: O dono pediu a margem também na Simulação. E o saldo da lista e da comparação precisa ser o mesmo da Simulação e o dos cartões de cenário; sem isso, a mesma loja mostraria saldos diferentes em telas diferentes.

**Independent Test**: Abrir uma simulação que reduz o fechamento de um dia numa loja com margem por hora, e conferir que "venda que deixa de entrar" vira "margem que deixa de entrar", que o saldo usa a margem, e que a lista e a comparação mostram o mesmo saldo.

**Acceptance Scenarios**:

1. **Given** uma loja com margem por hora e uma simulação que fecha ou abre horas, **When** o resultado é visto, **Then** a perda das horas fechadas e o ganho das horas novas são medidos em margem, e o saldo é "− folha extra − hora extra + margem estimada das horas novas − margem que deixa de entrar".
2. **Given** a mesma simulação, **When** a lista e a comparação são vistas, **Then** o saldo é o mesmo do painel, na mesma régua, e os rótulos dizem "margem".
3. **Given** uma loja sem margem utilizável na base, **When** a Simulação é vista, **Then** a conta e os rótulos seguem em venda, como hoje, com o aviso do motivo.
4. **Given** uma simulação já gravada antes desta entrega, **When** é aberta, **Then** o saldo é recalculado com a régua atual da loja e o painel diz qual régua usou, pois o saldo nunca foi guardado, só calculado na hora.
5. **Given** a venda em reais e o ticket médio que a Simulação já mostra, **When** a conta passa a usar margem, **Then** esses números seguem sendo mostrados como informação, sem entrar no saldo.

---

### User Story 5 - Quem vê o quê (Priority: P2)

Margem é dado comercial sensível, como o valor em reais. Só o dono do grupo vê margem em reais; os outros perfis seguem sem nenhum valor.

**Why this priority**: Regra do produto que não pode ser quebrada.

**Independent Test**: Abrir os cenários como dono e como gestor e conferir que o gestor não recebe nenhum campo de margem em reais.

**Acceptance Scenarios**:

1. **Given** um gestor ou consulta, **When** os cenários são vistos, **Then** nenhum valor de margem chega à tela (o campo nem existe na resposta).
2. **Given** o dono, **When** os cenários são vistos, **Then** vê a margem perdida, a margem ganha e o saldo em reais.

---

### Edge Cases

- Margem negativa em alguma hora (promoções, devoluções): a hora conta como está; o aviso do cartão diz quando o resultado depende de hora com margem negativa.
- Margem maior que a venda numa hora (dado de base errado): essa hora é tratada como dado suspeito, volta à venda para aquela conta e é avisada.
- Hora sem linha na base: vale zero, como hoje.
- Simulação gravada antes desta entrega: o saldo é recalculado na hora com a régua atual; como o saldo nunca foi guardado, nenhum dado antigo muda, só o que a tela mostra.
- Comparação de simulações onde a régua difere entre elas: não acontece, pois a régua é da loja.
- Cenário 3 que coincide com o Cenário 1 ou 2: continua sendo avisado, agora na régua da margem.
- Margem muda entre duas importações da base: os cenários usam sempre a base ativa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Os cenários MUST usar a margem bruta por hora da base comercial ativa quando ela estiver disponível, e a venda quando não estiver.
- **FR-002**: O Cenário 3 MUST medir perda e ganho de horários em margem, e escolher o estado de menor impacto em margem (custo adicional + margem perdida − margem ganha).
- **FR-003**: Os Cenários 1 e 2 e a escolha do cenário sugerido MUST usar a mesma régua do Cenário 3, para os números serem comparáveis.
- **FR-004**: O ganho das horas novas MUST seguir a regra atual (valor registrado, senão 50% da hora vizinha), aplicada à margem; a robustez do ganho estendido MUST valer na mesma régua.
- **FR-005**: O saldo da operação de cada cartão MUST ser "− custo adicional − margem perdida + margem ganha" quando a régua é margem, e continuar como hoje quando é venda.
- **FR-006**: Todo rótulo, dica e frase dos cartões e da comparação MUST dizer "margem" quando a régua é margem e "venda" quando é venda; nunca "lucro".
- **FR-007**: Base sem margem, com margem zerada ou com margem incoerente (maior que a venda) MUST voltar à venda, com aviso do motivo, sem misturar as duas réguas num mesmo cálculo.
- **FR-008**: Valores de margem em reais MUST chegar à tela só para o dono do grupo.
- **FR-009**: O faturamento mensal de referência (peso do impacto em % do faturamento) MUST continuar sendo o de venda.
- **FR-010**: Nenhum dado da base MUST ser alterado ou apagado; a margem já está guardada e só passa a ser lida.
- **FR-011**: A Simulação MUST usar a mesma régua e a mesma regra de escolha (margem ou venda) dos cenários, no cálculo da venda que deixa de entrar, da venda estimada das horas novas e do saldo; a lista e a comparação de simulações MUST mostrar o mesmo saldo do painel, na mesma régua.
- **FR-013**: A economia de folha, a hora extra, a folha extra e todos os números de custo MUST continuar iguais; só a medida de perda e ganho de horários muda.
- **FR-012**: A tela MUST dizer qual régua cada cenário usou (margem ou venda), em uma frase perto do saldo.

### Key Entities

- **Margem por dia e hora**: média da margem bruta de cada hora de cada dia da semana, calculada da base comercial ativa, como já é a venda média.
- **Régua do cenário**: o que o cenário usa para medir perda e ganho, "margem" ou "venda", escolhida pelo servidor conforme a base da loja.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Numa loja com margem por hora, o Cenário 3 escolhe a hora de menor margem para cortar em 100% dos casos de teste em que a margem contradiz a venda.
- **SC-002**: Os três cartões e o cenário sugerido estão sempre na mesma régua; não existe tela com um cartão em margem e outro em venda.
- **SC-003**: Numa loja sem margem na base, todos os números dos cenários são idênticos aos de hoje.
- **SC-004**: Nenhum valor de margem em reais aparece para quem não é dono do grupo.
- **SC-005**: A pessoa lê, em uma frase perto do saldo, se o cenário foi calculado em margem ou em venda.
- **SC-006**: Para a mesma loja, o saldo do painel da Simulação, o da lista e o da comparação são idênticos, e todos estão na mesma régua dos cartões de cenário.
- **SC-007**: Numa loja sem margem na base, todos os números da Simulação são idênticos aos de hoje.

## Assumptions

- Decision: a margem usada é a margem bruta em reais por hora que a base comercial já traz e guarda. Why: já está no banco; a spec 027 só a tirou das contas.
- Decision: a régua é escolhida pelo servidor, por loja, conforme a base; não é uma opção que a pessoa liga ou desliga. Why: evita cenários comparados em réguas diferentes.
- Decision: a mesma régua vale para os três cenários e para o sugerido. Why: o sugerido compara os três.
- Decision: o fator de 50% das horas novas continua; passa a valer sobre a margem da hora vizinha. Why: mudar o fator junto mudaria duas coisas ao mesmo tempo.
- Decision: a Simulação, a lista e a comparação passam à margem junto com os cenários, pelo pedido do dono. Why: o saldo precisa ser o mesmo em todas as telas. Como o saldo nunca é guardado (é recalculado a cada abertura), nenhum dado gravado é alterado; só muda o que a tela mostra, e o painel diz qual régua usou.
- Fora do escopo: unidades, tickets e ticket médio como parte da conta (conversa à parte), escolher a régua por tela, margem em %.
