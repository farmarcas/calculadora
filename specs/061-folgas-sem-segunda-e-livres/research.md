# Research: Folgas sem segunda-feira, equipe espalhada e folga livre

## Como o dia da folga é escolhido hoje

Cada pessoa que passa do limite de dias da regra recebe as folgas que faltam. Para cada folga, os dias de trabalho dela viram "opções", ordenadas por:

1. `novaFalta`: horas de falta que a saída abre no dia (cobertura primeiro);
2. `perto`: proximidade de outra folga da própria pessoa (spec 055);
3. `junto`: quantas folgas da mesma função já foram dadas **nesta rodada** naquele dia;
4. `sobra`: maior sobra de cobertura;
5. `giro`: rotação pelo número da pessoa (desempate sem sorteio);
6. o menor dia.

Antes disso, o rodízio de domingo tira ao menos 1 em cada 3 pessoas da função no domingo.

Por que a sugestão "parece aleatória": a ordem põe `perto` antes de `junto` e não conhece a segunda; o `giro` gira o dia de partida de cada pessoa, o que parece sorteio; e `junto` ignora as folgas que os colegas já têm do Cadastro.

## Decisões

### D1 — Nova ordem de preferência
**Decision**: `novaFalta` → `segunda` (0 para qualquer dia que não seja segunda, 1 para segunda) → `junto` → `perto` → `sobra` → `giro` (começando na terça) → menor dia.
**Why**: é a ordem pedida na spec (cobertura, segunda, colega do cargo, afastar as próprias folgas). Segunda só vence quando todos os outros dias têm mais falta de cobertura do que ela.
**Alternatives**: somar pesos num único número (descartada: some a ordem, difícil de explicar); fazer a segunda "proibida" (descartada: a spec manda aceitar quando é o único jeito).

### D2 — `junto` passa a contar as folgas que os colegas já têm
**Decision**: em cada dia, `junto` = (folgas dadas nesta rodada) + (colegas da mesma função, ativos, que já não trabalham nesse dia aberto, vindos do Cadastro ou de folgas livres anteriores).
**Why**: a spec fala de pessoas do mesmo cargo "não folgarem no mesmo dia", e a folga que já existe vale tanto quanto a nova. Contar só as novas deixava dois colegas folgarem junto.
**Alternatives**: manter a contagem só da rodada (descartada: não resolve o caso real).

### D3 — Diferença máxima de 1 entre dias do mesmo cargo
**Decision**: não precisa de regra extra: escolher sempre o dia de menor `junto` entre os que têm a mesma cobertura e não são segunda já mantém a diferença em no máximo 1 enquanto a cobertura permitir.
**Why**: simples e previsível. O teste da US2 verifica o caso.

### D4 — Avisos de preferências não atendidas
**Decision**: dois avisos novos, no mesmo lugar e com o mesmo tom dos de hoje: "{nome}: só deu para folgar na segunda sem faltar gente." e "{cargo}: não deu para folgar em dias diferentes sem faltar gente." (uma vez por cargo, com os dias).
**Why**: a spec exige avisar sem esconder. Reaproveita a lista `avisos` que a tela já mostra.

### D5 — Duas cópias do algoritmo continuam, com testes de equivalência
**Decision**: alterar `aplicarFolgas` (servidor) e `sugerirFolgas` (tela) com o mesmo código de decisão e acrescentar um teste que roda as duas em uma mesma entrada e compara os dias de folga.
**Why**: unificar numa só exigiria a tela chamar o servidor para sugerir (muda a interação) ou duplicar menos código via pacote compartilhado, o que o projeto não tem. O padrão de duas cópias com mesmo critério já existe (spec 042/046).
**Alternatives**: chamar o servidor para sugerir (descartada: aumenta o escopo e latência).

### D6 — Folga livre reaproveita as funções da Escala por hora
**Decision**: uma função pura nova `folga-livre-regras.js` com `darFolga(turnos, matricula, dia)` (= `semTurnoNoDia`) e `escalarNoDia({ turnos, matricula, dia, aba, regra })` (= `novoTurnoNaFolga`). A tela de semana chama essas e grava por `turnosParaGravar` → `salvar({ turnos })`.
**Why**: mesmo comportamento da Escala por hora e nenhum caminho novo no servidor.
**Verificado**: o servidor aceita remover um turno, vários e todos os turnos de uma pessoa (teste feito pela API em 19/11/2026), então não há trava a remover.

### D7 — Controle por célula, sem tirar a navegação
**Decision**: dentro de cada célula editável da Escala da semana fica o botão grande atual (abre o dia na Escala por hora) e, ao lado, um botão pequeno com ícone ("Dar folga" no dia de trabalho, "Escalar" na folga), com nome acessível e dica.
**Why**: não tira o que já funciona; a ação fica a um clique (SC-004).
**Alternatives**: trocar o clique da célula (descartada: perde a navegação); menu de contexto (descartada: não se descobre).

### D8 — Escopo de celular
**Decision**: o controle existe na grade da semana de computador; a lista do celular não é alterada nesta etapa.
**Why**: a Escala por hora e a lista do celular seguem como hoje; evita escopo grande. Registrado como fora de escopo.
