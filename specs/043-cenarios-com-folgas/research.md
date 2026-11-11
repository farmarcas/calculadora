# Research: Cenários que já contam as folgas

## Como o cenário calcula hoje
- Decision: entender antes de mudar. `verificarRegra` (regras/capacidade.ts) calcula, por função, `necessidadeH` (horas exigidas na semana) e `capacidadeH` (soma de `min(cargaH, teto, dias×maxDia)` por pessoa); `gapH = necessidadeH − capacidadeH`, e a sugestão de contratação sai de `gapH`.
- Rationale: a conta já limita cada pessoa às horas da regra (42h), mas não sabe **em que dias e horas** a pessoa trabalha; folgas e domingo não entram. A Simulação, por sua vez, abre com os turnos do Cadastro (7 dias).

## Falta real por cobertura hora a hora
- Decision: com os horários do Cadastro, aplicar folgas e rodízio, e medir a cobertura real: para cada dia e hora, `coberto = min(pessoas presentes, exigido)`. `capacidadeCobreH = Σ coberto`; `gapH = necessidadeH − capacidadeCobreH`.
- Rationale: é a mesma cobertura que a Escala por hora mostra, então o cartão e a Simulação concordam; farmacêutico continua obrigatório em todas as horas.
- Alternatives: manter horas e só somar "horas de folga" — erra o horário em que a pessoa falta.

## Folgas e domingo no servidor
- Decision: portar para TypeScript as regras da spec 042 (`sugerirFolgas`): limite de dias da regra, dia de maior sobra, espalhar entre pessoas, domingo `ceil(n/3)` por função. Testes com os mesmos casos nos dois lados (JSON de casos compartilhado ou casos espelhados).
- Rationale: fonte única no servidor sem perder o botão da tela.
- Alternatives: chamar o servidor a cada clique do botão — mais lento e muda o comportamento da spec 042.

## Contratações e turnos
- Decision: posicionar a contratação nas horas e dias que ficam sem cobertura (parcial até 6 h por dia, integral na jornada da regra, como na spec 040), conferir; se ainda falta, somar 1 turno por vez até fechar, com teto de 20 vagas (o limite que já existe). Se o teto não fechar, a linha vira "não resolve sozinho".
- Rationale: o número do cartão é o que a Simulação confirma; nada de prometer o que não fecha.

## Domingo e função com pouca gente
- Decision: a cobertura vence o rodízio. Função com poucas pessoas não força o domingo; o cenário mostra o texto do que falta.

## Cenários antigos
- Decision: não reescrever. Os números novos aparecem quando o cenário é recalculado ou a Simulação é reaberta.

## Compatibilidade
- Decision: `verificarRegra` e o motor funcionam sem horários (comportamento de hoje), então testes e chamadas antigas continuam valendo; o Diagnóstico usa a conta nova só quando há horários da equipe.
