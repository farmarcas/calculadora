# Pesquisa: Base comercial por CNPJ (julho a outubro)

## Decisão 1: converter o total do período em média de um dia ao ler o arquivo
- **Decision**: ao ler o arquivo, cada valor (venda, CMV, tickets, unidades) é dividido pelo número de vezes que o dia da semana aparece no período informado; o banco continua guardando a média de um dia.
- **Rationale**: todos os cálculos (cenários, Simulação, cobertura) já tratam a base como "soma ÷ datas do dia da semana". Comparando as 1.784 lojas em comum, o arquivo vale 17,5× a base atual em todas elas (decis entre 17,2 e 17,9), e julho a outubro tem 17,6 semanas: é total, não média.
- **Alternatives considered**: guardar o total e o período e dividir em cada cálculo (muda todos os cálculos, risco alto); pedir a quem gera o arquivo que já mande a média (adia a entrega e não resolve o próximo envio).

## Decisão 2: datas de referência dentro do período
- **Decision**: cada dia da semana recebe como data a sua primeira ocorrência dentro do período (1º de julho de 2026 é quarta-feira, então segunda = 06/07, terça = 07/07, quarta = 01/07 …). O período declarado vai na carga (início e fim).
- **Rationale**: o cálculo já conta "datas distintas por dia da semana"; com uma data por dia da semana a soma ÷ 1 é a própria média. Datas dentro do período fazem a tela e o histórico mostrarem algo coerente, e não 2001.
- **Alternatives considered**: datas fictícias de 2001 (como o faturamento do cadastro); repetir a linha por semana (17 vezes mais linhas, sem ganho).

## Decisão 3: clientes e unidades passam a aceitar decimais
- **Decision**: migration que troca clientes e unidades da base de inteiro para decimal.
- **Rationale**: a média de tickets por hora é, por exemplo, 86 ÷ 17 = 5,06; arredondar para 5 perderia o dado nas horas de pouco movimento (1 ticket no período viraria 0). O pedido é guardar para uso futuro, então o dado tem de ser fiel. A mudança de inteiro para decimal não perde nada e não é destrutiva.
- **Alternatives considered**: arredondar (perde dado); guardar o total e o período à parte (outro formato só para isso).

## Decisão 4: leitor de planilha com arquivo grande
- **Decision**: corrigir o cálculo de largura da planilha, que quebra acima de cerca de 125 mil linhas ("Maximum call stack size exceeded"), e subir o limite de envio de 10 para 20 MB.
- **Rationale**: o arquivo tem 185 mil linhas e 15,5 MB; testei e o leitor atual quebra. É uma correção de uma linha (trocar `Math.max(...lista)` por uma soma acumulada).
- **Alternatives considered**: trocar o leitor de CSV inteiro (mais risco para os envios que já funcionam).

## Decisão 5: como reconhecer o formato
- **Decision**: se o cabeçalho tem `cnpj`, `dia_semana` e `faturamento`, é o formato por CNPJ; caso contrário segue o fluxo atual, sem mudança.
- **Rationale**: a pessoa não escolhe formato nem colunas; o formato atual (por código da loja e data) continua intacto.
- **Alternatives considered**: um segundo botão de envio (mais confuso para quem não é técnico).

## Decisão 6: lojas encontradas pelo CNPJ sem pontuação
- **Decision**: o CNPJ do arquivo e o do cadastro são comparados só pelos 14 dígitos; as lojas do GE são lidas uma vez e casadas em memória.
- **Rationale**: o cadastro tem alguns CNPJs com pontuação; 1.791 dos 1.834 casam hoje por dígitos.
- **Alternatives considered**: uma consulta por CNPJ (1.834 idas ao banco).

## Decisão 7: gravar loja por loja, em lotes
- **Decision**: cada loja é uma transação com inserção em lote (a base antiga vira inativa e a nova entra junto); algumas lojas em paralelo. O faturamento do cadastro é preenchido na mesma loja, só nos campos vazios.
- **Rationale**: uma falha numa loja não desfaz as outras; o resultado diz quais lojas foram gravadas. Cada loja tem cerca de 100 linhas, então é rápido.
- **Alternatives considered**: tudo numa transação só (uma loja ruim derruba as 1.791); fila em segundo plano (só se a medição passar de ~45 s, ver Pontos em aberto).

## Pontos em aberto
- Tempo de resposta da importação inteira (1.791 lojas). Será medido no quickstart; se passar de 45 s por causa do limite de tempo do servidor de produção, a importação vai para segundo plano com acompanhamento, em outra fatia.
