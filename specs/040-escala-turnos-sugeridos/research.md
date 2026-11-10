# Pesquisa: Escala por hora com turnos sugeridos e arrastar mais fácil

## Decisão 1: tudo na tela, sem mudar o servidor
- **Decision**: a sugestão de turnos, a prévia, criar e tirar turno são feitos na tela com funções puras; o servidor não muda. As gravações usam as chamadas que já existem (`PUT` com `vagas` e `turnos`).
- **Rationale**: a tela já recebe a cobertura por dia e função (com o mínimo de cada hora), os turnos, o quadro e a regra; a conta da sugestão é a mesma da sugestão do formulário (spec 039), só que por vaga.
- **Alternatives considered**: calcular no servidor ao criar a vaga (porta a regra para o servidor e duplica a da tela).

## Decisão 2: turno sugerido já no Personalizar, em duas gravações
- **Decision**: ao criar a simulação pelo Personalizar, depois de gravar as vagas e o horário do cenário, a tela calcula os turnos das vagas sobre a cobertura devolvida e os grava numa segunda chamada.
- **Rationale**: a cobertura certa só existe depois de o horário do cenário e as vagas estarem na simulação (o horário do cenário muda os dias abertos).
- **Alternatives considered**: mandar vagas já com turnos antes de saber a cobertura (os turnos ficariam sobre um horário que ainda não existe).

## Decisão 3: como os dias e o horário de uma vaga são escolhidos
- **Decision**: parcial usa o menor número de dias com até 6 horas por dia (sem intervalo); integral usa a jornada cheia da regra nos dias que ela permite, com 1 hora de intervalo quando passa de 6 horas. A janela é a que cobre mais horas sem cobertura da função (mesma janela em todos os dias), e os dias são os que mais ganham com ela. Uma vaga seguinte da mesma função parte da cobertura já com a anterior.
- **Rationale**: é o limite sem intervalo e a jornada da regra que o sistema já usa; a mesma janela em todos os dias combina com o formulário (um Entra e um Sai).
- **Alternatives considered**: janelas diferentes por dia (não cabe no formulário e dificulta o ajuste).

## Decisão 4: a prévia é o estado do formulário, na grade
- **Decision**: o estado do formulário (tipo, dias, entra, sai) sobe para a seção; a grade desenha a barra de prévia a partir dele, e arrastar a barra muda Entra e Sai. Nada é gravado até "Adicionar à simulação".
- **Rationale**: uma só fonte de verdade para o formulário e para a barra.
- **Alternatives considered**: duas cópias sincronizadas (divergem).

## Decisão 5: criar e tirar turno
- **Decision**: "Folga" clicável cria um turno com o horário mais frequente da pessoa em outros dias (ou, sem histórico, a abertura do dia com a jornada diária da regra); "Tirar do dia" remove o turno selecionado. As duas mudanças usam a gravação de turnos de hoje.
- **Rationale**: é o que a pessoa faria na mão; as regras de dias e horas por semana aparecem como avisos, não como bloqueio (como o resto da escala).
- **Alternatives considered**: bloquear a criação quando passa do limite (mudaria uma regra do produto).

## Decisão 6: erro junto da escala
- **Decision**: a seção recebe o erro do hook de simulação e o mostra no topo dela depois de uma gravação de turno que falhou; o turno já volta ao anterior (comportamento atual).
- **Rationale**: a mensagem fica onde a pessoa está mexendo.

## Pontos em aberto
Nenhum.
