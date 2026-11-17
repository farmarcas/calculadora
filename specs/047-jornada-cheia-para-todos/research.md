# Research: Jornada cheia para todos

## A jornada por dia
- Decision: `jornadaDia = min(regra.maxDia, tetoEfetivo ÷ regra.dias)`. 42h com convenção: min(8,4; 42÷5 = 8,4) = 8,4 = 8h24; 42h sem convenção: min(8; 40÷5) = 8; regra de 44h: min(8; 44÷6 = 7,333) = 7h20.
- Rationale: é a `duracaoTurno` que o sistema já usa.

## O limite da pessoa
- Decision: `limite = min(cargaH, tetoEfetivo)`; por dia, `min(jornadaDia, folga da semana)`.
- Rationale: nunca passa da carga contratada nem do teto.

## Fase 2: completar
- Decision: depois da fase 1 (cobrir falta, spec 046), para cada pessoa sem horário fixo e cada dia que ela trabalha, enquanto a duração líquida do dia for menor que `jornadaDia`: estender o fim até o horário de fechamento ou o descanso de 11 h; se o fim não alcançar, estender o começo até a abertura; quando o turno passa de 6 h sem intervalo, entra 1 h de intervalo (e a duração líquida é recalculada). Ordem das pessoas: a mesma da spec 046; dias em ordem.
- Rationale: simples e determinístico; cobre primeiro onde falta (fase 1).

## Minutos inteiros
- Decision: horas guardadas como decimais; o servidor aceita `Math.round(h × 60)/60 ≈ h` (múltiplo de 1 minuto, tolerância de 1e-6); a conta usa minutos arredondados (`emMinuto = round(h×60)/60`) para evitar sobras de ponto flutuante.
- Rationale: 8h24 = 8,4 h = 504 min; qualquer minuto inteiro é representável.

## Cadastro
- Decision: tirar o arredondamento do Cadastro para quartos de hora na criação da Simulação (`emQuartosDeHora`): passa a arredondar só ao minuto.
- Rationale: o arredondamento foi criado por causa do limite de 15 minutos.

## Tela
- Decision: `turnosParaGravar` arredonda ao minuto (no lugar do quarto); `moverTurno` mantém a duração (a saída é entrada + duração, sem arredondar a quarto); `redimensionarTurno` continua andando de 15 em 15 minutos; os textos de horas (`hhTexto`) já mostram minutos.
- Rationale: arrastar continua simples e uma barra esticada não perde os minutos.

## Efeito nos cenários
- Decision: a fase 2 roda dentro de `semanaComFolgas`; as contratações só diminuem ou ficam iguais, e o cartão continua igual ao Personalizar.
- Rationale: FR-006.
