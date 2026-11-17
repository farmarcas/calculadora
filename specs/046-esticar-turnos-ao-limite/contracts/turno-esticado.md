# Contrato: turno esticado

Rotas e formato de erro não mudam (`/api/v1`).

## `turnos` da Simulação (`GET`/`PUT /simulacoes/:id`, `POST /lojas/:id/simulacoes`)
- Cada turno pode trazer `antes: { entrada, saida }` (opcional, de 15 em 15 minutos, dentro de 0 a 24).
- `PUT` aceita e devolve `antes`; quem não manda `antes` não o recebe de volta.
- Turnos antigos, sem `antes`, seguem valendo.

## `POST /lojas/:id/simulacoes` com `comVagasSugeridas: true`
- A simulação criada já vem com os turnos esticados e `antes` neles; as contratações são as do cartão do cenário (spec 043 e 044).

## Garantia
- Com o esticamento, o número de contratações do cartão é menor ou igual ao de antes, e igual ao das vagas da simulação criada por Personalizar.
