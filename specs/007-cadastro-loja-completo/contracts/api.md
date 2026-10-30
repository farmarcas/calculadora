# Contrato HTTP — mudanças (`/api/v1`)

## Lojas
`POST /lojas`, `PATCH /lojas/:id`, `GET /lojas` ganham:
```jsonc
{ "cidade": "Belo Horizonte", "regimeTributario": "simples",   // simples | presumido | real | null
  "faturamento": { "dias": [12000, 12000, 12000, 12000, 15000, 18000, null], "mensal": 420000, "margemPct": 28 } }
```
- `faturamento` só existe na resposta para `TENANT_ADMIN`; os demais perfis nem o recebem, e enviá-lo sendo gestor devolve 403.
- `PUT /lojas/:id/custos` deixa de aceitar `regimeTributario` (campo removido do corpo); `GET` continua devolvendo `custos` sem ele.
- Erros no formato padrão: CNPJ inválido, UF fora da lista, valor negativo, margem fora de 0–100.

## Funcionários
`POST /funcionarios`, `PATCH /funcionarios/:id`, `GET /funcionarios` ganham:
```jsonc
{ "cargaMensalH": 220, "cargaSemanalH": 44,   // semanal derivada
  "entrada": "08:00", "saida": "17:00", "dias": [0,1,2,3,4],
  "cpf": "123.456.789-09" }                   // mascarado para consulta
```
- 409 `CPF_DUPLICADO` quando já existe na loja entre ativos; 422 para CPF inválido ou saída igual à entrada.

## Diagnóstico
`GET /lojas/:id/diagnostico` ganha `origemVendas: "base" | "cadastro" | null`. Com `"cadastro"`, `vendas.top` e `numeros.maiorVendaDescoberta` vêm nulos e os cenários 2–4 usam a venda estimada. `fontes` indica se há faturamento cadastrado.

## Planilha
O modelo ganha colunas opcionais: `Cidade`, `Regime_Tributario`, `Carga_Mensal`, `Entrada`, `Saida`, `Dias`, `Fat_Seg`…`Fat_Dom`, `Fat_Mensal`, `Margem_Pct`. Planilhas antigas seguem válidas.
