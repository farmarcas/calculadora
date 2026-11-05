# Implementation Plan: Modais de importação

**Branch**: `feat/modais-de-importacao` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/029-modais-de-importacao/spec.md`

## Summary

Dois modais novos, com a mesma casca acessível (passo a passo, área de envio própria, foco preso, Esc e ×): "Importar lojas e funcionários" (com etapa de **revisão antes de gravar**) e "Enviar base comercial" (com o **quadro do arquivo** e o aviso do envio que será substituído). Para isso a API ganha duas leituras que **não gravam nada**: a revisão da importação do Cadastro e a revisão da base comercial. A gravação continua nos caminhos de hoje. Sem migration.

## For the reader

Chosen: os modais passam a mostrar o que vai acontecer antes de gravar, com um passo a passo simples e funcionando só pelo teclado.

Why: assim ninguém grava uma planilha às cegas, e quem não usa mouse (ou leitor de tela) consegue importar do mesmo jeito.

## Technical Context

**Language/Version**: TypeScript (Node 22) na API; React 18 + Vite + Tailwind na tela

**Primary Dependencies**: Express, Multer (já usado no envio), ExcelJS (já lê as planilhas), Vitest; nada novo

**Storage**: PostgreSQL 16; **sem migration** (a revisão só lê; a gravação usa as tabelas de hoje)

**Testing**: Vitest unitário (formatação, lista de erros, regras da tela) e integração HTTP (`npm run test:integration`) para as duas revisões (não gravam; números iguais aos da gravação)

**Target Platform**: Docker Compose local (postgres, api, web)

**Project Type**: aplicação web (backend + frontend)

**Performance Goals**: a revisão de um arquivo de até 10 MB responde na mesma ordem de tempo da gravação de hoje (uma leitura, sem escrita)

**Constraints**: a revisão MUST NOT gravar; o número mostrado MUST ser o que a gravação produz; permissões como hoje (a aba Lojas só para quem importa lojas); limite de arquivo de 10 MB (o que a API já impõe); .xlsx e .csv

**Scale/Scope**: 2 endpoints novos, ~10 componentes de tela, 1 aviso global; nenhuma outra tela muda

## Constitution Check

- Spec Kit seguido (specify → plan; tasks e implement com aprovação): OK.
- Tudo no Docker, stack padrão, sem tecnologia nova: OK.
- Banco só muda por migration: **sem mudança de estrutura**: OK.
- Acessibilidade e design system: tokens do Alquimia já usados no projeto: OK.

Sem violações a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/029-modais-de-importacao/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api-revisao.md
│   └── estados-da-tela.md   # estados que o board não desenhou, para aprovação
└── tasks.md   # criado depois, em /speckit-tasks
```

### Source Code (repository root)

```text
backend/node/src/modules/
├── cadastros/
│   ├── cadastros.service.ts     # confirmarImportacao vira "executar(simular)"; novo revisarImportacao
│   ├── cadastros.routes.ts      # POST /importacoes/cadastro/:id/revisar
│   └── cadastros.schemas.ts     # corpo da revisão (mesmo mapeamento da confirmação)
└── escala/
    ├── escala.service.ts        # novo revisarBase (lê, resume, não grava); mensagens de coluna faltando
    └── escala.routes.ts         # POST /cargas/base/revisar

frontend/react/src/
├── components/importacao/
│   ├── JanelaDeImportacao.jsx   # casca do modal: role=dialog, foco preso, Esc, ×, foco volta ao gatilho
│   ├── PassoNumerado.jsx, AreaDeEnvio.jsx, QuadroDoArquivo.jsx, AvisoCaixa.jsx
│   ├── useArmadilhaDeFoco.js, formato.js (tamanho, datas, lista de erros em CSV)
├── features/cadastros/ModalImportarCadastro.jsx   # substitui ImportarPlanilha.jsx (e a revisão)
├── features/diagnostico/ModalEnviarBase.jsx       # substitui EnviarPlanilhas.jsx
├── shell/AvisoGlobal.jsx        # aviso de sucesso depois que o modal fecha
└── App.jsx, CadastrosPage.jsx, AbaEquipe.jsx      # trocam os modais e mostram o aviso
```

**Structure Decision**: aplicação web existente; componentes novos em uma pasta própria, reutilizáveis pelos dois modais.

## Complexity Tracking

Sem desvios da constituição.
