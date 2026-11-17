# Contrato: Escala por hora

## Cobertura por dia (já existe, ganha `exigido`)
`GET /api/v1/simulacoes/:id` → `avaliacao.cobertura[dia]` é uma lista por função: `{ funcao, minimo, porHora: [{ hora, pessoas, ok, exigido }] }`. `exigido` é novo: as pessoas exigidas daquela função naquela hora. Igual para todos os perfis.

## Vaga com turnos
`PUT /api/v1/simulacoes/:id` (dono e gestor; só rascunho)
```json
{
  "vagas": [
    { "matricula": "VAGA-1", "funcao": "Farmacêutico", "cargaH": 12 },
    {
      "funcao": "Farmacêutico",
      "cargaH": 12,
      "turnos": [
        { "dia": 4, "entrada": 16, "saida": 22 },
        { "dia": 5, "entrada": 16, "saida": 22 }
      ]
    }
  ]
}
```
`turnos` só vale para vaga nova (sem `matricula`). Os turnos de vagas que já existem continuam em `turnos` do pedido, como hoje. Resposta: o detalhe da simulação de sempre.

## Prévia do custo de uma contratação
`POST /api/v1/simulacoes/:id/efeito-contratacao` (dono)
```json
{ "funcao": "Farmacêutico", "cargaH": 12 }
```
Resposta do dono: `{ "custoPct": 2.8, "custoEstado": "ok" }` (variação do custo de pessoal em % que a vaga acrescenta ao resultado atual). Gestor e visualizador: `{}` (nenhum valor). Não grava nada. Erros: simulação gravada → `SIMULACAO_NAO_EDITAVEL` não se aplica (a prévia é só leitura e vale em qualquer simulação); vaga inválida → 400.

## Garantias
- Nenhum valor em reais sai para gestor e visualizador.
- Visualizador não edita (`PUT` continua 403).
