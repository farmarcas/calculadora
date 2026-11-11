# Research: Folgas sugeridas

## Quantas folgas
- Decision: folgas por pessoa = `max(0, diasQueTrabalha − regraInfo.dias)`; a pessoa fica com `regraInfo.dias` dias de turno (44h: 6; 42h e 40h: 5), limitado aos dias abertos da loja.
- Rationale: é o mesmo limite que a avaliação do servidor já cobra ("exige N folga(s) por semana").
- Alternatives: ajustar pela carga contratada em horas — mistura duas decisões; fica para depois.

## Que dias folgar
- Decision: para cada função, ordenar as pessoas com mais dias a retirar primeiro e escolher, para cada folga, o dia com mais **sobra de cobertura** (pessoas presentes menos o exigido, no pior momento do dia, recalculado com `recalcularCobertura` após cada retirada); empate pelo dia com menos venda e depois pelo mais cedo na semana. Duas pessoas da mesma função só folgam no mesmo dia se não houver outro.
- Rationale: tira da hora em que a pessoa faz menos falta e usa a conta de cobertura que a tela já tem.
- Alternatives: sorteio ou rodízio fixo (Seg/Ter…) — pode derrubar cobertura.

## Domingo
- Decision: se a loja abre no domingo, para cada função, `ceil(pessoas / 3)` pessoas recebem o domingo como uma das folgas (as que têm mais sobra no domingo), desde que a cobertura mínima permita; senão a cobertura vence e o card avisa. Função com 1 pessoa: não força o domingo e avisa.
- Rationale: 1 domingo de folga a cada 3 semanas (Lei 10.101/2000, art. 6º, parágrafo único) ⇒ em cada semana, 1/3 da equipe folga no domingo; EC 141/2026 mantém o domingo "preferencial".
- Alternatives: desenhar 3 semanas — a tela mostra uma; ficaria fora desta entrega.

## Mulheres (art. 386 da CLT) e regras de farmácia
- Decision: fora desta entrega. Não confirmado pelo jurídico; o sistema não sabe o sexo das pessoas; fica como pendência e o texto do card não promete cumprimento da lei.

## Avisos
- Decision: depois de sugerir, rodar a cobertura de cada dia/função; as horas que ficam abaixo do mínimo viram um aviso curto ("Sexta: falta 1 farmacêutico às 14h") e a faixa amarela da Escala por hora já mostra o resto.

## Gravação e desfazer
- Decision: guardar na página o turno de antes da sugestão; "Desfazer sugestão" regrava esses turnos. A gravação usa `PUT /simulacoes/:id { turnos }` já existente.
- Rationale: nenhuma API nova.
