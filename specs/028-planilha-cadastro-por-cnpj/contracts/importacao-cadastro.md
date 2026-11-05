# Contrato: importação do Cadastro

## Modelo para baixar (`GET /api/v1/importacoes/cadastro/modelo`)

**Aba Lojas**: `CNPJ *`, `Nome da loja / Apelido`, Cidade, UF, Marca, Regime tributário, Faturamento por dia e mensal, Convenção 8h24, Metas e Salários por função, Loja 24 horas, Abre/Fecha por dia. **Saem**: Código da loja, RAT (%), FAP, Provisão de rescisão.

**Aba Funcionários**: Matrícula *, Nome *, `CNPJ da loja *`, CPF, `Cargo` (lista: Farmacêutico, Atendimento, Caixa), carga, horários, intervalo, dias, horário fixo, regime. **Saem**: Código da loja de lotação, o antigo Cargo de texto livre.

**Aba "Como preencher"**: explica o CNPJ como identificação, o Cargo como lista, os encargos pelo regime; sem código de loja, RAT, FAP ou rescisão.

## Importação (`POST /importacoes/cadastro` e `/confirmar`)

| Situação | Resultado |
|---|---|
| Linha de loja com CNPJ de loja do grupo (com/sem pontuação, zeros perdidos) | atualiza a loja |
| CNPJ ausente (e sem código na planilha antiga) | erro de linha: "CNPJ da loja vazio" |
| CNPJ inválido | erro de linha: "CNPJ inválido" |
| CNPJ repetido na planilha | erro de linha: "CNPJ … repetido na planilha" |
| CNPJ sem loja no grupo | erro de linha: "CNPJ não encontrado entre as lojas do grupo" |
| Planilha antiga com código e sem CNPJ | reconhece pelo código, como hoje |
| CNPJ e código na mesma linha | vale o CNPJ; o código cadastrado não muda |
| Funcionário com "CNPJ da loja" (ou código de lotação antigo) | liga à loja; senão erro de linha como acima |
| Cargo fora da lista | função deduzida do texto; sem dedução, "Outros cargos" |
| Colunas RAT, FAP, rescisão, margem em planilha antiga | ignoradas, sem erro |

Mapeamento: deixa de exigir "Código da loja"; exige "CNPJ **ou** Código" (aba Lojas) e "CNPJ da loja **ou** Código da loja de lotação" (aba Funcionários).

## Custos da loja

`PUT` dos custos: `encargos` (ajustes) é aceito e ignorado; o valor guardado é preservado. O custo usa `encargos.totalPct` do regime da loja.
