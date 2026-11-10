# Implementation Plan: Margem nos cenários e na Simulação

**Branch**: `feat/margem-nos-cenarios` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/033-margem-nos-cenarios/spec.md`

## Summary

Todos os cálculos de perda e ganho de horários (Cenários 1, 2 e 3, cenário sugerido, Simulação, lista e comparação) saem hoje de uma única tabela de venda por dia e hora. O plano é escolher, por loja, uma **régua** (margem ou venda) e alimentar essa mesma tabela com ela; as contas em si não mudam. O servidor devolve junto qual régua usou, e a tela troca os rótulos "venda" por "margem" conforme essa informação. Sem migration, sem mudança em dado guardado.

## For the reader

Chosen: o servidor escolhe, por loja, se mede em margem ou em venda, e usa a mesma escolha em todos os cálculos de perda e ganho.

Why: a margem já está guardada hora a hora; trocar só a medida, sem reescrever as contas, mantém todos os cenários e a Simulação comparáveis e deixa o risco de errar pequeno.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API); React 18 + Vite + Tailwind (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança (a margem já é guardada em `vendas_hora.margem`; o saldo nunca é guardado)

**Testing**: Vitest (unidade e tela) e testes de integração da API

**Target Platform**: web (computador e celular)

**Project Type**: web (API + tela)

**Performance Goals**: sem mudança; a escolha da régua é uma passada pelas linhas da base, já lida hoje

**Constraints**: margem em reais só para o dono; base sem margem continua idêntica a hoje; nenhum número de custo muda

**Scale/Scope**: 1 função nova de régua, ajustes nos cálculos dos cenários e da Simulação para recebê-la, e troca de rótulos em ~6 arquivos da tela

## Constitution Check

- I (Spec Kit): spec aprovada; plano e tarefas passam pelo seu OK antes de código. ✔
- II, V (Docker, dados protegidos): nada novo; nenhum comando destrutivo. ✔
- III (Stack): sem tecnologia nova. ✔
- IV (Banco só muda por migration): não há mudança de banco. ✔
- VII (Começar pequeno): troca só a medida; unidades, tickets e margem em % ficam fora. ✔

Gate aprovado; reavaliado depois do desenho, segue aprovado.

## Project Structure

### Documentation (this feature)

```text
specs/033-margem-nos-cenarios/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── regua-nos-calculos.md
└── tasks.md   # etapa seguinte
```

### Source Code (repository root)

```text
backend/node/src/modules/escala/
├── regua.ts                       # NOVO: escolher a régua da base e aplicá-la às linhas
├── regua.test.ts                  # NOVO
├── cenarios.ts                    # usa a régua na tabela de perda/ganho; textos e campos dizem a régua
├── comparativo.ts                 # idem nos cartões e no sugerido
└── diagnostico.ts                 # escolhe a régua uma vez e a entrega aos cenários

backend/node/src/modules/simulacoes/
├── resultado.ts                   # perda, ganho e saldo na régua; venda e ticket médio seguem como informação
├── simulacoes.service.ts          # escolhe a régua uma vez por loja e a passa ao resultado
└── comparar.ts / resumo           # lista e comparação trazem a régua junto do saldo

frontend/react/src/features/
├── diagnostico/cartao/cartao-regras.js, comparativo-regras.js     # rótulos por régua
├── simulacao/PainelResultado.jsx                                   # rótulos e fórmula por régua
└── grade/comparacao.js, ComparacaoDeSimulacoes.jsx, ListaDeSimulacoes.jsx   # idem
```

**Structure Decision**: uma função pura (`regua.ts`) decide e converte; os cálculos continuam os mesmos e só recebem outra tabela. O faturamento de referência (peso do impacto) usa sempre a venda real.

## Design

1. **Escolher a régua (`regua.ts`).** `reguaDaBase(linhas)` devolve `{ tipo: 'margem' | 'venda', motivo }`. Usa margem só se: a soma da margem é maior que zero; as linhas com margem positiva cobrem pelo menos 90% das linhas com venda; e nenhuma linha tem margem maior que a venda. Caso contrário usa venda, com o motivo em texto (sem margem, margem parcial ou margem incoerente). `linhasNaRegua(linhas, tipo)` devolve as mesmas linhas com o campo `venda` trocado pela margem quando a régua é margem.
2. **Cenários.** O Diagnóstico escolhe a régua uma vez e passa aos cenários as linhas já na régua para montar a tabela de perda e ganho; o faturamento de referência continua lendo as linhas originais. Os textos dos cartões, os campos de perda e ganho e o saldo da operação passam a trazer `regua`. O cenário sugerido compara impactos na mesma régua, com as mesmas salvaguardas.
3. **Simulação.** O resultado recebe a régua, monta a venda que sai e a venda estimada das horas novas com as linhas na régua, e calcula o saldo como hoje. Venda por hora, clientes e ticket médio seguem com os dados reais, como informação. O peso no faturamento usa a venda real.
4. **Lista e comparação.** Como já usam o mesmo cálculo do painel, recebem o saldo na mesma régua e levam `regua` junto.
5. **Tela.** Uma função pequena devolve a palavra ("margem" ou "venda") e um texto de apoio; cartões, painel, lista e comparação trocam rótulos e fórmula por ela. Quando a régua é venda por causa de um motivo (por exemplo, margem incoerente), um aviso curto diz qual.
6. **Nomes.** Os campos que hoje se chamam "venda..." continuam com os mesmos nomes na resposta e passam a carregar margem quando `regua` é margem; `regua` diz como ler. Isso evita quebrar quem já consome a API e as telas.

## Complexity Tracking

Nenhuma violação a justificar. Risco conhecido: nomes de campo "venda…" que carregam margem; mitigado pelo campo `regua` explícito e pelo contrato escrito.
