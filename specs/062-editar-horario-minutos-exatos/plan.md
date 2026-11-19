# Implementation Plan: Editar o horário de cada pessoa com minutos exatos na Simulação

**Branch**: `feat/folgas-evitar-segunda-e-livres` (acumula; sem branch nem PR novo) | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/062-editar-horario-minutos-exatos/spec.md`

## Summary

Um lápis ao fim da barra de cada pessoa (e na lista do celular) abre uma janela pequena para digitar entrada, intervalo e saída em HH:mm com qualquer minuto. A janela valida em linguagem simples e, ao salvar, grava pelo **mesmo caminho do arrastar** (`mudarTurno(..., definitivo = true)`), então cobertura, avisos e resultado atualizam igual. Não há mudança de servidor, de banco nem de contrato: o servidor já aceita minutos inteiros (spec 047). A regra de contagem da cobertura por hora **não muda**; a janela só mostra, em texto, quais horas cheias o turno cobre.

Confirmado no código antes de planejar:
- O servidor valida horas como "minutos inteiros" (`simulacoes.schemas.ts`), sem exigir quarto de hora; `emMinutosDeHora` (servidor) e `emQuarto` (tela, mal nomeado) só tiram a fração de minuto do ponto flutuante. O comentário de `turnosParaGravar` ("só 15 em 15") está desatualizado.
- A cobertura por hora conta a pessoa só quando ela cobre a **hora cheia** (`presente`, igual no servidor e na tela) e o intervalo de até 2 h não a tira da cobertura.
- Os 15 minutos mandam apenas no arrastar (`movimento-regras.js`), no formulário de contratação (`opcoesDeHora`) e no teclado da barra; nada disso muda.
- A folha vem da carga contratada; o total de horas da semana já soma minutos reais.

## For the reader

Chosen: uma janela pequena de horário, reaproveitando o visual e o comportamento das janelas que o sistema já tem, ligada ao mesmo "salvar turno" do arrastar.

Why: assim o resultado, a cobertura e os avisos respondem exatamente como hoje, sem criar um caminho novo de gravação.

## Technical Context

**Language/Version**: JavaScript + React 18 na tela; TypeScript no servidor (só um teste novo)

**Primary Dependencies**: as do projeto (React, Vite, Tailwind, Vitest); nenhuma nova. A janela usa o componente `Modal` e os campos (`Campo`, `entrada`, `Botao`) que já existem em `components/ui`.

**Storage**: PostgreSQL existente; **sem migration**.

**Testing**: Vitest (regras puras ao lado dos arquivos `.test.js`); 1 teste de integração HTTP para provar que o servidor guarda minutos quebrados.

**Target Platform**: navegador (computador e celular), Docker Compose local.

**Project Type**: web (backend + frontend).

**Performance Goals**: gravar e atualizar a cobertura em menos de 2 s (o mesmo caminho do arrastar).

**Constraints**: arrastar e teclado seguem iguais; horário de funcionamento da loja e Cadastro não mudam; acessibilidade por teclado e leitor de tela; toque de 44 × 44 px.

**Scale/Scope**: 1 arquivo de regras puras novo, 1 componente novo (janela), 3 componentes alterados (linha da pessoa, escala por hora, escala do celular), 1 comentário corrigido.

## Constitution Check

- **I. Spec Kit**: spec aprovada; plano agora; tarefas e implementação depois, com aprovação a cada etapa. ✔
- **II. Docker**: testes e verificação nos containers. ✔
- **III. Stack padrão**: nenhuma tecnologia nova. ✔
- **IV. Banco só muda por migration**: sem mudança de banco. ✔
- **V. Dados locais protegidos**: nenhum comando destrutivo. ✔
- **VI/VIII. Linguagem simples e decisões do agente**: decisões em `research.md`, resumo em linguagem simples. ✔
- **VII. Começar pequeno**: P1 (janela, validação, exibição) entrega valor sozinha; o celular (P2) vem depois. ✔

Sem violações. Reavaliado depois do desenho: sem mudança.

## Project Structure

### Documentation (this feature)

```text
specs/062-editar-horario-minutos-exatos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui-horario-exato.md
└── tasks.md              # próxima etapa (/speckit-tasks)
```

### Source Code (repository root)

```text
frontend/react/src/features/simulacao/escala/
├── horario-exato-regras.js         # NOVO: ler/mostrar HH:mm, validar, montar o turno (puro)
├── horario-exato-regras.test.js    # NOVO
├── ModalHorarioDoTurno.jsx         # NOVO: a janela (usa o Modal do projeto)
├── LinhaDaPessoa.jsx               # lápis ao fim da barra
├── EscalaPorHora.jsx               # estado da janela e gravação via mudarTurno
├── EscalaMobile.jsx                # lápis na lista do celular
└── escala-regras.js                # comentário de turnosParaGravar corrigido; horasCobertas(turno) (texto da cobertura)

backend/node/src/modules/simulacoes/
└── simulacoes.routes.integration.test.ts   # teste: o servidor guarda 07:32, 12:17, 13:17 e 16:24

templates/backend/node/...          # cópia gerada por scripts/sync-templates.sh (não editar à mão)
```

**Structure Decision**: aplicação web existente; só os arquivos acima mudam.

## Complexity Tracking

Sem violações da constituição; nada a justificar.
