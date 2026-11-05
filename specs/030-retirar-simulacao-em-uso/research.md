# Research: Retirar "Marcar como em uso"

**Decision**: a conversão das simulações existentes é uma migration só de dados: `UPDATE simulacoes SET status='gravada' WHERE status IN ('em_uso','substituida')`.
**Rationale**: é versionada, roda sozinha na publicação, vale para o banco local e o de produção e é o jeito que a constituição pede para mexer em dados do banco.
**Alternatives considered**: script manual (esqueceria a produção); converter na leitura (o banco ficaria com estados que o sistema não conhece).

**Decision**: os valores `em_uso` e `substituida` continuam no tipo de estado do banco; o código só deixa de gravá-los.
**Rationale**: remover um valor de um tipo do Postgres exige recriar o tipo e a coluna, sem ganho para o pedido; deixar o valor sem uso é seguro e reversível.
**Alternatives considered**: recriar o tipo sem os valores (migration de estrutura mais arriscada).

**Decision**: o tipo `SimulacaoStatus` do código (e as respostas da API) passam a ter só `rascunho`, `gravada` e `descartada`; o mapeamento do banco trata `em_uso` e `substituida`, se aparecerem, como `gravada` (defesa).
**Rationale**: a API e a tela deixam de conhecer os estados extintos, e nada quebra se algum registro antigo escapar.
**Alternatives considered**: manter os estados no tipo (a tela continuaria precisando tratá-los).

**Decision**: as colunas `aprovada_por`, `aprovada_em`, `vigencia_inicio` e `substituida_em` ficam como estão e deixam de ser lidas e escritas pela API.
**Rationale**: o pedido é "sem perder nada"; apagá-las é irreversível e fora do pedido.
**Alternatives considered**: removê-las (migration destrutiva).

**Decision**: a comparação deixa de incluir a simulação "em uso" e de calcular `referenciaId`, `referencia`, `podeAprovar` e `diferencaMensalFrenteEmUso`; cada simulação mostra seus próprios números.
**Rationale**: sem o conceito de "em uso" não há referência a buscar.
**Alternatives considered**: usar a primeira das escolhidas como referência (cria uma base fixa que o pedido manda tirar).

**Decision**: a síntese de cada simulação descreve só ela mesma ("cobre X% das horas exigidas", vagas, horas que faltam) e, quando há erro, diz "tem N erro(s) nas regras".
**Rationale**: o texto atual compara com a em uso e fala em aprovar.
**Alternatives considered**: comparar duas a duas na síntese (texto novo, fora do pedido).

**Decision**: `Aprovar.jsx` é apagado e o botão, a janela, o aviso de desatualizada e a linha de vigência da lista saem junto; os rótulos dos estados extintos saem dos mapas de estado.
**Rationale**: código morto depois da mudança.
**Alternatives considered**: manter o componente sem uso (peso morto).
