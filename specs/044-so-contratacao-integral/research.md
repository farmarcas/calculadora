# Research: Só contratação integral

## Onde nasce o parcial
- Decision: `sugerirContratacao` (regras/contratacao-horas.ts) é o único lugar que decide parcial × integral. Ele monta combinações (só parcial, só integral, integral + parcial) e uma variante de 26h + até 6h extras; `verificarRegra` (capacidade.ts) usa o resultado para `contratar`, `parcialH`, `contratarInteiras`; o resto (`cenarios`, `comparativo`, `linhas-cenarios`, `etapas`, `resultado-em-horas`) lê esses campos.
- Rationale: trocar a decisão aqui propaga para tudo sem mexer nos consumidores além de textos.

## A nova regra do motor
- Decision: `principal = { inteiras: ceil(gapH ÷ jornadaIntegralH), parcialH: null }`, `alternativa = null`. O gap nulo continua sem sugestão. As horas ociosas passam a ser `inteiras × jornada − gap`.
- Rationale: é a leitura direta do pedido; a ociosidade já é calculada e exibida.
- Alternatives: arredondar a integral para baixo e cobrir o resto com hora extra — é parcial disfarçado e foi retirado.

## Conta real (spec 043)
- Decision: o laço de `semanaComFolgas` continua somando horas até fechar a cobertura, agora com `sugerirContratacao` integral; as vagas são posicionadas em até `regra.dias` dias, e o que não fechar continua marcado como "não resolve sozinho".
- Rationale: sem mudar o desenho da spec 043; só o tipo de contratação muda.

## Servidor: vaga nova
- Decision: em `criar` e `editar` (vagas), uma vaga **sem matrícula** (nova) só é aceita com `cargaH` igual à jornada cheia da regra da simulação; com matrícula (já existente) vale como estava. Erro: "A contratação é integral: [N] horas por semana nesta regra."
- Rationale: impede parcial novo sem quebrar simulações salvas; as vagas sugeridas por Personalizar já saem integrais.

## Tela
- Decision: `FormularioContratar` perde o seletor de tipo e a carga é a jornada cheia; `sugerirContratacao`/`erroDoFormulario`/`turnosParaVaga` da tela deixam de tratar parcial (sem `LIMITE_PARCIAL_H` e `MIN_VAGA_H` nas contratações novas); textos "· parcial" e o `parcialHoras` dos cartões saem.
- Rationale: o formulário só cria o que o servidor aceita.

## Cenários e simulações já salvas
- Decision: não reescrever; o resultado de uma simulação gravada com vaga parcial segue calculando pelo `cargaH` dela (tipo `parcial` no resultado continua existindo só para leitura).
- Rationale: SC-004.

## Premissa `limiteParcial`
- Decision: a premissa `limiteParcial` (0 a 3 turnos) fica sem efeito e sai da interface se ainda houver; a rota continua aceitando o parâmetro (ignorado) para não quebrar quem o envia.
