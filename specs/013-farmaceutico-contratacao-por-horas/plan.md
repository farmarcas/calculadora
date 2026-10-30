# Implementation Plan: Farmacêutico como único mínimo e contratação por horas

**Branch**: `feat/farmaceutico-contratacao-por-horas` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

## Summary

Duas peças puras novas decidem tudo: o **gap em horas** (farmacêutico obrigatório; demais cargos com meta, padrão = nível de hoje) e a **sugestão de contratação por horas** (parcial até 30 h; integral; integral mais um parcial quando reduz a ociosidade; opção secundária de 26 h + 6 h extras). O motor de capacidade (`verificarRegra`) passa a chamá-las e continua devolvendo o mesmo formato, mais campos novos, para que o Diagnóstico, os cenários, o comparativo, as simulações e as vagas sugeridas sigam funcionando sem reescrita. Depois vêm a tela, os dias e horários do parcial com o aviso do CRF e, por último, a redistribuição das pessoas existentes (com a marca de horário fixo). Uma única migration pequena (campo `horario_fixo` no funcionário), só na última fatia.

## For the reader

Chosen: o **gap passa a ser em horas semanais**, com o motor atual de turnos mantido só para o farmacêutico, como verificação de que todos os dias têm cobertura.

Why: é o que o pedido descreve (gap de 10 h, de 35 h, de 54 h) e dá a sugestão de parcial com as horas certas; os turnos continuam avisando quando as horas fecham mas algum dia ficaria sem farmacêutico.

Chosen: o motor mantém o **mesmo formato de resposta** e ganha campos novos.

Why: mais de quinze telas e cálculos leem esse formato; trocar por um formato novo de uma vez quebraria tudo. Assim cada fatia termina com o sistema funcionando.

Chosen: nos cenários, **só o farmacêutico bloqueia** ("a equipe cobre?"); as metas dos outros cargos geram sugestões marcadas como "para manter o nível de hoje".

Why: assim "Foco em economia" continua tendo sentido (equipe atual cobre o exigido por lei) e você enxerga o que é obrigação e o que é meta.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite + Tailwind (tela), como já está
**Primary Dependencies**: nenhuma nova
**Storage**: PostgreSQL; **uma** migration, só na última fatia: `funcionarios.horario_fixo` (booleano, padrão falso)
**Testing**: Vitest com contas à mão (gap de 10 h, 30 h, 35 h, 54 h, 70 h, 75 h; 26 h + 6 h; loja 24 h; loja sem atendente; metas e escala das horas abertas; custo proporcional) e Supertest (Diagnóstico da Porto Feliz antes e depois, perfis); os testes antigos de capacidade, requisitos, cenários, comparativo, diagnóstico e simulações são refeitos à mão, com o motivo de cada mudança anotado
**Target Platform**: Docker Compose local
**Project Type**: web (api + front)
**Performance Goals**: Diagnóstico em até 2 s nas fases de 42 h e 40 h (a busca de combinações tem no máximo algumas dezenas de casos por cargo)
**Constraints**: valores em reais só para o dono; as duas fases sempre calculáveis; regras legais continuam vindo da tabela de parâmetros; nunca `down -v` nem `migrate reset`
**Scale/Scope**: 5 cargos, 3 regras (atual, 42 h, 40 h), até 20 vagas por simulação

## Constitution Check

| Princípio | Situação |
|---|---|
| I Spec Kit | OK — spec e plano; tarefas dependem de aprovação |
| II Docker | OK |
| III Stack | OK — nada acrescentado |
| IV Migrations | OK — uma migration só, escrita à mão, só acrescenta coluna |
| V Dados locais | OK — nenhuma exclusão; antes de migrar, conferem-se as contagens |
| VII Começar pequeno | OK — seis fatias que terminam verdes |
| VIII Técnico é do agente | OK |

Sem violações.

## Project Structure

```text
backend/node/src/modules/regras/
├── gap-horas.ts (+test)           # meta por cargo (nível de hoje ou meta do dono), capacidade e gap em horas
├── contratacao-horas.ts (+test)   # integral, parcial até 30 h, combinação, variante 26+6, ociosidade, custo
├── capacidade.ts                  # verificarRegra chama os dois e mantém o formato (campos novos)
├── perfis.ts / requisitos.ts      # padrão de mínimo: só o farmacêutico; demais = meta opcional
backend/node/src/modules/escala/
├── diagnostico.ts / cobertura.ts / quadro-turnos.ts   # alertas e "exigido" só para farmacêutico e metas do dono
├── cenarios.ts / comparativo.ts   # contratação por horas, "obrigatória" × "meta", Cenário 2 só pelo farmacêutico
├── distribuir-parcial.ts (+test)  # dias e horários do parcial (fatia 5)
└── redistribuir.ts (+test)        # escala semanal das pessoas existentes (fatia 6)
backend/node/src/modules/simulacoes/vagas.ts           # vagas sugeridas pela contratação nova
backend/node/prisma/migrations/…_horario_fixo/         # fatia 6
frontend/react/src/features/
├── diagnostico/                   # tabela de gaps e sugestões, cartões de cenário, quadro central
├── cadastros/ e diagnostico/Configuracao.jsx          # "mínimo" vira "meta opcional"; marca "horário fixo"
README.md
specs/013-farmaceutico-contratacao-por-horas/
```

**Structure Decision**: as duas regras novas vivem em módulos puros, separados do motor, para serem testadas com números à mão e reaproveitadas pelos cenários, pelas simulações e pela tela. O motor só orquestra.

## Fatias de entrega

1. **Núcleo por horas (US1 a US3, puro):** `gap-horas` e `contratacao-horas` com testes à mão.
2. **Motor e diagnóstico (US1, US2, US3):** `verificarRegra` com farmacêutico obrigatório, metas e sugestões por horas; padrão de mínimo; cobertura, quadro por turno e pontos de atenção só para farmacêutico e metas; testes antigos refeitos.
3. **Cenários, comparativo, simulações e vagas (US6):** a nova contratação em todos eles; Cenário 2 cobre só pelo farmacêutico; "obrigatória" × "meta"; Porto Feliz antes e depois pela API.
4. **Tela (US3):** diagnóstico (gap em horas, sugestão, horas usadas e ociosas, custo), configuração ("meta opcional"), cartões de cenário; conferência no navegador.
5. **Parcial com dias, horários e aviso do CRF (US4).**
6. **Redistribuição e horário fixo (US5) e fechamento:** escala semanal das pessoas existentes, migration, README, conferência final.

## Riscos

- **Muitos testes antigos mudam** (capacidade, requisitos, cenários, comparativo, diagnóstico, simulações): as expectativas serão refeitas à mão, uma a uma.
- **Meta = nível de hoje** gera sugestões de parcial para cargos como Apoio na regra de 40 h (aceito pela pessoa); elas aparecem marcadas como "para manter o nível de hoje".
- **Horas × dias:** as horas podem fechar e algum dia ficar sem farmacêutico; os turnos do farmacêutico seguem como verificação e o aviso aponta o dia.
- **Simulações gravadas** guardam o resultado congelado; ao reabrir um rascunho, o cálculo usa a lógica nova.
- **A redistribuição (fatia 6) é a parte mais pesada:** se crescer, vira spec própria sem atrapalhar as fatias 1 a 5.
