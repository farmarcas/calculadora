# Research — Cenários por dia

## Decisões

- **Venda do dia = soma das horas do dia.** `vendasPorDiaEHora` (média por dia da semana e hora) já recebe a base comercial ou as linhas sintéticas do faturamento do cadastro; somando as 24 horas de cada dia dá a venda e a margem médias do dia. Por isso, com faturamento por dia informado, a venda do dia é exatamente o valor do cadastro. Alternativa rejeitada: ler o faturamento direto no cenário (duplicaria a regra de precedência base > cadastro > estimativa).
- **Origem:** `base` | `cadastro` (por dia) | `estimativa` (só o mensal, dividido entre os dias abertos). `vendas-cadastro.ts` passa a informar `soMensal`.
- **Margem mensal do dia** = margem média do dia × 52 ÷ 12 (mesmo `SEMANAS_NO_MES` de hoje). Margem perdida ao fechar o dia = margem mensal × (1 − recaptura).
- **Economia = contratação evitada.** O custo de uma combinação de dias abertos vem de `verificarRegra` (quantas pessoas ainda faltam) e `custoDasVagas` (mesmo custo do Cenário 1): quem já está no quadro continua pago.
- **Cenário 2 (guloso):** dias abertos candidatos, não protegidos primeiro, do de menor margem mensal ao de maior; fecha um a um até `passa(verificarRegra)`. Se não basta, continua pelos protegidos e marca `naoRecomendado` com os dias atingidos. Se nem fechando tudo menos um dia passa, fica indisponível apontando o Cenário 1. Nunca fecha o último dia aberto.
- **Cenário 3 (enumeração):** para cada subconjunto não vazio dos dias abertos que não fecha dia protegido, calcula contratações e custo; `resultado = Σ margem dos dias abertos − custo adicional`. Escolhe o maior; desempate: menos contratações, depois menos dias fechados. Como "manter tudo" e a combinação do Cenário 2 estão no espaço de busca, o resultado nunca é pior que os cenários 1 e 2 (com a margem perdida dos dias protegidos fora do espaço: se o Cenário 2 precisou fechar um protegido, o Cenário 3 não o considera).
- **Impacto mensal (dono):** Cenário 1 = custo adicional; Cenário 2 = margem perdida; Cenário 3 = custo adicional + margem perdida; igual à definição atual, então o selo continua "o menor impacto".
- **Cenário 4:** equipe = pessoas atuais + vagas do Cenário 1; candidatos = dias hoje fechados; viável se `passa(verificarRegra)` com o dia aberto, sem nova contratação; horário do dia = o do dia aberto mais curto; margem = a do dia no cadastro/base se existir, senão 50% da média dos dias abertos; escolhe o de maior margem e repete enquanto couber. Custo adicional = o do Cenário 1.
- **Dias protegidos:** os 3 de maior faturamento entre os dias abertos (empate: o mais tardio na semana); loja com 3 dias abertos ou menos tem os mesmos candidatos limitados a "nunca fechar o último".
- **Recaptura:** `?recaptura=0..30` no pedido do Diagnóstico (inteiro, em %); a tela guarda o valor e recarrega. Não é gravada.
- **Visibilidade:** o filtro que hoje esconde venda e margem só quando a origem é o cadastro passa a valer sempre para quem não é dono.
- **Frase-resumo:** montada no servidor a partir do resultado ("Fechando o domingo você deixa de contratar 1 farmacêutico (R$ X/mês) e perde R$ Y de margem"), sem valores para quem não é dono.

## Riscos

- Os números dos cenários 2, 3 e 4 mudam; mitigação: avisar na tela e conferir à mão cada cenário nos testes.
- Muitas lojas fecham poucos dias com sentido: o resultado mais comum será "o equilíbrio é contratar tudo"; é esperado e está no texto.
- Remover código por hora exige reescrever testes antigos dos cenários 2, 3 e 4 (não os do 1 e do 5).
