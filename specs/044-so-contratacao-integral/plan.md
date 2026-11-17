# Implementation Plan: Só contratação integral

**Branch**: `feat/so-contratacao-integral` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/044-so-contratacao-integral/spec.md`

## Summary

A sugestão de contratação passa a ser só de pessoas integrais. A mudança é no coração do motor (`sugerirContratacao`, que hoje escolhe entre parcial, integral ou integral mais parcial) e se espalha sozinha para os cenários, o quadro central, o resultado em horas e o "Personalizar". Na tela, o formulário "+ Contratar" perde a escolha de parcial. O servidor passa a recusar vaga **nova** que não seja integral, e as simulações já salvas com parcial continuam abrindo. Banco e Cadastro não mudam.

## For the reader

Chosen: o motor só devolve integrais: `ceil(falta ÷ jornada cheia)` pessoas, sem parcial e sem a variante com hora extra.

Why: todo o resto (cartões, linhas, custo, ociosidade, Personalizar) já lê essa sugestão, então a mudança num ponto vale para todos e o cartão e a Simulação continuam sendo a mesma conta.

Chosen: a contratação integral tem a carga cheia da regra (a mesma que o sistema já usa: até 44h, e 40h nas regras de 42h e 40h sem convenção).

Why: é o que já existe e o que se contrata na prática; não inventa um número novo.

Chosen: o servidor recusa vaga nova que não seja integral, mas vaga que já existe numa simulação salva segue valendo.

Why: protege o histórico sem permitir mais parcial.

## Technical Context

**Language/Version**: Node 22 + TypeScript (servidor); React 18 (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança de banco

**Testing**: Vitest (unidade), testes de integração das rotas, conferência no navegador

**Target Platform**: web + API

**Project Type**: web (backend + frontend)

**Performance Goals**: sem mudança

**Constraints**: Cadastro intacto; simulações salvas abrem como estavam; sem R$ para quem não é dono

**Scale/Scope**: 3 regras, até 20 vagas por simulação

## Constitution Check

- Spec Kit seguido: sim.
- Sem mudança de banco, segredo ou autenticação: sim.
- Regra de negócio com teste unitário: sim.
- Contrato HTTP preservado: sim; muda o valor aceito para `cargaH` de vaga nova.

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/044-so-contratacao-integral/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/so-integral.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/node/src/modules/
├── regras/contratacao-horas.ts          # sugerirContratacao: só integral; sem variante de hora extra
├── regras/capacidade.ts                 # tira o aviso do CRF para parcial; usa a sugestão integral
├── escala/semana-com-folgas.ts          # a conta real usa integrais
├── escala/{cenarios,comparativo,etapas,linhas-cenarios,diagnostico}.ts   # textos e campos sem parcial
├── simulacoes/{vagas,resultado,resultado-em-horas,simulacoes.service}.ts # vagaSugeridas integrais; recusa vaga nova não integral
└── simulacoes/simulacoes.schemas.ts      # mensagem de vaga nova
frontend/react/src/features/
├── simulacao/escala/{FormularioContratar,escala-regras,EscalaPorHora}.jsx|js   # só integral
├── simulacao/{PassoContratacoes,resultado-regras}.jsx|js                        # sem parcial
└── diagnostico/{Comparativo.jsx,cartao/linha-regras.js}                         # textos sem parcial
```

**Structure Decision**: não há arquivo novo de produção; é uma troca de regra num ponto central e a limpeza do que dependia dele.

## Complexity Tracking

Nenhuma violação a justificar.
