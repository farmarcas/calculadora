# Research — Cenário 1 em turnos e comparativo

## Decisões

- **Turnos faltantes** = `max(0, necessidade em turnos − capacidade em turnos)`; os dois já saem de `verificarRegra` (`necessidadeT`, `capacidadeT`, `saldoT`), com a exigência por turno da loja (spec 008).
- **Regra do documento:** `inteiras = ⌊faltantes ÷ dias da fase⌋`, `resto = faltantes mod dias`; resto 1 a `limiteParcial` vira 1 parcial de `resto × duração do turno` horas; resto acima do limite vira +1 inteira. `limiteParcial` fica entre 0 e 3 (padrão 3), pois 3 turnos de 8 h = 24 h cabem nas 30 h da jornada parcial; 0 desliga o parcial.
- **Conferência final (CEN1-07):** depois de contratar, soma-se a capacidade em horas das vagas (inteiras = jornada cheia da regra; parcial = suas horas); se ainda faltar hora, acrescenta inteira até fechar e marca `ajustado`. Os turnos fecham por construção.
- **Forma do resultado em `LinhaFuncao`:** `contratarInteiras`, `parcialTurnos`, `parcialH`, `ajustado`; `contratar` continua como total de pessoas (inteiras + parcial) para quem só quer a contagem. Quem usava `parcialH` como "uma só vaga" (`contratacoesDe`, `custoDasVagas`, `vagasSugeridas`) passa a tratar inteiras e parcial separadamente.
- **Efeito esperado:** onde hoje há resto pequeno o sistema pedia uma pessoa inteira; agora pede um parcial (folha menor). Onde o resto era grande, igual a hoje.
- **Etapas:** etapa 1 = contratações da fase de 42h; etapa 2 = da fase de 40h; adicional = diferença por cargo (inteiras e horas parciais, nunca negativa).
- **Faturamento mensal de referência:** `faturamento.mensal` informado; senão soma dos dias × 52 ÷ 12; senão total da base comercial por dia da semana × 52 ÷ 12; senão ausente (o percentual some e a tela diz o que falta).
- **Custo anual** = custo adicional mensal × 12; **% do faturamento** = custo adicional mensal ÷ faturamento mensal de referência.
- **Comparativo:** montado no servidor a partir dos cenários 1, 2 e 3 já calculados:
  - `custoFolhaMensal` = folha atual + custo adicional do cenário; `margemMes` = margem perdida (negativa) ou 0; `resultadoLiquidoMensal` = −impacto mensal; `impactoPctFaturamento` = impacto ÷ faturamento mensal; essas quatro linhas só para o dono.
  - `status`: `viavel` (cobre sem fechar dia protegido), `nao_recomendado` (fecha dia protegido, spec 009), `inviavel` (não consegue cobrir); sem dados de custo ou venda o status fica nulo e o alerta diz o que falta.
  - `alertas`: origem estimada da venda, custos faltando, parcial usado, ajuste da conferência, dia protegido atingido.
  - `destaque`: o mesmo `destacar` do selo (menor impacto = maior resultado líquido).
- **Premissas editáveis:** viram parâmetros do pedido (`?recaptura=0..30`, `?margemPct=0..100`, `?fatorDiaNovo=0..100`, `?diasProtegidos=0..6`, `?limiteParcial=0..3`), validados, nunca gravados; a resposta devolve as premissas em uso. A margem só vai para o dono. Alternativa rejeitada: gravar premissas na loja (o documento pede só simular).
- **Visibilidade:** o filtro de valores em reais para quem não é dono é o mesmo da spec 009 e vale para o comparativo.

## Riscos

- Muda `contratar` no cálculo central: quadro central, simulações e testes que conferem esse número; mitigação: contas à mão nos testes novos e atualização consciente dos antigos, um a um.
- Depende da spec 009 para os status "não recomendado" e para o Cenário 3 por dia; a fatia 3 só começa depois.
- Muitas lojas terão o mesmo resultado nas duas regras quando o resto é 0 ou maior que 3; é esperado.
