# Implementation Plan: Nome e parecer do cenário salvo (com PDF)

**Branch**: `feat/coluna-folha-no-faturamento` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

## Summary

Ao salvar, a tela abre uma janela com nome e observação; o servidor valida o nome (obrigatório, até 60 caracteres, único na loja sem diferenciar maiúsculas), grava o cenário com esse nome e **guarda o parecer** (um retrato do momento de salvar) junto com a observação. O parecer é montado por uma função única a partir da simulação e do resultado, em duas versões prontas (completa para o dono e sem valores para os demais); a rota entrega a versão certa para o perfil. Há uma rota que devolve o parecer e outra que gera o PDF. Na tela, "Ver parecer" abre o parecer a partir da lista e da comparação de cenários salvos, com o botão "Baixar parecer em PDF". Cenários antigos têm o parecer montado na hora de abrir.

## For the reader

Chosen: o servidor guarda duas versões do parecer já escritas (completa e sem valores) e entrega só a do perfil.

Why: o retrato fica fixo, e gestor e consulta nunca recebem número de custo, porque a versão completa nem sai do servidor para eles.

Chosen: o PDF é gerado no servidor, a partir do mesmo parecer da tela, com a biblioteca `pdfkit`.

Why: o arquivo é sempre igual ao que está na tela e não depende do navegador. A biblioteca é conhecida e já cuida da quebra de linha e das páginas.

Chosen: duas colunas novas na tabela de simulações (observação e parecer), sem apagar nada.

Why: o parecer precisa ficar guardado com o cenário; adicionar colunas é uma mudança segura e não mexe nos dados atuais.

Chosen: o nome é validado só no servidor (a tela mostra o erro) e o botão de salvar fica bloqueado enquanto grava.

Why: o servidor é a fonte da verdade (nome único); bloquear o botão evita salvar duas vezes.

## Technical Context

- **Banco**: migração `…_parecer_do_cenario` com `ALTER TABLE simulacoes ADD COLUMN observacao TEXT, ADD COLUMN parecer JSONB` (aplicada com `migrate deploy`, sem reset); `schema.prisma` ganha `observacao String?` e `parecer Json?`.
- **Servidor** (`backend/node/src/modules/simulacoes/`):
  - `parecer.ts`: `montarParecer(entrada)` pura → `{ dono, publico }`, cada um com `resumo` (2 a 3 frases), `decisoes` e `efeitos` (seções com itens de texto). Usa os mesmos números do card da simulação (`calcularResultado`, `custoDoDono`, `horarioEstendido`) e frases em pt-BR simples, sem "p.p." nem "CMV" ("Custo da mercadoria"). As setas viram "para" no texto.
  - `parecer-pdf.ts`: `gerarPdf(parecer, cabecalho)` com `pdfkit`, fonte padrão Helvetica; "−" vira "-".
  - `simulacoes.schemas.ts`: `gravarReq` aceita `nome` (1 a 60) e `observacao` (até 1000).
  - `simulacoes.service.ts`/`repository.ts`: `gravar` valida e grava nome, observação e parecer; nome único por loja (sem diferenciar maiúsculas, ignorando descartadas); nova `parecer(id, perfil)` (devolve o guardado, ou monta na hora para cenários antigos com `montadoAgora: true`) e `parecerPdf(id, perfil)`.
  - `simulacoes.routes.ts`: `GET /simulacoes/:id/parecer` e `GET /simulacoes/:id/parecer.pdf`.
- **Tela** (`frontend/react/src/features/`):
  - `simulacao/ModalSalvarCenario.jsx` e `simulacao/salvar-regras.js` (nome sugerido "Cenário N", limites, contagem da observação, mensagens).
  - `SimulacaoPage.jsx`: o botão abre a janela e só então chama `gravar` com `nome` e `observacao`.
  - `grade/ParecerDoCenario.jsx` + `grade/parecer-regras.js`: leitura do parecer e botão "Baixar parecer em PDF" (reaproveita o download já existente em `api/client.js`); link "Ver parecer" em `ListaDeSimulacoes.jsx` e na comparação.
- **Perfis**: dono recebe a versão completa; gestor e consulta, a versão sem valores; salvar exige perfil que escreve (já existe).
- **Testes**: Vitest da função `montarParecer` (casos: Cosmópolis com contratação, sem contratação, desligados, horário a mais, sem salários, gestor sem "R$" nem "%"), do PDF (gera arquivo válido com acentos), dos validadores de nome e da tela; integração (salvar com nome e observação, nome repetido, nome vazio, parecer por perfil, PDF por perfil, cenário antigo, salvar duas vezes).

## Constitution Check

Sem conflito: linguagem simples; valores em reais só para o dono; migração apenas aditiva; uma dependência nova (`pdfkit`), registrada e justificada.

## Project Structure

```text
specs/056-nome-e-parecer-do-cenario/  spec · plan · research · quickstart · tasks
backend/node/prisma/schema.prisma · prisma/migrations/…_parecer_do_cenario/
backend/node/src/modules/simulacoes/parecer.ts · parecer-pdf.ts · simulacoes.{schemas,service,repository,routes}.ts (+ testes)
frontend/react/src/features/simulacao/ModalSalvarCenario.jsx · salvar-regras.js (+ teste) · SimulacaoPage.jsx
frontend/react/src/features/grade/ParecerDoCenario.jsx · parecer-regras.js (+ teste) · ListaDeSimulacoes.jsx · ComparacaoDeSimulacoes.jsx
README.md
```

## Complexity Tracking

Uma dependência nova (`pdfkit`): ver `research.md` para as alternativas descartadas.
