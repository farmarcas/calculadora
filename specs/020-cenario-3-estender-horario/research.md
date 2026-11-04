# Pesquisa — Cenário 3 com horário estendido

## 1. Quais horários o Cenário 3 testa
- Decision: para cada dia de fim de semana aberto, além de "como hoje", "fechar mais cedo" e "fechar", entram as extensões: abrir até `e` horas mais cedo e fechar até `l` horas mais tarde, com `e + l` de 1 a 3. Um dia ou é reduzido, ou fechado, ou estendido, nunca dois.
- Rationale: o espaço de busca fica pequeno (cerca de 20 opções por dia, 2 dias) e a regra "segunda a sexta nunca mudam" continua valendo.
- Limites (resposta à dúvida da spec): não abrir antes das 06h, não fechar depois das 24h, no máximo 16 h abertas no dia. Lojas que já abrem 24 h ou chegam a esses limites não estendem.
- Alternatives: estender sem limite — descartada; produziria horários que a loja não poderia operar.

## 2. Venda das horas novas
- Decision: para cada hora nova, se há venda registrada nessa hora (venda fora do horário cadastrado), vale a venda registrada. Se não, vale 50% da venda da hora de borda do mesmo dia (a última hora aberta, ou a primeira, conforme o lado). A mesma hora de borda vale para todas as horas novas do lado.
- Rationale: usa o dado real quando existe e é conservador quando não existe. Em lojas só com faturamento do cadastro, a hora de borda é a parcela igual de cada hora aberta.
- Alternatives: média do dia — descartada; superestima as pontas do dia.

## 3. Margem das horas novas
- Decision: margem da hora registrada, ou a margem da hora de borda aplicada à venda estimada. Já vale a margem do cadastro quando a base não tem (correção da spec 019).
- Rationale: mesma margem que o resto do cenário usa.

## 4. Custo da extensão
- Decision: o horário estendido passa por `verificarRegra` como qualquer outro; a contratação necessária entra no custo. Nada de regra nova de folha.
- Rationale: a conta de jornada e de horas ociosas já existe e é a mesma dos outros cenários.

## 5. Impacto e escolha do melhor horário
- Decision: `impacto = folha adicional + margem perdida − margem ganha`; o melhor é o de menor impacto, com os mesmos empates de hoje (menos contratações, menos dias fechados, menos horas cortadas) e um empate novo a favor de estender menos horas.
- Rationale: o sinal negativo do impacto é o que deixa o resultado positivo para o dono.
- Detalhe técnico: a perda por redução hoje usa fração negativa quando o horário cresce; passa a ser limitada a 0 e o ganho é calculado à parte, pela venda estimada, e não pela média do dia.

## 6. Selo "Cenário sugerido"
- Decision: o Cenário 3 com extensão só é sugerido se o impacto, calculado com a metade da margem ganha, ainda for menor que o de qualquer outro cenário comparável; senão a sugestão vai para o melhor dos outros.
- Rationale: a recomendação não pode depender de a estimativa se confirmar por inteiro.

## 7. Selo "Melhor resultado"
- Decision: o destaque (menor impacto) mostra "Melhor resultado" quando o impacto é negativo na conta interna (resultado positivo para o dono) e "Menor custo" nos demais casos.
- Rationale: texto coerente com o sinal que o dono vê.
