# Contrato de tela: folga livre na Escala da semana

Contrato de interface (não há endpoint novo; grava com o `PUT /simulacoes/:id` que já existe, campo `turnos`).

| Estado da célula | Controle novo | Nome acessível | Efeito |
| --- | --- | --- | --- |
| Turno | botão pequeno com ícone | `{Nome}, {dia}: dar folga` | remove o turno do dia e grava |
| Folga | botão pequeno com ícone | `{Nome}, {dia}: escalar neste dia` | cria o turno habitual da pessoa e grava |
| Loja fechada | nenhum | — | — |

- O botão grande da célula continua abrindo o dia na Escala por hora.
- Só aparece com a simulação editável; em simulação gravada, não aparece.
- Não bloqueia por cobertura nem por limite de dias: os avisos da avaliação mostram o efeito.
- Enquanto grava (`calculando`), os controles ficam desabilitados.
- Contratação simulada e quem foi desligado: a contratação tem o controle; desligado (linha opaca) não.
