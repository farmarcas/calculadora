# Contrato — resposta do diagnóstico (campos novos)

Rota existente do Diagnóstico; só se acrescentam campos opcionais, nada é removido. Valores em R$ seguem só para o dono.

| Campo | Onde | Tipo | Quando aparece |
|---|---|---|---|
| `premissa` | cada coluna do comparativo | texto fixo | sempre |
| `resultado` | cada coluna | texto | sempre |
| `faltaPorFuncao` | coluna `economia` | `[{ funcao, horasSemana }]` | só se houver falta |
| `semFarmaceuticoH` | coluna `economia` | número | sempre (0 se coberto) |
| `sugerido` | comparativo | `manter \| economia \| equilibrio \| null` | sempre |
| `recolher` | coluna `equilibrio` | `'manter' \| 'economia' \| null` | quando coincide |
| `lojaCobreTudo` | comparativo | booleano | quando os cenários não têm o que mostrar |
