# Contrato: faturamento por hora no painel do Cadastro

`GET` do painel da loja (o mesmo que a tela de Cadastro já usa) passa a devolver `faturamentoPorHora`.

```json
{
  "faturamentoPorHora": {
    "temBase": true,
    "periodo": { "inicio": "2026-09-07", "fim": "2026-10-30", "dias": 54, "semanas": 7.7 },
    "poucosDias": false,
    "tipos": {
      "uteis": [{ "hora": 7, "participacao": 0.014, "valor": 420 }, "…"],
      "sabado": [{ "hora": 8, "participacao": 0.03, "valor": 310 }],
      "domingo": null
    }
  }
}
```

## Regras
- `valor` só existe para o dono (`TENANT_ADMIN`); gestor e consulta recebem só `participacao`.
- Sem base ativa: `{ "temBase": false }`.
- `tipos.<tipo>` é nulo quando a base não tem venda nesse tipo de dia.
- As horas vêm de 0 a 23 só quando têm venda; a tela mostra só as da janela de funcionamento da loja.
- Nada mais na resposta do painel muda.

## Erros
Os mesmos do painel (404 loja inexistente, 403 perfil sem acesso). Base ilegível nunca derruba o painel: devolve `temBase: false`.
