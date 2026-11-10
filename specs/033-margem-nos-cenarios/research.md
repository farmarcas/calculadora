# Pesquisa: Margem nos cenários e na Simulação

## Decisão 1: trocar a medida, não as contas
- **Decision**: alimentar a tabela de perda e ganho (venda média por dia e hora) com a margem em vez da venda.
- **Rationale**: todos os cálculos de horário (cenários 2 e 3, sugerido, Simulação) já leem uma única tabela por dia e hora. Trocar o conteúdo dela muda o resultado em todos de uma vez, na mesma régua, sem reescrever a lógica.
- **Alternatives considered**: duplicar as contas para margem (muito código, risco de divergir); ligar uma "opção" na tela (cenários em réguas diferentes).

## Decisão 2: quando usar a margem
- **Decision**: margem só se a soma é positiva, cobre pelo menos 90% das linhas com venda e nenhuma linha tem margem maior que a venda; senão, venda com o motivo escrito.
- **Rationale**: base com margem faltando em muitas horas subestimaria perdas e ganhos; margem maior que a venda é erro de dado. Nos dois casos a venda é o número confiável. Margem negativa isolada (promoção, devolução) é possível e conta como está.
- **Alternatives considered**: usar margem hora a hora e venda onde faltar (mistura as réguas); exigir 100% de cobertura (rígido demais para bases reais). O limite de 90% é uma decisão que pode ser ajustada depois, está em um só lugar.

## Decisão 3: a régua é por loja, escolhida no servidor
- **Decision**: o servidor escolhe uma vez por pedido, a partir da base ativa da loja, e devolve `regua` junto dos resultados.
- **Rationale**: garante que cartões, sugerido, painel, lista e comparação falem da mesma coisa (SC-002, SC-006).
- **Alternatives considered**: escolher na tela (duplica regra e deixa telas divergirem).

## Decisão 4: o que continua em venda
- **Decision**: o faturamento mensal de referência (peso do impacto), o gráfico de venda por hora, os clientes e o ticket médio seguem com a venda real.
- **Rationale**: são informação e proporção do faturamento, não perda ou ganho; margem não é faturamento.

## Decisão 5: nomes dos campos
- **Decision**: manter os nomes atuais ("vendaCortadaMes", "vendaEstimada" etc.) e adicionar `regua`.
- **Rationale**: evita quebrar telas, testes e consumidores; o contrato documenta que os campos carregam margem quando `regua` é margem. Renomear tudo seria uma mudança grande sem ganho para a pessoa.

## Decisão 6: simulações já gravadas
- **Decision**: nada é migrado; o saldo é recalculado a cada abertura com a régua atual da loja.
- **Rationale**: o saldo nunca foi guardado (o resultado guardado é só o resumo da avaliação), então não há dado antigo a corrigir. O painel diz qual régua usou, para ninguém comparar um saldo antigo de memória com o novo.

## Pontos em aberto
Nenhum.
