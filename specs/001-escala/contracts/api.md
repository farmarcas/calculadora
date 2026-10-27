# Contrato HTTP — `/api/v1` (erro: `{ error: { code, message, details } }`, listas paginadas)

Perfil de demonstração no cabeçalho `X-Perfil`.

## Cadastros
- `GET /planilha-modelo` → .xlsx (abas Lojas e Funcionários)
- `POST /importacoes/cadastro` (arquivo) → `{ id, abas, mapeamentoSugerido[{campo, coluna, confianca}], previa, erros[] }`
- `POST /importacoes/cadastro/:id/confirmar` `{ mapeamento }` → resumo (novos, atualizados, erros)
- `GET|POST|PATCH|DELETE /lojas`, `/funcionarios` (filtro por loja)

## Escala atual e diagnóstico
- `GET /planilha-modelo-escala`, `GET /planilha-modelo-base`
- `POST /cargas/escala`, `POST /cargas/base` (arquivo; várias lojas por arquivo, cada linha vai para a loja do código; entendimento automático das colunas)
- `GET /lojas/:id/cargas` (histórico) · `PUT /lojas/:id/configuracao` (convenção 8h24, mínimo por função)
- `GET /lojas/:id/diagnostico` → quadro por função, cobertura por faixa, verificação 42h/40h, déficit, contratações, pontos de atenção

## Simulações
- `POST /lojas/:id/simulacoes` (origem: escala atual, vazia ou id de outra simulação) · `GET /lojas/:id/simulacoes[?descartadas=1]` histórico
- `GET /simulacoes/:id` · `PUT /simulacoes/:id` (nome, regra, turnos; só rascunho; devolve a avaliação recalculada com cobertura, erros e avisos)
- `POST /simulacoes/:id/gravar|descartar|clonar` (gravar exige zero erros) · `POST /simulacoes/:id/aprovar` (só TENANT_ADMIN; exige gravada e zero erros; a anterior em uso vira substituída)
- `GET /lojas/:id/simulacoes/comparar?ids=a,b,c` (2 a 3; a em uso entra como referência)
- `GET /simulacoes/:id/exportar.xlsx`

## Saúde
- `/health`, `/health/ready` (já existem)
