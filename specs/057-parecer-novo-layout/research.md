# Pesquisa: novo layout do parecer

- **Decision**: servidor monta o parecer já no formato do layout e a tela e o PDF só desenham. **Rationale**: o mesmo conteúdo nos dois, e a regra de "sem R$ nem %" fica no servidor. **Alternatives**: montar na tela a partir de campos soltos (o PDF teria de repetir a montagem e poderia divergir).
- **Decision**: versão 2 do parecer guardado; versão 1 é remontada ao abrir. **Rationale**: o layout precisa de pares hoje e depois que a versão 1 não guarda. **Alternatives**: migrar os pareceres antigos no banco (mexe em dados e não recupera o que não foi guardado).
- **Decision**: a diferença em R$ vem de folha depois − folha hoje, como exibidas. **Rationale**: pedido do board ("R$ 43.697 − R$ 32.584 = R$ 11.113") e evita diferença de 1 real entre cartão e tabela. **Alternatives**: usar o custo adicional arredondado (pode divergir por arredondamento).
- **Decision**: chip da folha usa a diferença dos pesos arredondados já calculada (`aumentoPp`). **Rationale**: é a regra das specs 050 e 052.
- **Decision**: foco preso, Esc e retorno do foco no `Modal` do sistema, com `subtitulo` e `rodape` opcionais. **Rationale**: acessibilidade igual para todas as janelas; mudança pequena e compatível.
- **Decision**: `baixarArquivo` passa a lançar erro quando a resposta não é 2xx. **Rationale**: hoje baixaria o texto do erro como se fosse o arquivo; o estado de erro e "Tentar de novo" dependem disso.
- **Decision**: `pdfkit` com `bufferPages` para "Página n de total". **Rationale**: o total só se sabe no fim; sem nova dependência.
- **Decision**: quebra antes de "O que muda" quando a tabela inteira não cabe no resto da página. **Rationale**: pedido do board; a tabela tem poucas linhas, então nunca é maior que uma página.
- **Decision**: a observação e o horário a mais ficam depois da tabela. **Rationale**: o board não os traz, mas as specs 049 e 056 os exigem; vêm depois para não atrapalhar o layout escolhido.
