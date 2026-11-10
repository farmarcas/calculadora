# Implementation Plan: Escala por hora, com venda e contratação por função

**Branch**: `feat/escala-por-hora` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/039-escala-por-hora/spec.md`

## Summary

A tela Personalizar da Simulação ganha uma seção em largura total, "Escala por hora": abas dos dias, venda e clientes por hora, cobertura por função com "N !" e faixa de aviso, "+ Contratar" com sugestão e efeito, e turnos que se arrastam. A contratação simulada é uma vaga da simulação com turnos; nada vai ao Cadastro. O servidor ganha três pequenos pontos (mínimo por hora na cobertura, vaga com turnos e a prévia do custo); o resto é tela.

## For the reader

Chosen: a seção fica em largura total, abaixo dos passos e do painel de resultado da Simulação.

Why: a grade precisa de uns 900 px de largura, e a coluna da esquerda da Simulação é estreita.

Chosen: a contratação simulada é uma vaga com turnos, criada numa única chamada.

Why: uma vaga sem turnos não cobre nada, e os turnos precisam do número da vaga, que só o servidor sabe.

Chosen: a cobertura e a sugestão são calculadas na tela, e só o custo em % vem do servidor, para o dono.

Why: a cobertura tem de responder enquanto se arrasta; o custo depende de salários, que só o dono vê.

Chosen: o efeito na venda mostra o que o sistema já calcula (● 0% quando o horário não muda).

Why: não existe regra de quanto cobrir uma falta aumenta a venda, e não vamos inventar um número.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API); React 18 + Vite + Tailwind (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança (turnos e vagas já ficam na simulação)

**Testing**: Vitest (unidade e tela) e testes de integração da API (por perfil)

**Target Platform**: web (computador e celular)

**Project Type**: web (API + tela)

**Performance Goals**: cobertura e faixa de aviso atualizadas em menos de 1 segundo ao arrastar, adicionar ou remover

**Constraints**: nenhum valor em reais para gestor e visualizador; nada gravado no Cadastro; o resto da Simulação e do Diagnóstico não muda

**Scale/Scope**: 1 pasta nova de componentes e regras puras na tela, 3 mudanças pequenas no servidor, 1 endpoint de prévia

## Constitution Check

- I (Spec Kit): spec aprovada; plano e tarefas passam pelo seu OK antes de código. ✔
- II, V (Docker, dados protegidos): nada novo; nenhum comando destrutivo. ✔
- III (Stack): sem tecnologia nova. ✔
- IV (Banco só muda por migration): não há mudança de banco. ✔
- VII (Começar pequeno): reaproveita vagas, turnos e cobertura que já existem; nenhuma regra de cálculo muda. ✔

Gate aprovado; reavaliado depois do desenho, segue aprovado.

## Project Structure

### Documentation (this feature)

```text
specs/039-escala-por-hora/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── escala-por-hora.md
└── tasks.md   # etapa seguinte
```

### Source Code (repository root)

```text
backend/node/src/modules/simulacoes/
├── avaliar.ts                      # a cobertura de cada hora ganha `exigido`
├── vagas.ts                        # vaga nova aceita `turnos`; o servidor dá a matrícula aos turnos
├── simulacoes.schemas.ts           # vagaSchema com `turnos`; pedido da prévia
├── simulacoes.routes.ts            # POST /simulacoes/:id/efeito-contratacao
├── simulacoes.service.ts           # prévia do custo (sem gravar, só dono)
└── (testes de unidade e de integração)

frontend/react/src/features/simulacao/escala/
├── escala-regras.js(+test)         # NOVO: horas do dia, quartis, cobertura, faixa de aviso, sugestão, efeito, total da semana (puro)
├── movimento-regras.js(+test)      # NOVO: mover e redimensionar turno de 15 em 15 min, limites (puro)
├── EscalaPorHora.jsx               # NOVO: abas, faixa de contexto e faixa de aviso
├── GradeDeHoras.jsx                # NOVO: cabeçalho, venda e clientes por hora
├── LinhaDaFuncao.jsx               # NOVO: resumo, pessoas por hora, "+ Contratar"
├── LinhaDaPessoa.jsx               # NOVO: barra de turno arrastável e total da semana
├── FormularioContratar.jsx         # NOVO: tipo, dias, entra, sai, sugestão e efeito
└── EscalaMobile.jsx                # NOVO: lista por função no celular
frontend/react/src/features/simulacao/SimulacaoPage.jsx   # renderiza a seção abaixo da grade atual
frontend/react/src/styles/alquimia.css                    # tokens que faltarem (azul escuro da função, escala de azul, texto de sucesso)
```

**Structure Decision**: as regras (cobertura, sugestão, movimento do turno) ficam em funções puras testadas; os componentes só desenham e chamam a gravação que a tela já usa (`salvar`). O servidor só ganha o que a tela não consegue saber sozinha.

## Design

1. **Dados.** A tela lê `sim.avaliacao.cobertura[dia]` (agora com `exigido`), `sim.turnos`, `sim.quadro`, `sim.diasAbertos`, `sim.resultado.vendaPorHora` e `sim.editavel`. Nada novo para ler.
2. **Grade.** Para o dia escolhido: horas abertas, linhas de venda (dono) e clientes (quatro tons por quartil do dia, média do dia à direita), e por função a linha-resumo (pessoas por hora, "mín. N" e "+ reforço", chevron, "+ Contratar") com as pessoas abaixo; folga mostra a barra "Folga".
3. **Cobertura e faixa de aviso.** Verde quando pessoas ≥ exigido; rosa com "N !" e borda vermelha quando abaixo; borda tracejada azul nas horas reforçadas pela contratação simulada. A faixa amarela diz quantas horas faltam, de qual função e a faixa; some quando fecha.
4. **Arrastar.** Mover e redimensionar de 15 em 15 minutos dentro das horas do dia; durante o gesto a tela recalcula a cobertura localmente; ao soltar grava `turnos` pela chamada de hoje. Teclado: setas movem e ajustam (acessibilidade).
5. **+ Contratar.** Um formulário aberto por vez, sob a linha da função. Sugestão: a janela e os dias que mais cobrem as horas sem cobertura da função, respeitando as horas do dia e o limite do parcial. Efeito: horas cobertas e "horário da loja sem mudança" calculados na tela; para o dono, o custo em % vem da prévia do servidor e a venda mostra o que o sistema já calcula.
6. **Adicionar e remover.** "Adicionar à simulação" envia a vaga com os turnos numa chamada; "Remover" envia as vagas sem ela. A linha azul "Contratação simulada" sai da vaga e dos turnos dela.
7. **Perfis.** Dono: venda por hora e custo em %. Gestor: sem venda e sem custo, mas contrata e arrasta. Visualizador e simulação gravada: só leitura.
8. **Estados.** Sem base: mensagem no lugar de venda e clientes; sem turno selecionado: faixa de contexto; dia fechado: mensagem simples.
9. **Celular.** Abaixo de ~700 px: lista por função com o turno em texto, cobertura por hora numa faixa com rolagem horizontal e "+ Contratar" por função.
10. **Tokens.** Azul escuro e azul claro das funções, os quatro tons da escala e o verde de texto usam o token mais próximo do Design System ou um novo no CSS.

## Complexity Tracking

Nenhuma violação a justificar. Riscos: (1) a quantidade de gravações ao arrastar, mitigada por gravar só ao soltar; (2) a grade larga, mitigada por seção em largura total e versão de celular própria.
