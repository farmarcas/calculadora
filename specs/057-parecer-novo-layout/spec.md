# Feature Specification: Novo layout do parecer do cenário (modal e PDF)

**Feature Branch**: `feat/coluna-folha-no-faturamento` (os ajustes se acumulam nesta branch até a pessoa mandar abrir o PR)

**Created**: 2026-11-12

**Status**: Draft

**Input**: Board "Parecer do cenário · modal e PDF · versão escolhida (A + C)". Evolui a spec 056 (nome e parecer do cenário salvo). **Não muda o cálculo**; muda a apresentação e os textos: um parágrafo corrido, três números grandes e a tabela "O que muda", na modal e no PDF, com o mesmo conteúdo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ler o parecer na modal (Priority: P1)

A modal se chama **"Parecer do cenário · {Loja}"** (grafia do cadastro, com acento, nunca em maiúsculas), tem o botão fechar (×) com o rótulo "Fechar" e um subtítulo de duas linhas em texto secundário: "{Loja} · {Regra} · Cenário {n}" (ex.: "Cosmópolis · Regra de 42h · Cenário 5") e "Salvo em {dd/mm/aaaa} pelo {papel}" (ex.: "pelo dono"; se houver o nome da pessoa, usa o nome).

O corpo tem, de cima para baixo:

1. **Chip de status:** "✓ Cobre o horário" (verde) ou o estado do cenário (ex.: "Não recomendado").
2. **Parágrafo corrido**, sem rótulos nem hifens, montado das decisões do cenário.
3. **Três números grandes**, lado a lado: Folha no faturamento, Equipe e Farmacêutico faltando.
4. **"O QUE MUDA"**: tabela com Hoje, Com o cenário e Mudança.
5. **Rodapé fixo** com o aviso de estimativa e os botões "Fechar" e "Baixar parecer em PDF". O corpo rola; o rodapé sempre aparece.

**Why this priority**: É o que a pessoa lê para decidir e mostra aos outros; precisa ser claro numa olhada.

**Independent Test**: Em Cosmópolis (Cenário 5, regra de 42h, dono): o parágrafo diz "Contratando 1 farmacêutico e 1 atendente, 42h por semana cada, a loja passa a cobrir todo o horário de funcionamento. Ninguém é desligado, o horário continua igual ao do Cadastro e todos trabalham 5 dias por semana e folgam 2. A venda não muda, mas a folha pesa mais no faturamento."; os números grandes mostram 9,7% (+2,5%, "hoje 7,2% · R$ 11.113 a mais por mês"), 9 pessoas (+2, "hoje 7") e 0 h (coberto, "hoje faltam 16 h por semana").

**Acceptance Scenarios**:

1. **Given** um cenário salvo, **When** a pessoa abre o parecer, **Then** vê título, subtítulo, chip, parágrafo, três números, tabela e rodapé, nessa ordem.
2. **Given** a tela pequena ou um conteúdo longo, **When** a modal rola, **Then** o rodapé com "Fechar" e "Baixar parecer em PDF" continua visível.
3. **Given** o parágrafo, **When** é lido, **Then** nunca aparece "jornada cheia" (escreve-se "42h por semana") e as contratações que não são de farmacêutico seguem marcadas como desejáveis.

---

### User Story 2 - O parágrafo e os números certos para cada situação (Priority: P1)

**Parágrafo**, em frases curtas que se encaixam:
- **Contratações:** "Contratando 1 farmacêutico e 1 atendente, 42h por semana cada, a loja passa a cobrir todo o horário de funcionamento." (sem contratação: "Sem contratar ninguém,"; com falta que sobra, diz o que ainda falta).
- **Desligamentos:** "Ninguém é desligado," ou "Desligando 1 atendente,".
- **Horário:** "o horário continua igual ao do Cadastro" ou a descrição da mudança.
- **Folgas:** "e todos trabalham 5 dias por semana e folgam 2."
- **Venda e custo:** "A venda não muda, mas a folha pesa mais no faturamento." Variações: "A venda sobe/cai…", "a folha pesa menos…", "a folha fica igual". Para gestor e consulta: "…mas o custo de pessoal aumenta/fica igual/diminui."

**Números grandes** (cards em fundo suave):
- **Folha no faturamento (dono):** o peso depois (ex.: 9,7%), um chip com a **diferença dos pesos já arredondados**, em "%" (ex.: +2,5%), e a linha "hoje 7,2% · R$ 11.113 a mais por mês". Chip âmbar quando sobe e verde quando cai. Com o custo em reais igual a zero: chip "folha igual" e, se for o caso, "Sobe só porque a venda cai."
- **Equipe:** "9 pessoas", chip "+2" e "hoje 7".
- **Farmacêutico faltando:** "0 h", chip "coberto" (verde) e "hoje faltam 16 h por semana".

**Tabela "O que muda"** (colunas: nome, Hoje, Com o cenário, Mudança):
- Farmacêutico faltando: 16 h por semana → 0 h, −16 h.
- Venda: — → "sem mudança" (ou os valores, quando mudar).
- Pessoas: 7 → 9, +2.
- Horas contratadas por semana: 308h → 392h, +84h.
- Folha por mês (só dono): R$ 32.584 → R$ 43.697, +R$ 11.113.

"Com o cenário" em negrito; "Mudança" à direita (verde para melhora, âmbar para piora, neutro para "—"). A folha em % **não se repete** na tabela.

**Acceptance Scenarios**:

1. **Given** o custo em reais maior que zero, **When** o dono vê o número da folha, **Then** o chip é âmbar com "+2,5%" (diferença dos pesos arredondados: 9,7 − 7,2) e a linha diz "hoje 7,2% · R$ 11.113 a mais por mês".
2. **Given** a folha que diminui, **When** o dono vê o chip, **Then** ele é verde com sinal "−" e a linha diz "a menos por mês".
3. **Given** custo em reais zero, **When** o dono vê o cartão, **Then** o chip é "folha igual" e, se o peso sobe pela venda, aparece "Sobe só porque a venda cai."
4. **Given** os valores do cartão e da tabela, **When** comparados, **Then** são os mesmos números (R$ 43.697 − R$ 32.584 = R$ 11.113).

---

### User Story 3 - Gestor e consulta, sem valores em reais (Priority: P1)

Para gestor e consulta não há R$ nem percentual de custo: o cartão vira **"Custo de pessoal"**, mostra "—", a frase "sem valores em reais" e um chip **Aumenta**, **Igual** ou **Diminui**; a linha "Folha por mês" some da tabela; o rodapé ganha "Valores em reais aparecem só para o dono do grupo."; o parágrafo usa "o custo de pessoal aumenta/fica igual/diminui". Sem dados de custo: "Dados do custo ainda não informados." no lugar do número. A regra vale para o PDF, **conferida no servidor ao gerar o arquivo**, não só na tela.

**Acceptance Scenarios**:

1. **Given** o perfil gestor ou consulta, **When** abre o parecer ou baixa o PDF, **Then** não há "R$" nem "%" de custo em lugar nenhum.
2. **Given** a resposta do servidor e o arquivo gerado para esses perfis, **When** inspecionados, **Then** não trazem esses valores.

---

### User Story 4 - O PDF com o mesmo conteúdo (Priority: P1)

O PDF é A4, **uma página**, com o mesmo conteúdo da modal: cabeçalho com o logo Radar, título "Parecer do cenário · {Loja}" e o mesmo subtítulo; corpo com chip de status, parágrafo, três números grandes e a tabela "O que muda", na mesma ordem; rodapé da página com "Estimativa feita com os dados importados da loja. Não altera o Cadastro." à esquerda e "Página {n} de {total}" à direita. Nome do arquivo: **"parecer-{loja-em-minusculas-sem-acento}-cenario-{n}.pdf"** (ex.: parecer-cosmopolis-cenario-5.pdf). Se o conteúdo passar de uma página, quebra **antes** de "O que muda", nunca no meio de uma linha da tabela.

**Acceptance Scenarios**:

1. **Given** o parecer de Cosmópolis, **When** a pessoa baixa o PDF, **Then** o arquivo se chama parecer-cosmopolis-cenario-5.pdf e traz as mesmas seções e os mesmos números da modal.
2. **Given** um parecer longo, **When** o PDF é gerado, **Then** a quebra de página acontece antes de "O que muda" e nenhuma linha da tabela é cortada.

---

### User Story 5 - Estados e acessibilidade (Priority: P2)

- **Gerando o PDF:** o botão "Baixar parecer em PDF" mostra um indicador de carregamento e fica desabilitado.
- **Erro:** "Não foi possível baixar o PDF. Tente de novo." com a ação "Tentar de novo".
- **Modal:** é uma janela de diálogo; o foco fica preso dentro dela, ela fecha com Esc e devolve o foco ao botão que a abriu.
- **Chips:** não dependem só de cor; trazem sinal (+, −) ou palavra (Aumenta, Igual, Diminui). Contraste mínimo AA para o âmbar e o verde sobre os fundos dos chips.

---

### Edge Cases

- **Cenário antigo (sem parecer guardado):** abre com o texto montado na hora, no mesmo layout.
- **Sem salários ou sem faturamento (dono):** o cartão da folha diz o que falta ("Informe os salários para ver o custo de pessoal." / "Informe o faturamento para ver o peso da folha.") e a linha "Folha por mês" some se não houver valor.
- **Venda não estimada:** a tabela mostra "—" e o parágrafo diz que a venda não foi estimada.
- **Horário a mais (dono):** o resultado do horário a mais continua no parecer, depois da tabela, com "Custo da mercadoria".
- **Nome da loja com acento ou muito longo:** o título quebra em linhas sem cortar nem usar maiúsculas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A modal tem título "Parecer do cenário · {Loja}", botão fechar com rótulo "Fechar" e subtítulo de duas linhas (loja, regra, cenário; data e papel ou nome de quem salvou).
- **FR-002**: O corpo segue a ordem: chip de status, parágrafo, três números, tabela "O que muda", rodapé fixo.
- **FR-003**: O parágrafo é montado das decisões do cenário (contratações, desligamentos, horário, folgas, venda e custo), em linguagem simples, sem rótulos, sem hifens, sem "jornada cheia" ("42h por semana"), com as contratações que não são de farmacêutico marcadas como desejáveis.
- **FR-004**: O cartão "Folha no faturamento" (dono) mostra o peso depois, o chip com a diferença dos pesos arredondados em "%", "hoje X%" e os reais por mês; as variações com R$ zero e o chip "folha igual" seguem as specs 050 e 052.
- **FR-005**: Os cartões "Equipe" e "Farmacêutico faltando" mostram o valor, o chip e o "hoje".
- **FR-006**: A tabela "O que muda" traz as linhas definidas, com a linha "Folha por mês" só para o dono, "Com o cenário" em negrito e "Mudança" à direita com as cores definidas; a folha em % não se repete.
- **FR-007**: O cartão e a tabela mostram o mesmo valor, e as diferenças são calculadas dos valores exibidos.
- **FR-008**: Gestor e consulta recebem o cartão "Custo de pessoal" com "—", "sem valores em reais" e Aumenta, Igual ou Diminui, sem a linha de folha, com o aviso no rodapé; o servidor garante isso na resposta e no PDF.
- **FR-009**: O rodapé da modal é fixo (borda superior, não rola) com o aviso de estimativa e os botões "Fechar" e "Baixar parecer em PDF".
- **FR-010**: O PDF é A4, de uma página, com cabeçalho (logo, título, subtítulo), o mesmo corpo da modal, rodapé com o aviso e "Página {n} de {total}", e o nome de arquivo definido; quebra antes de "O que muda" quando passa de uma página, sem cortar linha da tabela.
- **FR-011**: Estados: indicador de carregamento e botão desabilitado ao gerar o PDF; mensagem e "Tentar de novo" em erro; "Dados do custo ainda não informados." para gestor sem dados.
- **FR-012**: Acessibilidade: diálogo com foco preso, fecha com Esc, devolve o foco; chips com sinal ou palavra; contraste AA.
- **FR-013**: Formato pt-BR em todo o parecer (R$ 1.234, 9,7%, 308h, "42h por semana"); nunca "p.p." nem "pontos".
- **FR-014**: O cálculo não muda; cenários salvos antes continuam abrindo com o texto montado na hora; as regras de permissão (dono, gestor, consulta) não mudam.

### Key Entities

- **Parecer**: o texto do cenário (parágrafo, números e tabela) guardado ao salvar, nas versões do dono e do público (spec 056), agora organizado para o novo layout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em Cosmópolis (Cenário 5), o parecer do dono mostra o parágrafo, 9,7% (+2,5%), 9 pessoas (+2), 0 h (coberto) e a tabela com R$ 32.584 → R$ 43.697 (+R$ 11.113), e o PDF traz os mesmos números.
- **SC-002**: O PDF cabe em uma página nos cenários comuns e, quando não cabe, nenhuma linha da tabela é cortada.
- **SC-003**: Em 100% dos pareceres e PDFs de gestor e consulta, não há "R$" nem percentual de custo.
- **SC-004**: O nome do arquivo segue o padrão em 100% dos casos, sem acento e em minúsculas.
- **SC-005**: A pessoa consegue fechar a modal só com o teclado (Esc) e o foco volta ao botão de origem.
- **SC-006**: Nenhum texto do parecer contém "jornada cheia", "p.p." ou "pontos".

## Assumptions

- **Escopo:** Decision: muda só a apresentação e os textos do parecer (modal e PDF); o cálculo e as permissões ficam como estão. Why: pedido do board.
- **Quem salvou:** Decision: mostra o papel ("pelo dono", "pelo gestor", "pela consulta"); se o sistema passar a guardar o nome, usa o nome. Why: hoje só o perfil é guardado.
- **Número do cenário:** Decision: usa o número dado ao salvar ("Cenário 5"); cenário antigo sem número mostra só a loja e a regra. Why: o número já existe nos cenários salvos.
- **Farmacêutico faltando "hoje":** Decision: as horas de falta de hoje e as de depois já existem no cálculo do resultado; o parecer só as mostra. Why: sem novo cálculo.
- **Cores fora do DS:** Decision: usar os tokens de chip já criados na coluna Folha dos Cenários (âmbar e verde), com comentário no código. Why: mesmos valores e contraste AA já verificados.
- **Fora do escopo:** editar nome ou observação depois de salvar, enviar o PDF por e-mail e novos cálculos.
