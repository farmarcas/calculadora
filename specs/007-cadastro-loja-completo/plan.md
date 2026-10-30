# Implementation Plan: Cadastro de loja completo (dados, faturamento e equipe)

**Branch**: `feat/cadastro-loja-completo` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

## Summary

A configuração da loja passa a ter cidade, regime tributário (que sai do painel de Custos e passa a morar na loja), faturamento (por dia da semana, mensal e margem %) e a lista de funcionários com carga mensal e horário de entrada/saída. O faturamento vira a fonte de venda do Diagnóstico: quando não há base comercial, o servidor **monta linhas de venda no mesmo formato da base** a partir do cadastro (cada dia dividido igualmente entre as horas abertas). Assim os cenários 2, 3 e 4 e o quadro central funcionam sem mudar suas contas; a base comercial continua valendo quando enviada.

## For the reader

Chosen: transformar o faturamento do cadastro em "vendas por hora" de mentira organizada, no mesmo formato da base, e entregar isso ao diagnóstico que já existe.

Why: os cenários já prontos não precisam ser reescritos nem retestados; só muda de onde vem o dado, e a tela mostra a origem para ninguém confundir estimativa com dado real.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite + Tailwind (tela), como já está
**Primary Dependencies**: nenhuma nova
**Storage**: PostgreSQL via Prisma, **1 migration** (colunas novas, nenhuma apagada; expand-only)
**Testing**: Vitest (montagem das vendas do cadastro, conversão de carga, validação CNPJ/CPF) + Supertest (rotas de loja/funcionário, permissões, diagnóstico sem base)
**Target Platform**: Docker Compose local
**Project Type**: web (api + front)
**Performance Goals**: diagnóstico segue abrindo em < 2 s; tela de loja com 200 funcionários fluida
**Constraints**: faturamento e margem só para `TENANT_ADMIN` (campos ausentes, não nulos, para os demais); CPF mascarado para consulta; planilhas antigas continuam aceitas; resultados atuais não mudam para quem já tem base ou carga semanal
**Scale/Scope**: dezenas de lojas, até algumas centenas de funcionários por loja

## Constitution Check

| Princípio | Situação |
|---|---|
| I Spec Kit | OK — spec ajustada e aprovada, plano em curso |
| II Docker | OK — tudo roda no Compose |
| III Stack | OK — nada acrescentado |
| IV Migrations | OK — uma migration versionada pelo Prisma |
| V Dados locais | OK — só colunas novas; sem reset, sem `down -v` |
| VII Começar pequeno | OK — quatro fatias independentes |
| VIII Técnico é do agente | OK |

Sem violações.

## Project Structure

```text
backend/node/prisma/
├── schema.prisma                 # Loja: cidade, regimeTributario, faturamento; Funcionario: cargaMensalH, entrada, saida, dias
└── migrations/<nova>/            # colunas novas + índice de CPF único por loja entre ativos
backend/node/src/modules/cadastros/
├── cadastros.schemas.ts          # campos novos, validação CNPJ/CPF/UF, faturamento
├── documentos.ts (+test)         # validar CNPJ, CPF, mascarar CPF
├── carga.ts (+test)              # mensal ↔ semanal (÷5)
└── cadastros.service.ts / repository.ts / processar.ts  # gravar, auditar, planilha com colunas novas
backend/node/src/modules/escala/
├── vendas-cadastro.ts (+test)    # faturamento da loja → VendaLinha[] (semana de referência)
├── diagnostico.ts                # escolhe origem: base > cadastro > nenhuma; expõe `origemVendas`
└── escala.service.ts             # lê faturamento da loja; funde horário digitado como turno atual
frontend/react/src/features/cadastros/
├── FormLoja.jsx                  # cidade, bandeira, horário, faturamento, margem, lista de equipe
├── EquipeLoja.jsx                # lista, busca, adicionar/editar/remover funcionário dentro da loja
└── FaturamentoLoja.jsx           # 7 dias + mensal + conferência da soma
frontend/react/src/features/diagnostico/
├── QuadroCentral.jsx, Cenarios.jsx, EnviarPlanilhas.jsx   # textos e origem da venda; base vira opcional
```

**Structure Decision**: a conversão faturamento → vendas fica num arquivo próprio e puro, para o diagnóstico escolher a origem em uma linha e os cenários ficarem intocados.

## Fatias de entrega

1. **US1 Dados da loja:** cidade, regime tributário (três opções, migrado do painel de Custos), bandeira (rótulo), validação CNPJ/UF, migration, planilha com cidade e regime.
2. **US2 Faturamento:** sete dias + mensal + margem % na loja (só dono), conferência da soma, planilha.
3. **US4 Diagnóstico sem base:** `vendas-cadastro.ts`, origem no diagnóstico, avisos e textos novos, base opcional. Depende da fatia 2.
4. **US3 Equipe na loja:** carga mensal, entrada/saída, dias, CPF validado e mascarado, lista dentro da loja, horário digitado entra na escala atual quando não há carga importada.
5. **Fechamento:** permissões, planilha modelo, README, conferência de que os resultados antigos não mudaram.
