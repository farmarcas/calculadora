# Implementation Plan: Custos e Turnos, com o faturamento hora a hora ao lado dos turnos

**Branch**: `feat/custos-e-turnos` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/035-custos-e-turnos/spec.md`

## Summary

A aba do Cadastro ganha o nome "Custos e Turnos" e uma nova ordem de seções, e a seção de turnos é refeita como gráfico + tabela + detalhe, alimentada por uma série de faturamento médio por hora que o servidor passa a incluir na resposta do painel do Cadastro (já calculada por tipo de dia e protegida por perfil). O resto é tela: gráfico com faixas e alças arrastáveis, tabela, detalhe do turno, sugestão de turnos e o estado sem dados. Nenhuma regra de turnos, validação ou gravação muda.

## For the reader

Chosen: o servidor entrega o faturamento médio por hora (úteis, sábado e domingo) junto com os dados que a tela de Cadastro já pede, e a tela só desenha e deixa arrastar os limites.

Why: a conta fica no servidor, onde já se protege o valor em reais; trocar o tipo de dia na tela é instantâneo, e nenhuma regra de turnos precisa mudar.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API); React 18 + Vite + Tailwind (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova (o gráfico é HTML e CSS, sem biblioteca)

**Storage**: nenhuma mudança (a série é calculada a cada leitura da base ativa)

**Testing**: Vitest (unidade, na API e na tela) e testes de integração da API

**Target Platform**: web (computador e celular)

**Project Type**: web (API + tela)

**Performance Goals**: arrastar uma alça atualiza tabela e detalhe em menos de 1 segundo; a série vem junto da leitura do painel, sem pedido extra

**Constraints**: valores em reais só para o dono; validação, cobertura, mínimo de farmacêutico, modo "Mínimo único do dia" e gravação inalterados; textos existentes inalterados

**Scale/Scope**: 1 função pura nova no servidor, 1 campo novo na resposta do painel, uma seção refeita na tela (5 componentes e 1 módulo de regras puras)

## Constitution Check

- I (Spec Kit): spec aprovada; este plano e as tarefas passam pelo seu OK antes de código. ✔
- II, V (Docker, dados protegidos): nada novo; nenhuma limpeza de dados. ✔
- III (Stack): sem tecnologia nova (sem biblioteca de gráficos). ✔
- IV (Banco só muda por migration): não há mudança de banco. ✔
- VII (Começar pequeno): só a seção de turnos; "Mínimo único do dia" e filtro de período ficam de fora. ✔

Gate aprovado; reavaliado depois do desenho, segue aprovado.

## Project Structure

### Documentation (this feature)

```text
specs/035-custos-e-turnos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── faturamento-por-hora.md
└── tasks.md   # etapa seguinte
```

### Source Code (repository root)

```text
backend/node/src/modules/
├── escala/faturamento-por-hora.ts          # NOVO: série por hora e tipo de dia, a partir da base ativa
├── escala/faturamento-por-hora.test.ts     # NOVO
└── cadastros/painel.ts                     # ler() devolve "faturamentoPorHora" (dono: com valores; demais: só participação)

frontend/react/src/features/cadastro-loja/
├── config.js                               # ABAS: "Custos e Turnos" (id interno "regras" não muda)
├── AbaRegras.jsx                           # nova ordem; Encargos e Convenção juntos; modo padrão "Por turnos"
├── MinimoPessoas.jsx                       # vira a seção "Pessoas por Turnos na Loja" (modo único como hoje)
├── turnos/
│   ├── turnos-grafico.js                   # NOVO, puro: faturamento do turno, alças, sugestão, faixas
│   ├── turnos-grafico.test.js              # NOVO
│   ├── GraficoDeTurnos.jsx                 # NOVO: barras, faixas, alças, teclado
│   ├── TabelaDeTurnos.jsx                  # NOVO: linhas, contadores, faturamento
│   ├── DetalheDoTurno.jsx                  # NOVO: números e mini gráfico
│   └── SemFaturamento.jsx                  # NOVO: caixa do estado sem dados + linha do tempo simples
└── ../../styles/alquimia.css               # tokens novos do gráfico
```

**Structure Decision**: as contas do gráfico (faturamento do turno, pico, mover limite, sugerir) ficam num módulo puro e testado; os componentes só desenham. O servidor entrega a série; nenhuma conta de faturamento é refeita no navegador além de somar horas do turno.

## Design

1. **Servidor.** `faturamentoPorHora(linhas, { dono })` agrupa a base ativa por hora para três tipos de dia (segunda a sexta, sábado, domingo): para cada hora, a média por dia daquele tipo (soma ÷ datas distintas) e a participação no dia. Devolve também o período (início, fim, dias distintos, semanas) e `poucosDias` (menos de 4 semanas). Para quem não é dono, o campo de valor em reais nem existe. Sem base, devolve `temBase: false`. `painel.ler` chama essa função com a base ativa da loja (o mesmo repositório que o Diagnóstico usa).
2. **Tela, seção Turnos.** O título vira "Pessoas por Turnos na Loja"; o seletor "Por turnos | Mínimo único do dia" e todos os textos ficam. Com base: gráfico, alças, barra de ações, tabela e detalhe. Sem base: a caixa tracejada e a linha do tempo simples.
3. **Gráfico.** Uma coluna por hora de funcionamento (a janela da loja que `turnos.js` já calcula); barras relativas ao maior valor do tipo de dia; as 3 maiores em destaque; faixas dos turnos acima. Turnos que se sobrepõem ou viram a noite usam as linhas e os pedaços que `turnos.js` já sabe fazer. Alças só entre turnos consecutivos que se tocam (fim de um = início do próximo).
4. **Arrastar.** Mover uma alça chama uma função pura que muda o fim do turno anterior e o início do seguinte em passos de 1 hora, com mínimo de 1 hora; o resultado passa pelo mesmo `onMudar` que os campos já usam, então validação, cobertura e gravação são as de hoje. Por teclado: Tab foca, setas movem 1 hora, Enter seleciona.
5. **Sugerir turnos.** Função pura que divide o horário da loja em k turnos que carregam partes iguais do faturamento do dia (cada limite cai na hora cheia mais perto de 1/k, 2/k… do total), com k = número de turnos atual (ou 3 se for 1 ou 2, respeitando o máximo). A pré-visualização é estado local (faixas tracejadas); "Aplicar" chama o mesmo `onMudar`; "Descartar" só limpa o estado.
6. **Modo padrão.** Loja sem modo escolhido abre em "Por turnos" com os turnos iniciais de hoje (cópia do mínimo atual); a base do rascunho considera o mesmo ponto de partida, então não aparece "alteração pendente" só por abrir. Quem já guardou um modo mantém o guardado.
7. **Aba e ordem.** O texto da aba muda em `config.js`; "Custos de Salário em Folha" (só dono), "Turnos" e "Encargos e Convenção Coletiva" (encargos só dono + convenção) são movidos sem mudar o que fazem; endereço e atalhos usam o id interno que não muda.
8. **Tokens.** Cores novas viram variáveis no CSS do sistema de design (`--chart-bar`, `--chart-band-border`, `--chart-band-selected`, `--chart-turn-tint-a`, `--chart-turn-tint-b`, `--chart-detail-border`, `--chart-band-text`).
9. **Enviar base.** O botão da caixa usa o envio de base que já existe (o mesmo modal do menu Importar); ao concluir, o painel é recarregado e a tela passa ao estado normal sem perder os turnos do rascunho.

## Complexity Tracking

Nenhuma violação. Risco conhecido: o arrastar e a navegação por teclado são a parte mais delicada da tela; ficam isolados em componentes e em funções puras testadas.
