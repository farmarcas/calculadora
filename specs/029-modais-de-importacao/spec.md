# Feature Specification: Modais de importação (lojas e funcionários, e base comercial)

**Feature Branch**: `feat/modais-de-importacao`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Reescrever os dois modais de importação de planilha do Radar conforme o board 'Importações em massa · lojas e funcionários, e base comercial (opções)': o modal 'Importar lojas e funcionários' na versão A (passo a passo, com etapa de revisão antes de gravar) e o modal 'Enviar base comercial' na versão C (passo a passo, com o quadro do arquivo escolhido). O modal de envio passa a tratar somente da base comercial."

**Nota de ordem**: esta entrega parte da planilha identificada pelo CNPJ (spec 028); o texto e a revisão falam em CNPJ, e não em "código da loja", para o Cadastro.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Importar lojas e funcionários passo a passo, com revisão (Priority: P1)

Quem cuida do Cadastro abre "Importar lojas e funcionários" e vê três passos curtos: baixar a planilha modelo, preencher e salvar, enviar. Ao escolher o arquivo, o botão "Revisar planilha" é liberado. A revisão mostra, antes de gravar qualquer coisa, o que o Radar entendeu: quantas lojas e quantos funcionários serão atualizados, quantos são novos e quantas linhas têm erro. Só então a pessoa grava.

**Why this priority**: É o fluxo principal de alimentar o Cadastro, e hoje a pessoa grava sem saber o que vai acontecer.

**Independent Test**: Baixar o modelo, preencher uma loja e dois funcionários, enviar o arquivo, conferir a revisão (1 loja atualizada, 2 funcionários novos, 0 erros) e só então gravar e ver o resultado no Cadastro.

**Acceptance Scenarios**:

1. **Given** o modal aberto, **When** nenhum arquivo foi escolhido, **Then** aparecem os três passos, o aviso "Lojas que já existem são atualizadas. Antes de gravar, você revisa o que o Radar entendeu.", o botão "Baixar modelo" e o botão "Revisar planilha" desabilitado.
2. **Given** a área de envio, **When** a pessoa arrasta um arquivo .xlsx ou .csv, clica em "Escolher arquivo" ou aciona a área pelo teclado, **Then** o arquivo é aceito pelos três jeitos.
3. **Given** um arquivo escolhido, **When** a pessoa clica em "Revisar planilha", **Then** o modal passa para a revisão, sem gravar nada, mostrando o nome do arquivo, o tamanho, o link "Trocar arquivo" e a tabela "O que o Radar entendeu" com as linhas Lojas e Funcionários e as colunas Atualiza, Novas e Com erro.
4. **Given** uma revisão com linhas com erro, **When** ela é mostrada, **Then** aparece um aviso de atenção "N linhas com problema. Elas não serão gravadas.", a lista dos erros no formato "Lojas, linha 14: CNPJ não encontrado entre as lojas do grupo." e o link "Baixar lista de erros".
5. **Given** a revisão, **When** a pessoa clica em "Gravar X lojas e Y funcionários" (com os totais reais), **Then** as linhas sem erro são gravadas, as com erro não, o modal fecha e aparece o aviso "X lojas e Y funcionários gravados."
6. **Given** a revisão, **When** a pessoa clica em "Trocar arquivo", **Then** volta ao passo 3 sem perder o modal.
7. **Given** um arquivo que não segue o modelo, **When** é enviado, **Then** o sistema tenta entender as colunas sozinho e a revisão mostra o que foi entendido; se não achar as colunas essenciais, mostra a mensagem do que falta e como corrigir.

---

### User Story 2 - Enviar base comercial com o quadro do arquivo (Priority: P1)

Quem envia a base comercial (vendas por data e hora) vê o modal "Enviar base comercial", marcado como "Opcional", com os mesmos três passos. Ao escolher o arquivo, no lugar da área de envio aparece o quadro do arquivo: nome, tamanho, quantas lojas e o período das vendas. Se algum envio anterior será substituído, um aviso diz qual e quantas lojas passam a usar a nova planilha.

**Why this priority**: A base comercial é o segundo arquivo do Radar e hoje seu envio é um bloco solto, sem mostrar o que será enviado nem o que será substituído.

**Independent Test**: Escolher uma base com 14 lojas de outubro, ver nome, tamanho, 14 lojas e o período, ver o aviso de substituição e enviar.

**Acceptance Scenarios**:

1. **Given** o modal aberto, **When** nenhum arquivo foi escolhido, **Then** aparecem a etiqueta "Opcional" ao lado do título, o texto de abertura, o aviso azul de substituição, os três passos e "Enviar base comercial" desabilitado.
2. **Given** um arquivo válido escolhido, **When** o quadro do arquivo é mostrado, **Then** traz o nome, o tamanho, a quantidade de lojas, o período (primeira e última data) e o link "Trocar arquivo", e o botão "Enviar base comercial" fica ativo.
3. **Given** que alguma das lojas do arquivo já tem uma base enviada, **When** o quadro é mostrado, **Then** aparece abaixo dele "Este envio substitui o de dd/mm/aaaa." e "As N lojas passam a usar a nova planilha. A anterior fica no histórico."
4. **Given** o arquivo escolhido, **When** a pessoa clica em "Enviar base comercial", **Then** a base é gravada, o modal fecha e aparece "Base comercial enviada para N lojas."
5. **Given** o modal, **When** é aberto, **Then** não trata mais de "Escala atual": só da base comercial.

---

### User Story 3 - Comportamento comum dos dois modais (Priority: P1)

Os dois modais têm a mesma estrutura, o mesmo teclado e os mesmos estados (enviando, erro de arquivo, sucesso), e são operáveis só com o teclado.

**Why this priority**: Garante acessibilidade e consistência, e evita campos nativos do navegador soltos na tela.

**Independent Test**: Abrir cada modal só com o teclado, percorrer os passos, escolher um arquivo, fechar com Esc e ver o foco voltar ao botão que abriu.

**Acceptance Scenarios**:

1. **Given** um modal aberto, **When** a pessoa aperta Esc ou clica no ×, **Then** o modal fecha e o foco volta ao botão que o abriu.
2. **Given** um modal aberto, **When** a pessoa percorre o teclado com Tab, **Then** o foco fica preso dentro do modal.
3. **Given** a área de envio, **When** é vista ou usada, **Then** não aparece nenhum campo de arquivo nativo do navegador, a área é operável por teclado e o arquivo escolhido é anunciado a leitores de tela.
4. **Given** um envio em andamento, **When** o modal mostra o progresso, **Then** não pode ser fechado até o fim e os botões ficam desabilitados.
5. **Given** um arquivo de formato diferente de .xlsx ou .csv, vazio ou sem as colunas essenciais, **When** é escolhido, **Then** aparece, no lugar do quadro do arquivo, a mensagem do motivo e de como corrigir (por exemplo: "Não encontramos a coluna Hora. Baixe o modelo e confira os nomes das colunas."), com ícone e texto, e o botão principal fica desabilitado.
6. **Given** um envio concluído, **When** o modal fecha, **Then** a tela por trás já reflete o resultado.

---

### Edge Cases

- Arquivo muito grande ou com muitas linhas: a legenda da área de envio mostra o limite e o arquivo acima dele é recusado com a mensagem.
- Planilha com várias abas e só uma delas reconhecida: a revisão mostra o que foi reconhecido e o que foi ignorado.
- Trocar o arquivo depois de revisar: a revisão anterior é descartada.
- Perda de conexão no envio: mensagem de erro, modal continua aberto, nada fica gravado pela metade.
- Pessoa sem permissão para importar lojas: o passo e a tabela de revisão mostram só o que o perfil pode importar, como hoje.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O modal "Importar lojas e funcionários" MUST substituir o atual "Importar em massa", com os três passos, o aviso, o botão "Baixar modelo" (que baixa o modelo atual de duas abas) e o botão "Revisar planilha".
- **FR-002**: O modal "Enviar base comercial" MUST substituir o atual "Enviar planilhas" e tratar somente da base comercial, com a etiqueta "Opcional".
- **FR-003**: A área de envio MUST aceitar arrastar e soltar e clique, MUST ser operável por teclado, MUST aceitar .xlsx e .csv e MUST NOT expor o campo de arquivo nativo do navegador.
- **FR-004**: O botão principal de cada modal MUST ficar desabilitado até haver um arquivo válido escolhido.
- **FR-005**: A revisão MUST mostrar, sem gravar nada, as contagens de Lojas e de Funcionários que atualizam, são novos e têm erro, e a lista de erros com a linha, a aba e o motivo.
- **FR-006**: O botão de gravar MUST mostrar os totais reais ("Gravar X lojas e Y funcionários") e gravar somente as linhas sem erro; linhas com erro MUST NOT ser gravadas e as demais MUST ser.
- **FR-007**: A revisão MUST oferecer o link "Baixar lista de erros" com as linhas que não serão gravadas.
- **FR-008**: O quadro do arquivo da base comercial MUST mostrar nome, tamanho, quantidade de lojas, período e "Trocar arquivo", calculados do arquivo escolhido (sem gravar).
- **FR-009**: Quando o arquivo da base comercial substituir um envio anterior de alguma loja, o modal MUST avisar a data do envio substituído e quantas lojas passam a usar a nova planilha, informando que a anterior fica no histórico.
- **FR-010**: Os dois modais MUST ter `role="dialog"` e `aria-modal`, título ligado por `aria-labelledby`, botão × com `aria-label="Fechar"`, fechar com Esc e com o ×, foco preso dentro e devolvido ao botão que abriu.
- **FR-011**: O arquivo escolhido MUST ser anunciado em uma região `aria-live="polite"`, e as mensagens de erro MUST usar ícone e texto, sem depender só de cor.
- **FR-012**: Durante o envio o modal MUST mostrar o progresso e MUST NOT poder ser fechado; ao terminar com sucesso MUST fechar e mostrar "X lojas e Y funcionários gravados." (lojas e funcionários) ou "Base comercial enviada para N lojas." (base comercial).
- **FR-013**: Erros de arquivo (formato, vazio, colunas faltando, acima do limite) MUST aparecer no lugar do quadro do arquivo com o motivo e como corrigir.
- **FR-014**: Os textos MUST estar em português, em "sentence case", sem emoji e sem o termo "operador", e MUST usar os tokens do design system do Radar.
- **FR-015**: Os números e datas mostrados MUST ser os reais do arquivo e do sistema, e não os de exemplo do board.
- **FR-016**: Para o Cadastro, os textos de erro MUST falar em CNPJ (por exemplo "CNPJ não encontrado entre as lojas do grupo"), e não em código da loja.

### Key Entities *(include if feature involves data)*

- **Revisão da importação**: a leitura do arquivo sem gravar, com as contagens de atualiza, novas e com erro para lojas e funcionários, e a lista de erros.
- **Quadro do arquivo (base comercial)**: nome, tamanho, quantidade de lojas, período das vendas e os envios anteriores que serão substituídos.
- **Envio anterior de base comercial**: a base já enviada para uma loja, com a data, que passa para o histórico quando uma nova é enviada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa que nunca usou a importação consegue baixar o modelo, preencher, enviar, revisar e gravar sem ajuda, na primeira tentativa.
- **SC-002**: Em 100% das importações de lojas e funcionários, a pessoa vê quantas linhas serão atualizadas, criadas e recusadas antes de qualquer gravação.
- **SC-003**: Em 100% dos envios de base comercial que substituem uma anterior, a pessoa é avisada da data e do número de lojas antes de enviar.
- **SC-004**: Os dois modais são concluídos apenas com o teclado, sem o mouse, e o foco nunca sai do modal enquanto está aberto.
- **SC-005**: Em todos os erros de arquivo, a mensagem diz o motivo e como corrigir, e nenhum erro aparece só como cor.

## Assumptions

- Decisão: a revisão do Cadastro lê o arquivo e calcula o resultado **sem gravar** no banco, pelo mesmo caminho que a gravação usa, para que o número mostrado seja o que de fato será gravado. Por quê: é o que dá sentido à promessa "antes de gravar, você revisa".
- Decisão: a tela atual de ajuste manual de colunas (escolher qual coluna é qual) sai; o sistema entende as colunas sozinho e, se faltar uma essencial, diz qual e como corrigir. Por quê: é o que o board pede ("o sistema tenta entender sozinho e a tabela mostra o que foi entendido"). Se a pessoa precisar de ajuste fino, o caminho é corrigir o arquivo pelo modelo.
- Decisão: linhas com erro não são gravadas e as demais são. Por quê: é o comportamento de hoje e o que o board assume; se o envio inteiro tiver de ser barrado, muda só o texto e a regra do botão.
- Decisão: as colunas da base comercial (Código da loja, Data, Hora e Valor das vendas) são as do modelo atual; o board as marcou como suposição a confirmar com o time de dados. Por quê: não mudam o comportamento de hoje.
- Decisão: o limite de tamanho e de linhas do arquivo é o que o sistema já impõe hoje; se existir, aparece na legenda da área de envio; se não existir, nenhum limite é anunciado.
- Decisão: os estados que o board não desenhou (enviando, erro de arquivo, sucesso) seguem o texto desta spec e serão mostrados à pessoa para aprovação na etapa do plano, antes de implementar.
- Fora do escopo: o modal da "Escala atual" (já aposentado), a tela de Cadastro, as regras de quem pode importar o quê e o conteúdo dos modelos de planilha.
