# Research: Cenário 2 com travas

## 1. Onde implementar a ordem dos passos
- **Decision**: módulo novo e puro `escala/ajustes-fim-de-semana.ts`, chamado por `montarEconomia` (e, na fatia 4, por `montarEquilibrio`).
- **Rationale**: as duas regras (Cenário 2 e 3) precisam das mesmas travas; separar da `cenarios.ts` (586 linhas) e dos cenários por dia mantém cada peça testável com contas à mão.
- **Alternatives**: alterar `escolherDiasAFechar` com pesos por dia da semana (continua uma lógica de "fechar dia", sem o conceito de reduzir horário); duas implementações (uma por cenário), que poderiam divergir.

## 2. Sequência de passos do Cenário 2
- **Decision**: (a) reduzir o fechamento de sábado e domingo em passos de 1 h, sempre cortando 1 h do dia de menor venda por hora (empate: domingo) que ainda tenha mais de 4 h abertas; (b) fechar o domingo, se aberto e não protegido; (c) fechar o sábado, se aberto e não protegido. Depois de cada passo, conferir se a equipe atual cobre o horário (`verificarRegra`); parar no primeiro que cobre.
- **Rationale**: é a ordem pedida; a venda por hora estimada (venda do dia ÷ horas abertas) é o melhor critério disponível para escolher qual dia cortar primeiro; o empate no domingo segue a lógica de que o domingo costuma vender menos.
- **Alternatives**: cortar sábado e domingo sempre juntos (menos fino); cortar da abertura ou dos dois lados (decisão da pessoa: do fechamento).

## 3. Perda de faturamento de um estado
- **Decision**: para cada dia de fim de semana, `perda = vendaMes × (1 − horasAtuais ÷ horasDeHoje)`; dia fechado perde `vendaMes` inteira. Perda total em % = soma ÷ faturamento mensal de referência (soma da venda mensal dos dias abertos hoje).
- **Rationale**: proporcional às horas, simples, e o mesmo número alimenta o cartão ("faturamento perdido") e o teto.
- **Alternatives**: peso maior para as horas centrais do dia (exige venda por hora); usar a margem para o teto (não funciona sem margem informada).

## 4. Travas
- **Decision**: constante única `TRAVAS = { perdaMaxPct: 10, horasMinPct: 85, horasMinDia: 4 }`. Um passo só é aplicado se o estado resultante respeita as três; senão o cenário para e mostra o último estado válido, a trava que impediu e quanto falta de cobertura (soma da `faltaH` das funções que ainda faltam).
- **Rationale**: valores decididos pela pessoa; nomeados para ajuste futuro sem mexer na lógica; as premissas editáveis foram retiradas da tela de propósito.

## 5. Novo status "Não resolve sozinho"
- **Decision**: `CenarioEconomia` ganha `naoResolveSozinho`, `travou` ('perda' | 'horas' | null), `faltaH` e `passos`; no comparativo o status vira `nao_resolve` (selo amarelo). Ele nunca é "viável" nem "sugerido". Os casos de inviável por falta de gente no quadro (sem farmacêutico etc.) continuam iguais.
- **Rationale**: é uma situação diferente de "inviável": há um corte possível, mas ele não basta.

## 6. Margem não informada
- **Decision**: `margemCortadaMes` passa a ser **nulo** quando nenhuma margem foi informada (hoje vira 0 por conta de `margemMes = 0` em todos os dias); o comparativo já trata nulo como "—" e não calcula saldo nem selo de sugerido; o cartão ganha o alerta "Informe a margem bruta média da loja no Cadastro".
- **Rationale**: R$ 0 em verde enganava; o teto usa faturamento, então o cenário continua útil.

## 7. Cenário 3
- **Decision**: gerar só estados de fim de semana (cada dia em: original, reduzido de 1 h em 1 h até 4 h, fechado — fechamento só para dia não protegido), filtrar pelas travas e escolher o de menor impacto (custo adicional de folha + margem perdida), com o desempate atual (menos contratações, menos cortes).
- **Rationale**: mantém o objetivo do Equilíbrio dentro dos limites; ~150 estados, cada um uma conta curta.
- **Alternatives**: deixar o Cenário 3 como está (repete o problema por outro caminho).
