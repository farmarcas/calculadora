# Implementation Plan: Impacto em venda e saldo contra a folha

**Branch**: `feat/impacto-venda-e-saldo` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

## Summary

O motor dos cenários troca "margem perdida" por **venda perdida hora a hora** e por **saldo** (`economia de folha − venda perdida`, ou `venda adicional − custo adicional` quando estende). A venda das horas fechadas vem da tabela dia da semana × hora que o sistema já monta da base comercial; sem essa base, os cortes mostram só o aviso. Os cartões, a Simulação e o Cadastro (margem opcional) acompanham, e uma conta pura soma as lojas de um grupo.

## For the reader

Chosen: trocar a unidade da conta de margem para venda e acrescentar o saldo contra a folha, reaproveitando a tabela de venda por hora e a conta de folha que já existem.

Why: o dado e a folha já estão calculados corretamente; só muda o que é somado e como é mostrado, então o risco fica nos textos e na escolha do melhor cenário.

## Technical Context

**Language/Version**: TypeScript (Node 20) no servidor; React 18 + Vite + Tailwind na tela
**Primary Dependencies**: as já usadas (Vitest; sem biblioteca nova)
**Storage**: N/A (sem migration; o percentual de 50% vale na sessão, como as outras premissas)
**Testing**: Vitest (servidor, integração e tela); conferência no navegador e conta aberta com Cosmópolis e Porto Feliz
**Target Platform**: Docker Compose local
**Project Type**: web (backend + frontend)
**Performance Goals**: a busca do Cenário 3 segue abaixo de 1 s por diagnóstico (a soma por hora usa a tabela já montada)
**Constraints**: valores em R$ só para o dono; campos novos opcionais na API; os campos de margem saem dos cenários (nenhum consumidor externo); a regra de cobertura e de contratação não muda
**Scale/Scope**: cartões dos cenários, painel da Simulação, regra de "Completo" do Cadastro, 1 conta de grupo

## Constitution Check

- I. Spec Kit: cumprido (spec 022 → plano → tarefas → implementação).
- II. Docker: testes e conferência no ambiente local.
- III. Stack: a existente.
- IV. Banco só por migration: nenhuma mudança de banco.
- V. Dados locais protegidos: nada destrutivo; a validação com lojas reais só lê.
- VI/VIII. Linguagem simples e decisões técnicas do agente: cumprido.
- VII. Começar pequeno: sem tela de grupo, sem regra nova de folha ou cobertura.

Resultado: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/022-impacto-venda-e-saldo/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cenarios.md
└── tasks.md   # /speckit-tasks
```

### Source Code

```text
backend/node/src/modules/escala/
├── ajustes-fim-de-semana.ts   # venda perdida/adicional hora a hora; objetivo do Cenário 3 passa a ser o saldo
├── cenarios.ts                # venda perdida por dia, economia de folha, venda adicional, saldo
├── comparativo.ts             # saldo, anual, peso no faturamento, aviso sem venda hora a hora, selos pelo saldo
├── premissas.ts               # fatorHoraNova (0–100, padrão 50); sai a margem simulada
├── grupo.ts                   # soma das lojas e peso sobre o faturamento do grupo (conta pura)
└── *.test.ts
backend/node/src/modules/simulacoes/resultado.ts     # mesma conta na Simulação
backend/node/src/modules/cadastros/situacao.ts       # margem deixa de ser pendência
frontend/react/src/features/diagnostico/
├── Comparativo.jsx, comparativo-regras.js           # cartões: saldo, venda por dia, aviso, selo e campo do percentual
└── EscalaPage.jsx / Diagnostico.jsx                 # leva fatorHoraNova na consulta
frontend/react/src/features/simulacao/PainelResultado.jsx
frontend/react/src/features/cadastro-loja/pendencias.js, ResumoMensal.jsx  # margem opcional
```

**Structure Decision**: web app existente; só os arquivos acima.

## Complexity Tracking

Sem violações a justificar.
