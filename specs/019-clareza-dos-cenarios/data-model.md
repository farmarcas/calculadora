# Modelo de dados — Clareza dos cenários

Sem tabela nova. Campos novos na resposta do diagnóstico, todos opcionais:

- **Cenário 2 (`economia`)**
  - `faltaPorFuncao`: lista de `{ funcao, horasSemana }` com a falta abaixo do nível de hoje (só funções que não são farmacêutico, só `> 0`).
  - `semFarmaceuticoH`: horas semanais sem farmacêutico com os horários do cenário (0 se coberto).
  - `resultado`: frase da linha de resultado ("Nenhum horário precisa mudar" ou os dias alterados).
- **Comparativo**: em cada coluna, `premissa` (fixa) e `resultado`; na coluna 2, `faltaPorFuncao` e `semFarmaceuticoH`; `sugerido` (cenário que leva o selo) separado de `destaque` (menor custo).
- **Contratação**: `motivo` 'meta' passa a ser exibido como "(opcional)" (o valor da API não muda).
