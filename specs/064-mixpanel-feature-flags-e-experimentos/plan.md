# Implementation Plan: Feature flags e experimentos prontos no Mixpanel

**Branch**: `feat/mixpanel-feature-flags-e-experimentos` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/064-mixpanel-feature-flags-e-experimentos/spec.md`

## Summary

O serviço central de medição (`frontend/react/src/analytics/servico.js`) passa a ligar o recurso de flags do SDK do Mixpanel **só depois da identificação** e a expor duas funções simples (`flagLigada`, `variante`) e um gancho React (`useFlag`) para as telas. Sem flag criada, tudo devolve o padrão e nada muda. Uma variável de ambiente permite desligar o preparo. Nenhuma tela muda hoje.

## For the reader

Chosen: ligar as flags dentro do mesmo serviço de medição, só para quem entrou pelo Radar, com valor padrão "desligada" quando algo falhar.

Why: o SDK que já usamos traz flags e experimentos prontos, então não entra biblioteca nova, e o padrão desligado mantém o comportamento de hoje.

## Technical Context

**Language/Version**: JavaScript (React 18 + Vite 5), o que o front já usa

**Primary Dependencies**: `mixpanel-browser` 2.85 (já instalado); sem pacote novo

**Storage**: N/A (as flags ficam no Mixpanel; o SDK guarda um cache local curto)

**Testing**: Vitest com o Mixpanel simulado (padrão quando não há token ou pessoa, consulta só após identificar, contexto com as propriedades da pessoa, desligado por configuração, falha do SDK não lança erro)

**Target Platform**: navegador atrás do Radar (`/escala/`) e Docker local

**Project Type**: web (só front + configuração de build)

**Performance Goals**: nunca bloquear a tela esperando flag; antes de chegar, vale o padrão

**Constraints**: nada consultado sem pessoa logada; funcionar sem token e sem rede; nenhuma tela importa `mixpanel-browser`

**Scale/Scope**: poucas pessoas; zero flags reais hoje

## Constitution Check

- I. Spec Kit: spec → plan → tasks → implement com aprovação. OK.
- II. Docker: variável nova `MIXPANEL_FLAGS` entra no Compose, no Dockerfile e no workflow de deploy, como nas specs 059 e 060. OK.
- III. Stack: nenhuma biblioteca nova. OK.
- IV/V: sem banco, nada destrutivo. OK.
- VI/VIII: linguagem simples, decisão técnica do agente. OK.
- VII. MVP: duas funções, um gancho e uma chave de desligar; sem painel próprio nem flags reais. OK.
- Segredos: `MIXPANEL_FLAGS` não é segredo; o token continua fora do git. OK.

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/064-mixpanel-feature-flags-e-experimentos/
├── plan.md
├── research.md
├── quickstart.md
└── tasks.md   # próxima etapa
```

### Source Code (repository root)

```text
frontend/react/src/analytics/
├── servico.js        # liga flags após identificar; flagLigada, variante; desliga no limpar
├── servico.test.js
├── useFlag.js        # gancho React: re-renderiza quando as flags chegam
└── useFlag.test.jsx
frontend/react/Dockerfile                  # ARG VITE_MIXPANEL_FLAGS
docker-compose.yml / docker-compose.prod.yml
.github/workflows/deploy.yml               # repassa MIXPANEL_FLAGS no build de produção
.env.example / .env.production.example
frontend/FRONTEND.MD                       # como criar flag e experimento (FR-008)
```

**Structure Decision**: tudo no serviço central, que já é o único que importa `mixpanel-browser`; o gancho fica ao lado dele e só usa as funções do serviço.

## Design

**Interface exposta às telas** (contrato):

- `flagLigada(nome)` → `true` ou `false`; padrão `false`.
- `variante(nome, padrao)` → valor da versão que a pessoa recebeu (texto), ou `padrao`.
- `useFlag(nome)` / `useVariante(nome, padrao)` → o mesmo, dentro de componentes, atualizando quando as flags chegam.

**Quando liga**: no `init` o SDK sobe com flags **desligadas**. Em `identificar`, quando a pessoa muda, o serviço liga as flags passando como contexto as propriedades da pessoa (perfil, papel no Radar, operador, quantidades, acesso total) e busca as flags. Mudança só de propriedades da mesma pessoa atualiza o contexto.

**Quando desliga**: em `limpar`, as flags são desligadas antes do `reset`, para o SDK não buscar flags de uma pessoa anônima.

**Experimento**: o SDK registra sozinho `$experiment_started` na primeira vez que a versão é lida. O catálogo de eventos (spec 059) não precisa mudar.

**Desligar**: `VITE_MIXPANEL_FLAGS` com `0` ou `false` mantém as flags desligadas.
