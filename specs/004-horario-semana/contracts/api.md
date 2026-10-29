# Contrato HTTP — mudanças (`/api/v1`)

- `POST /lojas` e `PATCH /lojas/:id`: `horarios` aceita o formato novo (`{ versao: 2, dias: [7 × {aberta, h24?, abre?, fecha?}] }`) **ou** o antigo (`{ semana?, sabado?, domingo? }`). Resposta e listagens: sempre o formato novo.
- `GET /planilha-modelo`: aba Lojas com `Seg_Abre … Dom_Fecha` e `Loja_24h`.
- `POST /importacoes/cadastro`: a sugestão de colunas inclui os campos por dia e `Loja_24h`; planilhas com as colunas antigas continuam sugeridas (campos `abre_semana`… no mapeamento).
- `GET /lojas/:id/diagnostico`: `loja.horarios` no formato novo; `loja.horasAbertas` soma os sete dias.
