# Implementation Plan: Escala por hora com turnos sugeridos e arrastar mais fácil

**Branch**: `feat/escala-turnos-sugeridos` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/040-escala-turnos-sugeridos/spec.md`

## Summary

Duas melhorias na Escala por hora (spec 039): as contratações passam a ter turnos sugeridos já com a necessidade de cobertura (ao Personalizar, no botão "Sugerir turno" e como prévia na grade enquanto se contrata), e o ajuste dos turnos fica mais fácil (alças maiores, horário durante o gesto, criar e tirar turno, erro e avisos junto da escala). É tudo na tela, com funções puras testadas; o servidor não muda.

## For the reader

Chosen: a sugestão de turnos é calculada na tela, com a mesma conta do formulário de contratação.

Why: a tela já tem a cobertura por hora e o mínimo de cada hora; não precisa de regra nova no servidor.

Chosen: ao Personalizar, as vagas do cenário são gravadas primeiro e os turnos delas logo depois.

Why: os turnos dependem do horário do cenário e das vagas já estarem na simulação.

Chosen: o formulário "+ Contratar" passa a ser controlado pela seção, e a barra de prévia nasce do mesmo estado.

Why: assim arrastar a barra e mexer nos campos nunca divergem.

## Technical Context

**Language/Version**: React 18 + Vite + Tailwind (tela); servidor sem mudança

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança

**Testing**: Vitest (funções puras da tela); conferência no navegador

**Target Platform**: web (computador e celular)

**Project Type**: web (só tela)

**Performance Goals**: a prévia e a cobertura respondem em menos de 1 segundo

**Constraints**: nada gravado no Cadastro; permissões iguais às de hoje; avisos de regra não bloqueiam

**Scale/Scope**: funções novas em `escala-regras.js`, ajustes em 4 componentes da escala e no Personalizar

## Constitution Check

- I (Spec Kit): spec aprovada; plano e tarefas passam pelo seu OK antes de código. ✔
- II, V (Docker, dados protegidos): nada novo; nenhum comando destrutivo. ✔
- III (Stack): sem tecnologia nova. ✔
- IV (Banco só muda por migration): não há mudança de banco. ✔
- VII (Começar pequeno): reaproveita a cobertura, as vagas e a gravação de turnos que já existem. ✔

Gate aprovado; reavaliado depois do desenho, segue aprovado.

## Project Structure

### Documentation (this feature)

```text
specs/040-escala-turnos-sugeridos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md   # etapa seguinte
```

(Sem `contracts/`: nenhuma API muda.)

### Source Code (repository root)

```text
frontend/react/src/features/
├── simulacao/escala/
│   ├── escala-regras.js(+test)      # turnosParaVaga, sugerirTurnosDasVagas, turnoHabitual, novoTurnoNaFolga, avisosDaPessoa
│   ├── EscalaPorHora.jsx            # sugerir turno, criar e tirar turno, rascunho da contratação, prévia, erro e avisos na faixa de contexto
│   ├── FormularioContratar.jsx      # passa a ser controlado (valor + onMudar)
│   ├── LinhaDaPessoa.jsx            # alças maiores, "Folga" clicável, "Sugerir turno", barra de prévia
│   └── LinhaDaFuncao.jsx            # (sem mudança de contrato)
├── diagnostico/Comparativo.jsx      # Personalizar grava os turnos sugeridos das vagas
└── simulacao/SimulacaoPage.jsx      # entrega o erro à seção
```

**Structure Decision**: a decisão fica em funções puras (testáveis sem tela); os componentes só desenham e chamam a gravação que já usam.

## Design

1. **Turnos de uma vaga.** `turnosParaVaga({ cargaH, coberturaPorDia, abas, regra })` escolhe o número de dias (parcial: o menor com até 6 h por dia; integral: o da regra), a janela que cobre mais horas sem cobertura da função e os dias que mais ganham com ela; devolve os turnos (com intervalo acima de 6 h) e as horas por dia arredondadas para cima de 15 em 15 minutos.
2. **Várias vagas.** `sugerirTurnosDasVagas({ quadro, turnos, cobertura, abas, regra })` percorre as vagas sem turno, recalcula a cobertura da função com os turnos já postos e coloca a próxima.
3. **Personalizar.** Depois de gravar vagas e horário do cenário, calcula os turnos sobre a simulação devolvida e os grava; se não houver turnos a colocar, não faz a segunda chamada.
4. **Sugerir turno.** Botão na linha da contratação sem turno (só quem edita): calcula e grava os turnos dela.
5. **Rascunho da contratação.** O estado do formulário sobe para a seção. A grade desenha a barra de prévia na linha "Turno sugerido" da função e marca as horas reforçadas; arrastar ou redimensionar a barra muda Entra e Sai; Cancelar apaga o rascunho.
6. **Arrastar.** Alças de 12 px com marca visível; horário novo na barra durante o gesto (já existe) com destaque; teclado como hoje.
7. **Folga e tirar do dia.** "Folga" clicável cria o turno com `turnoHabitual` (ou abertura + jornada diária da regra); "Tirar do dia" na faixa de contexto remove o turno selecionado. Ambos gravam `turnos`.
8. **Erro e avisos.** A seção mostra o erro do hook depois de uma gravação de turno e a faixa de contexto lista os avisos da pessoa selecionada.
9. **Permissões.** Tudo isso só aparece quando `editavel`; o resto continua como hoje.

## Complexity Tracking

Nenhuma violação a justificar. Risco: a janela única para todos os dias pode não cobrir faltas em horários muito diferentes de dia para dia; mitigado porque a sugestão cobre o máximo possível e a faixa amarela mostra o que sobrou.
