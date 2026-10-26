# Contrato HTTP — `/api/v1` (erro: `{ error: { code, message, details } }`, listas paginadas)

Perfil de demonstração no cabeçalho `X-Perfil`.

## Cadastros
- `GET /planilha-modelo` → .xlsx (abas Lojas e Funcionários)
- `POST /importacoes/cadastro` (arquivo) → `{ id, abas, mapeamentoSugerido[{campo, coluna, confianca}], previa, erros[] }`
- `POST /importacoes/cadastro/:id/confirmar` `{ mapeamento }` → resumo (novos, atualizados, erros)
- `GET|POST|PATCH|DELETE /lojas`, `/funcionarios` (filtro por loja)

## Escala atual e diagnóstico
- `POST /lojas/:id/cargas-escala`, `POST /lojas/:id/base-comercial` (arquivo)
- `GET /lojas/:id/diagnostico` → quadro por função, cobertura por faixa, verificação 42h/40h, déficit, contratações, pontos de atenção

## Simulações
- `POST /lojas/:id/simulacoes` (do zero, da em uso ou clonar) · `GET` lista/histórico
- `PUT /simulacoes/:id/turnos` · `POST /simulacoes/:id/avaliar` → cobertura, erros, avisos
- `POST /simulacoes/:id/gravar|descartar|clonar|aprovar`
- `GET /lojas/:id/simulacoes/comparar?ids=a,b,c`
- `GET /simulacoes/:id/exportar.xlsx`

## Saúde
- `/health`, `/health/ready` (já existem)
