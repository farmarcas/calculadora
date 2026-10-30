# Contrato — rotas de simulação (mudanças)

Base: `/api/v1`. Cabeçalhos `X-GE` e `X-Perfil` como hoje.

## `PUT /simulacoes/:id` (existente) — novo campo
`horarios`: `{ versao: 2, dias: [{ aberta: boolean, abre?: "HH:mm", fecha?: "HH:mm" }] }` (7 itens) ou `null` para voltar ao Cadastro. Erro 400 com `error.details` por dia quando `fecha <= abre` ou nenhum dia aberto. Só em rascunho (409 `SIMULACAO_NAO_EDITAVEL` caso contrário).

## `GET /simulacoes/:id` e resposta do `PUT` — novo bloco `resultado`
```json
{ "resultado": {
  "impactoMensal": -6664, "folhaExtra": 6664, "horaExtra": 0,
  "vendaQueSai": 0, "margemPerdida": 0,
  "horasAbertas": 90, "horasAbertasAntes": 90,
  "horario": { "mudou": false, "dias": [ { "dia": 0, "aberta": true, "abre": "07:00", "fecha": "22:00", "horas": 15, "alterado": false } ] },
  "funcoes": [ { "funcao": "Farmacêutico", "faltaHoje": 10, "diasDeTrabalho": 2, "contratacoes": [ { "matricula": "VAGA-1", "cargaH": 16, "custoMensal": 2800 } ], "resultado": { "coberto": true, "horas": 6 }, "custoMensal": 2800 } ],
  "vendaPorHora": { "venda": [[0]], "clientes": null, "fechadas": [[7]], "ticketMedio": null }
} }
```
Para quem não é dono, os campos em reais (`impactoMensal`, `folhaExtra`, `horaExtra`, `vendaQueSai`, `margemPerdida`, `custoMensal`, `venda`) não existem.

## `POST /simulacoes/:id/gravar` (existente) — resposta passa a trazer `numeroCenario` e `nome` "Cenário N".
## `POST /simulacoes/:id/aprovar` (existente) — "Marcar como em uso", só dono.
