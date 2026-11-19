# Implementation Plan: Mapa de calor e replay de sessão no Mixpanel

**Branch**: `feat/coluna-folha-no-faturamento` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/060-mixpanel-mapa-de-calor-e-replay/spec.md`

## Summary

O serviço central de medição (`frontend/react/src/analytics/servico.js`, spec 059) passa a ligar a gravação de sessão do SDK do Mixpanel e a coleta de mapa de calor, **só depois de a pessoa ser identificada** (login do Radar). Todo texto e todo campo saem cobertos. Uma variável de ambiente controla a parcela de sessões gravadas (0 desliga). Nenhuma tela muda.

## For the reader

Chosen: ligar a gravação e o mapa de calor dentro do mesmo serviço de medição, com todo o texto da tela coberto, e só para quem entrou pelo Radar.

Why: o mapa de calor do Mixpanel nasce das sessões gravadas, e cobrir tudo evita que folha, nomes e CNPJs vazem sem depender de marcar tela por tela.

## Technical Context

**Language/Version**: JavaScript (React 18 + Vite 5), o que o front já usa

**Primary Dependencies**: `mixpanel-browser` 2.85 (já instalado); o gravador é baixado do CDN do Mixpanel (`cdn.mxpnl.com`) só quando uma sessão é gravada

**Storage**: N/A (dados no Mixpanel)

**Testing**: Vitest com o Mixpanel simulado (opções passadas ao `init`, início só após identificar, desligado sem token ou com 0%)

**Target Platform**: navegador atrás do Radar (`/escala/`) e Docker local

**Project Type**: web (só front + configuração de build)

**Performance Goals**: sem bloquear clique nem navegação; gravador carregado sob demanda

**Constraints**: nada legível na gravação; nada coletado sem pessoa logada; funcionar sem token e sem rede

**Scale/Scope**: poucas pessoas; todas as sessões no início

## Constitution Check

- I. Spec Kit: spec → plan → tasks → implement com aprovação. OK.
- II. Docker: variável nova `MIXPANEL_REPLAY_PERCENT` entra no Compose, no Dockerfile e no workflow de deploy, como a 059. OK.
- III. Stack: nenhuma biblioteca nova. OK.
- IV/V: sem banco, nada destrutivo. OK.
- VI/VIII: linguagem simples, decisão técnica do agente. OK.
- VII. MVP: tudo coberto e uma chave de liga/desliga; sem liberar trechos nem filtros por tela. OK.
- Segredos: o percentual não é segredo; o token continua fora do git. OK.

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/060-mixpanel-mapa-de-calor-e-replay/
├── plan.md
├── research.md
├── quickstart.md
└── tasks.md   # próxima etapa
```

### Source Code (repository root)

```text
frontend/react/src/analytics/
├── servico.js        # opções do SDK + iniciar a gravação após identificar
├── servico.test.js
└── catalogo.js       # (sem mudança)
frontend/react/Dockerfile                  # ARG VITE_MIXPANEL_REPLAY_PERCENT
docker-compose.yml / docker-compose.prod.yml
.github/workflows/deploy.yml               # repassa o percentual no build de produção
.env.example / .env.production.example
frontend/FRONTEND.MD                       # regra de cobertura (FR-009)
```

**Structure Decision**: tudo dentro do serviço central, que já é o único que importa `mixpanel-browser`.
