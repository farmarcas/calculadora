# Data Model — Cadastro de loja em painel único

Sem tabela nova e sem migration.

## Turnos da loja (JSON existente) — acréscimo
`{ versao: 1, modo?: 'turnos' | 'unico', turnos: [{ nome, inicio, fim, minimos }] }`. `modo` ausente = hoje (turnos valem se houver). Em `'unico'` os turnos ficam guardados e o motor usa o mínimo único.

## Regras de turno (validação)
Mantém: 1 a 6 turnos, nome único, início ≠ fim, `Farmacêutico ≥ 1`. **Sai**: sem sobreposição, sem buraco, dentro do horário. Nova saída informativa: `cobertura` = faixas sem turno por dia.

## Situação do cadastro (calculada, não gravada)
`{ status: 'completo' | 'revisar', motivo: string | null }` — Completo quando: nome, cidade, UF e regime preenchidos; funcionamento definido; ao menos 1 farmacêutico ativo na equipe; faturamento em todos os dias abertos; mensal dentro de 10% da soma dos dias (quando os dois existem). O primeiro item que falha vira o motivo.

## Item da lista de lojas (acréscimos)
`funcionarios` (já existe), `situacao`, `uf`, `cnpj`; faturamento segue só para o dono.
