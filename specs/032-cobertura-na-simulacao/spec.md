# Feature Specification: Cobertura e vendas por hora dentro da Simulação

**Feature Branch**: `feat/simulacao-cobertura-por-hora`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Trazer para dentro da Simulação a visão 'Cobertura e vendas' que já existe no Diagnóstico: a grade única, na mesma régua de horas, com os turnos, as vendas por hora e a cobertura de pessoas por função (Farmacêutico, Atendimento…) contra o mínimo, com a observação do pico de vendas e o aviso de vendas fora do horário. Na Simulação a grade reflete o horário simulado e o quadro simulado (pessoas, vagas e desligados)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a cobertura hora a hora da simulação (Priority: P1)

Quem está simulando vê, dentro da própria Simulação, a grade "Cobertura e vendas" calculada com o horário simulado e com o quadro simulado: em cada hora, quantas pessoas de cada função estão presentes contra o mínimo exigido, e quanto a loja vende naquela hora.

**Why this priority**: Hoje a Simulação mostra totais (horas abertas, folha, saldo) mas não mostra onde a equipe fica descoberta. O dono só vê isso no Diagnóstico, que reflete a escala atual e não a simulada. Sem a grade, não dá para saber se um horário reduzido, uma vaga ou um desligamento deixa a loja sem farmacêutico no pico.

**Independent Test**: Abrir uma simulação que reduz o fechamento de um dia, e conferir na grade que as horas retiradas aparecem como "fora do horário da loja", e que as horas restantes mostram pessoas contra o mínimo.

**Acceptance Scenarios**:

1. **Given** uma simulação aberta, **When** a pessoa chega à seção de cobertura, **Then** vê a mesma grade do Diagnóstico: cabeçalho de horas, linha de turnos, linha de vendas por hora e uma linha por função com o número de pessoas em cada hora.
2. **Given** a simulação muda o horário de um dia (reduz, estende ou fecha), **When** a grade é vista, **Then** as horas fora do novo horário ficam cinza ("fora do horário da loja: o mínimo não conta") e as horas novas passam a contar contra o mínimo.
3. **Given** uma hora em que uma função tem menos pessoas que o mínimo, **When** a grade é vista, **Then** a célula aparece em amarelo com "▲" e o número de pessoas; as que atendem o mínimo aparecem em verde.
4. **Given** a pessoa muda algo na simulação (horário, desligar alguém, adicionar vaga), **When** a mudança é salva, **Then** a grade se atualiza sem recarregar a tela, igual aos demais números do resultado.
5. **Given** a grade, **When** a legenda é lida, **Then** diz "Atende o mínimo", "Abaixo do mínimo (▲)" e "Fora do horário da loja: o mínimo não conta", e informa que mostra o pior dia da semana em cada hora, já descontando intervalos.

---

### User Story 2 - Observação do pico e aviso de vendas fora do horário (Priority: P2)

Acima da grade, uma frase destaca o pico de vendas e quantos atendentes há nele ("No pico de vendas, das 15h às 18h, há 5 atendentes…"). Abaixo, quando há vendas em horas fora do horário simulado, um aviso diz quais horas e leva a conferir o funcionamento.

**Why this priority**: Resume a grade em uma frase que o empresário entende sem ler a tabela, e mostra o custo de fechar uma hora que vende.

**Independent Test**: Numa loja com base de vendas, fechar às 20h uma loja que vende até 22h e ver o aviso "Há vendas às 20h, 21h e 22h, fora do horário simulado".

**Acceptance Scenarios**:

1. **Given** uma simulação com base de vendas por hora, **When** a grade é aberta, **Then** a frase do pico aparece com as horas de pico e o número de atendentes nelas.
2. **Given** vendas em horas que a simulação fecha, **When** a grade é vista, **Then** essas barras ficam tracejadas e o aviso lista as horas.
3. **Given** uma loja sem base de vendas, **When** a grade é vista, **Then** a linha de vendas some e aparece "Sem vendas por hora. Envie a base comercial para cruzar equipe e vendas.", sem quebrar a cobertura das funções.

---

### User Story 3 - Vagas e pessoas que saem aparecem no quadro (Priority: P2)

A grade conta quem está na simulação: pessoas ativas, e as vagas que tenham horário. Quem foi desligado na simulação não cobre nada. Vagas sem horário não cobrem nada e são avisadas.

**Why this priority**: É o ponto que torna a grade útil para decidir sobre contratar ou desligar.

**Independent Test**: Desligar a única pessoa de Atendimento de uma tarde e ver a cobertura de Atendimento cair a zero nessas horas; adicionar uma vaga sem horário e ver o aviso.

**Acceptance Scenarios**:

1. **Given** uma pessoa desligada na simulação, **When** a grade é vista, **Then** ela não conta em nenhuma hora.
2. **Given** uma vaga com turnos, **When** a grade é vista, **Then** ela conta nas horas dos seus turnos.
3. **Given** uma vaga sem turnos, **When** a grade é vista, **Then** não conta em nenhuma hora e um aviso diz "N vaga(s) ainda sem horário: não cobrem nada nesta grade".

---

### User Story 4 - Quem vê o quê (Priority: P2)

A grade respeita os perfis. Valores em reais aparecem só para o dono do grupo; os demais perfis veem a participação de cada hora no dia, como no Diagnóstico.

**Why this priority**: Regra que já existe em todo o produto e não pode ser quebrada.

**Independent Test**: Abrir a mesma simulação como dono e como gestor e conferir que o gestor não recebe nenhum valor em reais.

**Acceptance Scenarios**:

1. **Given** o dono do grupo, **When** a grade é vista, **Then** as barras mostram "R$ por hora, média por dia".
2. **Given** um gestor ou perfil de consulta, **When** a grade é vista, **Then** as barras mostram "participação no dia, por hora" e nenhum valor em reais chega à tela.

---

### Edge Cases

- Simulação sem nenhuma pessoa com função de escala: a grade mostra só os mínimos e todas as células ficam abaixo do mínimo, com a explicação em texto.
- Loja sem turnos cadastrados: os mínimos usam o horário da loja, como no Diagnóstico, e a linha "Turnos" não aparece.
- Simulação em rascunho que mexe no horário e ainda não foi salva: a grade acompanha o que está na tela, não o último salvo.
- Simulação gravada: a grade usa o quadro e o horário guardados na simulação; as vendas continuam as da base atual da loja.
- Dia fechado na simulação: não aparece na grade.
- Loja com horário que passa da meia-noite ou com 24 horas: o eixo de horas segue a mesma regra do Diagnóstico.
- Celular: a grade rola para o lado dentro do seu quadro, com a coluna de função fixa, sem fazer a página inteira rolar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A Simulação MUST ter uma seção "Cobertura e vendas" com a grade única do Diagnóstico (horas, turnos, vendas por hora e cobertura por função).
- **FR-002**: A grade MUST usar o horário simulado e o quadro simulado (pessoas ativas, vagas com turnos, sem desligados), e não o Cadastro atual.
- **FR-003**: Para cada hora e função, a grade MUST mostrar o número de pessoas presentes, descontando intervalos, e compará-lo ao mínimo exigido naquela hora.
- **FR-004**: A grade MUST mostrar, para cada hora, o pior dia da semana, igual ao Diagnóstico.
- **FR-005**: A grade MUST marcar como "fora do horário" as horas que o horário simulado não abre, e MUST mostrar as vendas dessas horas de forma tracejada.
- **FR-006**: A seção MUST mostrar a frase do pico de vendas e o aviso de vendas fora do horário, quando houver base de vendas.
- **FR-007**: Vagas sem turnos MUST NOT contar na cobertura e MUST gerar um aviso com o número de vagas sem horário.
- **FR-008**: Valores em reais MUST chegar à tela só para o dono do grupo; os demais perfis recebem a participação por hora.
- **FR-009**: A grade MUST se atualizar quando o horário, o quadro ou as vagas da simulação mudam, sem recarregar a página.
- **FR-010**: A seção MUST reaproveitar o mesmo desenho, as mesmas cores e os mesmos textos da grade do Diagnóstico, para as duas telas dizerem a mesma coisa.
- **FR-011**: A seção MUST funcionar sem base de vendas e sem turnos, mostrando só o que existe.
- **FR-012**: A seção MUST ser usável no celular, sem rolagem lateral da página inteira.
- **FR-013**: A seção NÃO MUST alterar nenhum número já calculado na Simulação (horas abertas, folha, hora extra, venda, saldo).

### Key Entities

- **Grade de cobertura da simulação**: para cada hora aberta na simulação, o pior dia da semana, o número de pessoas por função e o mínimo exigido; o conjunto de turnos que cobrem as horas; e a venda por hora.
- **Quadro simulado**: as pessoas do Cadastro que continuam ativas, as vagas e as que foram desligadas, com os turnos de cada uma.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em qualquer simulação, a pessoa responde "onde fico sem farmacêutico ou abaixo do mínimo?" olhando só a grade, sem abrir o Diagnóstico.
- **SC-002**: Para a mesma loja, o mesmo quadro e o mesmo horário, a grade da Simulação mostra exatamente os mesmos números que a do Diagnóstico.
- **SC-003**: Depois de mudar o horário, desligar alguém ou adicionar uma vaga, a grade acompanha a mudança em até 2 segundos, sem recarregar.
- **SC-004**: Nenhum valor em reais aparece para um perfil que não seja o dono do grupo.
- **SC-005**: Nenhum número do resultado da Simulação muda por causa desta seção.
- **SC-006**: A grade se usa no celular (375 px) sem rolagem lateral da página.

## Assumptions

- Decision: a seção entra dentro da própria tela da Simulação, abaixo do horário e das vendas e antes do resultado. Why: é onde a pessoa mexe nos horários e precisa ver o efeito.
- Decision: a grade mostra o pior dia da semana, como no Diagnóstico. Why: é o que já foi desenhado e aprovado, e é o que protege a loja no pior caso. Ver um dia específico fica para uma próxima etapa, pois o servidor já calcula a cobertura por dia.
- Decision: a seção reaproveita o mesmo componente da grade do Diagnóstico. Why: garante que as duas telas digam a mesma coisa.
- Assumption (de negócio): vaga conta na grade só se tiver turnos; vaga sem turnos aparece como aviso, e o sistema não inventa um horário para ela. Why: mostrar uma cobertura que o dono não definiu enganaria. Distribuir vagas automaticamente, ou deixar o dono definir o horário de cada vaga, fica fora desta entrega.
- Assumption: a Simulação já guarda os turnos de cada pessoa (copiados do Cadastro ao criar) e o servidor já calcula a cobertura hora a hora no pior dia, então esta entrega é principalmente de leitura e apresentação.
- Fora do escopo: comparar a cobertura de várias simulações lado a lado, editar turnos na grade, mexer em qualquer cálculo de custo ou saldo, e a visão por dia da semana.
