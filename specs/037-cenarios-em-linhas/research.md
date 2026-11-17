# Pesquisa: Cenários em linhas, sem valores em reais

## Decisão 1: um bloco novo de dados, só com o que a linha precisa
- **Decision**: o diagnóstico passa a devolver, por regra (42h e 40h), uma lista `linhas` com os três cenários já prontos para desenhar (status, causa, contratar, horário por dia, variação de venda e de custo de pessoal em %, estado indisponível). O bloco `comparativo` de hoje continua como está.
- **Rationale**: hoje o gestor e a consulta recebem os cenários sem custos e sem venda (para esconder os reais), então não têm as variações em % nem o Equilíbrio. O pedido é que as linhas sejam iguais para os três perfis. Um bloco novo, feito só de porcentagens, horários e textos, resolve isso sem relaxar nenhuma regra dos demais campos e sem mexer em quem já consome o `comparativo` (cenários salvos, Simulação).
- **Alternatives considered**: soltar os valores para o gestor e esconder só na tela (vaza o dado); mudar o `comparativo` (arrisca a Simulação e os cenários salvos).

## Decisão 2: calcular as linhas com os custos, para todos os perfis, e devolver só %
- **Decision**: o servidor monta as linhas a partir de um cálculo que usa os salários e a venda da loja (como o do dono), para qualquer perfil, e a resposta só leva porcentagens, horas e textos. Nenhum valor em reais, e nenhum salário, sai.
- **Rationale**: a variação do custo de pessoal (%) precisa da folha atual; a da venda precisa da venda e do faturamento. Em % não dá para voltar ao valor em reais sem a base. O Equilíbrio só fica indisponível para o gestor quando os custos não foram informados.
- **Alternatives considered**: calcular as % só no navegador (precisaria dos reais lá).

## Decisão 3: status e causa decididos no servidor
- **Decision**: uma função pura (`escala/linhas-cenarios.ts`) escolhe o status pela ordem de prioridade (Inviável, Não resolve sozinho, Não recomendado, Vende mais, Perde venda, Equipe menor que hoje, Cobre o horário) e uma única causa para a faixa amarela.
- **Rationale**: o status depende de campos que variam por perfil (venda ganha e perdida); decidir no servidor garante que os três perfis vejam o mesmo status, e a tela só desenha.
- **Alternatives considered**: decidir na tela com os campos atuais (o gestor não tem venda perdida nem ganha).

## Decisão 4: base dos %
- **Decision**: venda = (venda estimada das horas novas − venda que deixa de entrar) ÷ faturamento mensal de referência (venda real, mesmo quando a medida dos cenários é a margem); custo de pessoal = custo adicional de folha ÷ folha atual. Uma casa decimal. Zero vira "● 0%".
- **Rationale**: é o que o sistema já usa para os "% do faturamento" e para o acréscimo da folha; só ficava escondido dos outros perfis.
- **Alternatives considered**: % da margem (o quadro fala em venda).

## Decisão 5: a faixa dos 7 dias vem do horário que a tela já tem
- **Decision**: a tela monta a faixa a partir do horário da semana de cada cenário (já devolvido) contra o horário de hoje, mostrando sempre as horas do dia; o servidor devolve o horário do Equilíbrio dentro de `linhas`, porque o do Equilíbrio público pode estar indisponível para o gestor.
- **Rationale**: a conta de horas por dia já existe e tem testes; só muda o desenho.

## Decisão 6: componentes antigos saem
- **Decision**: o cartão, a faixa de resultado, o bloco de horário e o painel "Ver todos os dias" deixam de ser usados e são removidos junto com as regras que só eles usavam.
- **Rationale**: a linha já mostra o horário de cada dia; código morto confunde.
- **Alternatives considered**: deixar arquivos sem uso (mais difícil de manter).

## Decisão 7: Personalizar continua igual
- **Decision**: o botão cria a simulação como hoje, com as contratações e os horários do cenário; para isso a linha leva `contratacoes`, `ajustes` e `diasFechar` do cenário.
- **Rationale**: o pedido manda manter o botão.

## Pontos em aberto
Nenhum.
