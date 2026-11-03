# Contrato — resposta do diagnóstico (campos novos)

Só se acrescentam campos opcionais; nada é removido. Valores em R$ seguem só para o dono.

| Campo | Onde | Tipo | Quando aparece |
|---|---|---|---|
| passo `tipo: 'estender'` | `equilibrio.passos`, `horariosAjustados` (com `depois` maior) | `{ tipo, dia, horas, de, para }` | só se o Cenário 3 estende |
| `horasEstendidas` | `equilibrio` | lista | só se estende |
| `margemGanhaMes` | `equilibrio` | número (dono) | só se estende |
| `impactoRobusto` | `equilibrio` | número (dono) | só se estende |
| `estimativaDeVenda` | coluna `equilibrio` do comparativo | booleano | só se estende |

Sem extensão que compense, a resposta do Cenário 3 é idêntica à de hoje.
