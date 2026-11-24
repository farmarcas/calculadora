# Feature Specification: Usersnap instalado no Radar Escala

**Feature Branch**: `feat/usersnap-feedback`

**Created**: 2026-11-24

**Status**: Draft

**Input**: "Agora vamos instalar o Usersnap." Respostas da pessoa: o botão aparece para **todas as pessoas logadas**, e o feedback leva a **captura de tela mais nome e e-mail** de quem enviou.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mandar um feedback sem sair da tela (Priority: P1)

Quem usa o Radar Escala vê um botão de feedback. Ao clicar, pode escrever o que aconteceu (bug, dúvida ou sugestão), marcar um ponto na tela e enviar. A captura da tela vai junto.

**Why this priority**: É o pedido central: o time passa a receber relatos com a imagem do problema, sem pedir print por mensagem.

**Independent Test**: Entrar com login do Radar, clicar no botão, escrever um texto e enviar; o feedback aparece no Usersnap com a captura da tela.

**Acceptance Scenarios**:

1. **Given** uma pessoa logada pelo Radar, **When** ela clica no botão de feedback e envia, **Then** o feedback chega ao Usersnap com a captura da tela e o texto.
2. **Given** uma pessoa em qualquer tela do sistema, **When** ela abre o feedback, **Then** o relato traz o endereço da tela em que ela estava.

---

### User Story 2 - Saber quem mandou e de onde (Priority: P1)

Cada feedback chega com **nome, e-mail e perfil** de quem enviou, a tela e a loja em uso, para o time poder responder e reproduzir o problema.

**Why this priority**: Sem saber quem enviou, o time não consegue responder.

**Independent Test**: Enviar um feedback logado e conferir no Usersnap o nome, o e-mail, o perfil e a tela.

**Acceptance Scenarios**:

1. **Given** uma pessoa logada, **When** ela envia um feedback, **Then** o Usersnap mostra o nome, o e-mail e o perfil dela.
2. **Given** a pessoa trocou de loja, **When** envia um feedback, **Then** ele indica a loja atual.

---

### User Story 3 - Só com login e fácil de desligar (Priority: P2)

O botão só existe para quem entrou pelo Radar. Na tela de entrada e no modo demonstração ele não aparece. Se a chave do Usersnap não estiver configurada, ou se o serviço estiver fora do ar ou bloqueado, a calculadora funciona normalmente, sem botão e sem erro.

**Why this priority**: Protege quem ainda não se identificou e garante que o feedback nunca atrapalha o uso.

**Independent Test**: Sem a chave configurada o botão não aparece; sair do sistema faz o botão sumir.

**Acceptance Scenarios**:

1. **Given** modo demonstração ou tela de entrada, **When** a página carrega, **Then** não há botão e nada é carregado do Usersnap.
2. **Given** a pessoa sai do sistema, **When** a tela de entrada volta, **Then** o botão some e o próximo login não herda dados da pessoa anterior.
3. **Given** o Usersnap bloqueado no navegador ou fora do ar, **When** a pessoa usa o sistema, **Then** a calculadora funciona normalmente, sem erro visível.

---

### Edge Cases

- A captura mostra o que está na tela: valores em R$, nomes de funcionários, lojas e CNPJs. Isso é aceito, por escolha da pessoa, e exige aviso (veja Suposições).
- Troca de pessoa no mesmo navegador: a identidade do Usersnap é refeita; nunca mistura duas pessoas.
- Telas pequenas (celular): o botão não pode cobrir ações importantes nem o menu.
- Pessoa com bloqueador de anúncios: o botão pode não carregar e isso é aceitável.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST carregar o Usersnap para toda pessoa logada pelo Radar, de modo que os widgets que o time ativar no painel do Usersnap (botão de feedback, pesquisa/survey) apareçam para ela.
- **FR-002**: O sistema MUST NOT mostrar o botão nem carregar nada do Usersnap na tela de entrada nem em modo demonstração.
- **FR-003**: Cada feedback MUST levar a captura de tela e o endereço da tela atual.
- **FR-004**: Cada feedback MUST levar nome, e-mail e perfil da pessoa, e a loja e a tela em uso.
- **FR-005**: Ao sair, o botão MUST sumir e a identidade da pessoa MUST ser descartada.
- **FR-006**: Sem a chave do Usersnap configurada, o sistema MUST funcionar normalmente, sem botão e sem erro.
- **FR-007**: Falha, bloqueio ou lentidão do Usersnap MUST NOT quebrar nem atrasar telas.
- **FR-008**: Nenhuma tela MUST falar direto com o Usersnap; tudo passa por um serviço central, como na medição.
- **FR-009**: Deve ser possível desligar o Usersnap por configuração, sem mexer em telas.
- **FR-010**: O guia do front MUST registrar o que o Usersnap recebe e como configurar a chave.

### Key Entities

- **Feedback**: texto, captura de tela, endereço da tela, tela e loja em uso, e a pessoa que enviou (nome, e-mail, perfil).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em menos de 1 minuto, uma pessoa logada consegue enviar um feedback e o time o vê no Usersnap com a captura e a identificação.
- **SC-002**: 100% dos feedbacks de pessoas logadas chegam com nome, e-mail e perfil.
- **SC-003**: Em modo demonstração e na tela de entrada, 0 botões e 0 chamadas ao Usersnap.
- **SC-004**: Com o Usersnap indisponível, 0 telas quebradas ou lentidão perceptível.
- **SC-005**: Dá para desligar o Usersnap em um só lugar, sem publicar mudança nas telas.

## Assumptions

- Escolha da pessoa: o botão vale para todos os perfis e o feedback leva nome e e-mail. Fica registrado que a captura pode mostrar dados da tela (R$, nomes, CNPJs); isso exige um aviso na política de privacidade do Radar (LGPD) e o cuidado de configurar o Usersnap com acesso restrito ao time.
- Padrão do agente: o Usersnap é carregado só depois do login do Radar, para não coletar nada de quem ainda não se identificou.
- Padrão do agente: o projeto já existe na conta do Usersnap da pessoa (endereço dado no pedido); a **chave do projeto** é fornecida pela pessoa e entra por configuração, nunca no código.
- Padrão do agente: **o sistema não cria botão próprio**. O que aparece na tela (botão de feedback, pesquisa/survey), o visual, o texto e as regras de quando mostrar são cadastrados no painel do Usersnap; o código só carrega o Usersnap e identifica a pessoa. Sem nenhum widget ativo no painel, nada aparece.
- Fora do escopo: botão ou item de menu próprio do Radar que abra o Usersnap (se for desejado depois, vira outra spec), criar o projeto no Usersnap, integrar com Jira ou outras ferramentas, e mudar o desenho das telas.
