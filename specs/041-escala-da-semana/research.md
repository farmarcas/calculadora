# Research: Escala da semana

## Onde o card entra
- Decision: Simulação, abaixo da Escala por hora.
- Rationale: só ali existem `sim.turnos`, `sim.quadro` e as Contratações simuladas; confirmado pela pessoa.
- Alternatives: Diagnóstico (não tem turnos nem a grade) — fica para outra etapa.

## Fonte dos dados
- Decision: usar `sim.quadro`, `sim.turnos` (com o ajuste em andamento) e `sim.diasAbertos`; nenhuma chamada nova.
- Rationale: é a mesma fonte da Escala por hora, então os totais batem (SC-002).
- Alternatives: endpoint novo de escala semanal — duplicaria cálculo.

## Total da semana e jornada
- Decision: reaproveitar `totalDaSemana` (horas líquidas, intervalo descontado). Destaque de atenção quando horas > `cargaH` da pessoa.
- Rationale: já é a regra usada na Escala por hora.
- Alternatives: recalcular na tabela — risco de divergir.

## Clique no dia
- Decision: o dia escolhido sobe para `SimulacaoPage`; `EscalaPorHora` aceita `dia`/`onDia` opcionais (sem eles, segue como hoje). O clique troca o dia e rola até a Escala por hora.
- Rationale: mudança mínima e sem duplicar estado.
- Alternatives: evento global ou âncora na URL — mais frágil.

## Cores das funções
- Decision: tokens novos `--escala-semana-*` apontando para tokens do DS (verde `func-success`, azul `system`, amarelo `func-attention`).
- Rationale: o quadro pede verde, azul e amarelo; nenhuma cor nova fora dos tokens.

## Estado vazio
- Decision: sem nenhum turno na simulação, mostra o texto pedido e o botão "Cadastrar turnos", que leva à tela de Cadastro da loja.
- Rationale: é onde os turnos nascem hoje.

## Celular
- Decision: rolagem lateral com a coluna da pessoa fixa (`position: sticky`).
- Rationale: o desenho do celular ainda não existe (pedido).
