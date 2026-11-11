# Contrato: Cenários que já contam as folgas

Rotas e formato de erro não mudam (`/api/v1`).

## `GET /escala/diagnostico` e cenários por regra
- Resposta igual à de hoje; mudam os **valores**: `contratar`, `parcialH`, horas e status passam a considerar folgas e cobertura real.
- Perfis: igual a hoje (sem R$ para quem não é dono).

## `POST /simulacoes` com `comVagasSugeridas: true` e `origem: "escala_atual"`
- A simulação criada já vem com: `turnos` da equipe **depois das folgas**, vagas com `turnos` posicionados, e `avaliacao` sem erros de regra.
- Sem `comVagasSugeridas`, a Simulação abre como hoje (turnos do Cadastro).

## Garantia
- Para o mesmo cenário, `contratar` e as horas do cartão são iguais às das vagas da simulação criada por Personalizar (teste de integração).
