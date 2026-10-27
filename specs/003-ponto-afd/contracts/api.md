# Contrato HTTP (`/api/v1`) — ponto e apuração

Gerenciar exige simulação em uso na loja (senão 409 `SEM_SIMULACAO_EM_USO`).

## Importação
- `POST /lojas/:id/ponto/importacoes` (um ou vários arquivos) → por arquivo: `{ arquivo, status, periodo, aceitas, repetidas, pendentes, motivoRejeicao? }`
- `GET /lojas/:id/ponto/importacoes` → log paginado

## Pendências
- `GET /lojas/:id/ponto/pendencias?motivo=&page=` → `{ id, data, hora, cpfMascarado, motivo }`
- `POST /lojas/:id/ponto/pendencias/:batidaId/vincular` `{ matricula }`
- `POST /lojas/:id/ponto/pendencias/:batidaId/ignorar` `{ motivo }` (obrigatório)
- `POST /lojas/:id/ponto/pendencias/:batidaId/confirmar-folga` (dia sem escala)
- `POST /lojas/:id/ponto/pendencias/cpf` `{ cpf, matricula }` — grava o CPF na pessoa e resolve as pendências desse CPF

## Apuração (sempre com `rotulo: "apuração gerencial — não substitui o registro oficial de ponto"`)
- `GET /lojas/:id/apuracao/pessoas?de=&ate=` → pessoa × dia (planejado, batidas, ocorrências, hora extra estimada) — dono e gestor
- `GET /lojas/:id/apuracao/loja?de=&ate=` → aderência, hora extra por função e dia, faltas, atrasos, cobertura realizada, causa provável — todos os perfis (agregado)
- `GET /lojas/:id/apuracao/exportar.xlsx?de=&ate=` — dono e gestor; vai para a auditoria

## Painel e limites
- `GET /lojas/:id/gerenciar/painel` → simulação em uso e vigência, última importação, pendências abertas, aderência e hora extra do período, tendência (semanas), alertas
- `GET|PUT /lojas/:id/gerenciar/limites` — dono (PUT); gestor lê
