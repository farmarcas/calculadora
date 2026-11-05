# Contrato: revisões que não gravam

## Importação do Cadastro

`POST /api/v1/importacoes/cadastro` (como hoje): envia o arquivo, devolve `id`, `abas`, `mapeamento` entendido e `campos`.

`POST /api/v1/importacoes/cadastro/:id/revisar` — corpo `{ mapeamento }` (o devolvido acima). **Não grava e não muda o status da importação.** Resposta 200:

```json
{
  "arquivo": "cadastro.xlsx",
  "lojas":        { "atualiza": 12, "novas": 0, "comErro": 1 },
  "funcionarios": { "atualiza": 30, "novas": 18, "comErro": 2 },
  "erros": [ { "aba": "Lojas", "linha": 14, "motivo": "CNPJ não encontrado entre as lojas do grupo" } ],
  "avisos": [ "Faturamento, salário médio e encargos foram ignorados em 3 loja(s): só o dono do grupo grava esses valores." ]
}
```

Os números são os que `POST …/:id/confirmar` produz com o mesmo mapeamento. Coluna essencial ausente: 400 com "Não encontramos a coluna CNPJ. Baixe o modelo e confira os nomes das colunas." Perfil que não importa lojas: `lojas` zerado e o aviso de que a aba foi ignorada.

## Base comercial

`POST /api/v1/cargas/base/revisar` (multipart `arquivo`, mesmo limite de 10 MB). **Não grava.** Resposta 200:

```json
{
  "arquivo": "base-comercial-nov-2026.xlsx",
  "linhas": 41230,
  "lojas": 14,
  "lojasNaoCadastradas": ["0099"],
  "periodo": { "inicio": "2026-10-01", "fim": "2026-10-31" },
  "substitui": [ { "codigo": "001", "desde": "2026-10-28" } ],
  "erros": [ { "linha": 12, "loja": "001", "motivo": "…" } ],
  "totalErros": 1
}
```

Coluna ausente: 400 "Não encontramos a coluna Hora. Baixe o modelo e confira os nomes das colunas." Formato diferente de .xlsx/.csv: 400 (como hoje). Arquivo acima de 10 MB: 400 com mensagem no formato dos outros erros.

`POST /api/v1/cargas/base` (envio) continua como hoje.
