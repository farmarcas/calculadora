# Contrato: Só contratação integral

Rotas e formato de erro não mudam (`/api/v1`).

## `GET /lojas/:id/diagnostico` e cenários
- Mesmos campos; `parcialH` vem `null`, `contratar` conta só integrais, `horasContratadas` é múltiplo da jornada cheia, `horasOciosas` pode ser maior. Sem a variante de hora extra.

## `POST /lojas/:id/simulacoes` com `comVagasSugeridas`
- As vagas criadas são integrais, com turnos posicionados (spec 043).

## `PUT /simulacoes/:id` com `vagas`
- Vaga **nova** (sem `matricula`): `cargaH` precisa ser a jornada cheia da regra da simulação; senão `400` com `{ error: { code: 'VALIDATION_ERROR', message: 'A contratação é integral: N horas por semana nesta regra.' } }`.
- Vaga existente (com `matricula` `VAGA-n`): sem mudança.
