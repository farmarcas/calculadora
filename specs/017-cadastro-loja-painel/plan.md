# Implementation Plan: Cadastro de loja em painel único

**Branch**: `feat/cadastro-loja-painel` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

## Summary

Quase tudo que a tela precisa já existe no servidor (dados da loja, horário por dia, faturamento por dia, funcionários, configuração, custos, turnos). O trabalho se divide em: (1) **regras de turno** mais livres no motor (sobrepor, passar do horário, maior mínimo por hora, cobertura como aviso, modo "mínimo único"), (2) **lista com situação do cadastro, filtros e busca por CNPJ** no servidor, (3) **um endpoint de "salvar tudo"** que valida tudo antes de gravar, e (4) a **tela nova** (lista + 3 abas, rascunho único, equipe na hora, deep link).

## For the reader

Chosen: o servidor calcula a situação "Completo/Revisar" e valida tudo de uma vez ao salvar; a tela mantém um rascunho único por loja.

Why: assim a lista filtra certo mesmo com centenas de lojas, e um erro em qualquer aba não deixa a loja salva pela metade.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React 18 + Vite + Tailwind 3.4 (tela). **Dependencies**: as atuais; Vitest também no front (só para as contas puras da tela).
**Storage**: PostgreSQL 16; **sem migration**: o modo do mínimo entra no JSON de turnos que a loja já guarda (`{ versao, modo, turnos }`).
**Testing**: Vitest (contas puras: horas do dia, soma semanal, mensal, divergência, janela do mínimo, sobreposição, cobertura, situação do cadastro), Supertest (rotas), conferência da tela em 4 larguras.
**Performance Goals**: lista e filtros respondem em até 1 s para ~500 lojas por grupo (cálculo em memória do GE).
**Constraints**: valores em reais só para o dono; CPF mascarado; nada de CPF em URL; sem rolagem horizontal de 360 a 1920 px.
**Scale/Scope**: centenas de lojas por grupo, até 6 turnos por loja, ~100 funcionários por loja.

## Constitution Check

- I Spec Kit: spec aprovada; plano a seguir para tarefas. OK. II Docker: tudo no Compose. OK. III Stack padrão: sem stack nova (Vitest no front é ferramenta de teste). OK.
- IV Banco só por migration: **nenhuma mudança de tabela** (modo vai no JSON existente). OK.
- V Dados locais protegidos: nenhum comando destrutivo; turnos já gravados continuam válidos (a regra nova é mais permissiva). OK.
- VI/VII/VIII: linguagem simples, fatias pequenas, decisões técnicas do agente registradas em research.md. OK.

Sem violações.

## Project Structure

```text
specs/017-cadastro-loja-painel/  plan.md, research.md, data-model.md, quickstart.md, contracts/, tasks.md
backend/node/src/modules/
├── regras/turnos.ts, requisitos.ts        # sobrepor, passar do horário, maior mínimo por hora, cobertura, modo
├── cadastros/situacao.ts (+test)           # NOVO: situação Completo/Revisar e motivo
├── cadastros/cadastros.service.ts, .repository.ts, .routes.ts, .schemas.ts   # lista com filtros; "salvar tudo"
└── escala/escala.schemas.ts / service      # configuração com modo e turnos mais livres
frontend/react/src/features/cadastro-loja/   # NOVA tela (substitui Cadastros de Lojas e o "Editar loja")
├── CadastroLojaPage.jsx, ListaLojas.jsx, DetalheLoja.jsx, useRascunhoLoja.js, urlDaLoja.js
├── AbaDados.jsx (TabelaFuncionamento.jsx, ResumoMensal.jsx)
├── AbaEquipe.jsx (FormFuncionario.jsx)
├── AbaRegras.jsx (Custos, Convencao, MinimoPessoas.jsx, BarraTurnos.jsx)
└── calculos.js (+ calculos.test.js)       # horas do dia, soma semanal, mensal, divergência, janela, cobertura
```

**Structure Decision**: a tela nova mora em pasta própria e reaproveita os componentes de UI e as chamadas existentes; `CadastrosPage` passa a só montar as abas de página ("Lojas" e "Parâmetros legais").

## Complexity Tracking

Nenhuma violação.
