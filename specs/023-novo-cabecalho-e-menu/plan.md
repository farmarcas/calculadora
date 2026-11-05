# Implementation Plan: Novo cabeçalho e menu lateral (Radar)

**Branch**: `feat/novo-cabecalho-e-menu` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

## Summary

A casca da tela, hoje toda dentro de `App.jsx`, passa para uma pasta própria (`shell/`): barra superior de 80 px, menu lateral (280/72 px), faixa de contexto de 64 px e menu da conta. A loja escolhida e o botão Importar saem de dentro da tela da Escala e sobem para a casca, que passa a ser o único lugar de trocar de loja. As abas internas de Cadastros e da Escala dão lugar aos subitens do menu. O conteúdo e os cálculos das telas não mudam.

## For the reader

Chosen: construir a casca nova com os componentes e as cores que o projeto já usa, sem biblioteca nova, e subir a loja escolhida e o botão Importar para o topo.

Why: o dado e as telas já funcionam; só muda onde ficam a navegação e a escolha de loja, então o risco está em não quebrar o que cada tela espera receber.

## Technical Context

**Language/Version**: React 18 + Vite + Tailwind (JavaScript), como o resto da tela; nada no servidor
**Primary Dependencies**: as já usadas; ícones como SVG embutido (5 ícones), sem biblioteca nova
**Storage**: preferência do menu no `localStorage` do navegador (chave própria, leitura e escrita protegidas); nada no banco
**Testing**: Vitest em arquivos de lógica pura (itens do menu por perfil, item atual, horas de funcionamento, preferência do menu); cliques, foco, teclado e responsivo conferidos no navegador
**Target Platform**: Docker Compose local; mesmo build de produção
**Project Type**: web (só frontend)
**Performance Goals**: abrir e recolher o menu sem salto de layout, animação de 150–200 ms (sem animação com movimento reduzido)
**Constraints**: não alterar conteúdo, rotas, cálculos nem permissões; um único seletor de loja; Alquimia (tokens, sem valores soltos); tela de 360 a 1440 px sem rolagem horizontal da página
**Scale/Scope**: 1 casca (5 componentes), 3 telas ajustadas só nas bordas (App, EscalaPage, CadastrosPage)

## Constitution Check

- I. Spec Kit: cumprido (spec 023 → plano → tarefas → implementação).
- II. Docker: conferência no ambiente local.
- III. Stack: a existente; nenhuma tecnologia nova (ícones embutidos, sem pacote).
- IV. Banco: nenhuma mudança.
- V. Dados locais protegidos: nada destrutivo.
- VI/VIII. Linguagem simples e técnico do agente: cumprido.
- VII. Começar pequeno: sem Visão do grupo, sem login, sem novas telas.

Resultado: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/023-novo-cabecalho-e-menu/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/casca.md
└── tasks.md   # /speckit-tasks
```

### Source Code

```text
frontend/react/
├── public/radar-logo.png            # logo do desenho (1295×238, fundo transparente)
└── src/
    ├── App.jsx                      # passa a só montar a casca e as telas (estado de perfil, grupo, loja e tela)
    ├── shell/
    │   ├── AppShell.jsx             # barra + menu + faixa + área de conteúdo
    │   ├── BarraSuperior.jsx        # botão do menu, logo, avatar
    │   ├── MenuLateral.jsx          # aberto/recolhido, dica, painel de subitens, gaveta no celular
    │   ├── FaixaDeContexto.jsx      # horas, filtro de Loja, Importar
    │   ├── MenuDaConta.jsx          # nome, papel, Demonstração (Grupo e Papel), Sair
    │   ├── icones.jsx               # loja, calendário, prancheta, play, envio, menu, seta
    │   ├── menu.js                  # itens, filtro por perfil, item atual, destino de cada item
    │   ├── estadoDoMenu.js          # preferência aberto/recolhido (ler/gravar seguro) e padrão por largura
    │   ├── horas.js                 # horas de funcionamento por semana a partir do horário da loja
    │   └── *.test.js                # lógica pura
    └── features/
        ├── diagnostico/EscalaPage.jsx   # recebe loja e seção por props; sai o seletor de loja, o botão Enviar e as abas
        └── cadastros/CadastrosPage.jsx  # recebe a seção por props; saem as abas internas
```

## Design

**Estado na casca (`App.jsx`)**: perfil, grupo, `tela` e `secao` (qual subitem do menu), mais a **lista de lojas e a loja escolhida** (carregadas do mesmo `/lojas` que a Escala já usa) e o **envio de planilhas** (`importando`). Trocar de grupo continua remontando as telas (`key={ge}`); trocar de loja não remonta a tela, só muda o que ela recebe.

**Menu**: `menu.js` descreve os itens uma vez (id, rótulo, ícone, subitens, quem vê) e devolve a lista já filtrada por perfil, o item atual e o destino. Destinos: Minhas Lojas › Lojas = Cadastros/lojas; Minhas Lojas › Parâmetros legais = Cadastros/parâmetros (só operador); Escala › Diagnóstico e Simulações = Escala/diagnóstico e grade; Grupos = Grupos (só operador). Trocar de destino com alteração não salva continua passando por `confirmarSaida()`.

**Menu recolhido**: cada ícone é um botão com `aria-label` e dica (aparece com mouse e com foco). Minhas Lojas e Escala abrem um painel à direita com os subitens (fecha com Esc, clique fora e ao escolher). Em tela estreita, o menu vira gaveta sobre o conteúdo.

**Faixa de contexto**: aparece nas telas da Escala (Diagnóstico e Simulações), onde existe uma loja escolhida; em Minhas Lojas e Grupos não aparece, porque a loja ali é a que se abre na própria lista. As horas por semana saem do horário da loja já carregado (`horas.js`), sem pedido novo ao servidor. O botão Importar só aparece para quem pode escrever, e abre o mesmo `EnviarPlanilhas`; ao concluir, a tela da Escala recarrega.

**Menu da conta**: avatar com as iniciais do papel; popover de 320 px; "Demonstração" (Grupo e Papel) só quando `VITE_MODO_DEMONSTRACAO` não é `false` (padrão ligado, porque ainda não há login); "Sair" volta ao estado inicial de demonstração enquanto não houver login (ver research).

**Acessibilidade**: `header`, `nav` com nome "Menu principal" e `main`; botão do menu com `aria-expanded` e `aria-controls`; item atual com `aria-current="page"`; foco visível com o anel do Alquimia; alvos de 40 px (44 px no celular); estado nunca só por cor.

## Complexity Tracking

Sem violações a justificar.
