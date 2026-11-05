# Research: Lista e comparação de simulações

**Decision**: o resumo de cada simulação (saldo, horas abertas, folha extra, venda estimada, venda que deixa de entrar) é calculado na API pela mesma `calcularResultado` do painel, para todas as simulações da loja de uma vez, lendo a loja, a base comercial, os custos e os parâmetros **uma só vez**.
**Rationale**: o resultado gravado hoje guarda só erros e avisos, não o saldo; recalcular com a mesma função garante saldo idêntico ao do painel (SC-002), e ler os dados comuns uma vez evita o custo de repetir a leitura da base comercial por simulação.
**Alternatives considered**: guardar o saldo na gravação (precisaria de migration e de recalcular as simulações antigas; e o saldo mudaria com a base comercial depois); calcular no navegador (duplica a regra e exige a base comercial no navegador).

**Decision**: as diferenças, as cores, a base e a contagem "N de M itens mudaram" são calculadas no navegador por funções puras, a partir dos valores que a API devolve.
**Rationale**: trocar a base e filtrar "só o que mudou" ficam instantâneos e testáveis; a API não precisa saber qual é a base.
**Alternatives considered**: a API devolver as diferenças (uma chamada por troca de base, e acoplaria a regra de cor à API).

**Decision**: a ordem das simulações enviadas à comparação define a base (a primeira); "Usar como base" só reordena a lista no navegador, sem nova chamada.
**Rationale**: é a regra do board e dispensa estado novo no servidor.
**Alternatives considered**: um campo "base" na API (estado sem necessidade).

**Decision**: a situação "Desatualizada" volta como regra pura (`desatualizada.ts`), aplicada a toda simulação **gravada**: compara o quadro, o horário de funcionamento, o mínimo por função e a convenção da loja com o retrato gravado nas premissas. É a regra antiga da "em uso" (recuperada do histórico), sem o vínculo com aprovar.
**Rationale**: o board pede o selo; a regra já foi escrita e testada.
**Alternatives considered**: deixar a regra de fora (contraria o board); marcar como desatualizada qualquer mudança no Cadastro (muito ruidoso).

**Decision**: o tipo do cenário é calculado comparando `horasAbertas` da simulação com `horasAbertasAntes` (as da loja) que o resultado já traz: maior = "amplia", menor = "reduz", igual = "mantem".
**Rationale**: os dois números já existem no resultado.
**Alternatives considered**: gravar o tipo na simulação (estado novo).

**Decision**: o nome de quem criou vem de um mapa legível do perfil guardado em `autor` (dono = "Administrador da conta", gestor = "Gestor de escala", consulta = "Consulta", plataforma = "Administrador da plataforma"); o código interno nunca sai na tela.
**Rationale**: ainda não há nome de pessoa; o board sugere esse texto.
**Alternatives considered**: guardar o nome da pessoa (exige login real, fora do escopo).

**Decision**: para quem não é dono, a API não devolve `saldoMensal`, `folhaExtra`, `vendaEstimada` nem `vendaQueSai` (o campo nem existe); a tela esconde as linhas e colunas em reais quando os campos não vêm.
**Rationale**: é a regra de acesso que já vale para valores em reais.
**Alternatives considered**: esconder só na tela (o dado chegaria ao navegador).

**Decision**: o verde de texto #3E7500 vira o token `--text-success-strong`, definido no arquivo de tokens do projeto.
**Rationale**: o board pede o token; evita cor solta no código.
**Alternatives considered**: usar o verde já existente (não tem o contraste pedido).

**Decision**: o cabeçalho fixo da tabela usa `position: sticky` dentro de um contêiner com rolagem própria; a primeira coluna também fica fixa à esquerda na rolagem horizontal.
**Rationale**: resolve o cabeçalho fixo e a tela estreita sem biblioteca.
**Alternatives considered**: virtualização de tabela (exagero para até 4 colunas e 15 linhas).

**Decision**: a dica de "Desatualizada" é um selo com `title` e texto escondido para leitor de tela ligado por `aria-describedby`.
**Rationale**: funciona com mouse, toque e leitor de tela, sem componente novo.
**Alternatives considered**: um balão próprio (mais código para o mesmo efeito).
