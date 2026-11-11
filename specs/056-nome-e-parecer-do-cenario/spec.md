# Feature Specification: Nome e parecer do cenário salvo (com PDF)

**Feature Branch**: `feat/coluna-folha-no-faturamento` (os ajustes se acumulam nesta branch até a pessoa mandar abrir o PR)

**Created**: 2026-11-11

**Status**: Draft

**Input**: Ao salvar um cenário na Simulação, a pessoa dá um nome e pode escrever uma observação. O cenário salvo passa a ter um **parecer**: um texto corrido, em linguagem simples, com as decisões da simulação, que pode virar PDF. Decisões da pessoa: o parecer é **texto automático + observação da pessoa**; **dono, gestor e consulta** veem e baixam, com valores em reais só para o dono.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dar nome e observação ao salvar (Priority: P1)

Ao clicar em "Salvar como cenário N", abre uma janela pequena pedindo o **nome** do cenário (já preenchido com "Cenário N", editável) e uma **observação** opcional. A pessoa confirma e o cenário é gravado com esse nome.

**Why this priority**: O nome é o que a pessoa procura depois nas listas e comparações.

**Independent Test**: Salvar com o nome "Plano reforço sábado" e uma observação; o cenário aparece com esse nome nas listas e comparações.

**Acceptance Scenarios**:

1. **Given** uma simulação editável, **When** a pessoa clica em salvar, **Then** abre a janela com o nome sugerido "Cenário N" e o campo de observação vazio.
2. **Given** o nome vazio ou só com espaços, **When** a pessoa confirma, **Then** a janela avisa "Dê um nome ao cenário" e não grava.
3. **Given** um nome com mais de 60 caracteres ou igual ao de outro cenário da mesma loja, **When** a pessoa confirma, **Then** a janela avisa o problema em linguagem simples e não grava.
4. **Given** uma observação com mais de 1000 caracteres, **When** a pessoa digita, **Then** o campo mostra a contagem e impede passar do limite.
5. **Given** salvar sem observação, **When** a pessoa confirma, **Then** o cenário é gravado normalmente.
6. **Given** um perfil sem permissão de escrita, **When** abre a tela, **Then** não vê o botão de salvar.

---

### User Story 2 - Ler o parecer do cenário salvo (Priority: P1)

Cada cenário salvo tem um **parecer** que pode ser aberto a partir da lista e da comparação de cenários salvos. Ele traz: título com o nome do cenário; loja, regra (42h ou 40h), data e quem salvou; um **resumo** de 2 a 3 frases; as **decisões**; os **efeitos**; a **observação da pessoa** (separada do texto automático); e, no fim, a frase de que é uma estimativa e não altera o Cadastro.

- **Decisões:** contratações (função e carga), desligamentos, horário alterado por dia e folgas.
- **Efeitos:** cobertura (horas de falta por função e o status: cobre o horário, equipe menor que hoje, não resolve sozinho ou inviável), venda (variação estimada) e custo.
- **Custo, para o dono:** folha por mês antes e depois, peso no faturamento (por exemplo "de 8,0% para 9,7%") e reais por mês, com a mesma conta dos Cenários e do card da simulação; quando há horas a mais, o resultado do horário a mais (venda adicional, custo da mercadoria, lucro bruto, aumento de folha, resultado e Recomendado ou Não recomendado).
- **Custo, para gestor e consulta:** a mesma estrutura sem valores em reais nem percentuais de custo; só o sentido (aumenta, igual ou diminui).

**Independent Test**: Salvar o cenário de Cosmópolis com 1 farmacêutico; o parecer do dono diz que a folha sobe de 8,0% para 9,7% (R$ 7.659 por mês) e o de gestor e consulta diz que a folha aumenta, sem números.

**Acceptance Scenarios**:

1. **Given** um cenário salvo, **When** a pessoa abre o parecer, **Then** vê título, loja, regra, data, quem salvou, resumo, decisões, efeitos, observação (se houver) e a frase final.
2. **Given** um cenário sem desligamentos nem horário alterado, **When** o parecer é aberto, **Then** essas partes dizem "Nenhum desligamento" e "Horário igual ao do Cadastro" (não ficam vazias).
3. **Given** o perfil gestor ou consulta, **When** o parecer é aberto, **Then** não há "R$" nem percentual de custo, e a resposta da API deles não traz esses campos.
4. **Given** o Cadastro mudou depois de salvar, **When** o parecer é aberto, **Then** ele mostra o que valia quando foi salvo.

---

### User Story 3 - Baixar o parecer em PDF (Priority: P1)

No parecer há o botão **"Baixar parecer em PDF"**. O arquivo traz o mesmo conteúdo, bem formatado para impressão, com o nome do cenário no nome do arquivo.

**Acceptance Scenarios**:

1. **Given** o parecer aberto, **When** a pessoa clica em "Baixar parecer em PDF", **Then** baixa um PDF com o mesmo texto da tela.
2. **Given** o perfil gestor ou consulta, **When** baixa o PDF, **Then** o arquivo não tem valores em reais nem percentuais de custo.
3. **Given** um cenário com acentos e nome longo, **When** o PDF é gerado, **Then** os acentos saem corretos e o nome do arquivo é válido.

---

### User Story 4 - Cenários salvos antes desta mudança (Priority: P2)

Cenários salvos antes continuam abrindo. O parecer deles é montado na hora a partir do que existe (resultado guardado e dados da simulação), sem observação, e o PDF funciona igual.

**Acceptance Scenarios**:

1. **Given** um cenário antigo, **When** a pessoa abre o parecer, **Then** vê o texto montado do que foi guardado, sem observação, e um aviso curto "Cenário salvo antes do parecer: texto montado agora".

---

### Edge Cases

- **Nome repetido:** a comparação não diferencia maiúsculas e minúsculas ("plano A" e "Plano A" são o mesmo nome).
- **Sem salários ou faturamento (dono):** o custo do parecer diz o que falta ("Informe os salários para ver o custo de pessoal.") em vez de números.
- **Sem venda por hora:** o parecer diz que a venda não foi estimada.
- **Observação com quebra de linha:** as quebras são mantidas no parecer e no PDF.
- **Falha ao gravar:** a janela continua aberta, com a mensagem de erro, e o que a pessoa digitou não se perde.
- **Salvar duas vezes seguidas:** só um cenário é criado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: "Salvar como cenário N" abre uma janela com **nome** (sugestão "Cenário N", editável, obrigatório, até 60 caracteres, único na loja sem diferenciar maiúsculas) e **observação** (opcional, até 1000 caracteres, com contagem).
- **FR-002**: O nome escolhido aparece nas listas e nas comparações no lugar do nome automático.
- **FR-003**: Todo cenário salvo guarda um **parecer**: um retrato do momento de salvar, que não muda se o Cadastro mudar depois.
- **FR-004**: O parecer tem: título, loja, regra, data, quem salvou, resumo (2 a 3 frases), decisões, efeitos, observação (separada do texto automático) e a frase final de que é estimativa e não altera o Cadastro.
- **FR-005**: As decisões listam contratações (função e carga), desligamentos, horário alterado por dia e folgas; sem nada em uma delas, diz "Nenhum…" ou "igual ao do Cadastro".
- **FR-006**: Os efeitos trazem cobertura (horas de falta por função e status), venda (variação estimada) e custo.
- **FR-007**: Para o dono, o custo traz folha por mês antes e depois, peso no faturamento e reais por mês, pela mesma conta dos Cenários e do card da simulação; com horas a mais, traz também o resultado do horário a mais com "Custo da mercadoria" (nunca CMV) e Recomendado ou Não recomendado.
- **FR-008**: Para gestor e consulta, o parecer e o PDF têm a mesma estrutura sem valores em reais nem percentuais de custo (só aumenta, igual ou diminui); a API deles não traz esses campos.
- **FR-009**: O parecer abre a partir da lista e da comparação de cenários salvos e pode ser baixado em PDF pelo botão "Baixar parecer em PDF", com o mesmo conteúdo e o nome do cenário no nome do arquivo.
- **FR-010**: Dono, gestor e consulta veem e baixam o parecer; só quem pode escrever salva cenários.
- **FR-011**: Cenários salvos antes continuam abrindo; o parecer deles é montado na hora, sem observação e com o aviso de que foi montado agora.
- **FR-012**: Linguagem simples em pt-BR, sem "p.p." nem "pontos" como unidade, e sem a sigla CMV.
- **FR-013**: Salvar duas vezes seguidas não cria dois cenários.

### Key Entities

- **Cenário salvo**: a simulação gravada, agora com **nome** escolhido pela pessoa.
- **Parecer**: o texto do cenário (resumo, decisões, efeitos e observação) guardado no momento de salvar, mais a data e quem salvou.
- **Observação**: o texto livre da pessoa, até 1000 caracteres, parte do parecer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A pessoa salva um cenário com nome e observação em até 3 cliques depois de abrir a janela (digitar, confirmar).
- **SC-002**: Em Cosmópolis, o parecer do dono mostra "de 8,0% para 9,7% do faturamento (R$ 7.659 por mês)" e o de gestor e consulta não contém "R$" nem "%" de custo, em 100% dos testes.
- **SC-003**: O PDF baixado traz o mesmo conteúdo do parecer na tela (mesmas seções e mesmos números) em 100% dos casos testados.
- **SC-004**: Em 100% das telas, respostas e PDFs de gestor e consulta, nenhum valor em reais nem percentual de custo aparece.
- **SC-005**: Todo cenário salvo antes da mudança abre o parecer sem erro.
- **SC-006**: Nenhum texto do parecer contém "p.p." nem "CMV".

## Assumptions

- **Parecer:** Decision: texto automático mais observação da pessoa, separados. Why: a pessoa escolheu.
- **Acesso:** Decision: dono, gestor e consulta veem e baixam; valores em reais só para o dono. Why: a pessoa escolheu.
- **Retrato:** Decision: o parecer e os números dele ficam guardados com o cenário no momento de salvar. Why: a decisão registrada não deve mudar quando o Cadastro mudar.
- **Onde abrir:** Decision: na lista de cenários salvos e na comparação, com um link "Ver parecer" por cenário. Why: é onde a pessoa já olha os cenários salvos.
- **Cenários antigos:** Decision: parecer montado ao abrir, sem observação, com aviso. Why: não perder acesso ao que já foi salvo.
- **Nome único:** Decision: único por loja, sem diferenciar maiúsculas. Why: evita confundir cenários nas listas.
- **Fora do escopo:** editar o nome ou a observação depois de salvar, enviar o PDF por e-mail, e o item 10 da reunião.
