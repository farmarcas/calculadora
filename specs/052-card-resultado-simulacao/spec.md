# Feature Specification: Card "Resultado da simulação" com o peso da folha (versão B1)

**Feature Branch**: `feat/coluna-folha-no-faturamento` (os ajustes se acumulam nesta branch até a pessoa mandar abrir o PR)

**Created**: 2026-11-11

**Status**: Draft

**Input**: Na tela de Simulação, o card "Resultado da simulação" (coluna da direita) passa a mostrar o peso da folha no faturamento, com o mesmo cálculo da coluna Folha dos Cenários (specs 048 e 050), no layout do board "Simulação · card de resultado · versão B1 (escolhida)". O "+21,3% sobre a folha" atual sai. A tabela Hoje | Simulação | Mudança e a linha "Horas abertas" saem; entra a lista "O que muda".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O dono vê o peso da folha e o que mudou (Priority: P1)

Para o dono, o card mostra, de cima para baixo: cabeçalho e tag do tipo de simulação; status em pill; dois blocos lado a lado (proporção 1 : 1,6): **Venda** (ícone, %, "sem mudança" ou "venda estimada") e **Folha no faturamento** (peso depois em 22 px negrito, chip da variação ao lado, "hoje 8,0%" e, por último, os reais por mês); faixa amarela com a causa, quando existir; linha "Horário · 100h por semana" com a variação (±Xh) e os sete dias com as horas abertas; lista **O QUE MUDA**; linha **Contratar**; botão "Salvar como cenário N" e a frase de apoio.

**Why this priority**: É o número que o dono usa para decidir se a simulação vale o custo.

**Independent Test**: Em Cosmópolis, Manter horários com 1 contratação: bloco com "9,7%", chip "+1,7%", "hoje 8,0%" e "R$ 7.659 a mais por mês".

**Acceptance Scenarios**:

1. **Given** uma simulação que aumenta a folha, **When** o dono vê o card, **Then** o bloco mostra o peso depois, o chip âmbar "+1,7%", "hoje 8,0%" e "R$ 7.659 a mais por mês".
2. **Given** uma simulação que diminui a folha, **When** o dono vê o card, **Then** o chip é verde "−0,6%" (sinal U+2212) e o texto é "R$ 2.340 a menos por mês".
3. **Given** uma simulação sem custo adicional (por exemplo, sem contratação), **When** o dono vê o card, **Then** o chip é neutro com borda, "folha igual", e no lugar dos reais aparece "Sobe só porque a venda cai."; nunca "+0,2 p.p. (R$ 0/mês)".
4. **Given** qualquer chip, **When** ele é lido, **Then** o valor é a diferença entre o peso depois e o peso hoje, já arredondados a uma casa (9,7 − 8,0 = 1,7), em "%", sem "p.p." nem "pontos".
5. **Given** o card aberto, **When** o dono procura, **Then** a tabela Hoje | Simulação | Mudança, a linha "Horas abertas" e o "+X% sobre a folha" não existem mais; as horas abertas aparecem só na linha de Horário.

---

### User Story 2 - A lista "O que muda" (Priority: P1)

Cada item tem duas linhas: nome e variação em cima (negrito) e "antes → depois" embaixo, em texto pequeno.

- **Folha por mês** (só dono): "R$ 36.020 → R$ 43.679"; variação "+R$ 7.659" em âmbar, "−R$ 2.340" em verde, "igual" em cinza.
- **Pessoas**: "8 → 9", "+1".
- **Horas contratadas**: "352h → 394h", "+42h".
- **Hora extra**: só aparece como item se for maior que zero ("0h → 6h", "+6h"); se for zero, uma linha cinza "Sem hora extra.".
- Variação positiva de pessoas e de horas em verde; negativa em cor neutra; "igual" em cinza.

Abaixo da lista, **Contratar** mostra a descrição ("1 farmacêutico") ou "Nenhuma contratação".

**Independent Test**: Cosmópolis, Manter horários: Folha por mês, Pessoas (8 → 9, +1), Horas contratadas (352h → 394h, +42h) e "Sem hora extra.".

**Acceptance Scenarios**:

1. **Given** a simulação sem hora extra, **When** a lista é vista, **Then** aparece "Sem hora extra." em cinza e não há item de hora extra.
2. **Given** hora extra maior que zero, **When** a lista é vista, **Then** a hora extra vira item ("0h → 6h", "+6h") e a linha "Sem hora extra." some.
3. **Given** uma simulação que reduz a equipe, **When** a lista é vista, **Then** Pessoas mostra "−1" em cor neutra, Horas mostra a queda em cor neutra e a folha mostra "−R$ 2.340" em verde.
4. **Given** nada muda, **When** a lista é vista, **Then** os itens mostram "igual" em cinza.

---

### User Story 3 - Gestor e consulta veem só o sentido do custo (Priority: P1)

Para gestor e consulta, o bloco se chama **Custo de pessoal** e mostra só um chip: "Aumenta" (âmbar), "Igual" (neutro com borda) ou "Diminui" (verde). A lista **não tem** a linha Folha por mês e mantém Pessoas e Horas contratadas. A resposta da API desses perfis não tem campos de custo, folha ou faturamento; a classificação vem pronta do servidor.

**Acceptance Scenarios**:

1. **Given** o perfil gestor ou consulta, **When** o card é visto, **Then** o bloco é "Custo de pessoal" com um chip e sem número de custo.
2. **Given** a resposta da API desses perfis, **When** é lida, **Then** não há reais, percentuais de folha, folha nem faturamento.

---

### User Story 4 - Dados que faltam (Priority: P2)

- Sem salários, o bloco da folha diz "Informe os salários para ver o custo de pessoal." e a lista fica só com Pessoas e Horas contratadas.
- Sem faturamento, diz "Informe o faturamento para ver o peso da folha.".
- O resto do card continua funcionando; nenhum número é inventado.

---

### User Story 5 - Bloco "Horário a mais" (Priority: P2)

Só para o dono, e só quando a simulação abre horas a mais: depois de **Contratar**, um quadro cinza com o título "Horário a mais: sábado até 23h" (o dia e o horário simulados) e o selo "Recomendado" (verde) ou "Não recomendado" (vermelho). Linhas: Venda adicional, **Custo da mercadoria** (com o % entre parênteses), Lucro bruto, Aumento de folha e Resultado (negrito, e vermelho se negativo). O link "Como calculamos" abre o modal com a conta passo a passo (Esc fecha). Gestor e consulta não recebem esse bloco. A tela usa "Custo da mercadoria", nunca a sigla CMV.

**Independent Test**: sábado até 23h: venda R$ 2.214, custo da mercadoria 56,4% = R$ 1.249, lucro bruto R$ 965, folha R$ 4.924, resultado −R$ 3.958 em vermelho, selo "Não recomendado". Com resultado positivo, o selo é "Recomendado".

---

### Edge Cases

- **Coluna estreita (300 px):** nenhum texto quebra de modo que esconda informação.
- **Simulação gravada (não editável):** o card segue igual, com "Clonar para ajustar" no lugar do botão.
- **Calculando:** o card mantém o aviso de cálculo em andamento, como hoje.
- **Peso hoje igual ao peso depois, com custo diferente de zero:** o estado vem do custo em R$, como na coluna Folha dos Cenários (um custo pequeno que arredonda para 0,0 ainda é "aumenta").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O card mostra o peso da folha no faturamento (depois, hoje, chip e reais por mês) para o dono, calculado **pela mesma regra** da coluna Folha dos Cenários (specs 048 e 050); não existe uma segunda conta.
- **FR-002**: O chip segue as três regras (aumenta âmbar, diminui verde, igual neutro com borda), o valor é a diferença dos pesos já arredondados e a interface nunca escreve "p.p." nem "pontos".
- **FR-003**: Formato pt-BR: vírgula decimal, ponto nos milhares, sinal "−" (U+2212), "R$ 7.659 a mais por mês" / "R$ 2.340 a menos por mês".
- **FR-004**: A lista "O que muda" segue a User Story 2, com as cores definidas (âmbar para folha que sobe, verde para folha que cai e para pessoas e horas que sobem, neutra para quedas de pessoas e horas, cinza para "igual").
- **FR-005**: Gestor e consulta veem "Custo de pessoal" com um chip Aumenta, Igual ou Diminui; a lista não tem Folha por mês; o servidor não envia a eles campo de custo, folha ou faturamento.
- **FR-006**: Mensagens de dados que faltam conforme a User Story 4, sem números inventados.
- **FR-007**: O bloco "Horário a mais" segue a User Story 5 (só dono, só com horas a mais, selo Recomendado/Não recomendado, link "Como calculamos", "Custo da mercadoria").
- **FR-008**: A tabela Hoje | Simulação | Mudança, a linha "Horas abertas" e o "+X% sobre a folha" saem do card.
- **FR-009**: Nada depende só da cor: o chip sempre traz sinal ou texto, e tem rótulo completo para leitor de tela (por exemplo, "Folha sobe 1,7 ponto percentual, de 8,0% para 9,7% do faturamento"). Contraste mínimo AA em texto pequeno sobre o âmbar e o verde.
- **FR-010**: Cores e chips usam os mesmos tokens da coluna Folha dos Cenários e os do design system.

### Key Entities

- **Resultado da simulação**: venda, peso da folha (hoje, depois, variação, reais), sentido do custo, horas e pessoas antes e depois, hora extra, contratação descrita e, quando houver, horário a mais.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em Cosmópolis (Manter horários), o card mostra exatamente 9,7%, "+1,7%", "hoje 8,0%", "R$ 7.659 a mais por mês", Pessoas 8 → 9 (+1) e Horas 352h → 394h (+42h).
- **SC-002**: O chip bate com a diferença entre os pesos exibidos em 100% dos casos testados.
- **SC-003**: Em 100% das telas e respostas de gestor e consulta, não há "R$", percentual de folha nem campo de custo.
- **SC-004**: Nenhum texto do card contém "p.p.", "pontos" (como unidade da variação), "CMV" nem "+X% sobre a folha".
- **SC-005**: Com a coluna a 300 px, todo o texto do card permanece legível, sem informação escondida.

## Assumptions

- **Fonte do cálculo:** Decision: o resultado da simulação passa a trazer o peso da folha (hoje e depois) e o sentido do custo pela mesma função usada nas linhas de cenário. Why: evita duas contas diferentes para o mesmo número.
- **Perfil:** Decision: o servidor monta a parte de custo por perfil (dono recebe números; gestor e consulta, só o sentido). Why: gestor e consulta nunca devem receber custo, nem escondido na resposta.
- **Pessoas e horas:** Decision: "antes → depois" usa o quadro de hoje e o da simulação (pessoas em jornada e horas contratadas por semana, em 4 semanas, como a tabela atual). Why: são os mesmos números da tabela que sai.
- **Hora extra:** Decision: entra como item quando maior que zero, senão a linha cinza. Why: pedido no board.
- **Horário a mais:** Decision: o bloco que já existe é reorganizado no quadro cinza, com o selo e o link já existentes; os valores não mudam. Why: o cálculo e o modal "Como calculamos" já existem (specs 049).
- **Cor neutra para quedas:** Decision: queda de pessoas ou horas usa a cor neutra de texto do design system. Why: pedido do board; não é um erro.
- **Fora do escopo:** mudar a conta do resultado, a coluna Folha dos Cenários, o botão Salvar e a escala semanal.
