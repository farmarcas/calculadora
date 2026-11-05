# Research: Simulação compacta

**Decision**: a venda estimada das horas novas é calculada no servidor, em `simulacoes/venda-estimada.ts`, para qualquer dia da semana.
**Rationale**: a regra dos cenários (50% da hora vizinha) vive no servidor e só cobre sábado e domingo; a Simulação aceita qualquer dia, então precisa de uma versão geral. Mantendo a regra no servidor, cartão e Simulação concordam.
**Alternatives considered**: calcular na tela (a regra ficaria duplicada e poderia divergir); reaproveitar `ganhoDasHorasNovas` (só cobre fim de semana e dias abertos hoje).

**Decision**: saldo da Simulação contra a folha atual, numa função única (`saldo-simulacao.ts`).
**Rationale**: confirmado com a pessoa; é a regra dos cartões (spec 024), então a Simulação de um cenário mostra o mesmo saldo do cartão. A fórmula literal do quadro descontaria a folha extra duas vezes.
**Alternatives considered**: saldo contra manter o horário (só bate com o 1º exemplo); fórmula literal (conta dobrada).

**Decision**: o campo de horário guarda o texto enquanto se digita e confirma ao sair, no Enter ou nos botões; valor inválido volta ao último válido.
**Rationale**: o pedido manda voltar ao último válido, e confirmar só ao sair evita enviar horários pela metade ao servidor.
**Alternatives considered**: validar a cada tecla (a pessoa não consegue digitar "1" a caminho de "18:00").

**Decision**: o dia fechado na simulação mostra "Fechado nesta simulação" com "Reabrir"; o fechado no Cadastro mostra "Fechado" com "Abrir dia" (08:00 a 18:00).
**Rationale**: o quadro não desenha esse estado e o pedido manda propor e mostrar antes de implementar. O Cenário 3 já abre o domingo, então abrir um dia fechado é necessário.
**Alternatives considered**: manter o campo bloqueado para dia fechado no Cadastro (impediria abrir o domingo na Simulação).

**Decision**: o gráfico cresce com `flex` até a altura da lista, sem altura fixa em pixels.
**Rationale**: o pedido quer alturas equilibradas, e a lista muda de altura conforme o número de dias abertos.
**Alternatives considered**: altura fixa (volta o espaço vazio quando a lista cresce).

**Decision**: testes de lógica em Vitest (servidor e tela); interação, rolagem e alinhamento conferidos no navegador.
**Rationale**: o projeto não tem ferramenta de teste de componente e a regra é não acrescentar ferramenta sem pedido.
**Alternatives considered**: testing-library e jsdom (acréscimo fora do pedido).
