# Estados da tela que o board não desenhou (para aprovação)

Texto e comportamento propostos. Peço a sua aprovação deste quadro antes de implementar.

## Enviando
- Dentro da área onde estava o arquivo: barra de progresso indeterminada e o texto "Lendo a planilha…" (revisão) ou "Enviando…" / "Gravando…".
- O modal **não fecha** (× e Esc ficam sem efeito) e os botões "Cancelar", "Trocar arquivo" e o principal ficam desabilitados, com `aria-busy="true"` na janela.
- O estado é anunciado numa região `aria-live="polite"`.

## Erro de arquivo (no lugar do quadro do arquivo)
- Caixa com fundo `--func-attention-100`, ícone de alerta e texto (nunca só cor), com o motivo e como corrigir. Exemplos:
  - Formato: "Este arquivo não é .xlsx nem .csv. Salve a planilha em um desses formatos e envie de novo."
  - Coluna: "Não encontramos a coluna Hora. Baixe o modelo e confira os nomes das colunas."
  - Vazio: "A planilha está vazia. Preencha a partir da linha 2 do modelo e envie de novo."
  - Tamanho: "O arquivo tem mais de 10 MB. Divida a planilha em arquivos menores."
- O botão principal fica desabilitado; "Escolher arquivo" continua ativo para tentar de novo.

## Sucesso
- O modal fecha e o foco volta ao botão que o abriu.
- Banner no alto da tela (`role="status"`, some sozinho em ~8 s ou ao fechar): "X lojas e Y funcionários gravados." (lojas e funcionários) ou "Base comercial enviada para N lojas." (base comercial). Se houve linhas recusadas: "… N linhas não foram gravadas."
- A tela por trás já mostra os dados novos.

## Falha de conexão no envio
- Volta ao estado anterior (arquivo continua escolhido), com a caixa de erro: "Não conseguimos enviar agora. Confira a conexão e tente de novo." Nada fica gravado pela metade.
