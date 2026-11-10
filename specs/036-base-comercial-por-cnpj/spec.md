# Feature Specification: Base comercial por CNPJ (julho a outubro)

**Feature Branch**: `feat/base-comercial-jul-out`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Tenho uma nova base comercial com mais meses (julho, agosto, setembro e outubro). Quero subi-la e substituir os dados que já existem: faturamento e CMV por hora, e deixar os tickets guardados para uso futuro. Pode subir tudo isso."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Subir a base nova e substituir a antiga, loja por loja (Priority: P1)

A pessoa envia o arquivo da nova base comercial (uma linha por loja, dia da semana e hora, identificada pelo CNPJ, com faturamento, CMV, unidades e tickets). Informa o período que ele cobre (1º de julho a 31 de outubro de 2026). O sistema entende que os valores são **totais do período**, converte para a **média de um dia** e passa a usar essa base nas lojas que existem no cadastro, no lugar da base anterior.

**Why this priority**: É o pedido central. Sem a conversão para média de um dia, todas as vendas ficariam cerca de 17 vezes maiores e todos os cenários sairiam errados.

**Independent Test**: Importar o arquivo, abrir a loja Arariba (código 264) e ver a venda média de uma segunda-feira próxima de R$ 23.288 e o CMV próximo de 58,7% da venda.

**Acceptance Scenarios**:

1. **Given** o arquivo com 1.834 CNPJs e o período de 01/07/2026 a 31/10/2026, **When** a pessoa pede a conferência, **Then** vê quantas lojas serão substituídas, quantas ficam como estão, quais CNPJs do arquivo não têm loja cadastrada, e os avisos de qualidade, sem que nada seja gravado ainda.
2. **Given** a conferência aprovada, **When** a pessoa confirma, **Then** cada loja cadastrada que veio no arquivo passa a ter a base nova ativa, e a base anterior dela fica guardada como inativa (nada é apagado).
3. **Given** um dia da semana que aparece 18 vezes no período (por exemplo, quarta-feira), **When** o valor de uma hora é convertido, **Then** o total do arquivo é dividido por 18; para os dias que aparecem 17 vezes (segunda, terça e domingo), por 17.
4. **Given** CNPJs do arquivo sem loja cadastrada, **When** a importação roda, **Then** são ignorados, listados no resultado e nenhuma loja é criada.
5. **Given** lojas cadastradas que não vêm no arquivo, **When** a importação roda, **Then** continuam com a base que já tinham.
6. **Given** a importação concluída, **When** a pessoa soma, por loja, o valor médio de cada dia × o número de vezes do dia no período, **Then** o resultado bate com o total do arquivo daquela loja.

---

### User Story 2 - CMV, clientes e unidades por hora ficam guardados (Priority: P1)

Junto da venda, a base nova grava por hora o **CMV (R$)**, os **clientes atendidos** (os tickets vendidos do arquivo) e as **unidades vendidas**. Clientes e unidades ficam guardados para uso futuro, sem alterar nenhuma conta.

**Why this priority**: O CMV por hora faz a loja medir perda e ganho em margem; clientes e unidades são o pedido de guardar para depois.

**Independent Test**: Depois da importação, a Simulação da Arariba mostra clientes por hora no gráfico, e o resultado da loja informa que a régua é margem.

**Acceptance Scenarios**:

1. **Given** uma hora com CMV no arquivo, **When** é gravada, **Then** o CMV da hora é guardado em reais, e o lucro bruto é a venda menos o CMV.
2. **Given** uma hora com tickets e unidades, **When** é gravada, **Then** os tickets viram clientes atendidos e as unidades ficam guardadas, ambos como média de um dia.
3. **Given** o arquivo, **When** é lido, **Then** as colunas de valor bruto e ticket médio são ignoradas (o ticket médio é a venda dividida por clientes e pode ser calculado quando for preciso).

---

### User Story 3 - Cadastro da loja preenchido só onde está vazio (Priority: P2)

Para as lojas substituídas, o sistema calcula, a partir do arquivo, o **faturamento médio por dia da semana** e o **CMV médio (%)** e os coloca no Cadastro da loja, **somente onde o campo está vazio**. O que alguém já digitou não é alterado.

**Why this priority**: As telas de cadastro e de Custos e Turnos já nascem com números, mas isso não pode apagar o que uma pessoa informou.

**Independent Test**: Importar com uma loja que já tem CMV médio digitado e outra sem: a primeira mantém o valor, a segunda recebe o calculado.

**Acceptance Scenarios**:

1. **Given** uma loja com faturamento do dia da semana ou CMV médio em branco, **When** a importação conclui, **Then** o campo é preenchido com o valor calculado do arquivo.
2. **Given** uma loja com valor já digitado, **When** a importação conclui, **Then** o valor digitado permanece, e o resultado informa quantas lojas tinham valor próprio.

---

### User Story 4 - Conferência de qualidade antes de gravar (Priority: P2)

A conferência lista, em linguagem simples, o que merece atenção: linhas zeradas, unidades menores que clientes, CMV maior que a venda, e lojas com poucos dias da semana no arquivo.

**Why this priority**: Dá confiança ao dado antes de substituir 1.791 lojas, sem bloquear a importação por avisos leves.

**Independent Test**: A conferência do arquivo atual mostra 62 linhas zeradas, 73 com unidades menores que clientes e 585 com CMV maior que a venda, e permite seguir.

**Acceptance Scenarios**:

1. **Given** linhas com valores suspeitos, **When** a conferência é mostrada, **Then** cada tipo de aviso aparece com a quantidade de linhas e é só informativo; a importação não é bloqueada.
2. **Given** linha sem CNPJ válido, dia da semana fora de 1 a 7, hora fora de 0 a 23 ou faturamento ausente ou negativo, **When** o arquivo é lido, **Then** a linha é rejeitada com o motivo e a linha do arquivo.

---

### Edge Cases

- Arquivo de 15,5 MB e 185 mil linhas: precisa ser aceito (hoje o limite de envio é menor).
- Loja do arquivo com poucos dias da semana (por exemplo, 6 dias porque não abre aos domingos): só os dias presentes são gravados.
- Hora com CMV zero e venda positiva: gravada como veio; a conferência avisa.
- Envio repetido do mesmo arquivo: substitui de novo a base ativa, sem duplicar horas.
- Loja de teste ou centro de distribuição no cadastro e fora do arquivo: segue com o que tem.
- Perfil sem permissão de dono: não vê valores em reais, como já é hoje.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST aceitar a planilha de base comercial por CNPJ, com dia da semana de 1 (segunda) a 7 (domingo) e hora de 0 a 23, e reconhecê-la sem a pessoa escolher colunas.
- **FR-002**: O sistema MUST pedir o período coberto (data inicial e final) e usá-lo para converter os totais em média de um dia, dividindo cada dia da semana pelo número de vezes que ele aparece no período.
- **FR-003**: O sistema MUST usar o faturamento (líquido) como venda, o CMV em reais como CMV, os tickets como clientes atendidos e as unidades vendidas como unidades.
- **FR-004**: O sistema MUST ignorar as colunas de valor bruto e de ticket médio.
- **FR-005**: O sistema MUST, antes de gravar, mostrar a conferência: lojas substituídas, lojas mantidas, CNPJs sem loja cadastrada e avisos de qualidade.
- **FR-006**: O sistema MUST substituir a base ativa somente das lojas cadastradas que vêm no arquivo, mantendo a base anterior guardada como inativa.
- **FR-007**: O sistema MUST ignorar e listar os CNPJs sem loja cadastrada, sem criar lojas.
- **FR-008**: O sistema MUST preencher o faturamento médio por dia da semana e o CMV médio (%) do Cadastro apenas onde estiverem vazios, e informar quantas lojas já tinham valor próprio.
- **FR-009**: O sistema MUST aceitar arquivos de até 20 MB e pelo menos 250 mil linhas.
- **FR-010**: O sistema MUST rejeitar linha inválida com o número da linha e o motivo, sem impedir as demais.
- **FR-011**: O sistema MUST manter a regra atual de acesso: valores em reais só para o dono.
- **FR-012**: O sistema MUST deixar clientes e unidades guardados sem alterar nenhum cálculo existente além do efeito do faturamento e do CMV novos.

### Key Entities

- **Base comercial da loja**: venda, CMV, clientes e unidades por dia da semana e hora (média de um dia), com o arquivo de origem, o período e a situação (ativa ou anterior).
- **Período do arquivo**: data inicial e final, de onde saem as quantidades de cada dia da semana.
- **Cadastro da loja**: faturamento médio por dia da semana e CMV médio (%), preenchidos só quando vazios.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das lojas importadas, a soma (média do dia × vezes no período) fica a menos de 0,5% do total do arquivo.
- **SC-002**: Nenhuma loja importada mostra venda média de um dia próxima de 17 vezes a anterior: a razão entre a base nova e a antiga fica entre 0,8 e 1,3 para a maioria das lojas.
- **SC-003**: As 1.791 lojas com cadastro passam a ter a base nova ativa; as 23 sem arquivo e os 43 CNPJs sem cadastro ficam exatamente como relatado na conferência.
- **SC-004**: Todas as lojas importadas passam a usar margem (lucro bruto) nos cenários e na Simulação.
- **SC-005**: A pessoa confere e confirma a importação em menos de 5 minutos.
- **SC-006**: A Arariba (código 264) fica com CMV médio de 58,7% e faturamento de segunda-feira próximo de R$ 23.288.

## Assumptions

- Decision: o período é 01/07/2026 a 31/10/2026 (informado pela pessoa), com 17 segundas, 17 terças, 18 quartas, 18 quintas, 18 sextas, 18 sábados e 17 domingos. Why: a razão de 17,5 entre o arquivo e a base atual confirma o período.
- Decision: o arquivo traz totais do período, e a base guarda a média de um dia (como hoje). Why: os cálculos já dividem por datas distintas e esperam média.
- Decision: o faturamento líquido é a venda e o CMV é medido sobre ele. Why: dá 66% de CMV no conjunto, coerente com farmácia, e é a base que a régua já usa.
- Decision: o Cadastro só recebe valores onde está vazio. Why: não apagar o que alguém digitou.
- Decision: CNPJs sem loja cadastrada são ignorados e listados. Why: somam 0,5% do faturamento do arquivo; cadastrar lojas é outra decisão.
- Decision: a base anterior das lojas substituídas fica guardada como inativa. Why: permite voltar atrás.
- Decision: o CNPJ é comparado sem pontuação. Why: o cadastro guarda com e sem pontuação.
- Decision: a tela de envio trabalha com um grupo econômico por vez (como todo o sistema); a carga da rede inteira, que traz lojas de centenas de grupos, é feita por um comando que usa exatamente a mesma conversão e confere antes de gravar. Why: o arquivo tem 1.791 lojas em 486 grupos, e enviar um grupo por vez seria inviável.
- Fora do escopo: calcular ou mostrar ticket médio, usar unidades ou clientes em cálculos, cadastrar lojas novas.
