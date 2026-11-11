# Implementation Plan: Esticar os turnos até o limite da regra

**Branch**: `feat/esticar-turnos-ao-limite` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/046-esticar-turnos-ao-limite/spec.md`

## Summary

Um passo novo na conta da semana com folgas (spec 043): depois de aplicar as folgas e cortar o que passa do limite, **esticar os turnos de quem trabalha menos que o limite, só onde falta cobertura**. O passo é uma função pura no servidor, usada pela conta real dos cenários e pelo "Personalizar", e é repetida na tela para o botão e para o recálculo ao arrastar. Cada turno esticado guarda o horário de antes para a tela marcar "ajustado". Sem mudança de banco (os turnos já são um campo de dados livre), mas com um campo opcional novo no contrato do turno.

## For the reader

Chosen: o esticamento entra na mesma função que já aplica as folgas e mede a cobertura (`semanaComFolgas`), na ordem folgas → esticamento → contratações.

Why: a conta de cobertura e de contratação já está lá; assim o cartão do cenário e a Simulação continuam sendo a mesma conta.

Chosen: só se estica onde a função tem falta, e no máximo até o limite da pessoa (o menor entre a carga contratada e o teto da regra).

Why: não mexe no horário de quem não precisa e nunca passa da jornada.

Chosen: o turno esticado leva `antes` (entrada e saída do Cadastro) como campo opcional; a tela compara e mostra "ajustado".

Why: a tela não tem o horário do Cadastro para comparar, e guardar o "antes" no próprio turno evita uma chamada nova.

Chosen: quem tem horário fixo no Cadastro não é esticado.

Why: o Cadastro já diz que o horário dessa pessoa não muda.

## Technical Context

**Language/Version**: Node 22 + TypeScript (servidor); React 18 (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma migration; os turnos da Simulação são JSON e ganham o campo opcional `antes`

**Testing**: Vitest (unidade e integração), conferência no navegador

**Target Platform**: web + API

**Project Type**: web (backend + frontend)

**Performance Goals**: a conta dos cenários continua em menos de 1 segundo

**Constraints**: Cadastro intacto; nunca passar do limite da pessoa nem do máximo por dia; horário fixo e vagas fora; o esticamento nunca aumenta contratação

**Scale/Scope**: até ~20 pessoas por loja, 7 dias

## Constitution Check

- Spec Kit seguido: sim.
- Sem migration, segredo ou autenticação: sim.
- Regra de negócio com teste unitário: sim; a função é pura.
- Contrato HTTP preservado: sim; só ganha um campo opcional no turno.

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/046-esticar-turnos-ao-limite/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/turno-esticado.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/node/src/modules/
├── escala/semana-com-folgas.ts          # novo passo `esticarTurnos`; `semanaComFolgas` o chama entre as folgas e as contratações; HorarioPessoa ganha `fixo`
├── escala/escala.service.ts             # passa quem tem horário fixo aos horários dos cenários
├── simulacoes/{avaliar,simulacoes.schemas,simulacoes.service}.ts   # TurnoSim e schema com `antes` opcional; criar usa a equipe esticada
frontend/react/src/features/simulacao/escala/
├── folgas-regras.js                     # `esticarTurnos` na tela e uso em "Sugerir folgas"/"Desfazer"
├── LinhaDaPessoa.jsx                    # marca "ajustado" e dica
└── EscalaMobile.jsx / LinhaDaSemana.jsx # total e marca
```

**Structure Decision**: o passo novo mora ao lado das folgas; a tela repete a função (não há código compartilhado entre os dois lados) e os testes dos dois lados usam os mesmos casos.

## Complexity Tracking

Nenhuma violação a justificar.
