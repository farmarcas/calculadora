# Feature Specification: Margem fora do dia a dia e "abrir um dia" por venda

**Feature Branch**: `feat/margem-fora-abrir-dia-por-venda`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Tirar a margem bruta do dia a dia do Radar Escala e fazer o cenário 'abrir um dia hoje fechado' estimar o ganho em venda (e não em margem), como a Simulação. O dia novo continua valendo 50% da média dos dias abertos (ou o que ele já vendeu). O resultado é a venda estimada do dia menos o custo da folha, rotulado como venda e não como lucro. O campo 'Margem bruta média' some das telas do Cadastro da loja, mas o valor já cadastrado continua guardado e a planilha antiga com a coluna de margem continua sendo aceita sem erro. A coluna margem da base comercial também continua guardada, só que não entra mais em nenhuma conta. O aviso do Diagnóstico que pede para informar a margem deixa de existir. Não muda os três cartões de cenário nem a Simulação."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - "Abrir um dia" estimado pela venda (Priority: P1)

Numa loja que hoje fecha algum dia da semana, o dono quer saber quanto a loja venderia a mais se abrisse esse dia usando a sobra da equipe. O cálculo passa a estimar a **venda** do dia novo (e não a margem) e compara com o custo da folha, do mesmo jeito que a Simulação já faz. Funciona em qualquer loja, tenha ela margem preenchida ou não.

**Why this priority**: É o único cálculo que ainda dependia da margem. Sem esta mudança a margem não pode sair sem deixar o cenário sem número.

**Independent Test**: Numa loja com um dia fechado e venda por dia informada, pedir o diagnóstico como dono e conferir que o "abrir dia" mostra a venda estimada do dia e o resultado "venda estimada − custo da folha", sem nenhuma menção à margem.

**Acceptance Scenarios**:

1. **Given** uma loja com um dia fechado que nunca vendeu e venda informada nos outros dias, **When** o dono vê o "abrir dia", **Then** a venda estimada do dia novo é 50% da média dos dias abertos e vem marcada como estimativa (referência, não previsão).
2. **Given** um dia fechado que já tem venda registrada, **When** o "abrir dia" é calculado, **Then** vale o que ele vendeu, sem aplicar os 50%.
3. **Given** que o "abrir dia" tem custo de folha e venda estimada, **When** o resultado é mostrado ao dono, **Then** aparece como "venda estimada menos custo da folha", com o rótulo "venda" e não "lucro" nem "margem".
4. **Given** uma loja sem margem preenchida em lugar nenhum, **When** o "abrir dia" é calculado, **Then** o resultado em reais aparece normalmente (antes ficava em branco).
5. **Given** vários dias fechados, **When** o cenário escolhe quais abrir, **Then** escolhe pela maior venda estimada, só entre os que a equipe cobre sem nova contratação, como antes, e não abre dia de venda estimada zero.
6. **Given** um usuário que não é o dono, **When** vê o "abrir dia", **Then** não aparecem valores em reais (como já é hoje).
7. **Given** uma loja que abre os 7 dias, **When** o "abrir dia" é pedido, **Then** continua informando que todos os dias já estão abertos.

---

### User Story 2 - Margem some das telas e das contas (Priority: P1)

O campo "Margem bruta média" deixa de aparecer no Cadastro da loja (aba de faturamento e resumo mensal) e no modelo da planilha de Cadastro. O aviso do Diagnóstico que pedia para "informar a margem bruta" deixa de existir. Nenhuma tela, texto ou conta do Diagnóstico e da Simulação usa a margem.

**Why this priority**: É o objetivo do pedido: não pedir nem mostrar um dado que não muda nenhum resultado.

**Independent Test**: Abrir o Cadastro de uma loja como dono e ver que não há campo de margem; abrir o Diagnóstico de uma loja cuja venda vem só do faturamento do Cadastro e ver o aviso sem pedir margem.

**Acceptance Scenarios**:

1. **Given** o Cadastro de uma loja aberto pelo dono, **When** a aba de faturamento e o resumo mensal são vistos, **Then** não existe campo, rótulo, dica ou erro de "margem".
2. **Given** o botão de baixar o modelo da planilha de Cadastro, **When** o modelo é baixado, **Then** não traz coluna de margem.
3. **Given** uma loja cuja venda vem só do faturamento do Cadastro, **When** o Diagnóstico é aberto, **Then** o aviso explica que a venda é estimada pelo faturamento, dividida igualmente entre as horas abertas, sem pedir margem.
4. **Given** qualquer loja, **When** os três cartões de cenário e a Simulação são calculados, **Then** os números são exatamente os mesmos de antes (já usavam venda e folha).
5. **Given** o painel de pendências do Cadastro, **When** a margem está vazia, **Then** nada é cobrado (já era assim) e nenhum texto a menciona.

---

### User Story 3 - O que já está guardado continua guardado e aceito (Priority: P1)

Quem já preencheu a margem não perde o valor: ele continua guardado. Planilhas antigas de Cadastro que ainda trazem a coluna de margem seguem sendo importadas sem erro e sem aviso de coluna desconhecida. A coluna de margem da base comercial também segue sendo aceita e guardada, mas não entra mais em nenhuma conta.

**Why this priority**: A pessoa quer poder voltar a usar a margem no futuro e não quer que planilhas já preparadas passem a falhar.

**Independent Test**: Importar uma planilha antiga com a coluna de margem e conferir que a importação termina sem erro; conferir que o valor de margem que já estava salvo numa loja continua lá depois de salvar o faturamento pela tela.

**Acceptance Scenarios**:

1. **Given** uma planilha de Cadastro antiga com a coluna "margem", **When** é importada, **Then** a importação conclui sem erro e sem pedir para corrigir a coluna.
2. **Given** uma loja com margem já salva, **When** o dono edita e salva o faturamento pela tela (que não mostra mais a margem), **Then** a margem salva continua igual.
3. **Given** uma base comercial com a coluna de margem, **When** é enviada, **Then** é aceita e guardada como hoje, e nenhum cenário muda por causa dela.
4. **Given** uma planilha antiga com margem inválida (por exemplo, acima de 100%), **When** é importada, **Then** a coluna é ignorada e não recusa a linha.

---

### Edge Cases

- Loja só com faturamento mensal (sem venda por dia): a venda do dia novo segue a mesma divisão igual entre os dias abertos usada hoje; o "abrir dia" mostra o ganho em venda.
- Loja sem nenhuma venda informada: o "abrir dia" escolhe só pela capacidade da equipe e avisa que falta venda para estimar o ganho, sem valor em reais.
- Custo de folha do cenário base indisponível (falta salário médio): o resultado em reais do "abrir dia" fica em branco, como já acontece com os outros cenários.
- Dia fechado cuja venda estimada seria zero ou negativa: não é aberto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O cenário "abrir um dia hoje fechado" MUST estimar o ganho do dia novo em **venda**, nunca em margem.
- **FR-002**: A venda do dia novo MUST ser a que o dia já vendeu quando houver histórico; sem histórico, 50% da média dos dias abertos (o mesmo fator das premissas já existentes) e marcada como estimativa.
- **FR-003**: O resultado em reais do "abrir dia", visto só pelo dono, MUST ser "venda estimada do dia menos o custo adicional de folha", rotulado como venda (não como lucro ou margem) e como referência, não previsão.
- **FR-004**: A escolha de quais dias abrir MUST ser feita pela maior venda estimada, entre os dias que a equipe cobre sem nova contratação, sem abrir dia de venda estimada zero.
- **FR-005**: O "abrir dia" MUST funcionar igual em lojas com e sem margem preenchida.
- **FR-006**: O campo "Margem bruta média" MUST sair da aba de faturamento e do resumo mensal do Cadastro da loja.
- **FR-007**: O modelo para baixar da planilha de Cadastro MUST deixar de trazer a coluna de margem.
- **FR-008**: O Diagnóstico MUST deixar de pedir ou mencionar a margem em qualquer aviso ou texto.
- **FR-009**: A margem já cadastrada em lojas MUST continuar guardada e MUST NOT ser apagada nem alterada ao salvar o faturamento pela tela.
- **FR-010**: Planilhas de Cadastro que ainda tenham a coluna de margem MUST ser aceitas sem erro e sem recusar linhas; a coluna é ignorada.
- **FR-011**: A coluna de margem da base comercial MUST continuar sendo aceita e guardada, mas MUST NOT entrar em nenhuma conta do Diagnóstico ou da Simulação.
- **FR-012**: Os três cartões de cenário e a Simulação MUST manter os mesmos resultados de antes.
- **FR-013**: Quem não é o dono MUST continuar sem ver valores em reais.

### Key Entities *(include if feature involves data)*

- **Faturamento da loja**: venda por dia da semana e mensal informadas no Cadastro; a margem informada anteriormente continua guardada junto, sem uso e sem tela.
- **Venda por hora (base comercial)**: venda média por dia da semana e hora; a coluna de margem continua guardada, sem uso.
- **Cenário "abrir um dia"**: dias hoje fechados que a equipe cobre, com venda estimada de cada um e resultado "venda − folha" para o dono.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das lojas com dia fechado e venda informada, o "abrir dia" mostra um resultado em reais para o dono, tenha a loja margem preenchida ou não (antes, sem margem, ficava em branco).
- **SC-002**: Nenhuma tela de Cadastro, Diagnóstico ou Simulação e nenhum modelo de planilha contém a palavra "margem" ligada à loja.
- **SC-003**: Os números dos três cartões de cenário e da Simulação ficam idênticos aos de antes em todas as lojas de teste (diferença zero).
- **SC-004**: 100% das planilhas de Cadastro antigas com coluna de margem continuam importando sem erro.
- **SC-005**: 100% das lojas que tinham margem salva continuam com o mesmo valor guardado depois da mudança e de um salvamento pela tela.

## Assumptions

- Hoje nenhuma tela do Radar mostra o cenário "abrir um dia"; ele é calculado e fica disponível nos dados do diagnóstico. Esta entrega **muda o cálculo e os textos desse cenário**, mas **não cria uma tela nova** para ele (fora do escopo).
- Decisão: a coluna de margem das planilhas de Cadastro é lida e **ignorada** (não atualiza o valor guardado). Por quê: evita erro em planilhas antigas e preserva o que já está salvo sem criar um caminho escondido de edição.
- Decisão: o valor guardado não é removido do banco agora. Por quê: a pessoa quer manter guardado, e remover depois é possível sem desfazer nada.
- O fator de 50% do dia novo e a regra de "equipe cobre sem nova contratação" continuam como estão.
- A mesma ressalva da Simulação vale aqui: venda menos folha não é lucro (não desconta o custo da mercadoria); o texto deixa isso claro.
- Fora do escopo: criar tela para o "abrir dia", apagar a coluna do banco, mudar os três cartões de cenário ou a Simulação.
