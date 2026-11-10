# Pesquisa: Custos e Turnos com faturamento hora a hora

## Decisão 1: a série vem do servidor, junto do painel do Cadastro
- **Decision**: `painel.ler` devolve `faturamentoPorHora` com os três tipos de dia.
- **Rationale**: a tela de Cadastro já carrega esse painel; valores em reais só podem sair para o dono, e é no servidor que isso já é garantido; trocar o tipo de dia vira uma escolha na tela, sem novo pedido.
- **Alternatives considered**: endpoint próprio por tipo de dia (mais pedidos e mais estados); calcular na tela a partir da base (exigiria mandar a base inteira ao navegador).

## Decisão 2: gráfico sem biblioteca
- **Decision**: barras, faixas e alças em HTML e CSS (grade de colunas).
- **Rationale**: o gráfico é simples e alinhado a uma régua de horas; dar foco, teclado e leitor de tela a elementos próprios é mais direto que adaptar uma biblioteca; não adiciona dependência (constituição III).
- **Alternatives considered**: biblioteca de gráficos (peso e dificuldade de alinhar faixas e alças às colunas).

## Decisão 3: mover limite só entre turnos que se tocam
- **Decision**: alças existem entre turnos consecutivos cujo fim é o início do próximo; em turnos sobrepostos ou com lacuna, o ajuste continua pelos campos.
- **Rationale**: é o caso do desenho (turnos emendados) e evita regras novas de sobreposição; a validação de hoje continua a única fonte de verdade.

## Decisão 4: sugerir turnos em partes iguais do movimento
- **Decision**: dividir o horário da loja em k turnos que carregam partes iguais do faturamento do dia, com limites em horas cheias e mínimo de 1 hora por turno.
- **Rationale**: é fácil de explicar ("cada turno cuida de um terço do movimento"), determinístico e dá turnos mais longos onde a loja vende pouco e mais curtos no pico. Uma primeira ideia (agrupar horas parecidas) isolava pontas de pouca venda e deixava um turno enorme no meio, o que não ajuda a escalar gente.
- **Alternatives considered**: agrupar horas de faturamento parecido (turno gigante no meio); cortar nas horas de menor faturamento (limites arbitrários perto das pontas).

## Decisão 5: tipos de dia e período
- **Decision**: segunda a sexta, sábado e domingo; toda a base ativa.
- **Rationale**: o que o desenho propõe e o que o resto do produto já usa; o período de 90 dias fica como possível filtro futuro.

## Decisão 6: modo padrão sem mudar dado
- **Decision**: o padrão "Por turnos" é de exibição (turnos iniciais a partir do mínimo atual); nada é gravado até a pessoa editar e salvar.
- **Rationale**: abrir a tela nunca deve alterar a configuração de uma loja nem mostrar "alterações pendentes".

## Pontos em aberto
Nenhum.
