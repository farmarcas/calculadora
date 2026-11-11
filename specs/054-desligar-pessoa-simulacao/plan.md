# Implementation Plan: Desligar pessoa na simulação

**Branch**: `feat/coluna-folha-no-faturamento` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

## Summary

O servidor já aceita a lista de desligados ao salvar a simulação (`desligados` no PUT), tira essas pessoas do cálculo e guarda a marca no quadro da simulação; os turnos ficam guardados, então religar devolve tudo. Falta a tela: o botão **Desligar** em cada funcionário existente (grade do dia, semana e celular), a faixa **Desligados na simulação (N)** com **Religar**, e testes que provam o ciclo desligar → religar. Quase todo o trabalho é de tela, com um teste de ponta a ponta no servidor para travar o comportamento. Sem banco e sem rota nova.

## For the reader

Chosen: a tela manda sempre a lista completa de desligados (a de agora mais ou menos uma pessoa) no mesmo salvamento que as outras edições já usam.

Why: é o jeito que o servidor aceita hoje; reaproveita o recálculo, a trava de simulação gravada e o registro de auditoria que já existem.

Chosen: o botão fica na linha da pessoa nas três visões da escala (dia, semana e celular), e a faixa de desligados aparece uma vez, acima delas.

Why: a pessoa já mexe na equipe ali, e a faixa não se repete em cada visão.

Chosen: a faixa também aparece (sem os botões) em simulação gravada e para o perfil de consulta.

Why: quem lê a simulação precisa saber quem estava fora do quadro para entender os números.

## Technical Context

- **Servidor**: já pronto (`simulacoes.service.ts` → `aplicarVagasEDesligados` em `vagas.ts`; `avaliar.ts` ignora desligados; `resultado.ts` conta "hoje" com o quadro inteiro, spec 052). Falta só teste de integração do ciclo desligar/religar (mesmo resultado e mesma grade ao religar; gestor sem valores em reais; simulação gravada recusa).
- **Tela** (`frontend/react/src/features/simulacao/escala/`):
  - `EscalaPorHora.jsx`: `desligar(matricula)` e `religar(matricula)` que chamam `onSalvar({ desligados })`, montados a partir de `sim.quadro`.
  - `LinhaDaPessoa.jsx`, `LinhaDaSemana.jsx`, `EscalaMobile.jsx`: botão "Desligar" só em funcionário existente (nunca em vaga), só com `editavel`, com rótulo "Desligar {nome}".
  - Novo `FaixaDeDesligados.jsx` e regras em `desligados-regras.js` (lista, texto "Desligados na simulação (N)", rótulo de leitor de tela).
- **Textos**: pt-BR simples, sem "p.p." nem "pontos".
- **Testes**: Vitest da tela (`desligados-regras.test.js`), integração da API, conferência no navegador em Cosmópolis (desligar 1 atendente; desligar o único farmacêutico; religar).

## Constitution Check

Sem conflito: linguagem simples; valores em reais só para o dono (nada novo sai do servidor); nenhuma dependência nova; sem mudança de banco.

## Project Structure

```text
specs/054-desligar-pessoa-simulacao/  spec · plan · research · quickstart · tasks
frontend/react/src/features/simulacao/escala/
  EscalaPorHora.jsx · LinhaDaPessoa.jsx · LinhaDaSemana.jsx · EscalaMobile.jsx   # botão Desligar
  FaixaDeDesligados.jsx · desligados-regras.js (+ .test.js)                       # faixa e regras
backend/node/src/modules/simulacoes/simulacoes.routes.integration.test.ts        # ciclo desligar/religar
README.md
```

## Complexity Tracking

Nenhuma violação a justificar.
