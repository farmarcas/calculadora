# Feature Specification: Desligar pessoa na simulação

**Feature Branch**: `feat/coluna-folha-no-faturamento` (os ajustes se acumulam nesta branch até a pessoa mandar abrir o PR)

**Created**: 2026-11-11

**Status**: Draft

**Input**: Item 7 da reunião com a VP. Na simulação, permitir desligar (remover só da simulação) um funcionário que já existe no quadro, sem apagar nada do Cadastro, e recalcular tudo. Caso de uso: "contrato 1 farmacêutico e tiro 1 balconista: como fica a cobertura e o custo?". Mostrar quem está desligado e permitir religar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Desligar alguém e ver o que acontece (Priority: P1)

Na linha de cada funcionário existente, na escala da simulação, há o botão **Desligar**. Ao clicar, a pessoa sai da simulação: seus turnos somem da grade e tudo é recalculado (cobertura por hora, faltas que isso abre, horas, status e alertas, pessoas, horas contratadas e, para o dono, a folha e o peso no faturamento).

**Why this priority**: É o caso de uso pedido: comparar contratar de um lado e reduzir equipe do outro.

**Independent Test**: Em Cosmópolis, desligar 1 atendente: o card mostra Pessoas "8 → 7" ("−1"), a folha cai (chip verde "−…%", "−R$ … por mês" para o dono) e a cobertura mostra as faltas que a saída abre.

**Acceptance Scenarios**:

1. **Given** uma simulação editável, **When** a pessoa clica em "Desligar" numa funcionária ou funcionário, **Then** os turnos dela saem da grade, o resultado é recalculado e ela passa a aparecer em "Desligados na simulação".
2. **Given** a simulação com alguém desligado, **When** o dono vê o card, **Then** "hoje" continua contando o quadro inteiro e a folha por mês mostra a queda.
3. **Given** o único farmacêutico desligado, **When** o resultado é recalculado, **Then** a ação é permitida e o status mostra "Sem farmacêutico no quadro" (inviável).
4. **Given** uma vaga simulada (contratação), **When** a pessoa procura "Desligar", **Then** o botão não existe: a vaga se remove com "Remover", como hoje.

---

### User Story 2 - Ver quem está desligado e religar (Priority: P1)

Uma faixa **"Desligados na simulação (N)"** lista os nomes (e a função) de quem está desligado, com **Religar** ao lado de cada nome. Religar devolve a pessoa e seus turnos como estavam e recalcula tudo.

**Acceptance Scenarios**:

1. **Given** duas pessoas desligadas, **When** a pessoa vê a faixa, **Then** ela mostra "Desligados na simulação (2)" e um "Religar" por nome.
2. **Given** "Religar" clicado, **When** o resultado é recalculado, **Then** a pessoa volta à grade com os mesmos turnos de antes e a faixa diminui (sem desligados, a faixa some).
3. **Given** uma simulação recarregada, **When** a pessoa a abre de novo, **Then** os desligados continuam desligados (ficam guardados com a simulação).

---

### User Story 3 - Quem pode e quem só vê (Priority: P2)

- Só quem pode editar a simulação desliga e religa; perfil só de consulta vê a faixa e o resultado, sem os botões.
- Simulação gravada (não editável): sem "Desligar" e sem "Religar".
- Gestor e consulta veem quem está desligado e o resultado, sem valores em reais; os valores em reais seguem só para o dono.

**Acceptance Scenarios**:

1. **Given** simulação gravada, **When** a tela abre, **Then** não há "Desligar" nem "Religar", mas a faixa mostra quem estava desligado.
2. **Given** o perfil consulta, **When** abre uma simulação com desligados, **Then** vê a faixa sem "Religar" e nenhum valor em reais.

---

### Edge Cases

- **Desligar e depois contratar:** a vaga nova continua funcionando; o resultado soma os dois efeitos.
- **Pessoa com horário fixo ou folga marcada:** pode ser desligada normalmente; ao religar, volta com o que tinha.
- **Todos desligados:** o resultado mostra a loja sem equipe (status inviável) e sem erro na tela.
- **Muitos cliques seguidos:** cada ação é aplicada em ordem, sem perder o que foi feito.
- **Erro ao salvar:** a tela mostra a mensagem em linguagem simples e o estado anterior continua valendo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada funcionário existente na grade da simulação (não as vagas) tem o botão "Desligar", visível só para quem pode editar uma simulação editável.
- **FR-002**: Desligar remove a pessoa e seus turnos só da simulação; nada muda no Cadastro.
- **FR-003**: Depois de desligar ou religar, tudo é recalculado: grade, cobertura e faltas, horas, status, alertas, pessoas, horas contratadas e, para o dono, a folha e o peso no faturamento (card da spec 052).
- **FR-004**: A faixa "Desligados na simulação (N)" mostra cada pessoa desligada (nome e função) com "Religar"; sem desligados, a faixa não aparece.
- **FR-005**: Religar devolve a pessoa e os turnos que ela tinha.
- **FR-006**: Os desligados ficam guardados com a simulação: continuam ao recarregar e ao reabrir.
- **FR-007**: Desligar o único farmacêutico, ou todos, é permitido; o resultado mostra o status inviável.
- **FR-008**: Em simulação gravada, os botões não aparecem; a faixa continua mostrando quem estava desligado. Perfil de consulta não vê os botões.
- **FR-009**: Gestor e consulta nunca recebem valores em reais nem percentuais de custo por causa desta função.
- **FR-010**: Textos em pt-BR simples, sem "p.p." nem "pontos"; o botão tem rótulo para leitor de tela com o nome da pessoa ("Desligar Ana Souza"), e a ação é feita também pelo teclado.

### Key Entities

- **Desligado na simulação**: marca que diz que, nesta simulação, a pessoa não conta. Vale só para funcionários existentes e fica guardada com a simulação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em Cosmópolis, desligar 1 atendente leva o card a mostrar Pessoas "8 → 7", horas contratadas menores e, para o dono, a folha em queda; o resultado aparece em até 2 segundos.
- **SC-002**: Desligar e religar a mesma pessoa devolve exatamente o resultado e a grade de antes, em 100% dos casos testados.
- **SC-003**: Em 100% das telas de gestor e consulta, nenhum valor em reais aparece.
- **SC-004**: Nenhuma ação desta função altera o Cadastro (conferido recarregando o Cadastro).

## Assumptions

- **Onde fica o botão:** Decision: na linha de cada funcionário da grade "Escala por hora" da simulação, ao lado de "Remover" das vagas. Why: é onde a pessoa já mexe na equipe.
- **O servidor:** Decision: usar o que já existe (a simulação aceita a lista de desligados e recalcula). Why: já foi feito e testado; falta a tela.
- **Quem desliga:** Decision: quem pode editar a simulação (dono e gestor). Why: é a mesma regra das demais edições.
- **Hora extra e folha:** Decision: o card da spec 052 já conta "hoje" com o quadro inteiro e a folha que cai; esta função só alimenta esses números. Why: evita refazer a conta.
- **Fora do escopo:** desligar de verdade no Cadastro, indenização ou custo de rescisão, e os itens 10 e outros da reunião.
