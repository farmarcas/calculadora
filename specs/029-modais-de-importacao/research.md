# Research: Modais de importação

**Decision**: a revisão do Cadastro reaproveita o mesmo código da gravação, com um modo "simular" que faz as mesmas leituras e decisões (reconhecer a loja, atualizar ou criar, recusar linha) mas não escreve. A gravação continua em `confirmar`.
**Rationale**: é a única forma de garantir que o número mostrado seja o que será gravado.
**Alternatives considered**: reimplementar a contagem à parte (os dois caminhos divergiriam com o tempo).

**Decision**: a tela de ajuste manual de colunas sai. A tela envia o arquivo, usa o mapeamento que a API já entendeu e pede a revisão; se faltar coluna essencial, a API responde com a mensagem "Não encontramos a coluna X. Baixe o modelo e confira os nomes das colunas."
**Rationale**: é o que o board pede; o ajuste fino é corrigir o arquivo pelo modelo.
**Alternatives considered**: manter o mapeamento manual escondido atrás de um link (complexidade sem pedido).

**Decision**: a revisão da base comercial é um endpoint próprio (`/cargas/base/revisar`) que lê o arquivo, soma por loja e devolve lojas, período, linhas e quais lojas já têm base (com a data do envio anterior). A gravação continua em `/cargas/base`.
**Rationale**: o quadro do arquivo precisa dos números antes de enviar; o arquivo é enviado duas vezes (revisar e enviar) para não guardar estado no servidor.
**Alternatives considered**: guardar o arquivo no servidor entre as duas chamadas (estado novo, limpeza e tabela nova).

**Decision**: o arquivo é lido no navegador só para nome, tamanho e extensão; todo o resto (lojas, período, erros) vem da API.
**Rationale**: o navegador não sabe as regras de colunas e lojas cadastradas.
**Alternatives considered**: ler a planilha no navegador (duplicaria a regra de colunas).

**Decision**: "Baixar lista de erros" gera um CSV no próprio navegador a partir da lista que a API já devolve (aba, linha, motivo).
**Rationale**: sem endpoint novo; a lista já está completa na resposta.
**Alternatives considered**: endpoint que devolve o CSV (mais uma rota para o mesmo dado).

**Decision**: componentes novos em `components/importacao`, sem alterar o `Modal` compartilhado.
**Rationale**: o `Modal` atual é usado em outras telas e não tem foco preso nem devolução de foco; mexer nele muda telas que não fazem parte do pedido.
**Alternatives considered**: evoluir o `Modal` para todos (escopo maior, risco em outras telas).

**Decision**: a área de envio é um `<button>` de verdade (com arrastar e soltar por cima) e o `<input type="file">` fica escondido e acionado por ele; o arquivo escolhido é anunciado numa região `aria-live="polite"`.
**Rationale**: atende teclado, leitor de tela e o requisito de não expor o campo nativo.
**Alternatives considered**: `div` com `role="button"` (mais código para o mesmo efeito).

**Decision**: o foco fica preso por um hook próprio (Tab e Shift+Tab circulam; ao fechar o foco volta ao elemento que abriu) e o corpo da página não rola enquanto o modal está aberto.
**Rationale**: não há biblioteca de modal no projeto e o hook é pequeno.
**Alternatives considered**: instalar uma biblioteca (tecnologia nova exige justificativa).

**Decision**: o aviso de sucesso depois de fechar é um banner global (`role="status"`), mostrado por um provedor simples que desaparece sozinho.
**Rationale**: hoje não existe aviso global, e o modal já terá fechado.
**Alternatives considered**: manter o modal aberto com o resultado (contraria o board: fechar e avisar).

**Decision**: o limite de 10 MB da API aparece na legenda da área de envio e a API devolve a mensagem de "arquivo acima do limite" no formato dos outros erros.
**Rationale**: o limite já existe; a spec manda mostrá-lo se existir.
**Alternatives considered**: não anunciar o limite (a pessoa só descobriria no erro).
