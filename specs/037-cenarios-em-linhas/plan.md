# Implementation Plan: Cenários em linhas, sem valores em reais

**Branch**: `feat/cenarios-em-linhas` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/037-cenarios-em-linhas/spec.md`

## Summary

Os três cartões de cenário viram uma lista de linhas. O servidor passa a devolver, para todos os perfis, um bloco `linhas` com o que cada linha precisa (status, causa, contratar, horário por dia, variação de venda e de custo em %), sem nenhum valor em reais. A tela troca o cartão por uma linha e remove os componentes antigos. O cálculo dos cenários não muda.

## For the reader

Chosen: o servidor entrega as linhas prontas, só com porcentagens, horas e textos, iguais para dono, gestor e consulta.

Why: hoje o gestor não recebe venda nem custo (para esconder os reais), então não teria as variações em %; calcular lá e devolver só % resolve sem abrir nenhum valor.

Chosen: status e causa de cada linha são decididos no servidor, na ordem de prioridade combinada.

Why: os três perfis veem sempre o mesmo status, e a tela fica só desenhando.

Chosen: o botão Personalizar e os cenários salvos ficam como estão.

Why: o pedido é só de apresentação; não vamos arriscar o que já funciona.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API); React 18 + Vite + Tailwind (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança

**Testing**: Vitest (unidade e tela) e testes de integração da API (por perfil)

**Target Platform**: web (computador e celular)

**Project Type**: web (API + tela)

**Performance Goals**: sem mudança perceptível; o cálculo dos cenários para as linhas roda mais uma vez para gestor e consulta

**Constraints**: nenhum valor em reais nem salário na resposta das linhas; linhas iguais para os três perfis; o restante da resposta e da tela não muda

**Scale/Scope**: 1 módulo novo no servidor, 1 campo novo na resposta, uma tabela de linhas e regras puras na tela, remoção de 4 componentes antigos

## Constitution Check

- I (Spec Kit): spec aprovada; plano e tarefas passam pelo seu OK antes de código. ✔
- II, V (Docker, dados protegidos): nada novo; nenhum comando destrutivo. ✔
- III (Stack): sem tecnologia nova. ✔
- IV (Banco só muda por migration): não há mudança de banco. ✔
- VII (Começar pequeno): só apresentação; nenhum cálculo muda. ✔

Gate aprovado; reavaliado depois do desenho, segue aprovado.

## Project Structure

### Documentation (this feature)

```text
specs/037-cenarios-em-linhas/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── linhas-de-cenarios.md
└── tasks.md   # etapa seguinte
```

### Source Code (repository root)

```text
backend/node/src/modules/escala/
├── linhas-cenarios.ts            # NOVO: status, causa, variações em %, indisponível (puro)
├── linhas-cenarios.test.ts       # NOVO
├── diagnostico.ts                # monta `linhas` para qualquer perfil (cálculo com custos, só % na saída)
└── escala.routes.integration.test.ts   # linhas iguais nos três perfis, sem reais

frontend/react/src/
├── features/diagnostico/
│   ├── Comparativo.jsx           # troca a grade de cartões pela tabela de linhas; Personalizar igual
│   ├── cartao/linha-regras.js(+test)   # NOVO: textos, %, faixa dos 7 dias, pills (puro)
│   ├── cartao/LinhaDeCenario.jsx # NOVO
│   ├── cartao/FaixaDosDias.jsx   # NOVO
│   ├── cartao/PillDeStatus.jsx   # NOVO
│   └── (removidos) cartao/CartaoCenario.jsx, FaixaDeResultado.jsx, BlocoHorario.jsx, BlocoContratacoes.jsx, PainelDias.jsx e as regras que só eles usavam
└── styles/alquimia.css           # tokens novos (texto de sucesso, rosa de redução), se faltarem
```

**Structure Decision**: a decisão fica numa função pura no servidor (testável sem banco); a tela recebe a linha pronta e só desenha. O `comparativo` atual segue intacto para a Simulação e os cenários salvos.

## Design

1. **Linhas no servidor.** `montarLinhas(entradaComCustos, cenarios)` devolve três itens na ordem Equilíbrio, Manter horários, Sem contratações. Roda com os custos da loja para qualquer perfil e devolve só porcentagens, horas, textos e o que o Personalizar precisa.
2. **Status.** Primeiro que se aplica: Inviável, Não resolve sozinho, Não recomendado, Vende mais, Perde venda, Equipe menor que hoje, Cobre o horário. Equilíbrio indisponível não tem status.
3. **Causa.** Uma só frase por linha, a primeira que se aplica na ordem: Faltam X h de farmacêutico (Não resolve sozinho), Sem farmacêutico no quadro (Inviável), Só cabe fechando um dos 3 melhores dias (Não recomendado), "<Função>: N pessoa(s) a menos que hoje" (Equipe menor que hoje), Sem venda por hora: perda não estimada, Venda das horas novas é estimada.
4. **Variações.** Venda = (ganho estimado − perda) ÷ faturamento mensal real; custo de pessoal = custo adicional ÷ folha atual. Uma casa decimal; sem venda por hora → `nao_estimada`; sem salários → `sem_salarios`.
5. **Igual a.** Equilíbrio que coincide com outro cenário leva o subtítulo e repete as colunas dele.
6. **Resposta.** `cenarios.r42.linhas` e `cenarios.r40.linhas`; o resto fica como está (inclusive o `comparativo` e o selo de sugerido só para o dono).
7. **Tela.** `Comparativo.jsx` desenha uma linha por item: selo, nome, pill; Contratar; Horário com total, mudança em horas e a faixa dos 7 dias (sempre as horas); Venda e Custo de pessoal em % com seta e sinal; faixa amarela de causa; botão. Estados visuais: sugerida, alternativa, rebaixada, indisponível. Em tela estreita a linha empilha.
8. **Tokens.** Texto verde de sucesso e rosa de redução usam o token mais próximo do Design System ou um token novo no CSS.
9. **Limpeza.** Remove os componentes e as regras do cartão que ficam sem uso, e atualiza os testes.

## Complexity Tracking

Nenhuma violação a justificar. Risco: o servidor passa a calcular as linhas com os custos também para gestor e consulta; mitigado por teste que garante que a resposta dessas linhas não tem nenhum campo em reais nem salário.
