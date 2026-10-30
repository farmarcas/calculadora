# Feature Specification: Cenário 2 com travas — reduzir o fim de semana antes de fechar dias

**Feature Branch**: `feat/cenarios-travas-fim-de-semana`
**Created**: 2026-10-29
**Status**: Draft
**Input**: User description: "O Cenário 2 (Foco em economia) sugeriu fechar a loja praticamente: 5 dos 7 dias, 28 h abertas por semana e 71% do faturamento perdido, com margem perdida R$ 0. A regra tem de priorizar reduzir os horários de fim de semana, depois fechar o domingo se estiver aberto, depois o sábado, e ter travas que preservem a loja de fechamentos assim. Pode seguir com: teto de perda de 10% do faturamento, piso de 85% das horas semanais, 4 horas mínimas por dia, e cortar do fechamento."

## Situação de hoje

- O Cenário 2 só tem uma alavanca: **fechar dias**, escolhendo os de menor margem, até a equipe atual caber. Não há limite de quantos dias fecha.
- Resultado visto numa loja real: fechou segunda, terça, sexta, sábado e domingo (de 94 h para 28 h por semana), deixando de faturar **R$ 360 mil por mês (71%)**, e o cartão mostrou ainda margem perdida **R$ 0** e saldo verde.
- A margem aparece como R$ 0 quando a margem bruta da loja **não foi informada**; deveria aparecer como "não informada".
- Quando todos os dias empatam (sem margem), ele fecha pela ordem da semana, inclusive dias úteis.
- O Cenário 3 (Equilíbrio) também testa fechar qualquer combinação de dias, inclusive dias úteis.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cenário 2 reduz e fecha só o fim de semana, em ordem (Priority: P1)

Para fazer a equipe atual caber, o cenário segue **sempre esta ordem**, parando no primeiro passo que resolve:

1. **Reduzir o horário de sábado e domingo**, cortando do fechamento, em passos de 1 hora, até no mínimo **4 horas abertas** no dia.
2. Se ainda não couber, **fechar o domingo** (se estiver aberto).
3. Se ainda não couber, **fechar o sábado**.

Dias úteis (segunda a sexta) **nunca** são reduzidos nem fechados por este cenário.

**Why this priority**: é o pedido principal; sem isso o cenário continua sugerindo fechar a loja.

**Independent Test**: loja com equipe pequena e horário todos os dias: o cenário só mexe em sábado e domingo, na ordem acima; segunda a sexta ficam intactas.

**Acceptance Scenarios**:

1. **Given** uma equipe que cabe depois de cortar 2 h do fim de semana, **When** abro o Cenário 2, **Then** vejo só a redução de sábado e domingo (ex.: "Sáb e dom fecham 2 h mais cedo") e nenhum dia fechado.
2. **Given** que a redução até 4 h por dia não basta, **Then** o domingo fecha; se ainda não bastar, o sábado também.
3. **Given** que o domingo já está fechado hoje, **Then** esse passo é pulado e o cenário segue para o sábado.
4. **Given** qualquer situação, **Then** segunda a sexta continuam com o horário de hoje.
5. **Given** que o sábado está entre os 3 dias de maior faturamento, **Then** ele só pode ser reduzido, nunca fechado (os dias protegidos valem também no fim de semana).
6. **Given** que a equipe atual já cobre o horário, **Then** o cenário diz que não há nada a reduzir ou fechar.
7. **Given** uma equipe que nem com tudo isso cabe, **Then** vale a Story 2.

---

### User Story 2 - Travas: o cenário para antes de destruir a loja (Priority: P1)

O cenário para e diz **"não resolve sozinho"** quando o próximo passo violaria uma trava:

- **Teto de perda:** não pode deixar de faturar mais de **10%** do faturamento mensal da loja.
- **Piso de horas:** a loja mantém ao menos **85%** das horas abertas por semana que tem hoje.
- **Piso por dia:** dia reduzido não fica com menos de **4 horas abertas** (abaixo disso, o passo seguinte é fechar o dia).

Quando uma trava para o cenário, o cartão mostra **o corte possível dentro dos limites**, o que ainda falta (ex.: "faltam 18 h de cobertura"), qual trava parou e o caminho sugerido ("veja o Cenário 3 · Equilíbrio"). Esse cenário **não** entra como "Cenário sugerido".

**Why this priority**: sem as travas, qualquer lógica nova pode repetir o fechamento absurdo.

**Independent Test**: a loja do caso real (94 h, equipe pequena) não passa de 10% de perda nem de 15% de corte de horas, não toca em dia útil e mostra "não resolve sozinho".

**Acceptance Scenarios**:

1. **Given** que o corte necessário excede 10% do faturamento, **Then** o cenário para no limite, mostra o corte possível e o selo "Não resolve sozinho".
2. **Given** que o corte necessário passaria de 15% das horas semanais, **Then** o mesmo.
3. **Given** que o cenário parou numa trava, **Then** o texto diz qual trava e quanto faltou para a equipe caber.
4. **Given** o caso da loja de 94 h, **Then** nenhum dia útil é tocado, a perda fica em até 10% e o cenário não resolve sozinho.
5. **Given** um cenário que parou numa trava, **Then** ele não recebe o selo "Cenário sugerido" nem "Viável".

---

### User Story 3 - Margem em branco deixa de aparecer como zero (Priority: P1)

Quando a margem bruta da loja não foi informada, **margem perdida** e **saldo mensal** aparecem como "—" com o aviso "informe a margem bruta média no Cadastro", nunca como R$ 0 em verde. O teto de perda usa o **faturamento** (não a margem), então o cenário continua funcionando sem a margem; só o saldo em reais fica sem valor.

**Why this priority**: o R$ 0 enganoso foi parte do que tornou o resultado "surreal".

**Independent Test**: loja só com faturamento mensal (sem margem): o Cenário 2 mostra faturamento perdido em reais e %, e margem e saldo como "—" com o aviso.

**Acceptance Scenarios**:

1. **Given** margem não informada, **When** o cenário corta algo, **Then** "Margem perdida" e "Saldo mensal estimado" mostram "—" e o aviso pede a margem.
2. **Given** margem informada, **Then** os valores aparecem como hoje.
3. **Given** margem não informada, **Then** o cenário não ganha selo "Cenário sugerido" por saldo (não há como comparar), mas continua mostrando status e o corte.

---

### User Story 4 - O cartão explica o que fez, em ordem (Priority: P2)

O texto do cartão conta os passos aplicados, em linguagem simples: "Sáb e dom fecham 2 h mais cedo; domingo fecha; faltam 6 h de cobertura, o limite de 10% do faturamento foi atingido. Veja o Cenário 3." A linha "Mudança de horário" do cartão passa a mostrar também reduções, ex.: "Sáb 08h–18h (antes 08h–22h) · Dom fechado".

**Why this priority**: sem a explicação, a lógica nova vira outra caixa-preta.

**Independent Test**: cada ordem de passos produz a frase certa (só redução; redução e domingo; redução, domingo e sábado; parou numa trava).

**Acceptance Scenarios**:

1. **Given** só redução de horário, **Then** a frase e a linha "Mudança de horário" mostram o novo horário de sábado e domingo.
2. **Given** domingo fechado depois da redução, **Then** a frase cita os dois passos na ordem.
3. **Given** que parou numa trava, **Then** a frase diz qual e o que falta.

---

### User Story 5 - O Cenário 3 respeita as mesmas travas (Priority: P2)

O Cenário 3 (Equilíbrio), que combina contratar e fechar, passa a só considerar **fechamentos de sábado e domingo** (e a redução do fim de semana), com as mesmas travas. Nunca fecha dia útil. Entre as opções permitidas, continua escolhendo a de menor impacto financeiro.

**Why this priority**: sem isso o Cenário 3 repete o problema por outro caminho. Pode ser entregue depois do Cenário 2.

**Independent Test**: loja com muitos dias possíveis de fechar: o Cenário 3 nunca fecha dia útil nem passa do teto de perda; contrata o que faltar.

**Acceptance Scenarios**:

1. **Given** qualquer loja, **Then** o Cenário 3 nunca fecha segunda a sexta.
2. **Given** que o teto de 10% seria ultrapassado, **Then** a combinação não é considerada; o cenário contrata o que falta.
3. **Given** que a melhor opção é só contratar, **Then** o cenário diz que coincide com o Cenário 1, como hoje.

---

### Edge Cases

- Loja só com faturamento mensal (venda estimada, dividida igualmente entre as horas abertas): a perda de uma redução de horário é proporcional às horas cortadas; o aviso de estimativa continua.
- Loja que já abre menos de 4 horas no sábado ou domingo: não há redução possível nesse dia; o passo seguinte é fechar (se permitido).
- Loja fechada no fim de semana: sem fim de semana para mexer; se a equipe não cabe, o cenário diz "não resolve sozinho".
- Loja 24 horas: a redução corta as horas finais do dia do mesmo jeito, até o piso de 4 h.
- Sábado e domingo protegidos (maior faturamento): só redução, nunca fechamento.
- Sem venda nenhuma informada: o cenário continua pedindo a venda (como hoje).
- Gestor e consulta: veem cortes, status e texto, sem nenhum valor em reais.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Cenário 2 MUST seguir a ordem: reduzir o horário de sábado e domingo; fechar o domingo; fechar o sábado; parando no primeiro passo em que a equipe atual cobre o horário.
- **FR-002**: O Cenário 2 MUST NOT reduzir nem fechar segunda a sexta.
- **FR-003**: A redução MUST cortar do fechamento, em passos de 1 hora, até no mínimo 4 horas abertas no dia; abaixo disso, o dia só pode ser fechado.
- **FR-004**: Um dia entre os de maior faturamento (proteção atual de 3 dias) MUST ser só reduzido, nunca fechado.
- **FR-005**: O cenário MUST parar antes de passar de **10% de perda de faturamento mensal** ou de baixar das **85% das horas semanais** de hoje.
- **FR-006**: Ao parar numa trava, o cartão MUST mostrar o corte possível, o que falta para a equipe caber, qual trava parou e a indicação do Cenário 3; o status MUST ser "Não resolve sozinho" e o cenário MUST NOT ser marcado como sugerido nem viável.
- **FR-007**: Sem margem informada, "margem perdida" e "saldo mensal" MUST aparecer como "—" com aviso pedindo a margem; nenhum R$ 0 pode ocupar o lugar de um dado que falta.
- **FR-008**: A perda de faturamento de uma redução de horário MUST ser estimada pela proporção das horas cortadas sobre as horas do dia, com o aviso de estimativa quando a venda não vem hora a hora.
- **FR-009**: O texto do cartão MUST descrever os passos aplicados, na ordem, e a linha "Mudança de horário" MUST mostrar o novo horário de cada dia reduzido ou fechado.
- **FR-010**: O Cenário 3 MUST considerar só fechamento ou redução de sábado e domingo, com as mesmas travas, e escolher entre as opções permitidas a de menor impacto.
- **FR-011**: A regra MUST valer igual para a fase de 42 h e a de 40 h, e para todos os perfis; valores em reais seguem só para o dono.
- **FR-012**: Os cenários 1, 4 e 5 e a tabela de contratações MUST NOT mudar de resultado.
- **FR-013**: As travas (10%, 85%, 4 h) MUST ser constantes únicas e nomeadas, para ajuste futuro sem mexer na lógica.

### Key Entities

- **Passo de ajuste**: uma ação do cenário (reduzir fim de semana em N horas, fechar domingo, fechar sábado), com a perda que causa.
- **Trava**: limite que impede o próximo passo (teto de perda, piso de horas semanais, piso diário).
- **Cenário de economia**: resultado com passos aplicados, status (viável, não recomendado, inviável, não resolve sozinho), o que falta e o texto explicativo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em nenhuma loja o Cenário 2 deixa de faturar mais de **10%** do faturamento mensal nem fica com menos de **85%** das horas semanais.
- **SC-002**: Em **100%** dos casos testados, segunda a sexta ficam com o horário de hoje no Cenário 2 e no Cenário 3.
- **SC-003**: A loja do caso real (94 h, 71% de perda) passa a mostrar corte de no máximo 15% das horas, perda de até 10% e o status "Não resolve sozinho".
- **SC-004**: Com a margem em branco, **0** cartões mostram "R$ 0" em margem perdida ou saldo.
- **SC-005**: Uma pessoa lê o cartão e entende, em uma frase, quais passos foram dados e por que parou.

## Assumptions

- Decision: os limites (10%, 85%, 4 h) são fixos nesta entrega e nomeados em um só lugar. Why: as premissas editáveis foram retiradas da tela para não confundir; ajustar depois é trocar o valor.
- Decision: sábado e domingo são reduzidos juntos, em passos de 1 hora, começando pelo dia de menor venda por hora; o primeiro a ser fechado é o domingo, depois o sábado. Why: segue a ordem pedida e a venda por hora é uma estimativa uniforme.
- Decision: cortar do fechamento. Why: as últimas horas costumam vender menos; é uma suposição avisada no cartão, já que não há venda hora a hora.
- Decision: o teto de perda usa o faturamento (não a margem). Why: funciona mesmo sem a margem informada.
- Decision: "Não resolve sozinho" é um novo status do cenário (selo amarelo), ao lado de viável, não recomendado e inviável.
- Decision: a proteção dos 3 dias de maior faturamento continua como é e agora vale também para a redução.
- Fora do escopo: venda hora a hora, cortar a abertura, tornar os limites editáveis, mudar os cenários 1, 4 e 5, dias úteis em qualquer cenário.
- Depende da spec 009 (cenários por dia) e da 010 (comparativo); os cartões e o comparativo recebem o novo status e a nova linha de horário.
