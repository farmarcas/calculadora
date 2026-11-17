# Implementation Plan: Texto explicativo em cada cenário

**Branch**: `feat/coluna-folha-no-faturamento` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

## Summary

O servidor passa a montar, para cada linha de cenário, uma frase explicativa já separada em trechos (um deles pode vir em negrito), de acordo com o perfil: o dono recebe pesos e reais; gestor e consulta recebem a frase sem números. A tela só desenha esses trechos no lugar da faixa amarela de causa. Sem banco, sem nova conta, sem nova rota.

## For the reader

Chosen: a frase é montada no servidor, na mesma função que já monta as linhas de cenário (`montarLinhas`), e vai num campo novo `explicacao`.

Why: é ali que já se sabe o perfil e onde estão os pesos e os reais; assim gestor e consulta nunca recebem número, e a frase usa exatamente os mesmos valores da coluna Folha.

Chosen: o campo vem em trechos (`texto` e `negrito`), e não como HTML.

Why: a tela escolhe como desenhar o negrito preto, sem risco de texto solto.

Chosen: a frase substitui a faixa amarela de causa nos dois cenários visíveis; a faixa continua para qualquer cenário sem frase.

Why: duas frases juntas competiriam; a nova já contém a causa ("ainda faltariam N h").

## Technical Context

- **Servidor**: `backend/node/src/modules/escala/linhas-cenarios.ts`: nova função pura `explicacaoDaLinha(coluna, status, dono, custo)` e campo `explicacao` em `LinhaDeCenario`. Testes em `linhas-cenarios.test.ts`.
- **Tela**: `frontend/react/src/features/diagnostico/cartao/LinhaDeCenario.jsx` desenha `linha.explicacao`; regra do trecho em negrito em `linha-regras.js`, com testes em `linha-regras.test.js`.
- **Textos**: pt-BR, "Analisar" no lugar de "Personalizar", sem "p.p." nem "pontos".
- **Dados já existentes**: `custoSentido` (todos), `custoPctFaturamento` (dono), `semFarmaceuticoH`, `faltaPorFuncao`, `status`.
- **Testes**: Vitest (unidade e integração da API); Vitest na tela; conferência no navegador em Cosmópolis e Paulínia.

## Regras da frase

| Cenário | Situação | Frase |
|---|---|---|
| Manter, dono, aumenta | cobre tudo | "Para manter todos os seus horários e a venda de hoje, a folha sobe de H% para D% do faturamento (R$ V por mês). Este é o caminho recomendado." |
| Manter, dono, igual | cobre tudo | "…a folha não muda. Este é o caminho recomendado." |
| Manter, dono, diminui | cobre tudo | "…a folha cai de H% para D% do faturamento (R$ V por mês). Este é o caminho recomendado." |
| Manter, gestor/consulta | cobre tudo | "…a folha precisa aumentar" / "não muda" / "diminui" + "Este é o caminho recomendado." |
| Manter, não cobre tudo | falta algo | mesma frase sem "caminho recomendado" + "Ainda faltariam N h de F por semana." |
| Manter, dono sem salários ou faturamento | | "Para manter todos os seus horários e a venda de hoje, é preciso contratar." (sem custo, sem repetir o aviso de dados) |
| Sem contratações, falta função | | "Sem contratar ninguém, você vai precisar fechar a loja em alguns horários. **Mesmo assim, ainda faltariam N h de F por semana.** Entre em Analisar para escolher quais horários fechar." |
| Sem contratações, falta de várias | | o trecho em negrito cita a função com mais horas e acrescenta "e mais N h de outras funções" |
| Sem contratações, resolve | | "Sem contratar ninguém, é possível cobrir tudo fechando em alguns horários. Entre em Analisar para escolher quais." |

Indisponível e Equilíbrio: sem frase.

## Constitution Check

Sem conflito: linguagem simples; reais só para o dono; nenhuma dependência nova; sem mudança de banco; uma decisão técnica registrada acima.

## Project Structure

```text
specs/051-texto-explicativo-cenarios/
├── spec.md · plan.md · research.md · quickstart.md · tasks.md
backend/node/src/modules/escala/linhas-cenarios.ts        # explicacaoDaLinha + campo explicacao
backend/node/src/modules/escala/linhas-cenarios.test.ts
frontend/react/src/features/diagnostico/cartao/LinhaDeCenario.jsx
frontend/react/src/features/diagnostico/cartao/linha-regras.js (+ .test.js)
README.md
```

## Complexity Tracking

Nenhuma violação a justificar.
