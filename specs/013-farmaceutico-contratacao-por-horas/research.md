# Research: farmacêutico único mínimo e contratação por horas

## 1. Onde implementar
- **Decision**: dois módulos puros novos (`gap-horas.ts`, `contratacao-horas.ts`) chamados por `verificarRegra`, que mantém o formato `LinhaFuncao` e ganha campos novos.
- **Rationale**: o formato atual é lido por Diagnóstico, cenários 1 a 5, comparativo, simulações, vagas e tela; preservar o formato permite entregar por fatias sem quebrar nada.
- **Alternatives**: novo motor paralelo com formato novo (duplica e deixa dois cálculos divergindo); reescrever os consumidores de uma vez (grande e arriscado).

## 2. Meta dos demais cargos
- **Decision**: meta padrão do cargo = soma, para cada pessoa do cargo, de `min(carga do cadastro ou da escala, jornada da regra atual)` (o que ela cumpre hoje, em horas semanais). O "mínimo por função", quando maior que zero, vira **meta do dono**: `mínimo × horas abertas da semana` (a mesma conta de hoje), e substitui a meta padrão. Cargo sem ninguém e sem meta do dono: meta zero.
- **Rationale**: é a leitura literal aprovada; unidade em horas permite comparar com a capacidade.
- **Scaling**: com horário reduzido (cenários), a meta padrão acompanha `horas abertas do cenário ÷ horas abertas de hoje`.
- **Alternatives**: meta por faixa horária (mais fiel, exige a redistribuição pronta; vira refinamento da fatia 6).

## 3. Padrão do mínimo
- **Decision**: `FUNCOES_PADRAO_MINIMO` passa a `{ Farmacêutico: 1, demais: 0 }`; valores já gravados nas lojas continuam e passam a valer como meta opcional (sem migração de dados).
- **Rationale**: nenhuma loja perde dado; só muda o significado, de obrigatório para meta.

## 4. Gap
- **Decision**: gap do cargo = `max(0, necessidade − capacidade)` em horas, onde necessidade = horas abertas × 1 (farmacêutico) ou a meta (demais) e capacidade = soma de `min(carga, teto efetivo da regra)` por pessoa. Para o farmacêutico, os turnos atuais continuam calculados como verificação de cobertura por dia.
- **Rationale**: simples, igual ao diagnóstico de hoje para o farmacêutico (54 h na Porto Feliz) e comparável entre regras.

## 5. Contratação por horas
- **Decision**: para um gap `g` e jornada integral `J` (a efetiva da fase: 40 h na regra de 42 h sem convenção): testar `n` integrais de `floor(g/J)` a `ceil(g/J)`; o resto `r = g − n·J` vira **no máximo um** parcial se `0 < r ≤ 30`. Entre as combinações válidas, escolher a de menos horas ociosas e, em empate, a de menor custo. Gap ≤ 30 h: 1 parcial. Variante secundária: parcial de 26 h + até 6 h extras quando o resto está entre 30 e 32 h e isso reduz a ociosidade; identificada "com hora extra".
- **Rationale**: reproduz os exemplos do pedido (10 h → parcial 10 h; 35 h → integral; 54 h → 1 integral + parcial de 14 h) e nunca passa de 30 h de parcial.
- **Alternatives**: vários parciais por cargo (mais contratos, fora do pedido).

## 6. Custo
- **Decision**: parcial de `h` horas = `salário médio × h × 5 ÷ divisor da fase × (1 + encargos)` (a conta que já existe e é proporcional); integral = a mesma conta com a jornada efetiva; hora extra da variante 26 + 6 = hora normal × 1,5. Encargos continuam o percentual único da loja.
- **Rationale**: consistente com o custo das vagas hoje; o resultado da Porto Feliz (1 integral + parcial de 14 h) fica perto de R$ 10 mil por mês, contra R$ 14,9 mil de hoje.

## 7. Cenários
- **Decision**: "a equipe cobre?" nos cenários passa a considerar **só o farmacêutico** (o que a lei exige). Contratações do Cenário 1 e do Equilíbrio incluem o farmacêutico (obrigatória) e as metas dos demais (marcadas "para manter o nível de hoje"). O Cenário 2 continua sem contratar nada. Horas abertas menores reduzem a necessidade do farmacêutico e a meta dos demais.
- **Rationale**: mantém o sentido dos cenários e deixa claro o que é obrigação e o que é meta.

## 8. Redistribuição e horário fixo
- **Decision**: montagem gulosa de escala semanal por cargo (até 5 dias por pessoa, até 8 h por dia ou o permitido pela convenção, folga no domingo revezando), começando pelo farmacêutico; pessoa com `horario_fixo` mantém dias e horários e entra como carga já fixa. O descoberto por faixa alimenta o gap e a distribuição do parcial.
- **Rationale**: aproveita o quadro antes de contratar; o campo novo é opcional e nunca bloqueia o cálculo.
- **Alternatives**: otimização exata (pesada demais agora); manter só a capacidade agregada (não mostra dias e horários).

## 9. Parâmetros que deixam de valer
- **Decision**: o parâmetro `limiteParcial` (0 a 3 turnos) fica aceito na API e é ignorado; o painel de premissas já saiu da tela.
- **Rationale**: não quebrar clientes antigos da API; o limite agora é legal (30 h).
