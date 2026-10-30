# Contrato — rotas (mudanças)

Base `/api/v1`, cabeçalhos `X-GE` e `X-Perfil`.

## `GET /lojas` — filtros e situação
Query novas: `uf` (sigla), `situacao` (`completo` | `revisar`), `busca` (agora também CNPJ, com ou sem pontuação). Cada item traz `situacao: { status, motivo }`. `meta.total` respeita os filtros; paginação como hoje.

## `PUT /lojas/:id/painel` — salvar tudo (novo)
Corpo (blocos opcionais, ao menos um): `{ loja?: { nome, cidade, uf, marca, regimeTributario, codigo?, cnpj?, horarios?, faturamento? }, configuracao?: { convencao8h24?, minimos?, turnos?: [...] | null, modoMinimo?: 'turnos' | 'unico' }, custos?: { salarioMedio, encargos? } }`. Tudo é validado **antes** e gravado numa única atualização da loja (ou grava tudo, ou nada). Permissões por bloco: `loja` = operador, dono e gestor; `faturamento` e `custos` = só o dono; `configuracao` = dono e gestor; `codigo` e `cnpj` = só o operador (403/400 como nas rotas atuais). Resposta: `{ loja, situacao, avisosDeTurnos }` (loja sem faturamento para quem não é dono). `GET /lojas/:id/painel` devolve o mesmo formato (estado atual).

## `PUT /lojas/:id/configuracao` (existente)
Aceita turnos sobrepostos e fora do horário; aceita `modoMinimo`. Passa a devolver `avisosDeTurnos` em vez de erro de cobertura.

## Funcionários (existentes)
Sem mudança de contrato; CPF mascarado como hoje para quem só consulta.
