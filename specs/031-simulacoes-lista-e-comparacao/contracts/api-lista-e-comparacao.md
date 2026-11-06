# Contrato: lista e comparação de simulações

## `GET /api/v1/lojas/:id/simulacoes` (lista)

Cada item de `data` mantém os campos de hoje (`id`, `nome`, `status` = rascunho | gravada | descartada, `regra`, `autor`, `criadaEm`, `gravadaEm`, `numeroCenario`) e ganha:

| Campo | Quem recebe | Valor |
|---|---|---|
| `tipo` | todos | `"mantem"`, `"reduz"` ou `"amplia"` |
| `horasAbertas` | todos | horas abertas por semana da simulação |
| `desatualizada` | todos | `true` quando é gravada e a loja mudou depois |
| `criadaPor` | todos | texto legível ("Administrador da conta") |
| `saldoMensal`, `folhaExtra` | só o dono | número ou `null` quando falta salário ou venda por hora |

O campo `resultado` bruto deixa de ir na lista. Ordem: mais recente primeiro.

## `GET /api/v1/lojas/:id/simulacoes/comparar?ids=a,b,c`

`2 a 4` ids da mesma loja, não descartadas; a **ordem** dos ids é a ordem das colunas e a primeira é a base. Cada item de `simulacoes` mantém `id`, `nome`, `status`, `regra`, `indicadores`, `vagas`, `sintese`, `custo` (dono) e ganha `tipo`, `desatualizada`, `horasAbertas` e, só para o dono, `saldoMensal`, `folhaExtra`, `vendaEstimada` e `vendaQueSai`.

Erros: menos de 2 ids, mais de 4, loja diferente ou simulação descartada → 400 com mensagem em português.

O saldo da lista, o da comparação e o do painel de resultado da simulação são o mesmo número.
