# Implementation Plan: Cobertura por turno e parâmetros legais editáveis

**Branch**: `feat/cobertura-por-turno` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

## Summary

O mínimo de pessoas deixa de ser um número por cargo para o dia todo e passa a ser **uma exigência por cargo em cada turno da loja**. Para não reescrever os cinco cenários, a simulação e a apuração, o motor passa a trabalhar com uma peça única, os **requisitos** ("quantas pessoas de cada cargo a loja exige neste dia e nesta hora"). A loja sem turnos gera requisitos iguais em todas as horas, o que dá exatamente o resultado de hoje. Em paralelo, as regras legais saem do código para uma **tabela de parâmetros com versões e data de vigência**, e o Diagnóstico ganha o aviso de estimativa.

## For the reader

Chosen: criar uma peça central de "requisitos por hora" e fazer o motor de cobertura, os cenários, a simulação e a apuração lerem dela; o mínimo único atual vira o caso particular em que todas as horas exigem o mesmo.

Why: é a forma de mudar o cálculo uma vez só, mantendo o resultado antigo idêntico (provado pelos testes que já existem) e sem espalhar a ideia de turno por vinte arquivos.

Chosen: a quantidade por turno é calculada da lista de pessoas e **não é gravada**.

Why: foi o combinado, e evita número digitado que fica velho quando a equipe muda.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite + Tailwind (tela), como já está
**Primary Dependencies**: nenhuma nova
**Storage**: PostgreSQL via Prisma, **1 migration** (coluna `lojas.turnos` e tabela `parametros_legais` com os valores atuais como versão inicial); expand-only
**Testing**: Vitest (requisitos, camadas de necessidade, validação de turnos, versão vigente, quadro por turno) e Supertest (configuração, parâmetros, diagnóstico); **os testes atuais seguem verdes sem alteração** (prova da paridade)
**Target Platform**: Docker Compose local
**Project Type**: web (api + front)
**Performance Goals**: Diagnóstico segue abrindo em < 2 s (a conta passa de "mínimo × horas" para uma soma por hora: no máximo 168 horas por loja)
**Constraints**: sem turnos = resultado idêntico ao de hoje; farmacêutico ≥ 1 em todo turno; só o dono edita parâmetros; dono e gestor editam turnos; salário médio inalterado
**Scale/Scope**: até 6 turnos por loja, 5 cargos, 3 fases

## Constitution Check

| Princípio | Situação |
|---|---|
| I Spec Kit | OK — spec aprovada, plano em curso |
| II Docker | OK |
| III Stack | OK — nada acrescentado |
| IV Migrations | OK — uma migration versionada, só colunas/tabelas novas |
| V Dados locais | OK — sem reset, sem `down -v`; a migration insere os valores atuais |
| VII Começar pequeno | OK — cinco fatias, cada uma termina verde |
| VIII Técnico é do agente | OK |

Sem violações.

## Project Structure

```text
backend/node/prisma/
├── schema.prisma                       # Loja.turnos (Json); ParametroLegal
└── migrations/<nova>/                  # coluna, tabela e versão inicial dos parâmetros
backend/node/src/modules/regras/
├── requisitos.ts (+test)               # tipo Requisitos, requisitosDaLoja, comoRequisitos, camadas
├── turnos.ts (+test)                   # validar turnos contra o horário, resolver turno de cada hora, pré-preencher do mínimo único
├── parametros.ts (+test)               # tabela de parâmetros, versão vigente, regraPara com parâmetros
├── capacidade.ts                       # necessidade por camadas (usa requisitos)
└── perfis.ts                           # regraPara aceita a tabela (padrão = valores de hoje)
backend/node/src/modules/escala/
├── cobertura.ts                        # exigência por hora, não mais um número só
├── cenarios.ts / cenarios-extras.ts    # custo da hora e cortes usam o requisito da hora
├── quadro-turnos.ts (+test)            # pessoas × mínimo por cargo e turno
├── diagnostico.ts                      # monta requisitos, devolve quadro por turno e explicação por turno
└── escala.schemas.ts / escala.service.ts  # configuração aceita `turnos`
backend/node/src/modules/simulacoes/ e apuracao/   # leem requisitos (snapshot da simulação guarda turnos)
backend/node/src/modules/parametros/    # rotas e serviço dos parâmetros legais (+ auditoria)
frontend/react/src/features/
├── diagnostico/Configuracao.jsx        # editor de turnos e mínimos, quadro por turno
├── diagnostico/Diagnostico.jsx         # aviso de estimativa
└── parametros/ParametrosLegais.jsx     # tela dos parâmetros (edição só dono)
```

**Structure Decision**: a ideia de turno fica restrita a `regras/requisitos.ts` e `regras/turnos.ts`; o resto do código só pergunta "quantos deste cargo nesta hora". Parâmetros ganham módulo próprio.

## Fatias de entrega

1. **Requisitos no motor (base de US4):** `requisitos.ts`, capacidade por camadas, cobertura por hora, custo da hora, simulação e apuração lendo requisitos. Sem mudança visível; todos os testes antigos passam e novos testes provam a conta por turno.
2. **US1 + US2 — turnos e mínimos:** migration de `lojas.turnos`, validação, API de configuração, editor na tela com o mínimo único como ponto de partida.
3. **US3 + US4 — quadro por turno e Diagnóstico:** quadro pessoas × mínimo por cargo e turno, destaque de falta, explicação com o turno de origem, cenários usando o mínimo do turno.
4. **US5 — parâmetros legais:** tabela e versão inicial, versão vigente, rotas, auditoria, tela, motor e custo lendo a tabela.
5. **US6 + fechamento:** aviso de estimativa, permissões, README, conferência de que lojas sem turnos não mudaram.
