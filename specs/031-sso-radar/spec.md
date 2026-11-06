# Feature Specification: Entrar pelo Radar (SSO) com grupos e lojas da pessoa

**Feature Branch**: `feat/sso-radar`

**Created**: 2026-11-05

**Status**: Approved

**Input**: User description: "Ao acessar o frontend, deve efetuar SSO. Usar o projeto api-authentication-dotnet criando um slug para este projeto. Ao entrar no frontend, chamar rota da API interna da calculadora que irá chamar a API de autenticação e retornar a URL para autenticação (URL do Radar), redirecionar para o login, que ao logar com sucesso será redirecionado novamente para a URL da calculadora com token gerado; esse token deve ser validado na API interna, que irá validar se o token é válido e então fornecer um JWT para manter a sessão do usuário logado na calculadora. Após o login, obter os grupos econômicos e lojas pelo token retornado da autenticação no Radar; esses dados precisam ser populados no dropdown do header das telas que usam como filtros, além de popular as lojas."

## Clarifications

### Session 2026-11-06

- Q: Como a pessoa entra, já que o `Sso/Start` só atende quem está logado no Radar? → A: Por um link no menu do Radar, igual ao Prisma. A calculadora não redireciona para o login.

### Session 2026-11-05

- Q: Qual papel do Radar vira qual papel da calculadora? → A: Sugestão aceita (FR-012).
- Q: Grupo ou loja do Radar que não existe na calculadora? → A: Criar no login, só com número, nome e CNPJ (FR-013).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar na calculadora com a conta do Radar (Priority: P1)

Quem está logado no Radar abre a calculadora pelo menu Aplicações e ela abre em outra aba já conectada, sem digitar nada, como o Prisma. Quem abre o endereço da calculadora sem sessão vê uma tela que manda voltar ao Radar, sem nenhum dado. A conexão continua valendo por um dia de trabalho, inclusive ao recarregar a página, e existe "Sair".

**Why this priority**: Hoje a calculadora está aberta: quem tiver o endereço vê e altera os dados, inclusive salários. Sem o login nenhuma das outras histórias faz sentido, e os dados reais não podem entrar antes disso.

**Independent Test**: Abrir a calculadora numa janela anônima e ver a tela "Ir para o Radar", sem nenhum dado; entrar pelo menu Aplicações do Radar e chegar à calculadora conectado; recarregar e continuar conectado.

**Acceptance Scenarios**:

1. **Given** uma pessoa logada no Radar, **When** escolhe "Calculadora" no menu Aplicações, **Then** a calculadora abre em outra aba já conectada, sem pedir usuário e senha.
2. **Given** uma pessoa sem sessão, **When** abre o endereço da calculadora, **Then** vê uma tela dizendo que o acesso é feito pelo Radar, com o botão "Ir para o Radar", e nenhum dado.
3. **Given** uma pessoa que acabou de entrar pelo Radar, **When** a calculadora abre, **Then** cai na tela inicial, sem o código do retorno no endereço.
4. **Given** uma pessoa conectada, **When** recarrega a página ou abre a calculadora em outra aba, **Then** continua conectada, sem passar pelo Radar.
5. **Given** um retorno do Radar com código inválido, vencido ou já usado, **When** a calculadora tenta validá-lo, **Then** a pessoa não entra e vê uma mensagem clara com o botão "Ir para o Radar".
6. **Given** uma pessoa conectada, **When** escolhe "Sair", **Then** a sessão da calculadora acaba, ela vê uma tela dizendo que saiu, com o botão "Ir para o Radar", e não é reconectada sozinha.
7. **Given** uma sessão que acabou durante o uso, **When** a pessoa faz a próxima ação, **Then** vê a tela "Sessão encerrada" e volta pelo menu do Radar.
8. **Given** alguém sem sessão, **When** chama qualquer rota de dados da calculadora diretamente, **Then** o pedido é recusado e nenhum dado é devolvido.

---

### User Story 2 - Ver só os próprios grupos e lojas no filtro (Priority: P1)

Depois do login, os filtros do topo mostram os grupos econômicos e as lojas a que a pessoa tem acesso no Radar. Trocar de grupo atualiza a lista de lojas e a tela. Grupos e lojas de outras pessoas não aparecem e não podem ser abertos, nem mexendo no navegador.

**Why this priority**: É o que torna o login útil: cada empresário vê o que é dele, e a escolha de grupo deixa de ser a brincadeira de "Demonstração" no menu da conta.

**Independent Test**: Entrar com uma conta do Radar ligada a 2 grupos: o filtro mostra esses 2, a lista de lojas muda ao trocar de grupo, e pedir os dados de um terceiro grupo é recusado.

**Acceptance Scenarios**:

1. **Given** uma pessoa ligada a mais de um grupo no Radar, **When** entra, **Then** o filtro de Grupo no topo lista esses grupos e o primeiro já vem escolhido, ou o último que ela usou.
2. **Given** uma pessoa ligada a um único grupo, **When** entra, **Then** vê o nome do grupo no topo, sem precisar escolher.
3. **Given** um grupo escolhido, **When** a pessoa abre o filtro de Loja, **Then** vê só as lojas dela naquele grupo.
4. **Given** uma pessoa com 2 das 5 lojas de um grupo, **When** usa a calculadora, **Then** vê e altera só essas 2, em toda tela e relatório.
5. **Given** uma pessoa conectada, **When** tenta abrir um grupo ou uma loja fora da sua lista, **Then** o pedido é recusado, como se o registro não existisse.
6. **Given** lojas ou grupos mudaram no Radar, **When** a pessoa entra de novo, **Then** os filtros refletem a mudança.
7. **Given** uma pessoa do Radar sem nenhuma loja ligada e sem papel de operador, **When** entra, **Then** vê uma tela explicando que não tem acesso e como pedir, sem nenhum dado.

---

### User Story 3 - Papel definido pelo Radar, sem modo demonstração (Priority: P1)

O que a pessoa pode fazer na calculadora passa a vir do cadastro dela no Radar. O bloco "Demonstração" (troca de grupo e de papel) some, e o menu da conta mostra o nome e o e-mail de verdade.

**Why this priority**: Enquanto o papel for escolhido em tela, qualquer pessoa conectada poderia se dar acesso aos salários. Login sem isso não protege nada.

**Independent Test**: Entrar com contas de papéis diferentes e ver que cada uma enxerga o que seu papel permite; ver que não existe mais onde trocar de papel e que forçar outro papel pelo navegador não muda nada.

**Acceptance Scenarios**:

1. **Given** uma pessoa conectada, **When** abre o menu da conta, **Then** vê seu nome, e-mail, papel e "Sair", sem o bloco "Demonstração".
2. **Given** uma pessoa conectada com papel de consulta, **When** altera pelo navegador o papel enviado à API, **Then** o servidor ignora e continua tratando-a pelo papel da sessão.
3. **Given** o papel de cada conta do Radar, **When** a pessoa entra, **Then** recebe o papel da calculadora conforme a regra de FR-012.
4. **Given** uma conta de fornecedor, indústria ou distribuidor, **When** tenta entrar, **Then** vê a tela de sem acesso.

---

### Edge Cases

- **API de autenticação fora do ar**: ao abrir pelo menu, o Radar avisa e fecha a aba; na volta, a calculadora mostra a indisponibilidade com "Tentar de novo". Nunca uma tela em branco.
- **Falha no retorno**: a calculadora para na tela de erro. Ela nunca leva a pessoa a outro lugar sozinha.
- **Sessão acaba com alterações não salvas no cadastro**: vale o aviso que já existe antes de sair da tela.
- **Grupo ou loja guardados no navegador que não são mais da pessoa**: caem no primeiro da lista dela.
- **Duas pessoas no mesmo navegador**: ao sair e entrar com outra conta, nada do grupo ou da loja da anterior é aproveitado.
- **Loja do Radar sem grupo econômico**: fica fora dos filtros e o fato é registrado, sem impedir o login.
- **Loja do Radar desativada**: fica fora dos filtros, como já acontece na carga da plataforma, que só traz lojas ativas.
- **Grupo desativado na calculadora**: continua indisponível, mesmo que o Radar o traga.
- **Tentativa de reaproveitar o endereço de retorno** (voltar no navegador, colar o link): o código só vale uma vez e por pouco tempo.

## Requirements *(mandatory)*

### Functional Requirements

**Login**

- **FR-001**: Toda tela da calculadora MUST exigir sessão válida; sem sessão, a pessoa MUST ver a tela "Ir para o Radar", sem nenhum dado.
- **FR-002**: A entrada MUST partir do menu Aplicações do Radar, que chama `Sso/Start` com o slug `Calculadora`, usando a sessão de quem está logado, e abre o `RedirectUrl` devolvido em outra aba, como o Prisma.
- **FR-003**: Quem entra pelo menu MUST chegar à calculadora sem digitar credenciais. A calculadora MUST NOT redirecionar sozinha para o login.
- **FR-004**: O retorno do Radar MUST ser validado pela API da calculadora junto à API de autenticação (`Sso/Exchange`, com o slug da calculadora), antes de qualquer sessão ser criada. Um retorno inválido, vencido ou já usado MUST ser recusado.
- **FR-005**: Retirado. O link nasce no Radar, então a calculadora não tem um login iniciado para comparar. A proteção é a mesma do Prisma: código de uso único, com validade curta, trocado com as credenciais da calculadora.
- **FR-006**: Com o retorno válido, a API da calculadora MUST emitir a sessão própria da calculadora (JWT), com prazo definido, sem expor ao navegador as credenciais da calculadora junto ao Radar nem o token do Radar.
- **FR-007**: Ao terminar o login, a pessoa MUST cair na tela inicial, sem o código no endereço.
- **FR-008**: "Sair" MUST encerrar a sessão da calculadora e MUST NOT reconectar a pessoa sozinha; o login do Radar dela continua como estava.
- **FR-009**: Todas as rotas de dados da API MUST recusar pedidos sem sessão válida. Ficam abertas só as de saúde e as do próprio login.

**Grupos, lojas e papel**

- **FR-010**: No login, a API da calculadora MUST obter do Radar, com o token recebido, os grupos econômicos e as lojas da pessoa, e guardá-los como o acesso daquela sessão.
- **FR-011**: A ligação com a calculadora MUST usar o número do grupo econômico do Radar (a "identificação" do grupo) e o CNPJ da loja.
- **FR-012**: O papel na calculadora MUST vir do cadastro da pessoa no Radar: Admin e Angel → Operador da plataforma; dono de loja (usuário de loja com ocupação Dono) → Dono do grupo, nos grupos em que é dono; demais usuários de loja → Somente consulta; Indústria, Distribuidor e Fornecedor → sem acesso.
- **FR-013**: Grupos e lojas do Radar que ainda não existem na calculadora MUST ser criados no login, só com número, nome e CNPJ; a loja criada assim MUST aparecer com os dados pendentes para o dono completar, e o que já existe na calculadora MUST NOT ser sobrescrito.
- **FR-014**: O filtro de Grupo e o filtro de Loja no topo das telas MUST listar só o acesso da pessoa; ao trocar de grupo, a loja e a tela MUST ser atualizadas.
- **FR-015**: Em todo pedido, o servidor MUST conferir grupo e loja contra o acesso da sessão, e registro fora dele MUST responder como "não encontrado".
- **FR-016**: O papel e o grupo informados pelo navegador MUST NOT conceder acesso: o papel vale só o da sessão, e o grupo só se estiver no acesso dela.
- **FR-017**: Quem entra sem nenhuma loja e sem papel de operador MUST ver a tela de sem acesso, sem dados.
- **FR-018**: O operador da plataforma MUST continuar vendo todos os grupos, como hoje, e seguir sem ver valores em reais.
- **FR-019**: O bloco "Demonstração" do menu da conta MUST sumir; o menu MUST mostrar nome, e-mail e papel reais.
- **FR-020**: As ações auditadas MUST passar a registrar quem fez, além do perfil.

**Radar e autenticação**

- **FR-021**: A API de autenticação MUST ter um slug próprio da calculadora, com endereço de retorno e credenciais por ambiente.
- **FR-022**: A entrada MUST usar o que já existe: as rotas `Sso/Start`, `Sso/Exchange` e `SessionInfo`. Nenhuma rota nova na API de autenticação. No Radar, só o item "Calculadora" no menu Aplicações.

### Key Entities

- **Sessão da calculadora**: quem é a pessoa (id no Radar, nome, e-mail), o papel, o acesso e o prazo.
- **Acesso da pessoa**: os grupos e as lojas que ela pode ver, trazidos do Radar a cada login.
- **Grupo econômico**: já existe; o número do Radar é a sua identificação.
- **Loja**: já existe; o CNPJ é o que a liga à loja do Radar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quem está logado no Radar chega à calculadora pelo menu em até 5 segundos, sem digitar nada.
- **SC-002**: 100% das rotas de dados recusam pedidos sem sessão válida.
- **SC-003**: Nenhuma conta vê ou altera grupo ou loja fora do seu acesso, em teste com pelo menos 2 contas de grupos diferentes e 1 conta com parte das lojas de um grupo.
- **SC-004**: Mudar o papel ou o grupo pelo navegador não dá nenhum acesso a mais, em 100% das tentativas.
- **SC-005**: Com a API de autenticação indisponível, a pessoa vê a mensagem de erro em até 15 segundos.
- **SC-006**: Um código de retorno já usado nunca abre uma sessão.

## Assumptions

- Decision: a sessão da calculadora dura 8 horas. Why: cobre um dia de trabalho; depois disso, basta abrir de novo pelo menu do Radar.
- Decision: grupos, lojas e papel são lidos do Radar só no login, não a cada ação. Why: a calculadora continua rápida e não depende do Radar durante o uso; o preço é que uma mudança só vale na entrada seguinte, no máximo em 8 horas.
- Decision: em ambiente local o login pode ser desligado por configuração, voltando ao modo de demonstração; em produção ele é sempre obrigatório. Why: permite desenvolver sem depender do Radar, sem abrir brecha em produção.
- Decision: o filtro de Grupo fica ao lado do filtro de Loja no topo da Escala e aparece sozinho no topo de Cadastros. Why: sem o bloco "Demonstração", Cadastros ficaria sem nenhum lugar para trocar de grupo.
- Decision: quem tem só parte das lojas de um grupo não usa as importações que valem para o grupo inteiro (cadastro e base de vendas). Why: um arquivo pode trazer lojas fora do acesso da pessoa.
- Decision: uma loja excluída na calculadora não volta sozinha no login, mesmo que o Radar ainda a traga. Why: a exclusão foi uma decisão do operador. Pelo mesmo motivo, o login só cria grupos e lojas para usuários de loja, não para o operador, que já vê tudo.
- Um segundo dono de loja cuja ocupação no Radar não é `Proprietário(a)` entra como consulta, porque o Radar só aponta o primeiro dono de cada loja.
- A carga de lojas por planilha continua existindo para o operador; ela completa os dados que o Radar não traz (horários, faturamento, custos).
- A ligação entre a loja da calculadora e a do Radar depende do CNPJ; lojas antigas com "CNPJ pendente" só aparecem para quem tem acesso depois de receberem o CNPJ.
- Fora desta entrega: sair do Radar junto com a calculadora, trocar a senha, papéis por loja e atualizar o acesso durante a sessão.

## Dependencies

- Em `api-authentication-dotnet`, publicado antes de ligar o login: só o slug `Calculadora` e a configuração dele.
- Em `webapp-radar`, publicado depois da API de autenticação: o item "Calculadora" no menu Aplicações.
- Quem não tem papel aceito vê o item no menu, como acontece com o Prisma, e a calculadora responde que a conta não tem acesso.
- Credenciais e endereço de retorno da calculadora cadastrados por ambiente no cofre da API de autenticação e no Coolify.
