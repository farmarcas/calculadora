# Pesquisa — Clareza dos cenários

## 1. De onde vem a falta de cobertura por função
- Decision: usar `verificarRegra` (já usada em `cenarios.ts`) com os horários do cenário e a equipe atual; a falta de cada função é `gapH`.
- Rationale: é a mesma conta do diagnóstico ("Faltam 32 h de atendimento"), então card e diagnóstico mostram o mesmo número.
- Alternatives: a cobertura hora a hora (`cobertura.ts`) — descartada; é por "pior dia", não soma horas por semana.

## 2. Horas sem farmacêutico
- Decision: é o `gapH` do farmacêutico (obrigatório) no mesmo cálculo, com os horários do cenário. Em Sumaré dá 0.
- Rationale: já reflete os ajustes de horário do cenário (a dúvida levantada na spec).
- Alternatives: `faixasSemFarmaceutico` do diagnóstico — descartada; é número de hoje, não do cenário.

## 3. Quando o Cenário 2 "deixa função abaixo do nível de hoje"
- Decision: o Cenário 2 sem contratar deixa qualquer função com `gapH > 0` sem cobrir; só se `passa` (farmacêutico) ele é viável sem corte.
- Rationale: o nível de hoje nunca "falta" para `passa`; por isso hoje o card dizia que cobre tudo.

## 4. Cenários 1 e 3
- Decision: o Cenário 1 contrata para cobrir tudo (sem falta); o Cenário 3 também, nos dias que ficam abertos. Só o Cenário 2 mostra linha de falta.
- Rationale: por construção eles contratam o que falta.

## 5. Recolher e frase única
- Decision: o servidor já informa `coincideComManter/Economia`; a frase única vale quando o Cenário 1 não contrata nada e o 2 não muda nada. A tela só decide o que exibir.
- Rationale: nenhuma regra nova de negócio no front.

## 6. Selo "sugerido"
- Decision: o destaque (menor custo) continua calculado como hoje; o selo "Cenário sugerido" vai para o 1 quando o menor custo deixa falta de cobertura.
- Rationale: assumido na spec; fácil de mudar.
