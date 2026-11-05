# Feature Specification: Novo cabeçalho e menu lateral (Radar)

**Feature Branch**: `feat/novo-cabecalho-e-menu`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Novo cabeçalho e menu lateral da ferramenta de Escala (Radar Suite), conforme o quadro \"Header para o menu A · 2 · Barra limpa e faixa de contexto\": barra superior com botão de recolher menu, logo do Radar e conta; menu lateral aberto e recolhido; faixa de contexto com horas de funcionamento, filtro único de Loja e botão Importar; menu da conta com Grupo, Papel (demonstração) e Sair. Só a casca: não muda o conteúdo nem a lógica das telas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar pelo menu lateral e recolhê-lo (Priority: P1)

A pessoa vê, à esquerda, o menu com **Minhas Lojas** (Lojas e, só para o operador, Parâmetros legais), **Escala** (Diagnóstico e Simulações) e, só para o operador, **Grupos**. O item da tela atual aparece destacado. Um botão de três linhas na barra superior recolhe o menu para só ícones e o abre de novo; a escolha é lembrada na próxima vez.

**Why this priority**: É a navegação de toda a ferramenta; sem ela as demais partes não têm onde morar.

**Independent Test**: Abrir a ferramenta, recolher o menu, recarregar a página e ver o menu ainda recolhido; clicar em Diagnóstico e em Simulações e ver a tela certa com o item destacado.

**Acceptance Scenarios**:

1. **Given** o menu aberto, **When** a pessoa clica no botão de recolher, **Then** o menu mostra só ícones, com a mesma altura por item e o destaque do item atual.
2. **Given** o menu recolhido, **When** a pessoa passa o mouse ou foca um ícone, **Then** aparece uma dica com o nome do item.
3. **Given** o menu recolhido e a página recarregada, **When** a ferramenta abre, **Then** o menu continua recolhido.
4. **Given** um perfil que não é operador, **When** o menu é mostrado, **Then** não existem "Grupos" nem "Parâmetros legais".
5. **Given** o menu recolhido, **When** a pessoa clica em Minhas Lojas ou em Escala, **Then** os subitens aparecem num pequeno painel ao lado do ícone, e escolher um deles leva à tela certa.
6. **Given** uma tela estreita (celular), **When** a ferramenta abre, **Then** o menu começa recolhido e o botão da barra o abre por cima do conteúdo, fechando com Esc ou ao clicar fora.

---

### User Story 2 - Trocar de loja e importar planilhas num só lugar (Priority: P1)

Logo abaixo da barra superior há uma faixa com as **horas de funcionamento por semana** da loja escolhida à esquerda e, à direita, o **filtro de Loja** e o botão **Importar**. Esse é o único lugar para trocar de loja; nenhuma tela repete o seletor.

**Why this priority**: Evita seletores duplicados e deixa o contexto (qual loja) sempre à vista.

**Independent Test**: Trocar a loja na faixa e ver o Diagnóstico e as Simulações da nova loja, e a faixa mostrar as horas dela; clicar em Importar e abrir o mesmo fluxo de envio de planilhas que existe hoje.

**Acceptance Scenarios**:

1. **Given** a loja "1099 · Sumaré - Centro" escolhida, **When** a faixa é mostrada, **Then** ela exibe as horas de funcionamento por semana dessa loja (por exemplo "77h de funcionamento por semana").
2. **Given** uma loja nova escolhida no filtro, **When** a pessoa troca de tela, **Then** a loja continua a mesma.
3. **Given** a pessoa com permissão de enviar planilhas, **When** clica em Importar, **Then** abre o envio de planilhas que já existe.
4. **Given** uma pessoa só com consulta, **When** a faixa é mostrada, **Then** o botão Importar não aparece.
5. **Given** uma tela abaixo de 1024 px, **When** a faixa é mostrada, **Then** o texto de horas fica numa linha e o filtro com o Importar na de baixo; abaixo de 600 px, o Importar mostra só o ícone.

---

### User Story 3 - Conta e papel no avatar (Priority: P2)

No canto direito da barra, o avatar com a seta abre o menu da conta: nome e papel da pessoa e **Sair**. Em ambiente de demonstração, o menu também mostra o bloco "Demonstração" com os seletores de Grupo e Papel; em produção esse bloco não aparece.

**Why this priority**: Organiza a barra, mas a navegação e o contexto funcionam sem ele.

**Independent Test**: Abrir o menu da conta, trocar o papel (em demonstração) e ver o menu e as telas mudarem; fechar com Esc e ver o foco voltar ao avatar.

**Acceptance Scenarios**:

1. **Given** o ambiente de demonstração, **When** o avatar é clicado, **Then** o menu mostra nome, papel, os seletores de Grupo e Papel e "Sair".
2. **Given** o ambiente de produção, **When** o avatar é clicado, **Then** só aparecem nome, papel e "Sair".
3. **Given** o menu da conta aberto, **When** a pessoa aperta Esc, clica fora ou escolhe uma opção, **Then** ele fecha e o foco volta ao avatar.

---

### Edge Cases

- Grupo sem nenhuma loja: o filtro mostra que não há lojas e o Importar continua disponível a quem pode enviar planilhas.
- Loja sem horário de funcionamento cadastrado: a faixa não mostra o texto de horas (sem número inventado).
- O armazenamento do navegador indisponível: o menu abre no padrão (aberto em tela larga, recolhido em tela estreita) e a ferramenta segue funcionando.
- Trocar o papel para um que não vê a tela atual (por exemplo, sair do operador estando em Grupos): a pessoa vai para a primeira tela permitida.
- Alterações não salvas no cadastro: trocar de tela ou de loja continua pedindo confirmação, como hoje.
- Pessoa que usa só teclado: consegue chegar a todos os controles, com foco visível, e o item atual é anunciado como página atual.
- Movimento reduzido nas preferências do sistema: a abertura e o fechamento do menu não usam animação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A ferramenta MUST ter uma barra superior fixa de 80 px com, da esquerda para a direita, o botão de recolher/expandir o menu, o logo do Radar e o avatar da conta; sem caixa de avisos ou notificações.
- **FR-002**: O menu lateral MUST ter o estado aberto (280 px) e o recolhido (72 px, só ícones), com itens de 56 px de altura, sem divisores, e só o item atual destacado (fundo azul claro e barra lateral na cor principal).
- **FR-003**: O menu MUST ter, nesta ordem: Minhas Lojas (subitem Lojas e, só para o operador, Parâmetros legais), Escala (subitens Diagnóstico e Simulações) e, só para o operador, Grupos.
- **FR-004**: No menu recolhido, cada item MUST ter nome acessível e dica com o nome ao passar o mouse ou receber foco, e os itens com subitens MUST abrir um painel ao lado com os subitens.
- **FR-005**: A escolha entre menu aberto e recolhido MUST ser lembrada entre visitas; em tela estreita o menu MUST começar recolhido e abrir por cima do conteúdo, fechando com Esc e ao clicar fora.
- **FR-006**: Uma faixa de contexto de 64 px MUST aparecer abaixo da barra, com as horas de funcionamento por semana da loja escolhida à esquerda e, à direita, o filtro de Loja (280 px) e o botão Importar.
- **FR-007**: O filtro da faixa MUST ser o único seletor de loja da ferramenta; a loja escolhida MUST valer para Diagnóstico e Simulações e permanecer ao trocar de tela.
- **FR-008**: O botão Importar MUST abrir o envio de planilhas que existe hoje, aparecer só para quem tem permissão de enviar, e ter o nome acessível "Importar planilhas".
- **FR-009**: O menu da conta MUST abrir pelo avatar com nome, papel e "Sair"; o bloco "Demonstração" (Grupo e Papel) MUST aparecer só em ambiente de demonstração; ele fecha com Esc, clique fora e ao escolher uma opção, devolvendo o foco ao avatar.
- **FR-010**: O cabeçalho da página (trilha, título e subtítulo) MUST continuar dentro do conteúdo, sem controles ao lado; o aviso de estimativa permanece logo abaixo do título.
- **FR-011**: A ferramenta MUST usar o design system Alquimia (cores, espaçamento, raios, fonte e ícones), sem valores soltos.
- **FR-012**: A navegação MUST ser acessível: marcos da página (barra, menu principal, conteúdo), ordem de tabulação lógica, foco visível, item atual anunciado, alvos de toque de pelo menos 40 px (44 px no celular) e contraste AA.
- **FR-013**: Esta entrega MUST NOT alterar o conteúdo, os cálculos, as rotas nem as regras de permissão das telas; só a casca (barra, menu e faixa).
- **FR-014**: Trocar de tela com alterações não salvas MUST continuar pedindo confirmação.

### Key Entities *(include if feature involves data)*

- **Preferência do menu**: se a pessoa deixou o menu aberto ou recolhido; guardada no próprio navegador, não no servidor.
- **Contexto atual**: o grupo, a loja e o papel escolhidos, que a barra, o menu e as telas compartilham.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em qualquer tela, a pessoa troca de loja em um único lugar, em no máximo 2 cliques, e todas as telas passam a mostrar a nova loja.
- **SC-002**: Ao recarregar a página, o menu volta exatamente ao estado (aberto ou recolhido) em que foi deixado, em 100% das vezes em que o navegador permite guardar a preferência.
- **SC-003**: Toda a casca (menu, faixa, botão Importar e menu da conta) é operável só com o teclado, com foco visível em todos os controles.
- **SC-004**: Nenhuma tela existente muda de conteúdo ou de resultado: os números e textos de Diagnóstico, Simulações e Cadastro permanecem iguais aos de antes.
- **SC-005**: A casca funciona sem rolagem horizontal da página em larguras de 360 px até 1440 px.

## Assumptions

- **Decisão (menu)**: "Minhas Lojas" é o atual Cadastros, com os subitens Lojas e Parâmetros legais (este só para o operador). *Por quê*: confirmado com a pessoa; mantém as rotas e as permissões de hoje.
- **Decisão (Grupos)**: continua só para o operador, como item próprio do menu, depois de Escala. *Por quê*: não aparece no desenho, mas já existe e não deve sumir.
- **Decisão (menu recolhido)**: os itens com subitens abrem um painel ao lado do ícone. *Por quê*: o design system não tem um padrão pronto para isso e o painel evita expandir o menu inteiro.
- **Decisão (logo)**: usa o arquivo do Radar do próprio desenho (imagem com fundo transparente, 28 px de altura). *Por quê*: o repositório não tinha o logo.
- **Decisão (ícones)**: os do desenho (loja, calendário, prancheta, play, envio), embutidos na tela, sem nova biblioteca. *Por quê*: são poucos e não valem uma dependência.
- **Decisão (Demonstração)**: o bloco aparece enquanto o login real não existe, controlado por uma configuração do ambiente (ligado na demonstração e no ambiente local; desligado quando houver login). *Por quê*: o sistema ainda não tem login e hoje a troca de papel e grupo é feita assim.
- **Decisão (testes)**: a lógica da casca (estado do menu, persistência, textos e regras de quem vê o quê) é testada em arquivos puros, como o resto da tela; cliques e foco são conferidos no navegador. *Por quê*: o projeto não tem ferramenta de teste de componente e instalar uma não faz parte desta entrega.
- **Decisão (importar)**: o botão abre o mesmo fluxo de envio de planilhas que existe hoje, para quem pode escrever na loja. *Por quê*: o desenho pede o mesmo fluxo e não mudar permissões.
- Fora desta entrega: o conteúdo das telas, as rotas, o login real, a Visão do grupo e qualquer nova tela.
