# Data Model — Cadastro de loja completo

Migration expand-only; nada é apagado nem renomeado.

**Loja** (`lojas`)
- `cidade` String? — novo.
- `faturamento` Json? — novo, só dono: `{ "dias": [seg…dom, cada número ≥ 0 ou null], "mensal": número ≥ 0 ou null, "margemPct": 0–100 ou null }`.
- `regimeTributario` String? — novo; valores `simples` | `presumido` | `real` (rótulos: Simples Nacional, Lucro Presumido, Lucro Real). A migration copia para cá o `regimeTributario` que já estiver dentro de `custos` (mapeando os três textos conhecidos; texto desconhecido fica nulo) e o remove de `custos`.
- `marca` continua; rótulo da tela vira "Bandeira".

**Funcionário** (`funcionarios`)
- `cargaMensalH` Int? — novo (1–260). `cargaSemanalH` continua e é derivada (mensal ÷ 5, arredondada).
- `entrada` Float?, `saida` Float? — novos, horas decimais (8.5 = 08:30); saída menor que entrada = vira o dia.
- `dias` Int[] — novo, dias trabalhados (0 = segunda … 6 = domingo), vazio = horário só informativo.
- Sem índice único no banco para CPF (dados antigos podem repetir); a unicidade por loja entre ativos é checada no serviço.
- Exclusão continua lógica.

**Venda do cadastro** (não é tabela): calculada na hora a partir de `faturamento` e do horário da loja, no formato `VendaLinha` (data da semana de referência, hora, venda, margem).

**Origem da venda** (resposta do diagnóstico): `"base" | "cadastro" | null`.
