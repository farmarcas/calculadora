# Pesquisa — Impacto em venda e saldo

## 1. Venda perdida hora a hora
- Decision: `vendaPerdidaMes(hoje, final, tabela)` soma `tabela.venda[dia][hora]` das horas abertas hoje e fechadas no horário final, por dia da semana, × 52 ÷ 12, e devolve também o valor por dia alterado.
- Rationale: a tabela (`vendasPorDiaEHora`) já existe e é a que a Simulação usa; só os cenários 2 e 3 ainda dividem o dia por igual (`perdaMensal`).
- Alternatives: manter a divisão igual — descartada; superestima as pontas do dia.

## 2. Quando "tem venda hora a hora"
- Decision: só a base comercial (`origemVenda = 'base'`) conta. O faturamento por dia do Cadastro vira linhas com a venda dividida igualmente entre as horas, o que não é dado hora a hora.
- Rationale: a regra pedida é não inventar; o aviso diz isso.
- Consequência: nessas lojas os cortes continuam sendo montados (as travas usam a divisão igual, como hoje), mas o cartão não mostra venda nem saldo, só o aviso.

## 3. Objetivo do Cenário 3 (melhor combinação)
- Decision: o horário escolhido passa a ser o de **maior saldo**: `economia de folha vs "manter horário" − venda perdida + venda adicional − custo adicional`, com os empates de hoje (menos contratações, menos dias fechados, menos horas cortadas, menos horas estendidas).
- Rationale: é a mesma busca com a unidade trocada; as travas (perda máxima de 10% e piso de horas) seguem iguais, calculadas sobre a venda hora a hora.
- Efeito esperado: como a venda perdida costuma passar a folha economizada, o Cenário 3 tende a ficar igual ao 1 ou a estender.

## 4. Economia de folha
- Decision: `economia = custo adicional do "manter horário" − custo adicional do cenário`. O Cenário 1 tem economia 0 e mostra o custo adicional contra a folha atual; o Cenário 2 (sem contratar) economiza o custo do Cenário 1.
- Rationale: é a definição pedida; `custoDasVagas` já inclui salários, encargos do regime e provisões. A hora extra entra só onde já existe (Simulação).

## 5. Venda adicional de hora nova
- Decision: o que já existe (registrada na hora, senão fração da hora vizinha), em venda em vez de margem, com `fatorHoraNova` vindo da premissa (padrão 50) em vez da constante.
- Rationale: a spec 020 já faz isso; só troca a unidade e torna o percentual editável.

## 6. Premissa editável
- Decision: `fatorHoraNova` entra em `premissasQuery` (0 a 100, padrão 50) e a tela o leva na consulta do Diagnóstico, com um campo discreto perto do título dos cenários. A margem simulada (`margemPct`) sai, porque nada mais depende dela.
- Rationale: o mecanismo de premissas "só para simular, nunca gravadas" já existe; não precisa de banco.

## 7. Simulação (Personalizar)
- Decision: a Simulação já soma a venda hora a hora; passa a mostrar `venda que sai`, `custo adicional (folha extra + hora extra)`, `economia de folha` contra o "manter horário" da mesma regra e o saldo. O "manter horário" é o custo das contratações que cobrem o horário do Cadastro com a equipe atual (a mesma conta do Cenário 1).
- Rationale: mesma conta, mesmo texto. Risco: exige calcular o custo do "manter horário" dentro da Simulação; vai com teste.

## 8. Saldo, anual e peso
- Decision: `saldo anual = saldo mensal × 12`; `peso = saldo ÷ faturamento mensal médio` (o mesmo de referência que o comparativo já usa); sem faturamento o peso fica nulo.
- Rationale: padroniza com o que o Cenário 1 já mostra.

## 9. Margem no Cadastro
- Decision: sai de `pendenciasDoCadastro` (servidor) e de `pendenciasDoRascunho` (tela); o campo continua, com a ajuda "Faturamento − CMV = Margem", como detalhe opcional.
- Rationale: nenhum cálculo de cenário a usa.

## 10. Soma do grupo
- Decision: função pura `somarGrupo(lojas)` com `{ saldo, vendaPerdida, economiaFolha, vendaAdicional, faturamentoMensal }` por loja; devolve os totais, o peso sobre o faturamento total e quantas lojas ficaram de fora por falta de dado.
- Rationale: atende o teste de soma sem criar tela.

## 11. Validação com lojas reais
- Decision: um script de conferência, fora do repositório, lê Cosmópolis e Porto Feliz do banco local e mostra a conta aberta (sábado até 16h e extensão de 1 h por dia); a Simulação cobre o corte, e a extensão de 1 h por dia usa a conta pura (os cenários só estendem sábado e domingo).
- Rationale: a validação pedida mostra a conta; nada disso é gravado.
