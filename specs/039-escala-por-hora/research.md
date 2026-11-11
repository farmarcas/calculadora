# Pesquisa: Escala por hora

## Decisão 1: a seção ocupa a largura toda, abaixo da grade da Simulação
- **Decision**: a "Escala por hora" é uma seção própria, em largura total, logo abaixo da grade atual (passos e painel de resultado) da tela Personalizar. Os passos e o painel não mudam.
- **Rationale**: a grade tem coluna de pessoa (300 px), cerca de 15 horas e a coluna da semana: precisa de uns 900 px. A coluna da esquerda da Simulação e o painel de resultado ficam estreitos para isso.
- **Alternatives considered**: um quarto passo na coluna da esquerda (aperta a grade); trocar o passo Contratações (perde a visão por tipo e carga).

## Decisão 2: a contratação simulada é uma vaga com turnos
- **Decision**: "Adicionar à simulação" cria uma vaga da simulação e os turnos dela, numa única chamada. A vaga aceita um campo opcional `turnos` (dia, entrada, saída), e o servidor dá a matrícula `VAGA-n` aos turnos novos.
- **Rationale**: hoje uma vaga não cobre nada sem turnos, e os turnos precisam da matrícula da vaga, que o servidor só atribui ao criar. Sem isso a tela teria de adivinhar o número da vaga ou fazer duas gravações.
- **Alternatives considered**: duas chamadas em sequência (estado intermediário com vaga sem turnos e risco de falha no meio).

## Decisão 3: cobertura por dia e por função já existe; falta o mínimo por hora
- **Decision**: usar `avaliacao.cobertura` (por dia, função e hora, já devolvida a todos os perfis) e acrescentar a cada célula o `exigido` da hora.
- **Rationale**: com `exigido` a tela marca "N !" e escreve "mín. N" e "reforço" sem recalcular regra de turno no navegador.
- **Alternatives considered**: calcular a exigência na tela (duplica a regra dos turnos).

## Decisão 4: sugestão e cobertura em tempo real no navegador, efeito de custo no servidor
- **Decision**: a sugestão do formulário e a cobertura ao arrastar, adicionar ou remover são calculadas na tela, por funções puras testadas, a partir dos turnos e do `exigido`. O servidor devolve só o que depende de salário: o custo de pessoal em % de uma contratação, num endpoint de prévia que não grava nada e só responde ao dono.
- **Rationale**: a cobertura precisa responder em menos de 1 segundo enquanto se arrasta; o custo depende dos salários, que só o dono vê.
- **Alternatives considered**: tudo no servidor (cada arrasto vira uma chamada); custo na tela (precisaria dos salários).

## Decisão 5: arrastar grava ao soltar
- **Decision**: durante o arrasto a tela mostra o turno e a cobertura de forma local; ao soltar, grava o conjunto de turnos da simulação (mesma chamada de hoje, `PUT` com `turnos`).
- **Rationale**: uma gravação por gesto, sem sobrecarregar o servidor, e a avaliação oficial volta junto.
- **Alternatives considered**: gravar a cada movimento.

## Decisão 6: erros de turno avisam e não impedem gravar
- **Decision**: as verificações de jornada, intervalo e interjornada aparecem como avisos junto da grade; elas não travam "Salvar como cenário".
- **Rationale**: é como o produto trata a escala por turno hoje (o servidor já diz que essas regras não travam a gravação).
- **Alternatives considered**: bloquear a gravação (mudaria uma regra do produto).

## Decisão 7: efeito na venda
- **Decision**: o efeito na venda mostra o que o sistema já calcula: a venda só muda com o horário da loja, então contratar sem mudar o horário mostra "● 0%". O "+0,9% (estimado)" do board não é implementado.
- **Rationale**: não existe regra de quanto cobrir uma falta aumenta a venda, e não vamos inventar um número.
- **Alternatives considered**: um percentual fixo (inventado).

## Decisão 8: parcial e integral
- **Decision**: Integral usa a jornada cheia da regra e a quantidade de dias que ela permite; Parcial usa as horas dos dias escolhidos (soma dos turnos, descontado o intervalo), de 4 a 30 horas por semana, arredondadas para a hora inteira que a vaga aceita.
- **Rationale**: é o limite da vaga (4 a 44 horas, inteiras) e o limite legal do parcial (30 horas) que o sistema já usa.
- **Alternatives considered**: aceitar horas quebradas (a vaga não aceita).

## Decisão 9: ordem dos PRs
- **Decision**: a branch nasce em cima de `feat/simulacao-resultado-em-horas` (que nasce em `feat/cenarios-em-linhas`).
- **Rationale**: o efeito na semana reaproveita as porcentagens do resultado em horas e os componentes das linhas de cenário.

## Pontos em aberto
Nenhum.
