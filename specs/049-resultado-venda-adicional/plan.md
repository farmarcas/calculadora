# Implementation Plan: Resultado da venda adicional no Personalizar (com CMV)

**Branch**: `feat/peso-no-faturamento` (junto da spec 048) | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

## Summary

A Simulação já estima a venda das horas novas (`venda-estimada.ts`), já mede em margem quando a base tem CMV (`regua.ts`) e já soma o aumento de folha (`folhaExtra` + hora extra, em `resultado.ts`). Falta juntar isso num **bloco "Resultado do horário estendido"**: venda adicional, CMV, lucro bruto, aumento de folha e resultado, com selo azul "Recomendado" ou vermelho "Não recomendado", mais um modal "Como calculamos". O servidor monta o bloco (só para o dono) dentro de `resultado`, e a tela o desenha. Sem banco.

## For the reader

Chosen: o servidor calcula o bloco `horarioEstendido` dentro do resultado da Simulação, só para o dono.

Why: a venda adicional, o CMV e a folha já estão lá; assim o painel e o modal usam a mesma conta e os outros perfis nem recebem o dado.

Chosen: o CMV usa o CMV% da hora quando a base tem; senão o CMV médio da loja; sem nenhum dos dois, o bloco pede o CMV.

Why: é o que o pedido define.

Chosen: o selo é decidido no servidor (`resultado ≥ 0` → recomendado).

Why: evita regra de negócio duplicada na tela.

## Technical Context

**Language/Version**: Node 22 + TypeScript (servidor); React 18 (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: nenhuma mudança

**Testing**: Vitest (unidade e integração); o caso obrigatório (9.000 − 57,8% − 4.680 = −882) como teste unitário

## Constitution Check

Spec Kit seguido; sem banco, segredo ou autenticação; regra com teste; contrato HTTP preservado (campo novo opcional, só dono).

## Project Structure

```text
backend/node/src/modules/simulacoes/
├── resultado-horario-estendido.ts        # novo: função pura (venda, CMV, lucro bruto, resultado, selo, origem do CMV)
├── resultado-horario-estendido.test.ts   # o caso obrigatório e as bordas
└── resultado.ts                          # monta `horarioEstendido` para o dono
frontend/react/src/features/simulacao/
├── BlocoHorarioEstendido.jsx             # novo: o bloco e o selo
├── ModalComoCalculamos.jsx               # novo: a conta aberta
└── PainelResultado.jsx                   # mostra o bloco
```
