# Feature Specification: CMV no Cadastro e na base comercial, no lugar da margem

**Feature Branch**: `feat/cmv-no-cadastro`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "O campo de margem precisa voltar para o Cadastro, mas como CMV, e é preciso limpar tudo o que existe de margem, pois vamos subir esse novo valor. As lojas medem pelo CMV; o cálculo de perda e ganho de horários continua em lucro bruto (venda menos CMV), agora vindo do CMV."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Campo de CMV médio no Cadastro da loja (Priority: P1)

No Cadastro da loja, junto do faturamento, volta um campo, agora chamado **CMV médio (%)**: quanto da venda líquida volta ao fornecedor como custo da mercadoria. Ele serve de padrão para as horas em que a base comercial não traz o CMV.

**Why this priority**: É o pedido central e a rede de segurança do cálculo: sem CMV por hora, a loja ainda tem um número para estimar o lucro bruto.

**Independent Test**: Abrir o Cadastro de uma loja como dono, preencher "CMV médio (%)" com 65, salvar, reabrir e ver 65; tentar 120 ou −5 e ver a recusa.

**Acceptance Scenarios**:

1. **Given** o Cadastro de uma loja aberto pelo dono, **When** a aba de faturamento é vista, **Then** existe o campo "CMV médio (%)" com a explicação "Parte da venda líquida que volta ao fornecedor como custo da mercadoria", e nenhuma palavra "margem" no campo.
2. **Given** um valor entre 0 e 100, **When** é salvo, **Then** fica guardado na loja e volta igual ao reabrir; valores fora de 0 a 100 são recusados com mensagem em português.
3. **Given** a planilha de lojas e a de Cadastro, **When** o modelo é baixado, **Then** traz a coluna "CMV médio (%)" no lugar da antiga coluna de margem, e importar com ela preenche o campo.
4. **Given** um gestor ou perfil de consulta, **When** vê o Cadastro, **Then** não vê o campo nem o valor (dado comercial, só do dono).

---

### User Story 2 - A base comercial traz o CMV por hora (Priority: P1)

A planilha da base de vendas hora a hora passa a aceitar a coluna **CMV (R$)** no lugar de "Margem bruta (R$)". O lucro bruto de cada hora é a venda menos o CMV dela.

**Why this priority**: O CMV por hora é a melhor fonte: o mix de produtos muda ao longo do dia e a margem muda junto.

**Independent Test**: Enviar uma base com Data, Hora, Código da loja, Venda líquida e CMV (R$), e ver os cenários calculados em lucro bruto = venda − CMV por hora.

**Acceptance Scenarios**:

1. **Given** uma base com a coluna de CMV, **When** é enviada, **Then** a coluna é reconhecida (nomes como "CMV", "CMV (R$)", "Custo da mercadoria") e fica guardada por hora.
2. **Given** a base enviada, **When** os cenários e a Simulação são calculados, **Then** perda e ganho de horários usam o lucro bruto de cada hora (venda − CMV).
3. **Given** uma hora em que o CMV é maior que a venda, **When** a base é lida, **Then** a hora é tratada como dado suspeito e a loja volta a medir em venda, com o aviso do motivo (como já acontece com a margem incoerente).
4. **Given** uma base sem coluna de CMV, **When** é enviada, **Then** é aceita normalmente, e a loja usa o CMV médio do Cadastro, se houver.
5. **Given** uma planilha antiga que ainda traz a coluna "Margem bruta (R$)", **When** é enviada, **Then** a importação conclui sem erro e sem aviso de coluna desconhecida, e essa coluna é ignorada.

---

### User Story 3 - Limpar o que existe de margem (Priority: P1)

Todo valor de margem que existe hoje é apagado: a margem bruta média do Cadastro de cada loja e a margem de cada hora das bases comerciais. Vendas, clientes, unidades e as próprias bases continuam.

**Why this priority**: Os valores antigos não são CMV e misturariam duas coisas; o pedido é subir o dado novo do zero.

**Independent Test**: Depois da limpeza, nenhuma loja tem margem no Cadastro e nenhuma hora de base tem margem; as vendas por hora e os clientes estão iguais aos de antes.

**Acceptance Scenarios**:

1. **Given** lojas com margem no Cadastro, **When** a limpeza roda, **Then** o campo de margem de todas fica vazio; o faturamento por dia e o mensal ficam como estavam.
2. **Given** bases comerciais com margem por hora, **When** a limpeza roda, **Then** a margem de todas as horas fica zerada; venda, clientes, unidades, datas e horas ficam como estavam, inclusive nas bases antigas guardadas como histórico.
3. **Given** a limpeza concluída, **When** os cenários e a Simulação são abertos, **Then** a loja mede em venda (como antes de existir margem), com o aviso de que falta o CMV, até o CMV ser enviado.
4. **Given** a limpeza, **When** é rodada de novo, **Then** não muda mais nada (pode rodar quantas vezes forem).

---

### User Story 4 - O cálculo usa o CMV (Priority: P1)

O lucro bruto de cada hora é a venda menos o CMV. Quando a hora não tem CMV, vale a venda × (1 − CMV% médio da loja). Sem nenhum dos dois, a loja mede em venda.

**Why this priority**: É o que dá sentido ao dado novo; mantém a regra de três níveis (CMV da hora, CMV médio da loja, venda).

**Independent Test**: Numa loja com CMV médio de 65% e uma base sem CMV, a perda de uma hora de R$ 1.000 é R$ 350; com CMV de R$ 800 naquela hora, é R$ 200.

**Acceptance Scenarios**:

1. **Given** horas com CMV e horas sem, e o CMV médio da loja preenchido, **When** o cálculo roda, **Then** as horas com CMV usam o próprio; as sem CMV usam o médio; nenhuma hora cai em venda.
2. **Given** uma loja sem CMV nas horas e sem CMV médio, **When** o cálculo roda, **Then** mede em venda, como hoje, e diz que falta o CMV.
3. **Given** o trava de perda (3% no Cenário 2, 10% no Cenário 3), **When** o cálculo roda, **Then** a trava segue medindo a venda real, não o lucro bruto.
4. **Given** uma loja sem CMV em lugar nenhum, **When** os números são vistos, **Then** são idênticos aos de uma loja sem margem antes desta entrega.

---

### Edge Cases

- CMV médio de 0%: lucro bruto = venda inteira; é um valor válido, mas o aviso diz para conferir.
- CMV médio de 100%: lucro bruto zero; a perda de horários vira zero e os cenários dizem que fechar não custa nada, com aviso.
- Base com CMV só em parte das horas e CMV médio da loja vazio: usa o CMV das horas que têm e **venda** nas outras? Não: sem CMV médio, a mistura de réguas não é permitida; mede tudo em venda, com o aviso de que o CMV está incompleto.
- Duas bases na mesma loja: vale a base ativa, como já é.
- A limpeza não toca em simulações gravadas: o saldo delas é sempre recalculado na régua atual da loja.
- Importação em massa com a coluna de margem antiga e a de CMV na mesma planilha: vale o CMV.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Cadastro da loja MUST ter o campo "CMV médio (%)", de 0 a 100, visível e editável só pelo dono do grupo.
- **FR-002**: O modelo e a importação das planilhas de Cadastro e de lojas MUST usar a coluna "CMV médio (%)" no lugar da margem, aceitando a coluna antiga de margem sem erro e sem uso.
- **FR-003**: A base comercial MUST aceitar a coluna "CMV (R$)" por hora, reconhecendo os nomes usuais, e guardá-la por hora.
- **FR-004**: O lucro bruto de uma hora MUST ser a venda dela menos o CMV dela; com CMV maior que a venda, a hora é dado suspeito e a loja mede em venda, com aviso.
- **FR-005**: Hora sem CMV MUST usar o CMV médio da loja (venda × (1 − CMV%)); sem CMV médio e com CMV em parte das horas, a loja mede em venda, com aviso.
- **FR-006**: A régua da loja (margem ou venda) MUST seguir a mesma regra de escolha da entrega anterior, passando a ter o CMV como origem; os rótulos dos cenários e da Simulação seguem dizendo "margem" nesta entrega.
- **FR-007**: As travas de perda dos Cenários 2 e 3, o peso no faturamento, a venda por hora, os clientes e o ticket médio MUST continuar em venda real.
- **FR-008**: Uma limpeza única MUST zerar toda margem guardada (margem bruta média das lojas e margem por hora das bases, inclusive as inativas), sem tocar em venda, clientes, unidades, datas, horas, bases ou qualquer outro dado, e MUST poder rodar mais de uma vez sem efeito extra.
- **FR-009**: Valores de CMV em reais MUST chegar à tela e às respostas só para o dono do grupo.
- **FR-010**: Nenhuma simulação gravada, escala, equipe ou custo MUST ser alterado pela limpeza.

### Key Entities

- **CMV médio da loja**: percentual (0 a 100) da venda líquida que volta ao fornecedor, guardado no faturamento da loja.
- **CMV por hora**: custo da mercadoria, em reais, de cada hora de cada dia da base comercial (substitui a margem por hora).
- **Lucro bruto da hora**: venda − CMV da hora, ou venda × (1 − CMV médio) quando a hora não tem CMV.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Depois da limpeza, zero lojas com margem no Cadastro e zero horas de base com margem, e as vendas por hora e os clientes são idênticos aos de antes.
- **SC-002**: Numa loja com CMV médio de 65%, a perda de uma hora de R$ 1.000 é R$ 350 nos cenários e na Simulação, e o saldo do painel, o da lista e o da comparação são iguais.
- **SC-003**: Uma base enviada com a coluna de CMV passa a valer nos cálculos sem nenhuma outra ação.
- **SC-004**: Nenhum valor de CMV chega a quem não é dono do grupo.
- **SC-005**: Numa loja sem CMV (nem por hora nem médio), todos os números são os de uma loja sem margem.
- **SC-006**: Planilhas antigas com a coluna de margem continuam sendo importadas sem erro.

## Assumptions

- Decision: o CMV da base é em reais por hora; o do Cadastro é um percentual médio da loja. Why: é como o dado existe para as lojas (CMV por hora) e como o texto de apoio descreve o padrão (CMV% médio mensal).
- Decision: a coluna da base que guarda a margem por hora passa a guardar o CMV, e o lucro bruto é derivado na hora do cálculo. Why: o CMV é o dado de origem; a margem é consequência.
- Decision: a limpeza apaga só a margem (Cadastro e bases) e mantém todo o resto, incluindo as próprias bases. Why: venda e clientes continuam valendo, e é o menor apagamento que atende o pedido.
- Decision: o nome da coluna da base e o do campo do Cadastro seguem o rótulo "CMV". Why: o associado não pensa em "margem".
- Assumption (de negócio): o dono pode editar o CMV médio no Cadastro; a origem do valor (preenchido pela Farmarcas, com marca de "validar") fica para uma etapa seguinte. Why: o campo precisa existir agora para a conta funcionar; a marca de validar não muda a conta.
- Fora do escopo: trocar a palavra "margem" por "lucro bruto" nos cenários e na Simulação, o bloco "venda, CMV, o que sobra, folha" e o modal "como calculamos", o alerta de 3% como aviso em vez de trava, o saldo contra o Cenário 1, a hora extra no Cenário 1.
