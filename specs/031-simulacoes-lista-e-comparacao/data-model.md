# Data Model: Lista e comparação de simulações

Nenhuma tabela ou coluna muda.

**Resumo de uma simulação** (calculado na hora, não guardado): `tipo` (mantem | reduz | amplia), `horasAbertas`, `desatualizada`, `criadaPor` (texto legível) e, só para o dono, `saldoMensal`, `folhaExtra`, `vendaEstimada`, `vendaQueSai`.

**Retrato gravado** (`premissas` da simulação): horário, mínimos, convenção e custos do momento da gravação; é com ele que a regra de "Desatualizada" compara a loja de hoje.

**Comparação** (resposta, não guardada): para cada simulação, os indicadores de hoje (erros, avisos, cobertura, pessoas, horas) mais o resumo acima; a base e as diferenças são decididas na tela.
