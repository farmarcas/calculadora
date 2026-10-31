# Contrato — mudança no Diagnóstico

`GET /api/v1/lojas/:id/diagnostico` ganha **um campo opcional**, sem alterar nenhum existente:

```json
{ "regras": [ { "id": "r42", "...": "...", "com8h24": { "funcoes": [
  { "funcao": "Atendimento", "capacidadeH": 336, "saldoH": -16, "gapH": 16, "necessidadeH": 352 }
] } } ] }
```

- Só na regra `r42` e só quando a convenção de 8h24 da loja está desligada.
- Calculado com a mesma verificação de capacidade, com a convenção ligada (nenhuma fórmula nova).
- Valores em horas (sem R$): qualquer perfil recebe.

Sem outras mudanças de contrato. Endereço da tela: `?tela=escala&aba=cobertura|regras|equipe`.
