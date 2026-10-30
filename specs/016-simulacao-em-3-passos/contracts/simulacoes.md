# Contrato — rotas de simulação (mudanças)

Base: `/api/v1`. Cabeçalhos `X-GE` e `X-Perfil` como hoje.

## `PUT /simulacoes/:id` (existente) — novo campo
`horarios`: `{ versao: 2, dias: [{ aberta: boolean, abre?: "HH:mm", fecha?: "HH:mm" }] }` (7 itens) ou `null` para voltar ao Cadastro. Erro 400 com `error.details` por dia quando `fecha <= abre` ou nenhum dia aberto. Só em rascunho (409 `SIMULACAO_NAO_EDITAVEL` caso contrário).

## `GET /simulacoes/:id` e resposta do `PUT` — novo bloco `resultado`
```json
{ "resultado": {
  "impactoMensal": 6664, "folhaExtra": 6664, "horaExtra": 0,
  "vendaQueSai": 0, "margemPerdida": 0,
  "horasAbertas": 90, "horasAbertasAntes": 90,
  "horario": { "mudou": false, "dias": [ { "dia": 0, "aberta": true, "abre": "07:00", "fecha": "22:00", "horas": 15, "alterado": false } ] },
  "funcoes": [ { "funcao": "Farmacêutico", "faltaHoje": 10, "diasDeTrabalho": 2, "contratacoes": [ { "matricula": "VAGA-1", "cargaH": 16, "custoMensal": 2800 } ], "resultado": { "coberto": true, "horas": 6 }, "custoMensal": 2800 } ],
  "vendaPorHora": { "venda": [[0]], "clientes": null, "fechadas": [[false]], "ticketMedio": null }
} }
```
`impactoMensal` e as demais cifras são positivas (custo); a tela mostra o sinal de menos. `fechadas` é uma matriz 7 × 24: hora aberta no Cadastro e fechada na simulação. `margemInformada` e `temBase` dizem quando venda/margem que saem são "sem dado" (nulas).

Para quem não é dono, os campos em reais (`impactoMensal`, `folhaExtra`, `horaExtra`, `vendaQueSai`, `margemPerdida`, `custoMensal`, `venda`) não existem.

## `POST /simulacoes/:id/gravar` (existente) — corpo opcional `{ "comoCenario": true }`. Sempre numera (`numeroCenario`, por loja); com `comoCenario` o nome vira "Cenário N". O detalhe do rascunho traz `proximoNumeroCenario` (para o botão "Salvar como cenário N") e a lista traz `numeroCenario`.
## `POST /simulacoes/:id/aprovar` (existente) — "Marcar como em uso", só dono.
