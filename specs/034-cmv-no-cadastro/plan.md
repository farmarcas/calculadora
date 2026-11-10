# Implementation Plan: CMV no Cadastro e na base comercial, no lugar da margem

**Branch**: `feat/cmv-no-cadastro` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/034-cmv-no-cadastro/spec.md`

## Summary

A margem por hora da base comercial vira CMV por hora (a coluna do banco é renomeada e passa a aceitar "sem dado"), o Cadastro da loja ganha o campo "CMV médio (%)" no faturamento, e uma migration limpa toda margem que existe (Cadastro e bases). A régua de margem ou venda, entregue na spec 033, continua igual por dentro: o lucro bruto de cada hora passa a ser calculado como venda − CMV (ou venda × (1 − CMV médio) quando a hora não tem CMV), e o resto dos cálculos não muda.

## For the reader

Chosen: guardar o custo da mercadoria (CMV) por hora e o CMV médio da loja, e calcular o lucro bruto a partir deles, apagando a margem antiga.

Why: o CMV é o dado de origem que as lojas conhecem; o lucro bruto vira consequência, e as contas dos cenários e da Simulação seguem as mesmas.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API); React 18 + Vite + Tailwind (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: PostgreSQL; uma migration (renomeia e relaxa a coluna da margem por hora e limpa a margem guardada)

**Testing**: Vitest (unidade, tela) e testes de integração da API, inclusive o da migration

**Target Platform**: web

**Project Type**: web (API + tela)

**Performance Goals**: sem mudança; a limpeza é um UPDATE por tabela

**Constraints**: CMV só para o dono; numa loja sem CMV todos os números são os de uma loja sem margem; planilhas antigas com a coluna de margem continuam sendo aceitas

**Scale/Scope**: 1 migration, ajuste da importação da base e das lojas, 1 campo no Cadastro, 1 parâmetro novo (CMV médio) na régua

## Constitution Check

- I (Spec Kit): spec aprovada; plano e tarefas passam pelo seu OK antes de código e antes de rodar a limpeza. ✔
- II, V (Docker, dados protegidos): a limpeza apaga só margem, com escopo confirmado por você; antes de rodá-la no banco local faço um backup. Nenhum `down -v`, `prune` ou `migrate reset`. ✔
- III (Stack): sem tecnologia nova. ✔
- IV (Banco só muda por migration): tudo por uma migration Prisma versionada. ✔
- VII (Começar pequeno): só a origem do dado; rótulos, bloco "como calculamos" e o alerta de 3% ficam de fora. ✔

Gate aprovado; reavaliado depois do desenho, segue aprovado.

## Project Structure

### Documentation (this feature)

```text
specs/034-cmv-no-cadastro/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cmv.md
└── tasks.md   # etapa seguinte
```

### Source Code (repository root)

```text
backend/node/prisma/
├── schema.prisma                         # VendaHora: margem -> cmv (opcional)
└── migrations/<data>_cmv_no_lugar_da_margem/migration.sql   # renomeia, relaxa e limpa

backend/node/src/modules/
├── planilhas/campos.ts                   # base: coluna "CMV (R$)"; cadastro/lojas: "CMV médio (%)"; margem antiga só entendida e ignorada
├── escala/interpretar.ts                 # lê o CMV da base (nulo quando a coluna não vem)
├── escala/escala.repository.ts           # guarda e lê o CMV; entrega o lucro bruto (venda − CMV) às contas
├── escala/regua.ts                       # recebe o CMV médio da loja e preenche as horas sem CMV
├── escala/vendas.ts, vendas-cadastro.ts  # linha da base: margem passa a ser "lucro bruto ou nulo"
├── cadastros/faturamento.ts, cadastros.*  # campo cmvPct (0 a 100) no faturamento; só dono
├── escala/diagnostico.ts, simulacoes/*   # passam o CMV médio da loja à régua
frontend/react/src/features/cadastro-loja/ # campo "CMV médio (%)" na aba de faturamento
frontend/react/src/features/regua.js       # frases do motivo falam de CMV
```

**Structure Decision**: a régua da spec 033 continua sendo o único ponto que decide margem ou venda; esta entrega só troca o que a alimenta (CMV por hora e CMV médio) e limpa o dado antigo.

## Design

1. **Banco (uma migration).** Em `vendas_hora`: renomear `margem` para `cmv`, tirar o NOT NULL e gravar NULL em todas as linhas (limpeza). Em `lojas`: tirar a chave `margemPct` do JSON de `faturamento` onde existir. Nada mais é tocado. Rodar de novo não muda nada.
2. **Importação.** A base comercial reconhece "CMV (R$)" e variações (CMV, custo da mercadoria, CMV bruto). Coluna ausente = CMV nulo; as linhas somam por hora como hoje, e o CMV só soma quando veio. A coluna de margem antiga continua sendo entendida, para não cair em outra coluna, mas é ignorada. Nas planilhas de lojas e de Cadastro, a coluna "CMV médio (%)" preenche o campo; a coluna de margem antiga segue ignorada.
3. **Leitura.** O repositório entrega a cada linha de venda o lucro bruto: venda − CMV, ou nulo se a hora não tem CMV. O restante do código continua lendo `margem` como "lucro bruto" (a régua e as contas não mudam).
4. **Régua.** `reguaDaBase(linhas, cmvMedioPct?)`: antes de decidir, preenche cada hora sem CMV com venda × (1 − CMV médio), se a loja tem o valor. Depois aplica as regras de hoje: soma positiva, cobertura de 90% das horas com venda, nenhuma hora com CMV maior que a venda. Com CMV médio, a cobertura passa a ser 100% por construção; sem ele, vale a regra de hoje (margem parcial = venda, com o motivo). Os motivos viram: `sem_margem` ("falta CMV"), `margem_parcial` ("CMV incompleto") e `margem_incoerente` ("CMV maior que a venda").
5. **Contas.** O Diagnóstico e a Simulação passam o CMV médio da loja à régua; as linhas na régua continuam alimentando a mesma tabela de perda e ganho. Travas, peso no faturamento, venda por hora e clientes seguem em venda real.
6. **Cadastro.** O faturamento guarda `cmvPct` (0 a 100, ou vazio). O campo aparece na aba de faturamento só para o dono, com a explicação do spec. Gestor e consulta nunca recebem o valor.
7. **Limpeza e backup.** A limpeza é a própria migration. Antes de aplicá-la no banco local, faço um backup do banco (dump) e confirmo com você.

## Complexity Tracking

Nenhuma violação. Risco conhecido: a migration é irreversível para a margem (só ela); mitigado pelo escopo confirmado, pelo backup local e pelo teste de que nada além da margem muda.
