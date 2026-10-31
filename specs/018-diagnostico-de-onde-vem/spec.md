# Feature Specification: Diagnóstico — seção "De onde vêm esses números" em 3 abas

**Feature Branch**: `feat/diagnostico-de-onde-vem`
**Created**: 2026-10-31
**Status**: Draft
**Input**: Trocar os 8 blocos empilhados que ficam abaixo dos "Cenários sugeridos" no Diagnóstico por **um único cartão com 3 abas** (Cobertura e vendas, Resultado por regra, Equipe no cálculo). Texto completo e 3 quadros enviados pela pessoa.

## Regra de ouro

Só a seção "De onde vêm esses números" é implementada. **Nada do que já existe acima dela muda**: cabeçalho com as abas de regra (44h, 42h, 40h), card de diagnóstico (título, barras, indicadores, pendências) e "Cenários sugeridos". Se a nova seção precisar de um dado desses blocos, só lê.

## Situação de hoje

Abaixo dos cenários o Diagnóstico mostra blocos separados: Quadro por turno, Cobertura da escala atual, Horários de maior venda, Quadro por função, Verificação por regra, Escala atual por colaborador, Escala redistribuída e Déficit e contratações por função. Cada um repete parte da informação, e a pessoa precisa cruzar tudo de cabeça (por exemplo, "o pico de vendas tem gente suficiente?").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver se a equipe está nas horas em que a loja vende (Priority: P1)

Na aba **Cobertura e vendas** (a que abre primeiro), uma única grade por hora mostra os turnos da loja, as vendas médias por hora (com os picos em destaque) e quantas pessoas de cada função estão presentes, no pior dia da semana. Uma observação automática avisa quando há mais gente fora do pico do que no pico.

**Why this priority**: é o ganho central: cruzar equipe e vendas na mesma régua.

**Independent Test**: abrir o Diagnóstico de uma loja com turnos e vendas; ver a grade, os picos, as células abaixo do mínimo e a observação (quando faz sentido).

**Acceptance Scenarios**:
1. **Given** uma loja com vendas por hora, **Then** a grade mostra linha de turnos, linha de vendas (R$ por hora, média por dia) e uma linha de cobertura por função.
2. **Given** horas de maior venda (venda ≥ 75% do maior valor), **Then** as barras dessas horas ficam em azul escuro e as demais em azul claro.
3. **Given** a cobertura de uma hora abaixo do mínimo, **Then** a célula é amarela e traz o ícone "▲" (não só cor).
4. **Given** uma hora fora do horário da loja, **Then** a célula aparece listrada, sem número, e o mínimo não conta ali.
5. **Given** turnos que se sobrepõem ou passam do horário da loja, **Then** todos aparecem (sem esconder nenhum) e a parte fora do horário é recortada na grade.
6. **Given** que o maior número de atendentes aparece fora do pico e é maior que o do pico, **Then** a faixa "No pico de vendas, das 10h às 12h, há 5 atendentes. As 8 pessoas só aparecem entre 13h e 15h…" é mostrada; **caso contrário não aparece** (nunca texto vazio ou genérico).
7. **Given** vendas em horas fora do horário cadastrado, **Then** o rodapé mostra "Vendas fora do horário" com as horas, o horário cadastrado e o link "Conferir funcionamento"; sem vendas fora, nada aparece.
8. **Given** a loja sem vendas importadas, **Then** some a linha de vendas e a observação, e aparece "Sem vendas por hora. Envie a base comercial para cruzar equipe e vendas." com o link de envio; **sem turnos cadastrados**, some a linha de turnos e aparece "Sem turnos cadastrados. Os mínimos usam o horário da loja." com o link "Cadastrar turnos".

---

### User Story 2 - Comparar as três regras numa tabela só (Priority: P1)

Na aba **Resultado por regra**, uma tabela com a capacidade da equipe em cada regra (Hoje · 44h, 42h, 40h) para cada função que entra no cálculo, com o que a função precisa, o saldo ("sobram 43h", "faltam 32h") e uma barra com escala comum. A coluna da regra escolhida no topo da página fica destacada. Um bloco opcional mostra o efeito de a convenção coletiva permitir 8h24.

**Independent Test**: escolher 42h no topo e ver a coluna destacada; conferir "Atende" ou "Falta {função}" em cada cabeçalho e os saldos em texto.

**Acceptance Scenarios**:
1. **Given** as três regras, **Then** cada coluna mostra nome, vigência ("Em vigor", "A partir de 16/12/2026"), resumo da regra e a pill "Atende" ou "Falta {função}" (várias: "Faltam N funções"). Nunca "Passa".
2. **Given** o Farmacêutico (obrigatório), **Then** a linha mostra capacidade, "pessoas × horas · sobram/faltam Xh", turnos ("18 turnos · sobram 6") e "Precisa de 77h por semana e 12 turnos".
3. **Given** uma função com meta do dono, **Then** a linha mostra "Precisa de 352h por semana" e "atinge a meta" ou "faltam 32h".
4. **Given** as barras de uma função, **Then** todas usam a mesma escala; o traço marca o que a função precisa e a parte que falta fica tracejada.
5. **Given** a regra escolhida no topo, **Then** a coluna correspondente tem fundo destacado.
6. **Given** a convenção em "Não permite" e a estimativa com 8h24 reduzindo as horas que faltam, **Then** aparece "E se a convenção coletiva permitir 8h24 por dia?" com "faltariam 16h em vez de 32h" e o link "Alterar em Regras e custos"; **em qualquer outro caso o bloco não aparece**.
7. **Given** o texto da regra de 42h, **Then** muda com a convenção ("até 8h24 por dia · teto de 42h" quando permitida; "Sem 8h24, na prática 40h" quando não).

---

### User Story 3 - Ver quem entra na conta (Priority: P2)

Na aba **Equipe no cálculo (N)**, a equipe da loja, somente leitura, agrupada por função (com pessoas e horas por semana de cada grupo), com dias, turno, uma linha do tempo do turno, intervalo, carga e situação ("No cálculo" ou "Fora do cálculo"). Quem está sem função de escala aparece num grupo próprio, com atalho para definir a função. A edição continua no Cadastro de loja.

**Independent Test**: abrir a aba, ver os grupos e os totais, a barra do turno com a parte fora do horário listrada e o atalho para definir função de quem está fora.

**Acceptance Scenarios**:
1. **Given** a equipe, **Then** a tabela agrupa por função com "3 pessoas · 132h por semana" e, no fim, "Sem função de escala · 1 pessoa".
2. **Given** um turno que começa antes da abertura ou termina depois do fechamento, **Then** a barra mostra a parte dentro do horário em azul e a parte fora listrada, com legenda em texto.
3. **Given** quem está fora do cálculo, **Then** a linha mostra "—" em dias, turno, intervalo e carga e o apoio "Sem função de escala, não entra no cálculo".
4. **Given** pessoas fora do cálculo, **Then** a faixa superior mostra os totais ("11 no cálculo", "1 fora do cálculo") e os links "Definir função de quem está fora" e "Editar equipe no cadastro".
5. **Given** muitos funcionários, **Then** o rodapé mostra "Mostrando 8 de 12 funcionários" e "Ver todos".
6. **Given** nenhuma pessoa no cálculo, **Then** "Nenhum funcionário no cálculo. Cadastre a equipe da loja." com o botão "Cadastrar equipe".

---

### User Story 4 - Estrutura única, acessível e sem blocos repetidos (Priority: P1)

A seção é um cartão com 3 abas (abre em "Cobertura e vendas"; a aba fica no endereço), acessível por teclado, com carregamento, erro e vazio. A nota "Valores das regras ainda sem validação jurídica." aparece uma vez abaixo do cartão. "Escala redistribuída" e "Déficit e contratações" saem da página, e o que mostravam continua disponível em Personalizar/Simulação.

**Acceptance Scenarios**:
1. **Given** a página, **Then** os 8 blocos antigos desaparecem e dão lugar ao cartão único.
2. **Given** a aba ativa, **Then** ela fica em `?aba=cobertura|regras|equipe` (link direto) e funciona por setas e foco visível.
3. **Given** falha ao carregar, **Then** "Não foi possível carregar. Tentar de novo".
4. **Given** tela estreita (abaixo de ~1200 px), **Then** as grades das abas 1 e 3 rolam na horizontal dentro do cartão, com a primeira coluna fixa, e as abas seguem visíveis.
5. **Given** a convenção, os mínimos ou a equipe mudarem (por exemplo ao voltar do cadastro), **Then** a seção recalcula.

### Edge Cases

- Loja sem nenhuma venda importada ou sem turnos: ver vazios da História 1.
- Horário da loja que varia por dia (sábado até 20h): usa-se o **pior dia** por hora.
- Sem função com meta e sem pessoas: a aba 2 mostra só o Farmacêutico.
- Turnos diferentes por dia para a mesma pessoa: mostra o turno mais frequente, com "varia" nos dias e o detalhe numa dica.
- Dados de turno inconsistentes (início = fim): a linha daquele turno é ignorada com aviso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A seção "De onde vêm esses números" é um cartão com 3 abas ("Cobertura e vendas", "Resultado por regra", "Equipe no cálculo (N)") e subtítulo que muda por aba.
- **FR-002**: Nada acima da seção é alterado (cabeçalho de regras, card de diagnóstico, cenários sugeridos); a seção só lê dados deles.
- **FR-003**: Os cálculos de cobertura, capacidade, saldo, equipe e vendas por hora são os que já existem; só se monta a apresentação (nenhuma regra de negócio muda).
- **FR-004**: Aba 1: grade única com horas, linha de turnos (recortada ao horário da loja, todos visíveis), linha de vendas (média por dia, picos ≥ 75% do maior) e linhas de cobertura por função no pior dia; células abaixo do mínimo com ícone e rótulo; horas fora do horário da loja listradas e sem mínimo; legenda.
- **FR-005**: O mínimo de pessoas só vale dentro do horário de funcionamento da loja; turnos podem se sobrepor (vale o maior mínimo por cargo na hora) e passar do horário.
- **FR-006**: Observação automática do pico só quando a cobertura de Atendimento é maior fora do pico que no pico; senão não aparece.
- **FR-007**: "Vendas fora do horário" só quando existe venda fora do horário cadastrado; links levam ao cadastro certo.
- **FR-008**: Aba 2: tabela com as 3 regras, status "Atende" ou "Falta {função}", saldos em texto, barras com escala comum, coluna da regra escolhida destacada e texto da regra de 42h conforme a convenção.
- **FR-009**: O bloco de 8h24 só aparece quando a convenção é "Não permite" e a estimativa reduz as horas que faltam.
- **FR-010**: Aba 3: equipe somente leitura, agrupada por função com totais, linha do tempo com parte fora do horário listrada, "No cálculo"/"Fora do cálculo" e atalhos ao cadastro.
- **FR-011**: Abas acessíveis (tablist, setas, foco), aba na URL, carregamento/erro/vazio em cada uma, nota jurídica uma vez abaixo do cartão.
- **FR-012**: "Escala redistribuída" e "Déficit e contratações" saem desta página; antes de remover, confirmar que a informação existe em Personalizar/Simulação (se algum dado só existir nesses blocos, **não remover** e avisar).
- **FR-013**: Textos: "Atende", "Falta …", "No cálculo", "Fora do cálculo", "sobram 43h", "faltam 32h" (sem parênteses com sinal), "equipe" e "pessoas" (sem "quadro"), "Código 484", sinal "−".
- **FR-014**: Nenhuma diferença só por cor: ícones ou rótulos acompanham amarelo e listrado.
- **FR-015**: A seção recalcula quando mudam loja, convenção, mínimos ou equipe, sem refazer cálculo pesado ao trocar de aba.

### Key Entities

- **Grade de cobertura**: horas × (turnos, vendas, funções), com mínimo e presentes por hora.
- **Resultado por regra**: por função e regra, capacidade, necessidade e saldo.
- **Linha de equipe**: pessoa, função, dias, turno, intervalo, carga, situação, faixa dentro e fora do horário.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A pergunta "o pico de vendas tem gente suficiente?" se responde olhando uma única grade, sem rolar entre blocos.
- **SC-002**: A página passa de 8 blocos abaixo dos cenários para 1 cartão; nada acima dele muda.
- **SC-003**: Trocar de aba não refaz cálculos (a resposta é instantânea para a pessoa) e a aba escolhida sobrevive a recarregar a página.
- **SC-004**: As contas (pico, observação, cobertura por hora, mínimo na sobreposição, capacidade e saldo por regra, estimativa de 8h24, recorte de turno) batem com exemplos conferidos à mão.
- **SC-005**: Sem rolagem horizontal da página de 360 a 1920 px.

## Assumptions

- **Decision A (hora de pico)**: venda ≥ 75% do maior valor do período; numa função única (`isHoraPico`). Se o sistema já define pico de outra forma, vale a existente.
- **Decision B (observação do pico)**: aparece só se a maior cobertura de Atendimento (pior dia) ocorre fora do pico e é maior que no pico; função única (`buildObservacaoPico`).
- **Decision C (mínimo na sobreposição)**: vale o **maior** mínimo por cargo entre os turnos ativos na hora; reaproveita a regra já implementada no servidor.
- **Decision D (horário que varia por dia)**: eixo e listrado usam o pior dia por hora.
- **Decision E (turnos diferentes por dia na aba 3)**: mostra o mais frequente, com "varia" e dica.
- **Decision F (8h24)**: usa a função de capacidade existente com a convenção ligada; nenhuma fórmula nova.
- **Decision G**: a base comercial por hora, já corrigida para média por dia, alimenta a linha de vendas.
- Fora do escopo: cabeçalho, card de diagnóstico, cenários sugeridos e qualquer regra de negócio.
