# Contrato: importação da base por CNPJ

Mesmas rotas de hoje, com o formato novo reconhecido pelo cabeçalho. Só perfis de escrita (dono e gestor), como hoje. Limite do arquivo: 20 MB.

## POST /api/v1/cargas/base/revisar
Corpo (formulário): `arquivo` e, opcional, `periodoInicio` e `periodoFim` (AAAA-MM-DD).

Resposta quando o arquivo é por CNPJ (200):
```json
{
  "formato": "por_cnpj",
  "arquivo": "base.csv",
  "linhas": 185260,
  "periodo": { "inicio": "2026-07-01", "fim": "2026-10-31", "diasDaSemana": [17,17,18,18,18,18,17] },
  "precisaPeriodo": false,
  "lojas": 1791,
  "substitui": 1787,
  "mantidas": 23,
  "cnpjsSemLoja": ["02045563000121"],
  "totalCnpjsSemLoja": 43,
  "preencheCadastro": { "faturamento": 1500, "cmvPct": 1791, "jaTinhamValor": 12 },
  "avisos": [
    { "tipo": "linha_zerada", "quantidade": 62 },
    { "tipo": "unidades_menores_que_clientes", "quantidade": 73 },
    { "tipo": "cmv_maior_que_venda", "quantidade": 585 },
    { "tipo": "loja_com_poucos_dias", "quantidade": 13 }
  ],
  "erros": [], "totalErros": 0
}
```
Sem período, devolve `precisaPeriodo: true` e os números que não dependem dele.

## POST /api/v1/cargas/base
Corpo: `arquivo`, `periodoInicio`, `periodoFim` (obrigatórios no formato por CNPJ). 201 com `{ formato: "por_cnpj", lojas: [{ cnpj, codigo, nome, aceitas, rejeitadas, situacao }], cnpjsSemLoja, cadastro: { preenchidas, jaTinhamValor }, erros, totalErros }`.

## Erros
- Período ausente ou invertido, ou menor que 7 dias: 422 `PERIODO_INVALIDO`, "Informe o período que o arquivo cobre (data inicial e final, com pelo menos uma semana)."
- Arquivo acima de 20 MB: 400 com o limite no texto.
- Valores em reais nunca saem na resposta para quem não é dono; a resposta é só de contagens.
