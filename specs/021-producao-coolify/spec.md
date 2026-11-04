# Feature Specification: Ambiente de produção no Coolify

**Feature Branch**: `feat/producao-coolify`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "Vamos preparar um docker para o ambiente de produção e no Coolify. O login será colocado depois; pode deixar aberto para a internet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Colocar a calculadora no ar num endereço de verdade (Priority: P1)

A pessoa responsável conecta o repositório ao Coolify, preenche as variáveis (senha do banco e endereço) e manda publicar. Minutos depois a calculadora abre no endereço escolhido, com a tela, a API e o banco funcionando juntos, sem nenhum passo manual dentro do servidor.

**Why this priority**: Sem isso não existe produção. É o objetivo inteiro do pedido.

**Independent Test**: Num Coolify limpo, publicar a partir do repositório e abrir o endereço: a tela carrega, mostra os dados do grupo econômico e o aviso de saúde da API responde "pronto".

**Acceptance Scenarios**:

1. **Given** um Coolify sem nada publicado e as variáveis preenchidas, **When** a pessoa publica o projeto, **Then** tela, API e banco sobem e o endereço público abre a calculadora.
2. **Given** a calculadora no ar, **When** a pessoa abre o endereço de outro computador ou do celular, **Then** o acesso funciona (aberto na internet, sem login nesta fase).
3. **Given** uma variável obrigatória faltando (ex.: senha do banco), **When** a pessoa publica, **Then** a publicação falha com uma mensagem dizendo qual variável falta, em vez de subir com valor fraco.

---

### User Story 2 - Atualizar a produção sem perder dados (Priority: P1)

Quando o time envia uma versão nova para a `main`, a produção se atualiza sozinha (ou com um clique). As mudanças de estrutura do banco são aplicadas automaticamente e os dados já cadastrados (lojas, funcionários, simulações) continuam lá.

**Why this priority**: Uma produção que perde dados ou exige mexer no servidor a cada versão não serve para uso real.

**Independent Test**: Cadastrar uma loja, publicar uma versão nova que inclui mudança no banco, e conferir que a loja continua lá e a nova função funciona.

**Acceptance Scenarios**:

1. **Given** produção com dados cadastrados, **When** uma nova versão é publicada, **Then** os dados permanecem e as mudanças de estrutura do banco são aplicadas antes de a versão nova receber acesso.
2. **Given** uma versão nova com defeito que não inicia, **When** a publicação termina, **Then** ela é marcada como falha com o motivo visível, e a pessoa volta à versão anterior republicando-a, sem perder dados.
3. **Given** o servidor reiniciado, **When** ele volta, **Then** o banco mantém os dados.

---

### User Story 3 - Produção separada do computador local e dos dados de exemplo (Priority: P2)

A produção nunca carrega os dados fictícios de exemplo, não abre o banco para a internet e não usa senhas do ambiente local.

**Why this priority**: Evita expor o banco e misturar dado de teste com dado real.

**Independent Test**: Em produção, tentar conectar ao banco pelo endereço público falha; o banco só responde à API.

**Acceptance Scenarios**:

1. **Given** produção no ar, **When** alguém tenta acessar o banco de fora, **Then** não consegue.
2. **Given** produção recém-criada, **When** a pessoa abre a calculadora, **Then** não há lojas de exemplo; só o "Grupo inicial" vazio.

---

### Edge Cases

- Primeira publicação com banco vazio: a estrutura é criada do zero e os parâmetros legais iniciais ficam disponíveis.
- Banco demora a ficar pronto: a API espera em vez de cair.
- Endereço da produção diferente do esperado: a tela continua falando com a API pelo mesmo endereço, sem erro de acesso entre endereços.
- Espaço em disco do banco acabando: o time precisa ser capaz de perceber isso.
- Dado do ambiente local (`.env`) nunca vai para a produção nem para o repositório.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O projeto MUST poder ser publicado no Coolify a partir do repositório, com tela, API e banco como partes de um único conjunto.
- **FR-002**: A tela e a API MUST rodar em versão de produção (otimizada, sem ferramentas de desenvolvimento nem pastas do computador montadas).
- **FR-003**: Todas as configurações que mudam entre ambientes (senha do banco, endereço público) MUST vir de variáveis, com um exemplo documentado para produção; nenhum segredo no repositório.
- **FR-004**: A publicação MUST falhar com mensagem clara quando uma variável obrigatória estiver faltando.
- **FR-005**: As mudanças de estrutura do banco MUST ser aplicadas automaticamente a cada publicação, sem apagar dados.
- **FR-006**: O banco MUST guardar os dados em armazenamento persistente que sobrevive a reinícios e novas versões.
- **FR-007**: O banco MUST NOT ficar acessível pela internet; só a API se conecta a ele.
- **FR-008**: Cada parte MUST informar se está saudável, para o Coolify só considerar a publicação concluída quando tudo estiver pronto.
- **FR-009**: Os dados de exemplo MUST NOT ser carregados em produção.
- **FR-010**: O ambiente local atual (comandos `/subir-ambiente` e `/parar-ambiente`) MUST continuar funcionando sem mudança.
- **FR-011**: A tela MUST funcionar atrás do endereço público do Coolify (com HTTPS fornecido por ele), chamando a API sem erro de acesso.

### Key Entities

- **Variáveis de produção**: senha e nome do banco, endereço público, porta; vêm do Coolify, não do repositório.
- **Dados persistentes**: tudo que a calculadora cadastra, guardado no banco; deve sobreviver a reinícios e atualizações.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa publica a calculadora no Coolify preenchendo só as variáveis do arquivo de exemplo e ligando o endereço, em até 30 minutos.
- **SC-002**: Após publicar uma versão nova, 100% dos dados cadastrados antes continuam disponíveis.
- **SC-003**: Durante uma atualização, a calculadora fica fora do ar por no máximo 2 minutos.
- **SC-004**: Nenhuma tentativa de acessar o banco diretamente pela internet tem sucesso.
- **SC-005**: O ambiente local continua subindo com o mesmo comando de antes.

## Assumptions

- Business: a produção fica **aberta na internet, sem login**, por decisão da pessoa; o login será adicionado depois, em outra especificação. Risco aceito: quem tiver o endereço vê e altera os dados.
- Business: o endereço (domínio) não foi informado; fica configurável pelo Coolify.
- Business: uma única produção (sem ambiente de homologação) nesta fase.
- Decision: banco Postgres próprio dentro do mesmo conjunto no Coolify, com volume persistente. Why: mantém a mesma tecnologia do local e evita depender de outro serviço.
- Decision: a tela vira arquivos estáticos servidos por um servidor leve, e as chamadas à API passam pelo mesmo endereço. Why: é mais leve e seguro que o modo de desenvolvimento e evita erro de acesso entre endereços.
- Decision: as migrations rodam na subida da API, antes de ela aceitar acesso. Why: garante que o banco esteja no formato certo sem passo manual.
- Decision: sem guia escrito e sem código de backup; o backup agendado do banco é um recurso do próprio Coolify. Why: pedido da pessoa de não ter guia; o Coolify já oferece o backup.
- Fora do escopo: guia de publicação, login, SSO, domínio e DNS, monitoramento e alertas, ambiente de homologação, CI/CD além do que o Coolify já faz.
