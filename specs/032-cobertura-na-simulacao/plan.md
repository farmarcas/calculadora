# Implementation Plan: Cobertura e vendas por hora dentro da Simulação

**Branch**: `feat/simulacao-cobertura-por-hora` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/032-cobertura-na-simulacao/spec.md`

## Summary

A Simulação passa a mostrar a grade "Cobertura e vendas" do Diagnóstico, calculada com o horário simulado e o quadro simulado. O servidor já tem a conta pura da cobertura (`escala/cobertura.ts`) e a Simulação já guarda turnos, quadro e horário; falta chamar a mesma conta com os dados da simulação, devolvê-la no detalhe e desenhá-la na tela reaproveitando o montador e a grade do Diagnóstico. Sem migration, sem nova tabela e sem mudança em nenhum número existente.

## For the reader

Chosen: reaproveitar a conta e o desenho da cobertura que já existem no Diagnóstico, alimentando-os com o horário e o quadro da simulação.

Why: as duas telas passam a dizer exatamente a mesma coisa, o risco de errar é pequeno e nenhum número da Simulação muda.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API); React 18 + Vite + Tailwind (tela)

**Primary Dependencies**: as que o projeto já usa (Express, Zod, Vitest); nenhuma nova

**Storage**: nenhuma mudança (a cobertura é calculada a cada leitura, não é guardada)

**Testing**: Vitest (unidade, na API e na tela) e testes de integração da API (`npm run test:integration`)

**Target Platform**: web (computador e celular de 375 px)

**Project Type**: web (API + tela)

**Performance Goals**: a grade acompanha a mudança do horário, do quadro ou das vagas em até 2 segundos (o detalhe já é recalculado a cada salvamento)

**Constraints**: valores em reais só para o dono; nenhum número existente muda; grade usável no celular sem rolagem lateral da página

**Scale/Scope**: 1 seção nova na tela da Simulação, 1 campo novo no detalhe da simulação, 1 função pura nova no servidor

## Constitution Check

- I (Spec Kit): spec aprovada; este plano e as tarefas passam pela sua aprovação antes de qualquer código. ✔
- II (Docker) e V (dados protegidos): nada novo; nenhum comando destrutivo. ✔
- III (Stack): sem tecnologia nova. ✔
- IV (Banco só muda por migration): não há mudança de banco. ✔
- VII (Começar pequeno): uma seção, só leitura; editar turnos, escolher o dia e distribuir vagas ficam de fora. ✔

Resultado do gate: aprovado, sem violações. Reavaliado depois do desenho: mantém-se aprovado.

## Project Structure

### Documentation (this feature)

```text
specs/032-cobertura-na-simulacao/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cobertura-no-detalhe.md
└── tasks.md   # etapa seguinte
```

### Source Code (repository root)

```text
backend/node/src/modules/simulacoes/
├── cobertura-simulacao.ts          # NOVO: função pura que monta a cobertura da simulação
├── cobertura-simulacao.test.ts     # NOVO
├── simulacoes.service.ts           # detalhe() devolve o campo "cobertura"
└── simulacoes.routes.integration.test.ts   # casos novos (dono x gestor, desligado, vaga sem turnos, horário reduzido)

frontend/react/src/features/
├── simulacao/
│   ├── CoberturaDaSimulacao.jsx    # NOVO: seção (observação, grade, avisos)
│   └── SimulacaoPage.jsx           # encaixa a seção abaixo do passo 1
└── diagnostico/onde-vem/
    ├── montar.js                   # montarCobertura passa a aceitar o formato da simulação (sem regra nova)
    └── GradeCobertura.jsx          # reaproveitada como está
```

**Structure Decision**: a conta fica no servidor (uma só, como em todo o produto) e a tela só desenha. O montador e a grade do Diagnóstico são reaproveitados para as duas telas dizerem a mesma coisa.

## Design

1. **Servidor.** `coberturaDaSimulacao` recebe os dias abertos simulados, os turnos e o quadro da simulação, os mínimos, a base de vendas e se quem pede é o dono. Ela:
   - tira do cálculo quem foi desligado e transforma cada turno de pessoa/vaga em um turno de função (vaga conta se tiver turnos);
   - chama a `cobertura()` que o Diagnóstico já usa;
   - resume as vendas por hora com `resumirVendas` e, para quem não é dono, remove os reais com `semValorPorHora` (a mesma função que o Diagnóstico usa; hoje ela é privada em `escala/diagnostico.ts` e passa a ser exportada, sem mudar o que faz);
   - devolve também as vagas sem turnos (quantidade) e o horário simulado, para o aviso de "vendas fora do horário".
2. **Detalhe.** `detalhe()` chama a função com o horário e o quadro da simulação (rascunho: o da tela; gravada: o congelado) e a base de vendas atual da loja, e devolve o resultado no campo `cobertura`. A lista e a comparação não recebem esse campo.
3. **Tela.** `CoberturaDaSimulacao` monta os dados com `montarCobertura` e desenha a observação do pico, a grade e os avisos (vendas fora do horário simulado, vagas sem horário). Os atalhos para o Cadastro do Diagnóstico não aparecem aqui.
4. **Atualização.** O detalhe já volta inteiro a cada salvamento; a grade se atualiza junto, sem trabalho extra.
5. **Celular.** A grade rola dentro do próprio quadro, com a coluna de função fixa, como já faz no Diagnóstico.

## Complexity Tracking

Nenhuma violação a justificar.
