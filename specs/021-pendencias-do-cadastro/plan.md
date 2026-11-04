# Implementation Plan: Painel "O que falta preencher" no Cadastro de loja

**Branch**: `feat/pendencias-do-cadastro` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

## Summary

A regra que hoje devolve só o primeiro motivo (`situacaoDoCadastro`) passa a montar a **lista completa de pendências** (mesmos textos e mesma ordem de hoje). O servidor entrega essa lista no painel da loja e a contagem na lista de lojas. A tela mostra a faixa "O que falta preencher", contadores nas abas e destaque nos campos; como o que se digita muda a conta antes de salvar, a tela reproduz a mesma regra sobre o rascunho, com os mesmos casos de teste nos dois lados.

## For the reader

Chosen: transformar a regra de "primeiro motivo" em "lista de pendências" e mostrar essa lista em uma faixa, nas abas, nos campos e na lista de lojas.

Why: a regra e os textos já existem e estão testados, então o painel só passa a mostrar tudo o que ela já descobre, em vez de um item por vez.

## Technical Context

**Language/Version**: TypeScript (Node 20) no servidor; React 18 + Vite + Tailwind na tela
**Primary Dependencies**: as já usadas (Vitest no servidor e na tela; sem biblioteca nova)
**Storage**: N/A (sem migration, sem tabela nova; nada novo é gravado)
**Testing**: Vitest (`situacao.test.ts`, integração de cadastros, testes puros da tela); conferência no navegador
**Target Platform**: Docker Compose local
**Project Type**: web (backend + frontend)
**Performance Goals**: a lista de lojas continua calculando a situação de centenas de lojas em memória; a lista de pendências não acrescenta consultas
**Constraints**: nenhum valor em R$ vai para a lista de pendências; salários e faturamento seguem ocultos de quem não é dono; nenhuma aba ou seção hoje visível some (decisão da pessoa); contrato HTTP só ganha campos novos
**Scale/Scope**: 1 tela (detalhe da loja) e a lista de lojas

## Constitution Check

- I. Spec Kit: cumprido (spec 021 → plano → tarefas → implementação).
- II. Docker: testes e conferência no ambiente local.
- III. Stack: a existente.
- IV. Banco só por migration: nenhuma mudança de banco.
- V. Dados locais protegidos: nada destrutivo.
- VI/VIII. Linguagem simples e decisões técnicas do agente: cumprido.
- VII. Começar pequeno: sem permissões, regras ou cálculos novos.

Resultado: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/021-pendencias-do-cadastro/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cadastro.md
└── tasks.md   # /speckit-tasks
```

### Source Code

```text
backend/node/src/modules/cadastros/
├── situacao.ts          # pendenciasDoCadastro (lista) + situacaoDoCadastro derivada dela
├── painel.ts            # devolve `pendencias` e `equipe` (funções com gente), sem valores
├── cadastros.service.ts # lista de lojas: `situacao.quantidade`
└── *.test.ts
frontend/react/src/features/cadastro-loja/
├── pendencias.js        # mesma regra, sobre o rascunho (pura, com testes)
├── PainelPendencias.jsx # faixa compacta/expandida, confirmação de "Completo"
├── DetalheLoja.jsx      # painel no topo, contador nas abas, "Preencher" (aba, rolagem, foco)
├── AbaDados.jsx, ResumoMensal.jsx, TabelaFuncionamento.jsx, AbaRegras.jsx  # destaque dos campos
└── ListaLojas.jsx       # "N pendências · motivo"
frontend/react/src/components/ui/index.jsx   # contador na aba (Abas)
frontend/react/src/index.css                 # anel e selo de campo pendente
```

**Structure Decision**: web app existente; só os arquivos acima.

## Complexity Tracking

A regra existe em dois lugares (servidor e tela). Justificativa: a lista de lojas precisa dela para lojas que não estão abertas, e o painel precisa reagir ao que se digita antes de salvar. Alternativa descartada: só no servidor, que exigiria salvar a cada tecla.
