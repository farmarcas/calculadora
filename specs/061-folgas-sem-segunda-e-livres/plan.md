# Implementation Plan: Folgas sem segunda-feira, equipe espalhada e folga livre na simulação

**Branch**: `feat/folgas-evitar-segunda-e-livres` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/061-folgas-sem-segunda-e-livres/spec.md`

## Summary

Duas mudanças independentes na Simulação:

1. **Sugestão de folgas** (specs 042/055): a ordem de escolha do dia da folga ganha duas preferências novas, depois da cobertura: **evitar a segunda** e **não coincidir com colega do mesmo cargo** (contando também as folgas que o colega já tem, não só as dadas nesta rodada). O algoritmo existe em duas cópias que precisam dar o mesmo resultado: no servidor (`aplicarFolgas`, usada ao abrir uma simulação com folgas aplicadas) e na tela (`sugerirFolgas`, usada no botão "Sugerir folgas"). As duas mudam juntas.
2. **Folga livre**: na Escala da semana, cada célula de uma simulação editável ganha uma ação direta ("Dar folga" no dia de trabalho, "Escalar" no dia de folga). Usa as funções que a Escala por hora já usa (`semTurnoNoDia`, `novoTurnoNaFolga`) e grava pelo mesmo caminho dos turnos (`PUT /simulacoes/:id` com `turnos`). Nenhuma regra bloqueia; os avisos que a avaliação já devolve continuam aparecendo.

Sem mudança de banco, de endpoint ou de contrato HTTP.

## For the reader

Chosen: mexer só na ordem em que a sugestão escolhe o dia da folga (segunda por último, colega do mesmo cargo em dias diferentes) e acrescentar, na Escala da semana, um botão em cada dia para dar ou tirar a folga na hora.

Why: o motor de folgas já existe e já é previsível; só falta ensinar a ele as duas preferências, e a folga livre reaproveita o que a Escala por hora já faz, sem inventar tela nem regra nova.

## Technical Context

**Language/Version**: TypeScript (Node 22) no servidor; JavaScript + React 18 na tela

**Primary Dependencies**: as que o projeto já usa (Express, Zod, Prisma, React, Vite, Tailwind); nenhuma nova

**Storage**: PostgreSQL existente; **sem migration** (a folga é a ausência de turno em `simulacao_turnos`)

**Testing**: Vitest (unitário no servidor e na tela) e testes de integração HTTP já existentes para `/simulacoes`

**Target Platform**: Docker Compose local (api :4000, web :3000)

**Project Type**: web (backend + frontend)

**Performance Goals**: sugerir folgas e dar uma folga respondem em menos de 2 s numa loja de ~20 pessoas (hoje o cálculo é instantâneo)

**Constraints**: mesma entrada dá a mesma sugestão (sem sorteio); só a Simulação muda; o Cadastro e simulações gravadas não mudam

**Scale/Scope**: 2 funções puras (uma no servidor e uma na tela), 1 função pura nova de alternar folga, 3 componentes de tela (linha da semana, escala da semana, página da simulação)

## Constitution Check

- **I. Spec Kit**: spec aprovada; plano agora; tarefas e implementação depois, com aprovação a cada etapa. ✔
- **II. Docker**: tudo roda e testa dentro dos containers (`docker compose exec`). ✔
- **III. Stack padrão**: nenhuma tecnologia nova. ✔
- **IV. Banco só muda por migration**: não há mudança de banco. ✔
- **V. Dados locais protegidos**: nenhum comando destrutivo. ✔
- **VI/VIII. Linguagem simples e decisões técnicas do agente**: decisões registradas em `research.md` e traduzidas no resumo. ✔
- **VII. Começar pequeno**: ordem de entrega pela história de maior valor para quem usa (US1 segunda, US2 mesmo cargo, US3 folga livre); cada uma se verifica sozinha. ✔

Nenhuma violação; sem justificativas a registrar. Reavaliado depois do desenho (Fase 1): sem mudança.

## Project Structure

### Documentation (this feature)

```text
specs/061-folgas-sem-segunda-e-livres/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui-folga-livre.md
└── tasks.md              # próxima etapa (/speckit-tasks)
```

### Source Code (repository root)

```text
backend/node/src/modules/escala/
├── semana-com-folgas.ts          # aplicarFolgas: nova ordem + contagem de colegas + avisos
└── semana-com-folgas.test.ts     # testes da nova ordem (segunda, mesmo cargo, determinismo)

frontend/react/src/features/simulacao/
├── escala/folgas-regras.js       # sugerirFolgas: mesma ordem do servidor
├── escala/folgas-regras.test.js
├── escala/folga-livre-regras.js  # NOVO: darFolga / escalarNoDia (puro)
├── escala/folga-livre-regras.test.js
├── escala/LinhaDaSemana.jsx      # controle por célula (só editável)
├── escala/EscalaDaSemana.jsx     # repassa a ação
└── SimulacaoPage.jsx             # liga a ação ao salvar de turnos

templates/backend/node/...        # cópia gerada por scripts/sync-templates.sh (não editar à mão)
```

**Structure Decision**: aplicação web existente (backend + frontend); só se mexe nos arquivos acima.

## Complexity Tracking

Sem violações da constituição; nada a justificar.
