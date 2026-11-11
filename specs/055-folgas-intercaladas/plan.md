# Implementation Plan: Folgas sugeridas mais intercaladas

**Branch**: `feat/coluna-folha-no-faturamento` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

## Summary

Só muda **como o dia da folga é escolhido** para quem ainda tem folgas a receber (depois do rodízio de domingo, que não muda). A escolha continua começando pela **cobertura** (menos falta nova) e passa a desempatar por **afastamento da própria pessoa** (distância até as outras folgas dela, contando domingo e segunda como vizinhos), depois por **espalhar a equipe** (menos folgas da função naquele dia) e, por fim, por um **desempate rotativo** em vez de "o menor dia". Quando o dia escolhido ainda fica colado a outra folga da pessoa, a sugestão avisa com o nome dela. A mesma regra vale no servidor e na tela, com os mesmos testes.

## For the reader

Chosen: a cobertura continua sendo o primeiro critério; o afastamento e o espalhamento só decidem entre dias que abrem a mesma falta nova.

Why: foi a prioridade que você escolheu; assim a sugestão nunca fica pior em cobertura do que a de hoje.

Chosen: a "distância" entre folgas conta a volta da semana (domingo e segunda são vizinhos) e vale até 3 dias.

Why: quem folga domingo e segunda descansa dois dias colados na prática; mais de 3 dias de distância não melhora nada.

Chosen: o desempate final é rotativo por posição da pessoa na função, não sorteio.

Why: o resultado é sempre o mesmo para a mesma entrada, e as pessoas deixam de folgar todas nos mesmos primeiros dias.

Chosen: o aviso "Fulana: não deu para afastar as folgas sem faltar gente." usa o nome da pessoa; o servidor passa a receber o nome junto do horário.

Why: o aviso só ajuda se disser de quem é.

## Technical Context

- **Servidor**: `backend/node/src/modules/escala/semana-com-folgas.ts` → `aplicarFolgas` (o laço "As demais folgas"); `HorarioPessoa` ganha `nome?`; quem monta os horários (`simulacoes.service.ts`, `capacidade.ts`) passa o nome quando tem.
- **Tela**: `frontend/react/src/features/simulacao/escala/folgas-regras.js` → `sugerirFolgas`, mesma regra e mesmos avisos.
- **Critérios, em ordem** (menor é melhor): (1) falta nova de cobertura; (2) proximidade às outras folgas da mesma pessoa (`3 − min(distância circular, 3)`; as folgas que a pessoa já tem no Cadastro contam); (3) folgas da função naquele dia; (4) menor sobra de cobertura perdida (maior sobra primeiro, como hoje); (5) desempate rotativo `(dia − posição da pessoa) mod 7`.
- **Aviso**: depois de escolher, se a pessoa terminou com alguma folga nova vizinha de outra folga dela, entra "Nome: não deu para afastar as folgas sem faltar gente." (uma vez por pessoa).
- **Regras mantidas**: limite de dias da regra, rodízio de domingo (1 em 3), 11 h de descanso (já tratadas depois, em `ajustarJornada`/`esticarTurnos`), ordem das pessoas (quem tem mais folgas a receber primeiro, estável).
- **Testes**: Vitest dos dois lados com os mesmos casos (5 atendentes, 2 folgas cada, regra de 40h trabalhando 7 dias): sem folgas seguidas, folgas em pelo menos 5 dias diferentes, cobertura nunca pior que a de hoje, mesma entrada mesma saída, aviso com nome quando não dá, domingo e segunda como vizinhos, função de uma pessoa só.

## Constitution Check

Sem conflito: linguagem simples; nenhuma dependência nova; sem mudança de banco; só a Simulação muda.

## Project Structure

```text
specs/055-folgas-intercaladas/  spec · plan · research · quickstart · tasks
backend/node/src/modules/escala/semana-com-folgas.ts (+ .test.ts)       # critério novo + aviso com nome
backend/node/src/modules/simulacoes/simulacoes.service.ts                # passa o nome ao horário
frontend/react/src/features/simulacao/escala/folgas-regras.js (+ .test.js)
README.md
```

## Complexity Tracking

Nenhuma violação a justificar.
