# Contrato — rotas (mudanças)

Base `/api/v1`, cabeçalhos `X-GE` e `X-Perfil`.

## `GET /lojas` — filtros e situação
Query novas: `uf` (sigla), `situacao` (`completo` | `revisar`), `busca` (agora também CNPJ, com ou sem pontuação). Cada item traz `situacao: { status, motivo }`. `meta.total` respeita os filtros; paginação como hoje.

## `PUT /lojas/:id/painel` — salvar tudo (novo)
Corpo (todos opcionais, ao menos um): `{ dados?: {nome, cidade, uf, marca, regimeTributario, codigo?, cnpj?}, horarios?, faturamento?, configuracao?: { convencao8h24?, minimos?, turnos?: [...] | null, modoMinimo?: 'turnos' | 'unico' }, custos?: { salarioMedio, encargos? } }`. Valida tudo antes de gravar; 400 com `error.details` por campo (`campo` e `texto`). `faturamento` e `custos` só do dono (403 caso contrário); `codigo` e `cnpj` só do operador. Resposta: a loja atualizada, `situacao` e `avisosDeTurnos` (faixas sem turno).

## `PUT /lojas/:id/configuracao` (existente)
Aceita turnos sobrepostos e fora do horário; aceita `modoMinimo`. Passa a devolver `avisosDeTurnos` em vez de erro de cobertura.

## Funcionários (existentes)
Sem mudança de contrato; CPF mascarado como hoje para quem só consulta.
