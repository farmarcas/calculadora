# Research: Esticar os turnos até o limite da regra

## O que acontece hoje
- Decision: `aplicarFolgas` tira dias de quem passa do limite de dias; `ajustarJornada` corta o fim do turno que passa do máximo do dia ou do teto da semana. Nada aumenta turno. Em Cosmópolis, farmacêuticos com 7h por dia (35h em 5 dias) e atendimento com 8h (40h) ficam abaixo das 42h da regra.
- Rationale: é isso que o dono viu; o limite virou teto, não alvo.

## O limite da pessoa
- Decision: `limite = min(cargaH da pessoa, tetoEfetivo(regra))` em horas líquidas por semana; por dia, até `regra.maxDia` líquidas.
- Rationale: é o mesmo critério que `ajustarJornada` já usa para cortar.

## Onde esticar
- Decision: para cada função com exigência (farmacêutico e metas do dono), na cobertura depois das folgas, as horas com `pessoas < exigido` são as faltas. Para cada pessoa que trabalha menos que o limite (e não tem horário fixo), em cada dia que ela trabalha, estender o **fim** do turno (hora a hora) enquanto a hora seguinte tem falta, está dentro do horário da loja e o dia fica até `maxDia` líquidas; se o fim não alcançar, estender o **começo**. Parar quando a semana chega ao limite ou a função não tem mais falta.
- Rationale: simples, previsível e só mexe onde há ganho; ordem de pessoas: a que tem mais folga de jornada primeiro, e desempate pela matrícula (determinístico).
- Alternatives: estender todo mundo até o limite — muda horário à toa e cobre onde não falta.

## Intervalo
- Decision: o intervalo do turno é mantido; se o turno passa de 6 h líquidas e não tem intervalo, entra 1 h de intervalo no meio (regra já existente). Com a spec 045, intervalo de até 2 h não desconta da cobertura.
- Rationale: o esticamento não quebra as regras de jornada e intervalo.

## Descanso entre turnos
- Decision: antes de estender, conferir 11 h de descanso entre o fim de um dia e o começo do seguinte; se quebrar, não estende nesse dia.
- Rationale: a avaliação já cobra esse mínimo.

## Ordem e contratações
- Decision: folgas → ajuste de jornada → esticamento → conta de falta → contratações. Como o esticamento só cobre falta, `faltaH` só diminui, então o número de contratações nunca aumenta.
- Rationale: cumpre FR-005.

## Horário fixo
- Decision: `repo.matriculasHorarioFixo(lojaId)` já existe; os horários da equipe ganham `fixo` e o esticamento pula essas pessoas. Folgas e corte de jornada continuam valendo para elas.
- Rationale: o Cadastro já define isso.

## "Ajustado" na tela
- Decision: o turno esticado leva `antes: { entrada, saida }`; a tela marca "ajustado" quando `antes` existe e é diferente. Ao arrastar o turno, o `antes` se mantém; se o turno voltar ao horário de `antes`, a marca some.
- Rationale: sem chamada extra e sem tabela nova.

## Desfazer
- Decision: "Desfazer sugestão" (spec 042) já regrava os turnos de antes; como o esticamento acontece no mesmo passo ou em Personalizar, vale o mesmo mecanismo; no Personalizar, o esticamento já vem na criação e o dono ajusta na mão.
- Rationale: nada novo na API.
