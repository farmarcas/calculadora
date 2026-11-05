# Research: Cartões de cenário B2

**Decision**: o horário por dia vem do que o servidor já devolve (`cenarios.manter/economia/equilibrio.horarioSemana`), sem endpoint novo.
**Rationale**: o dado já é calculado e enviado; o painel só precisa compará-lo com o do "manter".
**Alternatives considered**: campo novo por coluna no comparativo (duplicaria o dado e o contrato).

**Decision**: o saldo novo é calculado no servidor numa única função (`saldoDaOperacao`), em um campo opcional da coluna.
**Rationale**: o saldo antigo e o "sugerido" já vivem no servidor; manter a conta no mesmo lugar evita dois números diferentes. Contra a folha atual, a ordem entre cenários é a mesma de antes (só desloca todos pelo custo do Cenário 1).
**Alternatives considered**: calcular na tela (a conta ficaria longe da regra do "sugerido").

**Decision**: contratações em uma linha por contratação, derivadas de `inteiras` (42h integral cada) e do parcial.
**Rationale**: o servidor devolve contagens, não linhas; a regra "integral = 42h" é a do pedido e precisa de validação com o produto.
**Alternatives considered**: uma linha por função (perde o detalhe de integral e parcial que o desenho mostra).

**Decision**: componentes pequenos em `cartao/` e contas em `cartao-regras.js`.
**Rationale**: o cartão atual tem 359 linhas misturando conta e visual; separar permite testar as contas sem montar a tela.
**Alternatives considered**: editar `Comparativo.jsx` no lugar (arquivo continua grande e difícil de testar).

**Decision**: foco preso e fechamento do painel feitos à mão, sem biblioteca.
**Rationale**: é um comportamento curto (Tab circular, Esc, clique fora) e a constituição pede não acrescentar tecnologia sem justificativa.
**Alternatives considered**: biblioteca de diálogo (nova dependência).

**Decision**: token `--text-success-strong` (#3E7500) no CSS do design system do projeto e uso em todo texto verde dos cartões.
**Rationale**: o verde atual de texto tem contraste abaixo de 3:1; o pedido define o token.
**Alternatives considered**: trocar o verde do token existente (mexeria em todas as telas).

**Decision**: testes de lógica em Vitest (servidor e tela); painel, foco e responsivo conferidos no navegador.
**Rationale**: o projeto não tem ferramenta de teste de componente e a regra é não acrescentar ferramenta sem pedido.
**Alternatives considered**: testing-library e jsdom (acréscimo fora do pedido).
