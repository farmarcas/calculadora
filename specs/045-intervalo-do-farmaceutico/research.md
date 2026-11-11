# Research: Intervalo de até 2 horas não precisa de cobertura

## Onde a presença é calculada
- Decision: cinco cópias do mesmo critério ("na hora inteira e fora do intervalo"): `simulacoes/avaliar.ts` (`presente`), `escala/cobertura.ts` (`cobre`), `escala/distribuir-parcial.ts` (`cobreCelula`), `escala/semana-com-folgas.ts` (`presente`) e `escala-regras.js` na tela (`presente`, `quemEstaEmIntervalo`).
- Rationale: mudar o critério nos cinco mantém Diagnóstico, Simulação, cenários e tela iguais.

## O novo critério
- Decision: o intervalo só desconta quando tem **mais de 2 horas** (`fimIntervalo − iniIntervalo > 2`). Até 2 horas, a pessoa conta presente durante o intervalo.
- Rationale: é a regra pedida; o limite de 2 horas fica numa constante.
- Alternatives: descontar só o que passa de 2 horas — mais complexo, e o pedido é "até 2 horas sem cobertura".

## A hora do intervalo na tela
- Decision: `quemEstaEmIntervalo` continua devolvendo quem está em intervalo (para a dica e a barra), mas a célula da cobertura já conta a pessoa; a dica diz "Em intervalo (não precisa de cobertura): Eliane".
- Rationale: o dono ainda vê o almoço, sem confundir com falta.

## Efeito nos cenários
- Decision: nada a fazer além do critério: a conta real da spec 043 usa `presente`, então o buraco do almoço deixa de gerar falta e contratação. Os testes que dependiam do intervalo mudam e são listados.
- Rationale: a mudança é na base da conta, não no motor.

## Compatibilidade
- Decision: intervalos acima de 2 horas e turnos sem intervalo dão os mesmos números de antes.
- Rationale: SC-003.
