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

## Medição de uso (Mixpanel)

Toda medição passa pelo serviço central `frontend/react/src/analytics/servico.js`. Nenhuma tela importa `mixpanel-browser`.

- Para medir uma ação nova: acrescente o evento (e as propriedades permitidas) em `analytics/catalogo.js` e em `specs/059-mixpanel-servico-central/contracts/catalogo-eventos.md`, e chame `registrar("nome_do_evento", { ... })`.
- Nunca envie valores em dinheiro, folha, CNPJ, nome de loja ou texto digitado. O serviço descarta o que não está no catálogo.
- Sem `MIXPANEL_TOKEN` a medição fica desligada. Em modo demonstração (sem login do Radar) ela também não mede.

### Mapa de calor e replay (spec 060)

O serviço de medição também grava uma parte das sessões do Mixpanel (replay) e, junto, coleta o mapa de calor. O mapa de calor do Mixpanel só existe dentro de sessões gravadas.

- **Tudo sai coberto:** texto e campos de formulário aparecem como retângulos na gravação. Isso é o padrão porque as telas mostram folha, faturamento, nomes e CNPJs. Não há trecho liberado; se um dia for preciso, a opção é `record_unmask_text_selector` no `analytics/servico.js`, com revisão de quem cuida da privacidade.
- **Só com login do Radar:** a gravação começa depois da identificação da pessoa. Modo demonstração e a tela de entrada não gravam.
- **Parcela gravada:** `MIXPANEL_REPLAY_PERCENT` (0 a 100). Vazio = todas as sessões; `0` desliga a gravação e o mapa de calor sem mexer em tela. No deploy de produção vem da variável do repositório `MIXPANEL_REPLAY_PERCENT`.
- Console e rede não são gravados, e cada gravação dura no máximo 1 hora.
