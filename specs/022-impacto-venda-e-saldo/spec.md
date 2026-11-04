# Feature Specification: Impacto em venda e saldo contra a folha

**Feature Branch**: `feat/impacto-venda-e-saldo`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "Mudar a lógica do impacto financeiro: em vez de margem perdida, mostrar a venda que deixa de entrar (hora a hora) e o saldo contra a folha. O associado não pensa em margem; o custo de folha é pago com o faturamento."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a venda que deixa de entrar, hora a hora (Priority: P1)

Ao olhar um cenário que reduz horário, o dono vê quanto de venda deixa de entrar por mês, por dia alterado ("Sábado fechando às 16h: R$ X por mês") e no total. A conta usa a venda média de cada hora da loja, por dia da semana, somada nas horas que fecham, vezes 52 ÷ 12 semanas por mês. Hoje o sistema divide a venda do dia igualmente entre as horas, mesmo quando tem a venda real de cada hora.

**Why this priority**: É a base de todo o resto e corrige uma imprecisão: horas de fim de dia vendem menos que a média do dia.

**Independent Test**: Em Cosmópolis, no cenário com o sábado fechando mais cedo, a venda perdida por dia e total bate com a soma à mão das horas fechadas.

**Acceptance Scenarios**:

1. **Given** uma loja com venda hora a hora e um cenário que fecha horas, **When** o cartão aparece, **Then** mostra a venda perdida por mês por dia alterado e o total, calculadas só sobre as horas que fecham.
2. **Given** um cenário sem mudança de horário, **When** o cartão aparece, **Then** a venda perdida é zero.
3. **Given** uma loja sem venda hora a hora (só o faturamento por dia do Cadastro), **When** um cenário reduz horário, **Then** aparece o aviso "Sem venda hora a hora, não é possível estimar a venda perdida", no lugar de qualquer valor, e nunca R$ 0.

---

### User Story 2 - Saldo: economia de folha menos venda perdida (Priority: P1)

Cada cenário mostra a economia de folha (custo do cenário "manter horário" menos o custo do cenário avaliado), a venda perdida e o **saldo**: `economia de folha − venda perdida`. Exemplo que precisa bater: venda perdida R$ 10.000 e economia de folha R$ 8.000 dão saldo −R$ 2.000. Saldo positivo em verde ("este cenário compensa"), negativo em vermelho ("este cenário custa mais do que economiza").

**Why this priority**: É a resposta que o associado procura: o corte compensa ou não.

**Independent Test**: Com 10.000 de venda perdida e 8.000 de economia, o cartão mostra −R$ 2.000 em vermelho.

**Acceptance Scenarios**:

1. **Given** o cenário "manter horário", **When** o cartão aparece, **Then** a venda perdida é 0, o saldo é 0 e o custo adicional de folha aparece em relação à folha atual.
2. **Given** um cenário de economia, **When** o cartão aparece, **Then** mostra a venda que deixa de entrar, a economia de folha contra "manter horário" e o saldo, com cor e texto (nunca só cor).
3. **Given** o saldo negativo, **When** o cartão aparece, **Then** diz "Este cenário custa mais do que economiza"; positivo diz "Este cenário compensa".
4. **Given** valores em reais, **When** qualquer perfil que não seja dono abre a tela, **Then** nenhum valor aparece, como hoje.

---

### User Story 3 - Estender horário: custo adicional contra venda adicional (Priority: P2)

No Cenário 3 com horas estendidas, o saldo é `venda adicional estimada − custo adicional de folha`. A venda de uma hora nova é uma **estimativa**: 50% da venda média da hora vizinha (a última hora antes do fechamento ou a primeira depois da abertura), com o percentual editável e a marca "estimativa" na tela; vale a venda registrada naquela hora quando existir.

**Independent Test**: Em Porto Feliz, o Cenário 3 mostra o custo adicional, a venda adicional estimada, o saldo e o aviso de estimativa.

**Acceptance Scenarios**:

1. **Given** um cenário que estende o horário, **When** o cartão aparece, **Then** mostra custo adicional, venda adicional estimada, saldo e o selo "estimativa".
2. **Given** que a pessoa muda o percentual de 50%, **When** ele é salvo, **Then** a venda adicional e o saldo são recalculados.
3. **Given** que o ganho só se sustenta se a estimativa se confirmar por inteiro, **When** o selo "Cenário sugerido" é decidido, **Then** a regra atual da metade se mantém.

---

### User Story 4 - Mesma conta na Simulação e na apresentação (Priority: P2)

A Simulação (Personalizar) usa a mesma conta, recalculada a cada alteração. Em todos os lugares: valores mensais e anuais (anual = mensal × 12) e o **peso no faturamento** (impacto ÷ faturamento mensal médio da loja, em %). A margem bruta sai da visão principal e **nenhuma tela mostra "margem perdida"**; a margem pode ficar só como detalhe.

**Acceptance Scenarios**:

1. **Given** uma simulação com o horário alterado, **When** a pessoa muda um horário, **Then** venda perdida, economia, saldo e peso no faturamento se atualizam.
2. **Given** qualquer tela, **When** é percorrida, **Then** o termo "margem perdida" não aparece.

---

### User Story 5 - Margem deixa de ser exigida no Cadastro (Priority: P2)

A margem bruta média passa a ser opcional: o campo continua no Cadastro, mas deixa de ser pendência obrigatória e de impedir "Completo".

**Acceptance Scenarios**:

1. **Given** uma loja completa em tudo, menos a margem, **When** a situação é calculada, **Then** é "Completo".
2. **Given** o painel "O que falta preencher", **When** abre, **Then** não lista a margem.

---

### User Story 6 - Soma do grupo (Priority: P3)

Existe uma conta pura e testada para somar o impacto das lojas de um grupo, com o peso calculado sobre o faturamento total do grupo. Não há tela nesta entrega.

### Edge Cases

- Loja sem custos informados: a economia de folha e o saldo ficam em branco com a mensagem de sempre; a venda perdida continua aparecendo.
- Venda hora a hora com poucos dias: aviso de "poucos dias" continua.
- Cenário "não resolve sozinho": mostra a venda perdida e o que ainda falta, sem saldo "compensa".
- Faturamento mensal médio ausente: o peso no faturamento fica em branco, não zero.
- Hora fechada sem venda registrada: conta zero para aquela hora.
- Gerente e consulta: horas e dias sem valores em reais.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A venda perdida de um cenário MUST ser a soma da venda média hora a hora das horas fechadas, por dia da semana, × 52 ÷ 12, mostrada por dia alterado e no total.
- **FR-002**: Sem venda hora a hora, o sistema MUST mostrar o aviso "Sem venda hora a hora, não é possível estimar a venda perdida" e MUST NOT mostrar valor nem zero para a venda perdida.
- **FR-003**: A economia de folha MUST ser o custo do cenário "manter horário" menos o custo do cenário avaliado, com custo de folha = salários + encargos do regime + hora extra + provisões quando ligadas no cadastro.
- **FR-004**: O saldo MUST ser `economia de folha − venda perdida`; em cenários que estendem horário, `venda adicional − custo adicional`. Positivo em verde e negativo em vermelho, sempre com texto.
- **FR-005**: O cenário "manter horário" MUST mostrar venda perdida 0 e o custo adicional de folha em relação à folha atual.
- **FR-006**: A venda adicional de hora nova MUST ser estimada em 50% (padrão, editável) da venda média da hora vizinha, ou a venda registrada na hora quando existir, e MUST aparecer marcada como estimativa.
- **FR-007**: A Simulação (Personalizar) MUST usar a mesma conta, recalculada a cada alteração.
- **FR-008**: Os valores MUST aparecer em mensal e anual (mensal × 12) e com o peso no faturamento (impacto ÷ faturamento mensal médio).
- **FR-009**: Nenhuma tela MUST mostrar "margem perdida"; a margem bruta MUST sair da visão principal.
- **FR-010**: O selo de melhor cenário e o "Cenário sugerido" MUST seguir o saldo (maior saldo), mantida a regra de só sugerir cenário com horas novas se o saldo resistir à metade da venda estimada.
- **FR-011**: A margem bruta média MUST deixar de ser pendência obrigatória e de impedir "Completo".
- **FR-012**: A escolha dos cortes MUST usar a venda hora a hora (e não a divisão igual do dia) quando a loja tem esse dado.
- **FR-013**: MUST existir uma conta de soma das lojas de um grupo, com o peso sobre o faturamento total do grupo, coberta por testes; sem tela.
- **FR-014**: Valores em reais MUST seguir só para o dono.

### Key Entities

- **Impacto do cenário**: venda perdida (por dia e total), economia de folha, custo adicional, venda adicional estimada, saldo, valores mensal e anual e peso no faturamento.
- **Premissa da venda de hora nova**: percentual (padrão 50%), editável.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O exemplo de R$ 10.000 de venda perdida e R$ 8.000 de economia mostra saldo −R$ 2.000 em vermelho.
- **SC-002**: A venda perdida de um cenário confere com a soma à mão das horas fechadas na base da loja.
- **SC-003**: Em lojas sem venda hora a hora, nenhum cenário mostra valor de venda perdida; todos mostram o aviso.
- **SC-004**: Nenhuma tela mostra "margem perdida".
- **SC-005**: A soma do grupo bate com a soma à mão das lojas, com o peso sobre o faturamento do grupo.

## Assumptions

- Business (aprovado): o saldo compara venda com folha, como pedido; como a venda perdida costuma ser muito maior que a folha economizada, quase todo corte aparecerá em vermelho e só a extensão tende a ficar em verde.
- Business (aprovado): a margem bruta continua como campo opcional no Cadastro, como detalhe; deixa de ser exigida.
- Business (aprovado): sem venda hora a hora (só faturamento por dia do Cadastro), os cenários de corte mostram o que muda no horário e o aviso, sem valores em reais de venda.
- Business (aprovado): o percentual de 50% fica em um campo discreto na área dos cenários; vale enquanto a pessoa está na tela (como as outras premissas dos cenários) e volta ao padrão ao recarregar; não é gravado. Why: evita mudança de banco; gravar por loja fica como evolução.
- Business (aprovado): a soma do grupo fica pronta e testada, sem tela; a tela da visão do grupo aguarda o desenho.
- Decision: a base de comparação é sempre o cenário "manter horário"; a economia de folha do Cenário 1 é zero. Why: é o custo para ficar dentro da regra sem mexer no horário.
- Decision: 52 ÷ 12 (4,3333) semanas por mês. Why: é a constante que o sistema já usa.
- Decision: a hora extra entra no custo de folha onde já é calculada (Simulação); nos cenários 1 a 3 ela só aparece quando a alternativa de hora extra estiver em uso. Why: não criar regra nova de folha.
- Fora do escopo: tela de visão do grupo, calculadora geral, mudança nas regras de cobertura ou de contratação, e qualquer alteração de dados salvos.
- Esta spec depende da spec do painel de pendências (PR aberto), cuja regra de "Completo" ela altera.
