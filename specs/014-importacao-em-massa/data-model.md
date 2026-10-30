# Modelo de dados: importação em massa

Sem tabela nova e sem migration. Colunas que a importação passa a preencher:

| Planilha | Coluna | Onde grava | Quem grava | Observação |
|---|---|---|---|---|
| Lojas | Convenção 8h24 (Sim/Não) | `lojas.convencao_8h24` | operador, dono | vazio mantém |
| Lojas | Meta de Farmacêutico / Atendimento / Caixa / Apoio / Perfumaria | `lojas.minimos` (mescla) | operador, dono | inteiro 0 a 10; Farmacêutico ≥ 1 |
| Lojas | Salário médio de cada função | `lojas.custos.salarioMedio` (mescla) | só dono | > 0 |
| Lojas | Encargos (%) | `lojas.custos.encargosPct` | só dono | 0 a 300 |
| Funcionários | Horário fixo (Sim/Não) | `funcionarios.horario_fixo` | operador, dono, gestor | vazio mantém |

Já existentes e sem mudança: dados da loja, horário por dia, 24 horas, faturamento por dia, mensal e margem (só dono), dados do funcionário.

## Resumo da importação (resposta)

`{ lojas: {novos, atualizados}, funcionarios: {novos, atualizados}, erros: [{aba, linha, motivo}], avisos: string[] }`. `avisos` é novo.
