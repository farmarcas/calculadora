# Frontend

Entrada das skills React. Antes de escrever código, abra a skill do contexto.

| Contexto | Skill |
| --- | --- |
| Pasta, componente, página, hook, estado, props, acessibilidade | `frontend/react/skills/component-development/SKILL.md` |
| Tailwind, `className`, token, espaçamento, cor, variante, primitivo visual | `frontend/react/skills/styling-tailwind/SKILL.md` |

Tela ou componente novo: leia `component-development` e, em seguida, `styling-tailwind`.

Mudança só de estrutura ou dados: `component-development`. Mudança só visual: `styling-tailwind`.

## Design system

O visual segue o **Alquimia DS (Farmarcas)**: https://claude.ai/artifact/UDhEi8DsnoyTWFsy2eN9aH

- Os tokens do DS estão copiados, sem alteração, em `frontend/react/src/styles/alquimia.css` (cores, tipografia, espaçamento, sombras, raios, layout). O Tailwind lê sombras e raios dessas variáveis.
- Os componentes base vivem em `frontend/react/src/components/ui/index.jsx` e seguem os do DS: `Botao` (40 px, ou 32 px pequeno, negrito), `entrada` e `Campo` (foco de 2 px azul, rótulo de 14 px acima), `Abas` (sublinhado de 3 px), `TH` e `TD` (cabeçalho em fundo suave, sem maiúsculas), `Ficha` (Pill de status), `Aviso` (Toast), `Modal`, `Cartao`. Tela nova usa esses componentes; não repete classe de botão, aba ou tabela.
- Regras de conteúdo do DS: pt-BR, frase com inicial maiúscula só na primeira palavra, botão é verbo de uma ou duas palavras, sem emoji, sem ponto de exclamação (exceto "Novo!"), maiúsculas só em rótulo pequeno de indicador.
- O texto das fichas e dos avisos usa o tom escuro que o próprio DS usa no Toast (por contraste); o texto de apoio (`ink-500`) mantém #6b7a90 em vez do #7a869a do DS, que não passa em 4,5:1 sobre branco.
- Ainda não adotado do DS: a barra superior de 80 px e o menu lateral fixo de 114 px, os ícones do conjunto do DS nos avisos e botões, e a altura de 48 px do campo (usamos a variante de 36 px).
