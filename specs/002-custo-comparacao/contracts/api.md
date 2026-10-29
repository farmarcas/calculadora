# Contrato HTTP — mudanças (`/api/v1`)

- `PUT /simulacoes/:id` agora também aceita `vagas: [{ funcao, cargaH }]` e `desligados: [matricula]` (rascunho). Resposta: simulação com quadro (vagas e desligados marcados) e avaliação.
- `POST /lojas/:id/simulacoes` aceita `comVagasSugeridas: boolean` (só com origem `escala_atual`).
- `GET /lojas/:id/custos` · `PUT /lojas/:id/custos` — só `TENANT_ADMIN`; corpo `{ salarioMedio: { funcao: number }, encargosPct: number, regimeTributario?: string }`.
- `GET /lojas/:id/simulacoes/comparar?ids=` — cada simulação ganha `custo` **somente para `TENANT_ADMIN`**: `{ informado: boolean, faltamInformar: [funcao], mensal, anual, porFuncao: [{funcao, pessoas, mensal}], diferencaMensalFrenteEmUso, memoria }`.
- `GET /simulacoes/:id` ganha `custo` com as mesmas regras de permissão.
