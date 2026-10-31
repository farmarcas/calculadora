# Data Model — "De onde vêm esses números"

Sem tabela nova. Só um campo aditivo na resposta do Diagnóstico e o view-model da tela.

## Acréscimo no servidor (`GET /lojas/:id/diagnostico`)
`regras[id='r42'].com8h24`: `{ funcoes: [{ funcao, capacidadeH, saldoH, gapH, necessidadeH }] }` — a verificação da regra de 42h com a convenção ligada. Ausente quando a loja já permite 8h24.

## View-model da seção (calculado no front, memorizado por loja e regra)
- **eixo**: horas `[h0 … hN]` (união do horário da loja, das vendas e dos turnos).
- **turnos[]**: `{ nome, inicio, fim, de, ate, dentro: [{de,ate}] }` (recortados ao horário da loja; todos visíveis, mesmo sobrepostos).
- **vendas[]**: `{ hora, valor, participacao, pico, foraDoHorario }`.
- **cobertura[]**: por função, `{ funcao, rotuloMinimo, celulas: [{ hora, pessoas, exigido, estado: 'atende'|'abaixo'|'fora' }] }`.
- **observacaoPico**: `null` ou `{ horaIni, horaFim, pessoasNoPico, pessoasFora, h1, h2 }`.
- **vendasForaDoHorario**: `null` ou `{ horas: [..], janela: 'HH:mm–HH:mm' }`.
- **regras[]**: `{ id, nome, vigenciaTxt, resumo, status: 'atende'|'falta', faltam: [função…], destacada, linhas: [{ funcao, capacidadeH, pessoas, horasPorPessoa, saldoTxt, turnos?, barra: { cap, precisa, falta } }] }`.
- **oito24**: `null` ou `{ funcao, comH, faltariaH, faltaHoje }`.
- **equipe**: `{ noCalculo, foraDoCalculo, grupos: [{ funcao, pessoas, horas, linhas: [...] }] }`.
