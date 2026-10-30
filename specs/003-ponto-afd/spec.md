# Feature Specification: Gerenciar a escala com o ponto (AFD)

**Feature Branch**: `feat/escala-ponto-custo`
**Created**: 2026-10-27
**Status**: Draft
**Input**: User description: "Executar o ponto (AFD): pilar Gerenciar do módulo M4 — Escala, documento v2.2, seção 6"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Importar o ponto (AFD) da loja (Priority: P1)

Com uma simulação em uso, o gestor envia um ou vários arquivos de ponto (AFD) do sistema de registro de ponto da loja. O sistema lê as batidas, descobre a loja pelo CNPJ e cada pessoa pelo CPF, e mostra o resultado da importação: batidas aceitas, repetidas (ignoradas) e pendentes. Reenviar o mesmo arquivo ou período não duplica nada. Arquivo de CNPJ que não pertence ao grupo é recusado.

**Why this priority**: sem o ponto não existe gestão; é a porta de entrada de todo o resto.

**Independent Test**: importar um AFD fictício duas vezes e conferir que o total de batidas não muda; importar um com CNPJ de fora e ver a recusa.

**Acceptance Scenarios**:

1. **Given** uma loja com simulação em uso, **When** envia um AFD válido, **Then** vê quantas batidas foram aceitas, repetidas e pendentes.
2. **Given** o mesmo arquivo reenviado, **Then** nenhuma batida é duplicada e o log registra "sem novidades".
3. **Given** um arquivo com CNPJ fora do grupo, **Then** é recusado com a explicação.
4. **Given** um arquivo com estrutura inválida, **Then** é rejeitado inteiro e nada é gravado.
5. **Given** uma loja sem simulação em uso, **When** tenta importar, **Then** o sistema explica que gerenciar exige uma simulação em uso.
6. **Given** vários arquivos de uma vez, **Then** cada um aparece no log com status (processado, com pendências ou rejeitado), nome, período, quantidade de batidas, autor e data.

---

### User Story 2 - Tratar as pendências (Priority: P2)

Batida de pessoa não identificada, de pessoa sem lotação na loja ou em dia sem escala vai para uma **fila de pendências**, nunca é descartada em silêncio. O gestor resolve cada pendência: **vincular à pessoa**, **ignorar com motivo** ou **cadastrar o CPF que falta**; ao cadastrar o CPF, as pendências daquela pessoa se resolvem juntas.

**Why this priority**: sem tratar pendências a apuração fica incompleta e injusta com quem bateu o ponto.

**Independent Test**: importar um AFD com um CPF desconhecido, vincular à pessoa certa e ver as batidas entrarem na apuração.

**Acceptance Scenarios**:

1. **Given** uma batida com CPF desconhecido, **Then** aparece na fila com data, hora e o CPF (mascarado).
2. **Given** uma pendência, **When** vincula a uma pessoa, **Then** a batida entra na apuração e some da fila.
3. **Given** uma pendência, **When** ignora, **Then** exige um motivo e fica registrada.
4. **Given** várias pendências do mesmo CPF, **When** cadastra o CPF na pessoa, **Then** todas resolvem de uma vez.

---

### User Story 3 - Apurar planejado × realizado (Priority: P3)

O sistema compara o **calendário planejado** (a simulação em uso, repetida semana a semana desde o início da vigência) com as batidas. Por pessoa e dia mostra: atraso, saída antecipada, falta, intervalo não cumprido ou reduzido, hora extra estimada, trabalho em dia de folga e descanso entre jornadas menor que o exigido. Por loja e período mostra aderência (horas cumpridas conforme o plano ÷ horas planejadas), hora extra por função e dia da semana, faltas e atrasos, e cobertura realizada × necessária (farmacêutico incluído). Toda tela e arquivo traz o rótulo **"apuração gerencial — não substitui o registro oficial de ponto"**.

**Why this priority**: é o valor do pilar: saber se a escala está sendo cumprida e onde nasce a hora extra.

**Independent Test**: com um AFD fictício onde uma pessoa chega 30 min atrasada e sai 1h depois, conferir o atraso, a hora extra e a aderência da loja.

**Acceptance Scenarios**:

1. **Given** batidas importadas, **When** abre a apuração de uma pessoa, **Then** vê dia a dia planejado × batidas e cada ocorrência.
2. **Given** um período, **When** abre a apuração da loja, **Then** vê aderência, hora extra e faltas por função e por dia.
3. **Given** um dia com farmacêutico ausente, **Then** a cobertura realizada mostra a faixa descoberta.
4. **Given** qualquer tela ou exportação da apuração, **Then** exibe o rótulo de apuração gerencial.
5. **Given** a causa provável da hora extra, **Then** classifica em plano, quadro ou execução, marcada como sugestão.

---

### User Story 4 - Painel de gestão da loja (Priority: P4)

Uma tela única por loja: simulação em uso e vigência, última importação de AFD, pendências abertas, aderência e hora extra do período, tendência das últimas semanas e alertas. A simulação em uso fica **desatualizada** quando a hora extra se repete acima do limite ou a aderência cai abaixo do limite; a ação sugerida é clonar e resimular. Nada é alterado automaticamente.

**Why this priority**: junta tudo para o dia a dia, mas só faz sentido depois das anteriores.

**Independent Test**: com hora extra acima do limite por duas semanas seguidas, ver o alerta e o atalho para clonar a simulação.

**Acceptance Scenarios**:

1. **Given** uma loja com ponto importado, **Then** o painel mostra o resumo e a tendência das últimas semanas.
2. **Given** hora extra acima do limite, **Then** a em uso é marcada desatualizada com o motivo e o atalho de clonar.
3. **Given** uma loja sem ponto importado, **Then** o painel diz que só há planejamento e convida a importar.

---

### Edge Cases

- Batidas em ordem diferente, em horário de virada de dia ou com número ímpar no dia: marcar o dia como "batidas incompletas" em vez de adivinhar.
- Pessoa em mais de uma loja do grupo: batidas casam por CPF na loja do arquivo; sem verificação cruzada de jornada.
- Feriado sem escala e batida no dia: vai para pendência "dia sem escala".
- Ajuste ou afastamento (férias, atestado) ainda não existe: dia planejado sem batida conta como falta, com aviso explicando a limitação.
- Arquivo muito grande: processar em partes e mostrar progresso.
- Dado pessoal: somente AFD fictício enquanto o parecer de proteção de dados não existir.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST importar AFD por upload, vários arquivos por vez, com log de nome, hash, período, quantidade de batidas, autor, data e status.
- **FR-002**: O sistema MUST casar o arquivo com a loja pelo CNPJ e cada batida com a pessoa pelo CPF, e MUST recusar CNPJ fora do grupo.
- **FR-003**: A importação MUST ser idempotente: reenviar arquivo ou período não duplica batidas.
- **FR-004**: O sistema MUST validar a estrutura do arquivo e rejeitá-lo inteiro se for inválida.
- **FR-005**: Batida sem correspondência MUST ir para a fila de pendências e nunca ser descartada em silêncio.
- **FR-006**: O sistema MUST permitir vincular, ignorar (com motivo) e resolver por cadastro de CPF, individualmente ou em lote por CPF.
- **FR-007**: Gerenciar MUST exigir simulação em uso e AFD importado; sem AFD, a loja fica só com planejamento.
- **FR-008**: O sistema MUST projetar o calendário planejado a partir da simulação em uso, desde o início da vigência.
- **FR-009**: O sistema MUST apurar por pessoa e dia: atraso, saída antecipada, falta, intervalo, hora extra estimada, trabalho em folga e descanso entre jornadas.
- **FR-010**: O sistema MUST apurar por loja e período: aderência, hora extra por função e dia, faltas, atrasos e cobertura realizada × necessária.
- **FR-011**: Toda tela e arquivo de apuração MUST trazer o rótulo "apuração gerencial — não substitui o registro oficial de ponto".
- **FR-012**: O sistema MUST marcar a simulação em uso como desatualizada por hora extra recorrente ou aderência baixa, sem alterar nada automaticamente, com limites editáveis.
- **FR-013**: O painel da loja MUST mostrar simulação em uso, última importação, pendências, aderência, hora extra, tendência e alertas.
- **FR-014**: Importação, tratamento de pendência e exportação nominal MUST ficar na auditoria.
- **FR-015**: O sistema MUST NOT emitir espelho de ponto, alimentar folha nem exportar para sistema de ponto.
- **FR-016**: O operador da plataforma MUST NOT ver batidas, pendências nem apuração, somente se a loja importa AFD e a frequência.
- **FR-017**: O sistema MUST usar apenas AFD fictício até existir o parecer de proteção de dados.

### Key Entities

- **Importação de ponto**: arquivo recebido (nome, hash, período, CNPJ, quantidade, status, autor, data).
- **Batida**: pessoa (ou pendente), loja, data, hora, importação de origem; única por loja, pessoa, data e hora.
- **Pendência**: batida sem correspondência, motivo, estado (aberta, vinculada, ignorada), quem resolveu e quando.
- **Calendário planejado**: dia, pessoa, turno planejado, derivado da simulação em uso.
- **Apuração do dia**: pessoa, dia, planejado, realizado, ocorrências, hora extra estimada.
- **Limites de alerta**: hora extra e aderência que marcam a simulação como desatualizada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Importar um AFD de uma loja de 10 pessoas e um mês de batidas leva menos de 30 segundos.
- **SC-002**: Reenviar o mesmo arquivo gera 0 batidas duplicadas.
- **SC-003**: 0 batidas descartadas em silêncio: toda batida aparece aceita, repetida ou pendente.
- **SC-004**: Em 100% dos casos de teste, atraso, hora extra e aderência conferem com o cálculo manual.
- **SC-005**: 0 telas ou arquivos de apuração sem o rótulo de apuração gerencial.
- **SC-006**: 90% dos gestores resolvem uma pendência na primeira tentativa, sem ajuda.
- **SC-007**: 0 dados de ponto visíveis para o operador da plataforma.

## Assumptions

- Decision: aceitar o layout do AFD da Portaria MTP 671/2021 (identificação por CPF). O layout antigo por PIS fica para depois, se houver base de associados que precise (documento M-D6, ainda em aberto). Why: é o formato em vigor e evita um campo a mais no cadastro.
- Decision: o calendário planejado repete a semana da simulação em uso (escala-padrão cíclica). Why: é a recomendação do documento (M-D3) e é o que a simulação já representa.
- Decision: causa provável da hora extra em três categorias (plano, quadro, execução), mostrada como sugestão. Why: documento M-D7.
- Decision: limites de hora extra e aderência começam com valores padrão editáveis por loja, a definir com as lojas piloto. Why: documento M-D5.
- Decision: ausências, trocas de turno e vendas reais ficam FORA desta entrega; dia planejado sem batida conta como falta, com aviso. Why: manter a entrega pequena; entram em seguida.
- Decision: quem importa AFD e trata pendências são o dono do grupo e o gestor de escala; quem só consulta vê a apuração agregada.
- Dependência: simulação em uso (specs/001-escala); CPF já existe no cadastro de funcionários e CNPJ no de lojas.
- Regra legal: o documento condiciona produção ao parecer de proteção de dados e ao catálogo trabalhista validado; esta entrega vale para desenvolvimento com dados fictícios.
