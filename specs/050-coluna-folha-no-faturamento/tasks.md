# Tasks: Coluna "Folha no faturamento" dos cenários (layout A3)

Servidor: `backend/node/src/modules/escala`. Tela: `frontend/react/src`.

## Phase 1: Servidor

- [x] T001 Em `linhas-cenarios.ts`, `aumentoPp` = `round1(depois) − round1(hoje)` (com `semZeroNegativo`); `hoje` e `depois` continuam arredondados a uma casa.
- [x] T002 Em `linhas-cenarios.test.ts`: Cosmópolis (8,0 → 9,7, `aumentoPp` 1,7, R$ 7.659), Paulínia (10,3 → 14,7, 4,4, R$ 11.112), reduz equipe (8,0 → 7,4, −0,6, R$ −2.340) e um caso em que a diferença sem arredondar daria outro valor (por exemplo 8,04 → 9,66: mostra 8,0, 9,7 e 1,7).

## Phase 2: Regras de texto (puras)

- [x] T003 Em `cartao/linha-regras.js`, `textoDaFolha(linha, dono)`: dono → `{ estado, peso: "9,7%", hoje: "hoje 8,0%", chip: { texto: "+1,7%", tom }, reais: "R$ 7.659 a mais por mês", ariaLabel }`; estados `aumenta` (âmbar), `diminui` (verde, sinal "−" U+2212, "a menos por mês") e `igual` (neutro com borda, "folha igual", linha de baixo "Sobe só porque a venda cai." quando o peso sobe, senão vazia); sem "p.p." nem "pontos"; gestor e consulta → só `{ chip: "Aumenta" | "Igual" | "Diminui", ariaLabel }`; sem salários: "Informe os salários para ver o custo de pessoal."; sem faturamento: "Informe o faturamento para ver o peso da folha."; gestor e consulta com falta: "Dados do custo ainda não informados.".
- [x] T004 Testes em `linha-regras.test.js`: os sete casos do pedido (Cosmópolis Manter e Sem contratações, reduz equipe, Paulínia, gestor nos três estados, as duas frases de falta, a frase do gestor), que o chip bate com a diferença dos pesos exibidos e que nenhum texto do gestor tem número.

## Phase 3: Tela

- [x] T005 Tokens em `styles/alquimia.css`: `--chip-aumenta-fundo/texto`, `--chip-diminui-fundo/texto` (âmbar `#B45F00`, verde `#3E7500`, fundos claros com contraste AA) e a borda do chip neutro.
- [x] T006 Criar `cartao/CelulaFolha.jsx`: à esquerda o peso em 20 px negrito com "do faturamento" embaixo (12 px); à direita, empilhados, "hoje 8,0%" (12 px) e o chip com `aria-label`; última linha em 12 px com os reais ou o texto de "folha igual"; frases de falta em 13 px secundário no lugar de tudo; gestor e consulta só com o chip.
- [x] T007 Em `cartao/LinhaDeCenario.jsx`, usar `CelulaFolha` no lugar de `Peso`; remover o código antigo de `textoDoPeso` se nada mais usar.
- [x] T008 Em `index.css`, a grade nova: `minmax(0,200px) minmax(0,1fr) minmax(0,1.25fr) 84px 200px 120px`, gap 16px, altura da linha pelo Horário, `align-items: start`; em `Comparativo.jsx`, o cabeçalho "Folha no faturamento" (dono) ou "Custo de pessoal" (gestor e consulta) e o texto de abertura novo (com o nome da regra), sem a regra dos 50%.

## Phase 4: Fechamento

- [x] T009 Rodar toda a suíte (servidor: `npm test`, `tsc`, `eslint`; tela: `npm test`, build).
- [x] T010 Conferir no navegador, depois de reiniciar a API: Cosmópolis e Paulínia (dono) em 1236 px (coluna da folha com no máximo 3 linhas; altura pelo Horário), gestor, e lojas sem salários e sem faturamento; comparar com o board A3 nos três estados.
- [x] T011 Atualizar o `README.md`.

MVP: T001–T008.
