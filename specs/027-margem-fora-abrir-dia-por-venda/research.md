# Research: Margem fora do dia a dia e "abrir um dia" por venda

**Decision**: a margem salva fica dentro do faturamento da loja e toda gravação passa a **preservar** esse valor (ignora o que vier no pedido).
**Rationale**: a margem é um campo do mesmo JSON do faturamento; a tela, que não envia mais a margem, substituiria o JSON inteiro e a apagaria. Preservar na gravação resolve a tela, o PUT da loja e a importação de uma vez, sem migration.
**Alternatives considered**: mover a margem para uma coluna própria (migration e backfill sem ganho); aceitar a margem enviada (um cliente antigo poderia alterá-la sem ninguém ver).

**Decision**: a coluna de margem sai do modelo de planilha de Lojas e a leitura da planilha deixa de lê-la. Coluna extra em planilha antiga é simplesmente ignorada, como qualquer coluna desconhecida.
**Rationale**: o importador só lê as colunas que conhece; não existe aviso de "coluna desconhecida" a evitar, então "aceitar sem erro" vem de graça. Uma margem inválida (>100%) antiga deixa de recusar a linha.
**Alternatives considered**: manter a coluna lida mas descartada (código a mais sem uso).

**Decision**: o resultado do "abrir dia" vira `saldoMensal = venda estimada − custo adicional de folha` (positivo é bom), no lugar de `impactoMensal = custo − margem`.
**Rationale**: é a mesma leitura da Simulação ("venda a mais menos folha a mais") e sinal positivo = ganho. Nenhuma tela consome o campo antigo.
**Alternatives considered**: manter o nome e o sinal antigos (confunde com o saldo da Simulação).

**Decision**: a venda estimada do dia novo reaproveita a regra atual: histórico próprio quando há; senão `fatorDiaNovo` (50%) da média dos dias abertos.
**Rationale**: é o que o motor já faz para a venda; só deixa de duplicar a conta para a margem.
**Alternatives considered**: usar 50% da hora vizinha como a Simulação (é outra situação: aqui é o dia inteiro).

**Decision**: remover o desvio "sem venda por hora, usar margem do dia" (`perdaPonderada` com `margemMes`) e o `melhorCombinacao` por margem se nenhum cenário os chama.
**Rationale**: sem venda por hora o cenário principal já fica indisponível antes desse ponto; é código morto que ainda carrega a margem.
**Alternatives considered**: deixar (mantém a margem viva em código que ninguém roda).

**Decision**: a coluna `margem` da base comercial continua sendo lida e gravada (tabela de vendas por hora), mas deixa de ser somada em qualquer conta.
**Rationale**: pedido de manter guardado; o custo é zero.
**Alternatives considered**: parar de gravar (perderia o dado que já vem do arquivo).

**Decision**: sem migration e sem apagar nada do banco.
**Rationale**: constituição e pedido; remover a margem do JSON pode vir depois, com confirmação.
