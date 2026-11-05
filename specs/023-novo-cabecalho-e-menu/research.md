# Research: Novo cabeçalho e menu lateral (Radar)

**Decision**: casca em `shell/`, extraída de `App.jsx`, sem biblioteca de rotas.
**Rationale**: o projeto já navega por estado e endereço simples (`?tela=`); trocar isso é fora do pedido.
**Alternatives considered**: introduzir uma biblioteca de rotas (muda rotas e testes; fora do escopo).

**Decision**: ícones como SVG embutido (loja, calendário, prancheta, play, envio, menu, seta).
**Rationale**: são 7 formas simples; uma biblioteca de ícones inteira não se justifica (constituição III).
**Alternatives considered**: pacote Lucide (nova dependência); PNGs do desenho (não herdam cor nem escalam bem).

**Decision**: menu recolhido com painel ao lado para itens com subitens.
**Rationale**: o Alquimia não traz um padrão; o painel evita expandir o menu e mantém o desenho de 72 px.
**Alternatives considered**: expandir o menu temporariamente (muda a largura do conteúdo ao clicar).

**Decision**: preferência do menu em `localStorage`, com leitura e escrita protegidas; padrão = aberto em tela larga, recolhido em tela estreita.
**Rationale**: é uma preferência de cada pessoa neste navegador; guardar no servidor exigiria login e banco.
**Alternatives considered**: guardar no servidor (sem login hoje); no endereço (polui e vaza para quem compartilha o link).

**Decision**: horas de funcionamento calculadas na tela, a partir do `horarios` que `/lojas` já devolve.
**Rationale**: o dado já está carregado; evita um pedido novo e um campo novo na API. Conferido: Sumaré - Centro dá 77 h (5 × 13 + 12), igual ao desenho.
**Alternatives considered**: campo novo na API (mudança de servidor sem necessidade).

**Decision**: o filtro de Loja e o Importar sobem para a casca, e a Escala passa a receber `lojaId` e `seção` por props.
**Rationale**: é o único jeito de ter um seletor só, que sobrevive à troca de tela. A Escala só perde o que a casca passa a oferecer.
**Alternatives considered**: manter o seletor dentro da Escala e espelhar na faixa (dois estados que podem divergir).

**Decision**: a faixa de contexto aparece só nas telas da Escala.
**Rationale**: em Minhas Lojas a loja é escolhida abrindo a própria lista, e em Grupos não há loja; um filtro ali enganaria. Registrado na entrega para você confirmar.
**Alternatives considered**: faixa em todas as telas (filtro sem efeito em duas delas).

**Decision**: o bloco "Demonstração" é controlado por `VITE_MODO_DEMONSTRACAO` (ligado quando ausente); "Sair" enquanto não houver login volta o papel e o grupo ao padrão de demonstração.
**Rationale**: sem login, não há sessão para encerrar; manter o botão cumpre o desenho sem fingir uma saída que não existe. Quando o login chegar, só esse botão muda.
**Alternatives considered**: esconder o "Sair" até haver login (o desenho o mostra).

**Decision**: testes de lógica em Vitest; interação conferida no navegador.
**Rationale**: o projeto não tem testing-library nem Storybook e a regra do projeto é não acrescentar ferramenta sem pedido; as regras que importam (quem vê o quê, item atual, persistência, horas) são puras.
**Alternatives considered**: instalar testing-library e jsdom (acréscimo de ferramenta fora do pedido).
